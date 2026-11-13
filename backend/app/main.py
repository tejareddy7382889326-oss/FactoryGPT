import os
import glob
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models import User, Document
from app.utils.auth_utils import get_password_hash
from app.routes import auth, documents, chat, reports, admin
from app.rag.pipeline import process_and_index_document
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("factorygpt.main")

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise AI Assistant for Factory Engineers & Maintenance Personnel using RAG and OpenRouter API."
)

# CORS Middleware setup for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow Vite frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Route Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(documents.router, prefix=settings.API_V1_STR)
app.include_router(chat.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        # Create default demo user if not existing
        demo_email = "admin@factorygpt.io"
        user = db.query(User).filter(User.email == demo_email).first()
        if not user:
            logger.info("Creating default engineer demo user (admin@factorygpt.io / password123)...")
            demo_user = User(
                email=demo_email,
                hashed_password=get_password_hash("password123"),
                full_name="Chief Maintenance Engineer",
                role="admin"
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
            user = demo_user

        # Auto-index sample documents from docs/ if uploaded directory is empty
        docs_dir = settings.DOCS_DIR
        if os.path.exists(docs_dir):
            sample_files = glob.glob(os.path.join(docs_dir, "*.*"))
            for sample_path in sample_files:
                filename = os.path.basename(sample_path)
                target_upload_path = os.path.join(settings.UPLOADS_DIR, filename)
                
                # Copy file to uploads if not present
                if not os.path.exists(target_upload_path):
                    import shutil
                    shutil.copy(sample_path, target_upload_path)
                    
                # Index into vector store if not in DB
                existing_doc = db.query(Document).filter(Document.filename == filename).first()
                if not existing_doc:
                    logger.info(f"Auto-indexing sample document: {filename}...")
                    try:
                        ext = os.path.splitext(filename)[1].replace(".", "").upper()
                        fsize = os.path.getsize(target_upload_path)
                        chunks = process_and_index_document(target_upload_path, filename)
                        
                        doc_rec = Document(
                            filename=filename,
                            file_path=target_upload_path,
                            file_type=ext,
                            file_size=fsize,
                            chunk_count=chunks,
                            uploaded_by=user.id
                        )
                        db.add(doc_rec)
                        db.commit()
                    except Exception as e:
                        logger.error(f"Failed to auto-index {filename}: {e}")
                        
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
