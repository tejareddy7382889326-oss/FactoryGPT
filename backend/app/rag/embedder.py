from chromadb.utils.embedding_functions import ONNXMiniLM_L6_V2
from app.config import settings
import logging

logger = logging.getLogger("rag.embedder")

_embedding_model = None

def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        try:
            logger.info("Loading PyTorch-free ONNX embedding model (all-MiniLM-L6-v2)...")
            _embedding_model = ONNXMiniLM_L6_V2()
        except Exception as e:
            logger.error(f"Failed to load ONNX embedding model: {e}")
            raise e
    return _embedding_model

def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Generates dense vector embeddings for a list of text strings using ONNX MiniLM.
    """
    model = get_embedding_model()
    return model(texts)

