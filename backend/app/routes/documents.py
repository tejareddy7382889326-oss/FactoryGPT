import os
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models import User, Document
from app.schemas import DocumentOut
from app.utils.auth_utils import get_current_user
from app.rag.pipeline import process_and_index_document
from app.rag.vector_store import vector_store

router = APIRouter(prefix="/documents", tags=["Documents"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".log", ".csv", ".md"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

@router.post("/upload", response_model=List[DocumentOut])
async def upload_documents(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    uploaded_records = []
    
    for file in files:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"File '{file.filename}' has unsupported extension {ext}. Allowed: {ALLOWED_EXTENSIONS}"
            )
            
        # Clean filename
        clean_filename = os.path.basename(file.filename)
        save_path = os.path.join(settings.UPLOADS_DIR, clean_filename)
        
        # Save file to uploads folder
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        file_size = os.path.getsize(save_path)
        if file_size > MAX_FILE_SIZE:
            os.remove(save_path)
            raise HTTPException(status_code=400, detail=f"File '{clean_filename}' exceeds max size of 50MB")
            
        # Index into ChromaDB vector store
        try:
            chunk_count = process_and_index_document(save_path, clean_filename)
        except Exception as e:
            if os.path.exists(save_path):
                os.remove(save_path)
            raise HTTPException(status_code=500, detail=f"Failed to process and index document '{clean_filename}': {str(e)}")
            
        # Delete existing DB record if replacing
        existing_doc = db.query(Document).filter(Document.filename == clean_filename).first()
        if existing_doc:
            db.delete(existing_doc)
            db.commit()
            
        # Save DB record
        doc_record = Document(
            filename=clean_filename,
            file_path=save_path,
            file_type=ext.replace(".", "").upper(),
            file_size=file_size,
            chunk_count=chunk_count,
            uploaded_by=current_user.id
        )
        db.add(doc_record)
        db.commit()
        db.refresh(doc_record)
        uploaded_records.append(doc_record)
        
    return uploaded_records

@router.get("", response_model=List[DocumentOut])
def list_documents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Document).order_by(Document.created_at.desc()).all()

@router.delete("/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Delete file from disk
    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception as e:
            pass
            
    # Delete vector chunks from ChromaDB
    try:
        vector_store.delete_document_chunks(doc.filename)
    except Exception as e:
        pass
        
    # Delete DB record
    db.delete(doc)
    db.commit()
    return {"message": f"Successfully deleted document '{doc.filename}'"}

@router.get("/{document_id}/file")
def get_document_file(document_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    media_type = "application/pdf" if doc.file_type == "PDF" else "text/plain"
    return FileResponse(path=doc.file_path, filename=doc.filename, media_type=media_type)

@router.post("/reindex")
def reindex_all_documents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Clear ChromaDB
    vector_store.clear_vector_db()
    
    docs = db.query(Document).all()
    total_reindexed = 0
    
    for doc in docs:
        if os.path.exists(doc.file_path):
            chunk_count = process_and_index_document(doc.file_path, doc.filename)
            doc.chunk_count = chunk_count
            total_reindexed += chunk_count
            
    db.commit()
    return {"message": f"Re-indexed {len(docs)} documents ({total_reindexed} chunks total)"}
