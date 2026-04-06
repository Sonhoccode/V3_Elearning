from pydantic import BaseModel, Field
from typing import Type, Optional, Any
import os
from langchain.tools import BaseTool
from langchain_core.callbacks.manager import CallbackManagerForToolRun
from langchain_google_genai import ChatGoogleGenerativeAI

from apps.ai.vector_store import similarity_search


# =========================
# Tool Input Schemas
# =========================

class RetrieveInput(BaseModel):
    query: str = Field(
        ...,
        description="Search query about company internal rules, policies, holidays, working hours, employee benefits."
    )


class WebSearchInput(BaseModel):
    query: str = Field(
        ...,
        description="Search query for web search when internal knowledge doesn't have answer."
    )


# =========================
# Retrieve Tool (Internal Knowledge)
# =========================

class RetrieveTool(BaseTool):
    name: str = "retrieve_internal_knowledge"
    description: str = (
        "Retrieve information from company internal database about policies, "
        "working hours, holidays, employee rules, and internal procedures. "
        "Use this first before web search. Returns relevant internal documents."
    )
    args_schema: Type[BaseModel] = RetrieveInput
    return_direct: bool = False

    _k: int = 4
    _gemini_model: Optional[ChatGoogleGenerativeAI] = None

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._k = kwargs.get("k", 4)
    
        google_api_key = os.getenv("GOOGLE_API_KEY")
        if google_api_key:
            self._gemini_model = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash",
                google_api_key=google_api_key,
                temperature=0.7,
                max_output_tokens=1000,
                max_retries=0
            )

    def _run(
        self,
        query: str,
        run_manager: Optional[CallbackManagerForToolRun] = None,
    ) -> str:

        results = similarity_search(query, k=self._k)

        # Nếu tìm thấy dữ liệu nội bộ, trả về ngay
        if results and len(results) > 0:
            documents = [doc.page_content for doc in results]
            result_text = "\n\n".join(documents)
            return f"📚 [Từ dữ liệu nội bộ]\n{result_text}"

        # Nếu không tìm thấy dữ liệu nội bộ, sử dụng Gemini
        if self._gemini_model:
            try:
                response = self._gemini_model.invoke(query)
                content = response.content if hasattr(response, 'content') else str(response)
                return f"🤖 [Từ Gemini AI]\n{content}"
            except Exception as e:
                return f"❌ Lỗi khi truy vấn Gemini: {str(e)}"
        else:
            return "⚠️ Không tìm thấy thông tin trong dữ liệu nội bộ và Gemini API chưa được cấu hình."


# =========================
# Get Tools  
# =========================

def get_tools(include_web_search: bool = True):
    """
    Get list of available tools for agent
    
    Args:
        include_web_search: Include web search tool (default True)
    
    Returns:
        List of tool instances
    """
    tools = []
    
    # Always include internal knowledge retrieval
    retrieve_tool = RetrieveTool(k=4)
    tools.append(retrieve_tool)
    
    # Include web search if requested and API key is available
    if include_web_search and os.getenv("TAVILY_API_KEY"):
        try:
            from langchain_tavily import TavilySearch  # optional dependency

            search_web_tool = TavilySearch(
                max_results=2,
                topic="general",
                include_answer=True,
            )
            tools.append(search_web_tool)
        except Exception as e:
            print(f"⚠️ Warning: Could not initialize web search: {str(e)}")
    
    return tools
