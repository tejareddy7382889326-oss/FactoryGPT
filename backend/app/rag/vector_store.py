import os
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.config import settings
from app.rag.embedder import generate_embeddings
import logging

logger = logging.getLogger("rag.vector_store")

class ChromaVectorStore:
    def __init__(self):
        self.persist_dir = settings.CHROMA_PERSIST_DIR
        os.makedirs(self.persist_dir, exist_ok=True)
        
        self.client = chromadb.PersistentClient(path=self.persist_dir)
        self.collection = self.client.get_or_create_collection(
            name="factory_knowledge_base",
            metadata={"hnsw:space": "cosine"}
        )
        logger.info(f"ChromaDB initialized at {self.persist_dir} with collection 'factory_knowledge_base'")

    def add_chunks(self, chunks: list[dict]):
        """
        Adds document chunks to ChromaDB.
        each chunk dict: {"chunk_id", "text", "document_name", "page"}
        """
        if not chunks:
            return
            
        ids = [c["chunk_id"] for c in chunks]
        documents = [c["text"] for c in chunks]
        metadatas = [
            {"document_name": c["document_name"], "page": c["page"]}
            for c in chunks
        ]
        
        embeddings = generate_embeddings(documents)
        
        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )
        logger.info(f"Successfully added {len(chunks)} chunks to ChromaDB vector store.")

    def search_similar_chunks(self, query: str, top_k: int = 5) -> list[dict]:
        """
        Queries ChromaDB for top_k most relevant chunks.
        Returns list of dicts: [{"document_name", "page", "content_snippet", "score"}]
        """
        query_embedding = generate_embeddings([query])
        
        results = self.collection.query(
            query_embeddings=query_embedding,
            n_results=top_k,
            include=["documents", "metadatas", "distances"]
        )
        
        retrieved_chunks = []
        if results and results.get("documents") and len(results["documents"]) > 0:
            docs = results["documents"][0]
            metas = results["metadatas"][0]
            distances = results["distances"][0] if "distances" in results else [0.0] * len(docs)
            
            for doc_text, meta, dist in zip(docs, metas, distances):
                # Cosine distance to similarity score
                similarity = round(1.0 - float(dist), 4) if dist is not None else 0.0
                retrieved_chunks.append({
                    "document_name": meta.get("document_name", "Unknown Document"),
                    "page": meta.get("page", 1),
                    "content_snippet": doc_text,
                    "score": max(0.0, similarity)
                })
                
        return retrieved_chunks

    def delete_document_chunks(self, filename: str):
        """
        Deletes all chunks belonging to a specific filename from ChromaDB.
        """
        self.collection.delete(where={"document_name": filename})
        logger.info(f"Deleted vector chunks for document: {filename}")

    def clear_vector_db(self):
        """
        Wipes all records in the ChromaDB collection.
        """
        self.client.delete_collection("factory_knowledge_base")
        self.collection = self.client.get_or_create_collection(
            name="factory_knowledge_base",
            metadata={"hnsw:space": "cosine"}
        )
        logger.info("Cleared all entries in ChromaDB vector store.")

    def get_total_chunks(self) -> int:
        """
        Returns total number of chunks stored in vector DB.
        """
        return self.collection.count()

# Global vector store singleton
vector_store = ChromaVectorStore()
