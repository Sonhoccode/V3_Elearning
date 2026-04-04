import os
import re
import fitz # PyMuPDF
from PIL import Image
import io
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

def load_pdf_with_ocr(file_path: str):
    """
    Chuyển PDF thành hình ảnh và dùng Gemini OCR xuất thành văn bản (chống scan, ảnh nhúng).
    """
    try:
        import google.generativeai as genai
    except ImportError as exc:
        raise RuntimeError(
            "google-generativeai chưa được cài. Hãy cài package để dùng OCR."
        ) from exc
    api_key = os.getenv("GOOGLE_API_KEY")
    genai.configure(api_key=api_key)
    # Dùng flash model vì nó cực nhanh cho OCR
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    docs = []
    doc = fitz.open(file_path)
    
    for page_num in range(len(doc)):
        try:
            page = doc.load_page(page_num)
            pix = page.get_pixmap(dpi=150) # Độ phân giải đủ để OCR tốt
            img_data = pix.tobytes("png")
            image = Image.open(io.BytesIO(img_data))
            
            # Gọi Gemini trích xuất văn bản
            response = model.generate_content([
                "Trích xuất TOÀN BỘ VĂN BẢN (Text) từ bức ảnh này chính xác như bản gốc. Nếu có bảng, hãy ghi lại rõ ràng. Trả về đúng văn bản tồn tại trong ảnh, tuyệt đối không thêm bình luận hay giải thích gì thêm.", 
                image
            ])
            extracted_text = response.text.strip()
            
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

def get_embedding_model():
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

def ingest_custom_text(text: str, source_name: str = "Admin Input"):
    """Ingest custom text from the admin UI into Supabase"""
    supabase = get_supabase_client()
    embedding = get_embedding_model()

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1200,
        chunk_overlap=200,
        separators=["\n\n", "\n", ".", " ", ""],
    )
    
    docs = text_splitter.create_documents(
        [clean_text(text)], 
        metadatas=[{"source": source_name}]
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


# =========================
# Ingest PDF
# =========================

def ingest_pdf(file_path: str):
    supabase = get_supabase_client()
    embedding = get_embedding_model()

    # Check duplicate trước khi ingest
    existing = supabase.table("documents") \
        .select("id") \
        .eq("metadata->>source", file_path) \
        .execute()

    if existing.data:
        print("⚠ File already ingested, skipping...")
        return

    # OCR Extract thay vì PyPDFLoader cũ (sẽ tóm được cả ảnh)
    raw_docs = load_pdf_with_ocr(file_path)
    
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
