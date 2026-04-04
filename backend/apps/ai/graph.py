import os
from typing import TypedDict, Annotated, Literal
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_core.messages import SystemMessage

from .vector_store import similarity_search
from .config import LLM_MODEL_NAME


# =========================
# State Definition
# =========================

class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    route: Literal["internal", "external"]
    user_profile: str


# =========================
# Classifier Node
# =========================

def create_classifier_node(threshold: float = 0.2):

    def classifier_node(state: AgentState):
        messages = state["messages"]

        last_user_message = next(
            (m.content for m in reversed(messages) if isinstance(m, HumanMessage)),
            None
        )

        if not last_user_message:
            return {"route": "external"}

        docs = similarity_search(last_user_message, k=5)

        if not docs:
            return {"route": "external"}

        # Nếu similarity_search có score
        scores = [doc.get("score", 0) for doc in docs]
        best_score = max(scores)

        print("🔎 Best similarity:", best_score)
        print("🔎 Scores:", scores)

        if best_score >= threshold:
            return {"route": "internal"}
        else:
            return {"route": "external"}

    return classifier_node


# =========================
# Internal RAG Node
# =========================

def create_internal_node():

    llm = ChatGoogleGenerativeAI(
        model=LLM_MODEL_NAME,
        temperature=0,
        api_key=os.getenv("GOOGLE_API_KEY"),
    )

    from .vector_store import get_supabase_client

    def internal_node(state: AgentState):
        messages = state["messages"]

        last_user_message = next(
            (m.content for m in reversed(messages) if isinstance(m, HumanMessage)),
            None
        )

        if not last_user_message:
            return {"messages": [AIMessage(content="Không tìm thấy thông tin.")]}

        # Lấy chunk
        top_docs = similarity_search(last_user_message, k=5)

        if not top_docs:
            return {
                "messages": [
                    AIMessage(content="Không tìm thấy thông tin trong tài liệu nội bộ.")
                ]
            }

        best_section = top_docs[0].get("metadata", {}).get("section_id")

        if best_section is None:
            # fallback nếu không có section_id (Áp dụng cho Admin UI mơi tạo)
            context_parts = []
            for doc in top_docs:
                content = doc.get("content", "")
                meta = doc.get("metadata", {})
                source = meta.get("source", "Không rõ nguồn").split("\\")[-1].split("/")[-1] # Lấy tên file cuôi
                page = meta.get("page")

                if page is not None:
                    # page_num của PyMuPDF bắt đầu từ 0
                    source_str = f"[Nguồn: {source} - Trang: {int(page) + 1}]"
                else:
                    source_str = f"[Nguồn: {source}]"

                context_parts.append(f"{content}\n{source_str}")
            
            # Loại bỏ các đoạn trùng lặp
            context = "\n\n---\n\n".join(list(dict.fromkeys(context_parts)))
        else:
            # Lấy TOÀN BỘ section từ Supabase (dùng cho ingest_docs text cũ)
            supabase = get_supabase_client()

            section_rows = supabase.table("documents") \
                .select("content, metadata") \
                .eq("metadata->>section_id", str(best_section)) \
                .execute()

            if not section_rows.data:
                context = "\n\n".join(
                    list(dict.fromkeys([doc.get("content", "") for doc in top_docs]))
                )
            else:
                context_parts = []
                for row in section_rows.data:
                    content = row["content"]
                    meta = row.get("metadata", {})
                    source = meta.get("source", "Không rõ nguồn").split("\\")[-1].split("/")[-1]
                    source_str = f"[Nguồn: {source}]"
                    context_parts.append(f"{content}\n{source_str}")
                
                context = "\n\n---\n\n".join(list(dict.fromkeys(context_parts)))

        strict_system = SystemMessage(content=f"""
Bạn là hệ thống truy xuất tài liệu nội bộ.

YÊU CẦU:
- Phải liệt kê ĐẦY ĐỦ tất cả công cụ/framework có trong CONTEXT.
- Không được bỏ sót.
- Không được thêm kiến thức ngoài CONTEXT.
- Không được tóm tắt.

THÔNG TIN HỌC VIÊN CHI TIẾT:
{state.get("user_profile", "Chưa có thông tin đánh giá năng lực.")}

QUY TẮC TRẢ LỜI CỐT LÕI:
- BẮT BUỘC phải đính kèm trích dẫn (Nguồn và số Trang tương ứng) ở cuối mỗi ý hoặc cuối mỗi đoạn trong câu trả lời nếu thông tin đó được lấy từ tài liệu.
- Trả lời CỰC KỲ NGẮN GỌN, SÚC TÍCH, đi thẳng vào vấn đề.
- Chỉ trả lời ĐÚNG CÂU HỎI, tuyệt đối không giải thích dài dòng luyên thuyên hay lan man những thứ người dùng không hỏi.
- Dựa trên tài liệu nội bộ và thông tin của học viên để đưa ra câu trả lời, lời khuyên phù hợp.

Nếu không có thông tin phù hợp trong CONTEXT:
Trả lời: "Không tìm thấy thông tin trong tài liệu nội bộ."

CONTEXT:
----------------
{context}
----------------
""")

        response = llm.invoke([strict_system] + messages)

        return {"messages": [response]}

    return internal_node


# =========================
# External LLM Node
# =========================

def create_external_node():

    llm = ChatGoogleGenerativeAI(
        model=LLM_MODEL_NAME,
        temperature=0.7,
        api_key=os.getenv("GOOGLE_API_KEY"),
    )

    def external_node(state: AgentState):
        messages = state["messages"]
        user_profile = state.get("user_profile", "Chưa có thông tin đánh giá năng lực.")

        normal_system = SystemMessage(content=f"""
Bạn là một AI kỹ sư phần mềm chuyên nghiệp và gia sư e-learning.
Bạn có thể tạo code đầy đủ khi được yêu cầu.

THÔNG TIN HỌC VIÊN CHI TIẾT:
{user_profile}

QUY TẮC TRẢ LỜI CỐT LÕI:
- Trả lời CỰC KỲ NGẮN GỌN, SÚC TÍCH, đi thẳng vào vấn đề.
- Chỉ trả lời ĐÚNG CÂU HỎI, tuyệt đối không giải thích dài dòng luyên thuyên hay lan man những thứ người dùng không hỏi.
- Dựa vào thông tin năng lực trên, đưa ra lời khuyên cụ thể và thực tế cho trình độ của học viên.
""")

        response = llm.invoke([normal_system] + messages)
        return {"messages": [response]}

    return external_node


# =========================
# Build Graph
# =========================

def build_agent_graph(tools=None):

    graph = StateGraph(AgentState)

    graph.add_node("classifier", create_classifier_node())
    graph.add_node("internal", create_internal_node())
    graph.add_node("external", create_external_node())

    graph.add_edge(START, "classifier")

    graph.add_conditional_edges(
        "classifier",
        lambda state: state["route"],
        {
            "internal": "internal",
            "external": "external",
        }
    )

    graph.add_edge("internal", END)
    graph.add_edge("external", END)

    return graph.compile()


# =========================
# Helper
# =========================

def get_final_response(agent_graph, messages: list, user_profile: str = "") -> str:

    state = {
        "messages": [
            HumanMessage(content=msg["content"])
            if msg["role"] == "user"
            else AIMessage(content=msg["content"])
            for msg in messages
        ],
        "route": "external",
        "user_profile": user_profile,
    }

    result = agent_graph.invoke(state)

    for msg in reversed(result["messages"]):
        if isinstance(msg, AIMessage):
            return msg.content

    return "Không có phản hồi"