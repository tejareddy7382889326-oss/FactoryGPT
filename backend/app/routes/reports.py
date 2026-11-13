import os
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models import User, Conversation, Message
from app.schemas import ReportRequest, ReportResponse
from app.utils.auth_utils import get_current_user
from app.utils.pdf_generator import generate_pdf_report

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("/generate", response_model=ReportResponse)
def create_report(
    req: ReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report_id = f"RPT-{uuid.uuid4().hex[:8].upper()}"
    filename = f"{report_id}_{req.equipment_name.replace(' ', '_')}.pdf"
    output_path = os.path.join(settings.REPORTS_DIR, filename)
    
    conversation_history = []
    if req.conversation_id:
        msgs = db.query(Message).filter(
            Message.conversation_id == req.conversation_id
        ).order_by(Message.created_at.asc()).all()
        
        conversation_history = [
            {
                "role": m.role,
                "content": m.content,
                "sources": m.sources
            }
            for m in msgs
        ]
        
    try:
        generate_pdf_report(
            output_path=output_path,
            title=req.title,
            equipment_name=req.equipment_name,
            report_type=req.report_type,
            notes=req.notes or "",
            conversation_history=conversation_history
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF report: {str(e)}")
        
    download_url = f"{settings.API_V1_STR}/reports/download/{filename}"
    return {
        "report_id": report_id,
        "download_url": download_url,
        "created_at": datetime.utcnow()
    }

@router.get("/download/{filename}")
def download_pdf(filename: str, current_user: User = Depends(get_current_user)):
    file_path = os.path.join(settings.REPORTS_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Report file not found")
        
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/pdf"
    )
