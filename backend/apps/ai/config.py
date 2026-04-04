import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_FOLDER_PATH = BASE_DIR / "data"
EMBEDDING_MODEL_NAME = "sentence-transformers/static-similarity-mrl-multilingual-v1"
LLM_MODEL_NAME = "gemini-2.5-flash"