from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models import User, Document, Conversation, Message
from app.schemas import KnowledgeBaseStats
from app.utils.auth_utils import get_current_user
from app.rag.vector_store import vector_store
from app.rag.pipeline import process_and_index_document
import os

router = APIRouter(prefix="/admin", tags=["Admin & Knowledge Base"])

@router.get("/stats", response_model=KnowledgeBaseStats)
def get_kb_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_docs = db.query(Document).count()
    total_chunks = vector_store.get_total_chunks()
    total_convs = db.query(Conversation).count()
    total_msgs = db.query(Message).count()
    
    return {
        "total_documents": total_docs,
        "total_chunks": total_chunks,
        "total_conversations": total_convs,
        "total_messages": total_msgs,
        "active_model": settings.DEFAULT_MODEL,
        "vector_db_status": "Healthy (ChromaDB)"
    }

@router.delete("/clear-vector-db")
def clear_vector_database(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        vector_store.clear_vector_db()
        # Reset chunk count in DB
        db.query(Document).update({Document.chunk_count: 0})
        db.commit()
        return {"message": "Vector database cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing vector DB: {str(e)}")

@router.post("/rebuild-index")
def rebuild_vector_index(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        vector_store.clear_vector_db()
        docs = db.query(Document).all()
        reindexed_count = 0
        
        for doc in docs:
            if os.path.exists(doc.file_path):
                chunks = process_and_index_document(doc.file_path, doc.filename)
                doc.chunk_count = chunks
                reindexed_count += chunks
                
        db.commit()
        return {"message": f"Successfully rebuilt vector index for {len(docs)} documents ({reindexed_count} total chunks)"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error rebuilding vector index: {str(e)}")
