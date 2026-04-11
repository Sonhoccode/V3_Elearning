import os
import re
from typing import Optional
import base64
from typing import Optional
import fitz # PyMuPDF
from supabase import create_client, Client

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings

from .config import DATA_FOLDER_PATH, EMBEDDING_MODEL_NAME


# =========================
# Supabase
# =========================

def get_supabase_client() -> Client:
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set")

    return create_client(supabase_url, supabase_key)


# =========================
# Utils
# =========================

def clean_text(text: str) -> str:
    """Clean PDF text to improve embedding quality"""
    text = re.sub(r"\n+", "\n", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


# =========================
# Load & Split Documents
# =========================

def load_pdf_with_ocr(file_path: Optional[str] = None, file_bytes: Optional[bytes] = None):
    """
    Chuyển PDF thành hình ảnh và dùng Gemini OCR xuất thành văn bản (chống scan, ảnh nhúng).
    """
    try:
        from google import genai
        from google.genai import types
    except ImportError as exc:
        raise RuntimeError(
            "google-genai chưa được cài. Hãy cài package này để dùng OCR PDF."
        ) from exc
    api_key = os.getenv("GOOGLE_API_KEY")
    client = genai.Client(api_key=api_key)
    # Dùng flash model vì nó cực nhanh cho OCR
    model_name = "gemini-2.5-flash"
    
    docs = []
    if file_bytes is not None:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
    else:
        doc = fitz.open(file_path)
    
    for page_num in range(len(doc)):
        try:
            page = doc.load_page(page_num)
            pix = page.get_pixmap(dpi=150) # Độ phân giải đủ để OCR tốt
            img_data = pix.tobytes("png")
            # Gọi Gemini trích xuất văn bản
            prompt = (
                "Trích xuất TOÀN BỘ VĂN BẢN (Text) từ bức ảnh này chính xác như bản gốc. "
                "Nếu có bảng, hãy ghi lại rõ ràng. Trả về đúng văn bản tồn tại trong ảnh, "
                "tuyệt đối không thêm bình luận hay giải thích gì thêm."
            )
            parts = []
            if hasattr(types, "Part") and hasattr(types.Part, "from_text"):
                parts.append(types.Part.from_text(prompt))
            else:
                parts.append({"text": prompt})

            if hasattr(types, "Part") and hasattr(types.Part, "from_bytes"):
                parts.append(types.Part.from_bytes(data=img_data, mime_type="image/png"))
            else:
                parts.append(
                    {
                        "inline_data": {
                            "mime_type": "image/png",
                            "data": base64.b64encode(img_data).decode("utf-8"),
                        }
                    }
                )

            response = client.models.generate_content(
                model=model_name,
                contents=parts,
            )
            extracted_text = (response.text or "").strip()
            
            docs.append(
                Document(
                    page_content=clean_text(extracted_text),
                    metadata={
                        "source": file_path,
                        "page": page_num
                    }
                )
            )
        except Exception as e:
            print(f"Lỗi OCR trang {page_num}: {e}")
            
    return docs


def load_and_split_documents():
    documents = []

    if os.path.exists(DATA_FOLDER_PATH):
        for filename in os.listdir(DATA_FOLDER_PATH):
            if filename.endswith(".txt"):
                full_path = os.path.join(DATA_FOLDER_PATH, filename)
                with open(full_path, "r", encoding="utf-8") as file:
                    content = file.read()
                    documents.append(
                        Document(
                            page_content=clean_text(content),
                            metadata={"source": full_path},
                        )
                    )

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1200,
        chunk_overlap=200,
        separators=["\n\n", "\n", ".", " ", ""],
    )

    return text_splitter.split_documents(documents)


# =========================
# Embedding Model
# =========================

def _ensure_hf_token():
    token = os.getenv("HF_TOKEN")
    if token and not os.getenv("HUGGINGFACEHUB_API_TOKEN"):
        os.environ["HUGGINGFACEHUB_API_TOKEN"] = token


