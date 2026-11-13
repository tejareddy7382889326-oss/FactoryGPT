import httpx
from typing import List, Dict, Any, Tuple
from app.config import settings
from app.rag.vector_store import vector_store
from app.rag.parser import extract_text_from_file, chunk_extracted_text
import logging

logger = logging.getLogger("rag.pipeline")

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

def process_and_index_document(file_path: str, filename: str) -> int:
    """
    Extracts, chunks, embeds, and indexes a single document into ChromaDB.
    Returns the total number of chunks indexed.
    """
    pages_data = extract_text_from_file(file_path)
    chunks = chunk_extracted_text(
        pages_data,
        filename,
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP
    )
    vector_store.add_chunks(chunks)
    return len(chunks)

async def query_rag_pipeline(
    user_query: str,
    chat_history: List[Dict[str, str]] = None,
    model_name: str = None,
    top_k: int = 5
) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Executes RAG pipeline:
    1. Retrieve top_k chunks from ChromaDB
    2. Construct prompt with retrieved context and strict system rules
    3. Send request to OpenRouter API
    4. Return final response answer text and source citations list
    """
    selected_model = model_name or settings.DEFAULT_MODEL
    
    # 1. Retrieve top-K relevant chunks
    retrieved_chunks = vector_store.search_similar_chunks(user_query, top_k=top_k)
    
    # Check if any documents exist or if similarity score is acceptable
    if not retrieved_chunks:
        return (
            "I couldn't find this information in the uploaded factory documentation.",
            []
        )
    
    # 2. Format Context from Retrieved Chunks
    context_blocks = []
    sources = []
    
    for idx, chunk in enumerate(retrieved_chunks, 1):
        doc_name = chunk["document_name"]
        page_num = chunk["page"]
        snippet = chunk["content_snippet"]
        
        context_blocks.append(f"--- Context Snippet [{idx}] ---\nSource File: {doc_name} (Page {page_num})\nText: {snippet}")
        sources.append({
            "document_name": doc_name,
            "page": page_num,
            "content_snippet": snippet[:200] + "..." if len(snippet) > 200 else snippet,
            "score": chunk["score"]
        })
        
    formatted_context = "\n\n".join(context_blocks)
    
    # 3. Assemble Messages for OpenRouter API
    messages = [
        {"role": "system", "content": f"{settings.SYSTEM_PROMPT}\n\nRETRIEVED FACTORY DOCUMENTS CONTEXT:\n{formatted_context}"}
    ]
    
    # Add previous chat history (up to last 6 messages) for multi-turn context
    if chat_history:
        for msg in chat_history[-6:]:
            messages.append({"role": msg["role"], "content": msg["content"]})
            
    # Add current user prompt
    messages.append({"role": "user", "content": user_query})
    
    # 4. Call OpenRouter API
    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "FactoryGPT Assistant",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": selected_model,
        "messages": messages,
        "temperature": 0.1, # Low temperature for factual precision
        "max_tokens": 1200
    }
    
    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(OPENROUTER_URL, headers=headers, json=payload)
            response.raise_for_status()
            res_json = response.json()
            
            choices = res_json.get("choices", [])
            if choices and len(choices) > 0:
                answer = choices[0]["message"]["content"]
            else:
                answer = "I couldn't find this information in the uploaded factory documentation."
                
    except Exception as e:
        logger.error(f"Error calling OpenRouter API ({selected_model}): {e}")
        answer = f"Error generating response from AI service ({selected_model}). Please verify API key or network connection."
        
    return answer, sources
