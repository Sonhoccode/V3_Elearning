"""
Utility functions for the agent system
"""

from langchain_core.messages import BaseMessage, HumanMessage, AIMessage


def convert_dict_to_messages(history: list[dict]) -> list[BaseMessage]:
    """Convert chat history dict format to LangChain messages"""
    messages = []
    for item in history:
        if item["role"] == "user":
            messages.append(HumanMessage(content=item["content"]))
        elif item["role"] == "assistant":
            messages.append(AIMessage(content=item["content"]))
    return messages


def convert_messages_to_dict(messages: list[BaseMessage]) -> list[dict]:
    """Convert LangChain messages to chat history dict format"""
    result = []
    for msg in messages:
        if isinstance(msg, HumanMessage):
            result.append({"role": "user", "content": msg.content})
        elif isinstance(msg, AIMessage):
            result.append({"role": "assistant", "content": msg.content})
    return result


def extract_text_content(content) -> str:
    """
    Extract text from various content formats
    Gemini sometimes returns list, dict, or string
    """
    if isinstance(content, str):
        return content
    
    if isinstance(content, list):
        texts = []
        for item in content:
            if isinstance(item, dict) and "text" in item:
                texts.append(item["text"])
            elif isinstance(item, str):
                texts.append(item)
        return "\n".join(texts)
    
    if isinstance(content, dict):
        if "text" in content:
            return content["text"]
        return str(content)
    
    return str(content)
