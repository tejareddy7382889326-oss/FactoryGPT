from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any, Dict
from datetime import datetime

# --- Auth Schemas ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Optional[str] = "engineer"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

# --- Document Schemas ---
class DocumentOut(BaseModel):
    id: int
    filename: str
    file_type: str
    file_size: int
    chunk_count: int
    uploaded_by: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

# --- Chat & RAG Schemas ---
class SourceItem(BaseModel):
    document_name: str
    page: Optional[int] = 1
    content_snippet: str
    score: Optional[float] = 0.0

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    model: Optional[str] = "deepseek/deepseek-chat-v3"
    top_k: Optional[int] = 5

class MessageOut(BaseModel):
    id: int
    role: str
    content: str
    sources: Optional[List[Dict[str, Any]]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationOut(BaseModel):
    id: str
    title: str
    model_used: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageOut] = []

    class Config:
        from_attributes = True

class ChatResponse(BaseModel):
    conversation_id: str
    user_message: MessageOut
    assistant_message: MessageOut

# --- Report Schemas ---
class ReportRequest(BaseModel):
    title: str
    equipment_name: str
    report_type: str # "maintenance", "troubleshooting", "safety"
    conversation_id: Optional[str] = None
    notes: Optional[str] = ""

class ReportResponse(BaseModel):
    report_id: str
    download_url: str
    created_at: datetime

# --- Admin & Stats Schemas ---
class KnowledgeBaseStats(BaseModel):
    total_documents: int
    total_chunks: int
    total_conversations: int
    total_messages: int
    active_model: str
    vector_db_status: str