def get_embedding_model():
    _ensure_hf_token()
    try:
        return HuggingFaceEmbeddings(
            model_name=EMBEDDING_MODEL_NAME,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
    except Exception as exc:
        fallback_model = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
        print(f"⚠ Embedding model error: {exc}. Fallback to {fallback_model}")
        return HuggingFaceEmbeddings(
            model_name=fallback_model,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )


# =========================
# Ingest TXT Documents
# =========================

def ingest_documents():
    supabase = get_supabase_client()
    embedding = get_embedding_model()

    docs = load_and_split_documents()
    print(f"Loaded TXT chunks: {len(docs)}")

    rows = []

    for i, doc in enumerate(docs):
        vector = embedding.embed_query(doc.page_content)

        rows.append(
            {
                "content": doc.page_content,
                "metadata": {
                    "source": doc.metadata.get("source"),
                    "chunk_id": i,
                },
                "embedding": vector,
            }
        )

    # Batch insert
    batch_size = 100
    for i in range(0, len(rows), batch_size):
        supabase.table("documents").insert(rows[i:i + batch_size]).execute()

    print("✅ TXT ingest completed.")

# =========================
# Ingest Custom Admin Text
# =========================

def ingest_custom_text(
    text: str,
    source_name: str = "Admin Input",
    source_key: Optional[str] = None,
    display_name: Optional[str] = None,
    document_id: Optional[str] = None,
):
    """Ingest custom text from the admin UI into Supabase"""
    supabase = get_supabase_client()
    embedding = get_embedding_model()

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1200,
        chunk_overlap=200,
        separators=["\n\n", "\n", ".", " ", ""],
    )
    
    source_value = source_key or source_name
    metadata = {"source": source_value}
    if display_name:
        metadata["display_name"] = display_name
    if document_id:
        metadata["document_id"] = document_id

    docs = text_splitter.create_documents(
        [clean_text(text)],
        metadatas=[metadata],
    )
    
    print(f"Loaded Custom Text chunks: {len(docs)}")

    rows = []
    for i, doc in enumerate(docs):
        vector = embedding.embed_query(doc.page_content)
        rows.append(
            {
                "content": doc.page_content,
                "metadata": {
                    "source": doc.metadata.get("source"),
                    "chunk_id": i,
                },
                "embedding": vector,
            }
        )

    # Batch insert
    batch_size = 100
    for i in range(0, len(rows), batch_size):
        supabase.table("documents").insert(rows[i:i + batch_size]).execute()

    print("✅ Custom Text ingest completed.")
    return len(rows)


# =========================
# Ingest PDF
# =========================

def ingest_pdf(
    file_path: Optional[str] = None,
    file_bytes: Optional[bytes] = None,
    source_key: Optional[str] = None,
    display_name: Optional[str] = None,
    document_id: Optional[str] = None,
):
    supabase = get_supabase_client()
    embedding = get_embedding_model()

    source_value = source_key or (file_path or "uploaded_pdf")

    # OCR Extract thay vì PyPDFLoader cũ (sẽ tóm được cả ảnh)
    raw_docs = load_pdf_with_ocr(file_path=file_path, file_bytes=file_bytes)
    for doc in raw_docs:
        doc.metadata["source"] = source_value
        if display_name:
            doc.metadata["display_name"] = display_name
        if document_id:
            doc.metadata["document_id"] = document_id
    
    # Chia nhỏ văn bản vì Raw OCR trả về nguyên trang
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1200,
        chunk_overlap=200,
        separators=["\n\n", "\n", ".", " ", ""],
    )
    docs = text_splitter.split_documents(raw_docs)
    
    print(f"Loaded OCR PDF chunks: {len(docs)}")

    rows = []

    for i, doc in enumerate(docs):
        vector = embedding.embed_query(doc.page_content)

        rows.append(
            {
                "content": doc.page_content,
                "metadata": {
                    "source": file_path,
                    "page": doc.metadata.get("page"),
                    "chunk_id": i,
                },
                "embedding": vector,
            }
        )

    # Batch insert tránh timeout
    batch_size = 100
    for i in range(0, len(rows), batch_size):
        supabase.table("documents").insert(rows[i:i + batch_size]).execute()

    print("✅ PDF ingest completed.")
    return len(rows)


# =========================
# Custom Similarity Search
# =========================

def similarity_search(query: str, k: int = 10):

    supabase = get_supabase_client()
    embedding = get_embedding_model()

    query_vec = embedding.embed_query(query)

    try:
        result = supabase.rpc(
            "match_documents",
            {
                "query_embedding": query_vec,
                "match_count": k,
                "filter": {},
            },
        ).execute()
    except Exception as exc:
        message = str(exc)
        if "relation \"documents\" does not exist" in message:
            return []
        # Fallback for legacy signature (filter, query_embedding)
        result = supabase.rpc(
            "match_documents",
            {
                "filter": {},
                "query_embedding": query_vec,
            },
        ).execute()

    if not result.data:
        return []

    documents = []

    for row in result.data:
        documents.append({
            "content": row["content"],
            "metadata": row.get("metadata", {}),
            "score": row.get("similarity", 0)
        })

    return documents


def delete_documents_by_source(source_key: str) -> int:
    if not source_key:
        return 0
    supabase = get_supabase_client()
    try:
        result = (
            supabase.table("documents")
            .delete()
            .eq("metadata->>source", source_key)
            .execute()
        )
        return len(result.data or [])
    except Exception:
        return 0
