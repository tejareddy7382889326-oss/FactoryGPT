import os
import fitz  # PyMuPDF
import docx
from typing import List, Dict, Any

def extract_text_from_file(file_path: str) -> List[Dict[str, Any]]:
    """
    Extracts text from PDF, DOCX, or TXT file.
    Returns a list of dicts: [{"page": page_num, "text": page_content}]
    """
    ext = os.path.splitext(file_path)[1].lower()
    pages_data = []
    
    if ext == ".pdf":
        doc = fitz.open(file_path)
        for i, page in enumerate(doc):
            text = page.get_text("text").strip()
            if text:
                pages_data.append({"page": i + 1, "text": text})
        doc.close()
        
    elif ext == ".docx":
        doc = docx.Document(file_path)
        text_content = []
        for p in doc.paragraphs:
            if p.text.strip():
                text_content.append(p.text.strip())
        full_text = "\n".join(text_content)
        pages_data.append({"page": 1, "text": full_text})
        
    elif ext in [".txt", ".log", ".csv", ".json", ".md"]:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            full_text = f.read().strip()
            pages_data.append({"page": 1, "text": full_text})
            
    else:
        raise ValueError(f"Unsupported file format: {ext}")
        
    return pages_data

def chunk_extracted_text(
    pages_data: List[Dict[str, Any]],
    filename: str,
    chunk_size: int = 800,
    chunk_overlap: int = 150
) -> List[Dict[str, Any]]:
    """
    Splits extracted page text into overlapping chunks using sliding windows.
    Each chunk retains document metadata (filename, page number, chunk index).
    """
    chunks = []
    chunk_id_counter = 0
    
    for page_info in pages_data:
        page_num = page_info["page"]
        text = page_info["text"]
        
        if len(text) <= chunk_size:
            chunks.append({
                "chunk_id": f"{filename}_p{page_num}_{chunk_id_counter}",
                "text": text,
                "document_name": filename,
                "page": page_num
            })
            chunk_id_counter += 1
        else:
            start = 0
            while start < len(text):
                end = start + chunk_size
                chunk_str = text[start:end]
                chunks.append({
                    "chunk_id": f"{filename}_p{page_num}_{chunk_id_counter}",
                    "text": chunk_str,
                    "document_name": filename,
                    "page": page_num
                })
                chunk_id_counter += 1
                start += (chunk_size - chunk_overlap)
                
    return chunks
