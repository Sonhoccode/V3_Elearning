import os
from langchain_google_genai import ChatGoogleGenerativeAI

from langgraph.prebuilt import create_react_agent 
from .config import LLM_MODEL_NAME

def get_agent(tools):
    llm = ChatGoogleGenerativeAI(
        model=LLM_MODEL_NAME,
        temperature=0,
        max_output_tokens=None,
        api_key=os.getenv("GOOGLE_API_KEY"),
    )
    
    agent = create_react_agent(llm, tools)
    return agent