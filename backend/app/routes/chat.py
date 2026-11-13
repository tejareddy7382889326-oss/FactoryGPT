import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models import User, Conversation, Message
from app.schemas import ChatRequest, ChatResponse, ConversationOut, MessageOut
from app.utils.auth_utils import get_current_user
from app.rag.pipeline import query_rag_pipeline

router = APIRouter(prefix="/chat", tags=["AI Chat"])

@router.get("/models")
def get_supported_models():
    return {
        "default_model": settings.DEFAULT_MODEL,
        "models": settings.SUPPORTED_MODELS
    }

@router.post("/query", response_model=ChatResponse)
async def query_ai(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conv_id = req.conversation_id
    
    # Fetch or create conversation
    if conv_id:
        conversation = db.query(Conversation).filter(
            Conversation.id == conv_id,
            Conversation.user_id == current_user.id
        ).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conv_id = str(uuid.uuid4())
        # Truncate title from query
        title_str = req.message[:40] + "..." if len(req.message) > 40 else req.message
        conversation = Conversation(
            id=conv_id,
            title=title_str,
            user_id=current_user.id,
            model_used=req.model or settings.DEFAULT_MODEL
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # Fetch previous messages for context
    history_messages = db.query(Message).filter(
        Message.conversation_id == conv_id
    ).order_by(Message.created_at.asc()).all()
    
    chat_history = [
        {"role": msg.role, "content": msg.content}
        for msg in history_messages
    ]
    
    # Record User Message
    user_msg = Message(
        conversation_id=conv_id,
        role="user",
        content=req.message
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)
    
    # Run RAG pipeline with OpenRouter LLM
    answer_text, sources = await query_rag_pipeline(
        user_query=req.message,
        chat_history=chat_history,
        model_name=req.model or conversation.model_used,
        top_k=req.top_k or 5
    )
    
    # Record Assistant Message
    assistant_msg = Message(
        conversation_id=conv_id,
        role="assistant",
        content=answer_text,
        sources=sources
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)
    
    return {
        "conversation_id": conv_id,
        "user_message": user_msg,
        "assistant_message": assistant_msg
    }

@router.get("/conversations", response_model=List[ConversationOut])
def get_user_conversations(
    search: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Conversation).filter(Conversation.user_id == current_user.id)
    if search:
        query = query.filter(Conversation.title.ilike(f"%{search}%"))
    return query.order_by(Conversation.updated_at.desc()).all()

@router.get("/conversations/{conversation_id}", response_model=ConversationOut)
def get_conversation_details(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation

@router.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    db.delete(conversation)
    db.commit()
    return {"message": "Conversation deleted successfully"}
