from .tools import get_tools
from .graph import build_agent_graph, get_final_response
from .utils import convert_dict_to_messages, extract_text_content

tools = None
agent_graph = None


def get_agent_graph():
    global tools, agent_graph
    if agent_graph is None:
        tools = get_tools()
        agent_graph = build_agent_graph(tools)
    return agent_graph


def run_agent(messages: list, user_profile: str = ""):
    """Run agent synchronously and return final response"""
    try:
        response = get_final_response(get_agent_graph(), messages, user_profile)
        return extract_text_content(response)
    except Exception as e:
        return f"❌ Lỗi xử lý: {str(e)}"


def stream_agent(messages: list):
    """Stream agent response for real-time output"""
    try:
        for chunk in stream_agent_response(get_agent_graph(), messages):
            yield chunk
    except Exception as e:
        yield f"❌ Lỗi streaming: {str(e)}"
