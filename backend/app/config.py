import os
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load .env file
load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "FactoryGPT – AI-Powered Industrial Maintenance Assistant"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Root directory
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    
    # Environment Variables
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    DEFAULT_MODEL: str = os.getenv("DEFAULT_MODEL", "deepseek/deepseek-chat-v3")
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./factorygpt.db")
    CHROMA_PERSIST_DIR: str = os.getenv("CHROMA_PERSIST_DIR", str(BASE_DIR.parent / "vector_db"))
    UPLOADS_DIR: str = os.getenv("UPLOADS_DIR", str(BASE_DIR.parent / "uploads"))
    REPORTS_DIR: str = os.getenv("REPORTS_DIR", str(BASE_DIR.parent / "reports"))
    DOCS_DIR: str = str(BASE_DIR.parent / "docs")
    
    JWT_SECRET: str = os.getenv("JWT_SECRET", "factorygpt_super_secret_jwt_key_2026_industrial_rag")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # RAG Settings
    CHUNK_SIZE: int = 800
    CHUNK_OVERLAP: int = 150
    TOP_K_RESULTS: int = 5
    EMBEDDING_MODEL_NAME: str = "BAAI/bge-small-en-v1.5"
    
    # Available OpenRouter Models for User Selection
    SUPPORTED_MODELS: list = [
        {"id": "deepseek/deepseek-chat-v3", "name": "DeepSeek V3 (Default Industrial)", "provider": "DeepSeek"},
        {"id": "anthropic/claude-3.5-sonnet", "name": "Claude 3.5 Sonnet", "provider": "Anthropic"},
        {"id": "openai/gpt-4o-mini", "name": "GPT-4o Mini", "provider": "OpenAI"},
        {"id": "meta-llama/llama-3.3-70b-instruct", "name": "Llama 3.3 70B", "provider": "Meta"},
        {"id": "google/gemini-2.0-flash-001", "name": "Gemini 2.0 Flash", "provider": "Google"},
    ]
    
    # Zero Hallucination System Prompt
    SYSTEM_PROMPT: str = """You are an Industrial AI Maintenance Assistant for FactoryGPT.
Your duty is to assist factory technicians, operators, and engineers with equipment troubleshooting, maintenance procedures, and safety compliance.

RULES:
1. Answer ONLY using the retrieved information from the uploaded factory manuals, SOPs, and maintenance logs provided in the context below.
2. If the answer cannot be found in the retrieved documentation context, respond EXACTLY with:
"I couldn't find this information in the uploaded factory documentation."
3. NEVER hallucinate, guess, or use external knowledge not present in the context.
4. ALWAYS explicitly cite the source document name and page/section numbers when referencing facts or steps. Format citations clearly like [Document: <doc_name>, Page: <page_no>].
5. Provide clear, structured answers with headings, safety precautions in bold bullet points, and maintenance steps in ordered lists.
"""

    class Config:
        case_sensitive = True

settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOADS_DIR, exist_ok=True)
os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
os.makedirs(settings.REPORTS_DIR, exist_ok=True)
os.makedirs(settings.DOCS_DIR, exist_ok=True)
