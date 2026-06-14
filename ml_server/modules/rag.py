"""
RAG pipeline - LangChain + FAISS + sentence-transformers.

Loads medical text files from knowledge_base/, chunks them, embeds with
MiniLM, builds a FAISS vector store, and retrieves relevant context for
any symptom query.

Interview talking point:
  "I built a RAG pipeline using LangChain for document chunking, FAISS for
   vector similarity search, and sentence-transformers MiniLM for free local
   embeddings. When a patient describes symptoms, the system retrieves the
   top-3 most relevant medical knowledge snippets before generating a
   response - this grounds the LLM and prevents hallucination."
"""

from __future__ import annotations

from pathlib import Path

KB_DIR = Path(__file__).parent.parent / "knowledge_base"

_vectorstore = None


def _build_vectorstore():
    """Build FAISS vector store from knowledge base text files. Lazy-loaded."""
    global _vectorstore
    if _vectorstore is not None:
        return _vectorstore

    try:
        from langchain_community.document_loaders import TextLoader
        from langchain.text_splitter import RecursiveCharacterTextSplitter
        from langchain_community.vectorstores import FAISS
        from langchain_community.embeddings import HuggingFaceEmbeddings

        txt_files = list(KB_DIR.glob("*.txt"))
        if not txt_files:
            print("[rag] No .txt files found in knowledge_base/")
            return None

        # Load all documents
        docs = []
        for f in txt_files:
            try:
                loader = TextLoader(str(f), encoding="utf-8")
                docs.extend(loader.load())
            except Exception as e:
                print(f"[rag] Could not load {f.name}: {e}")

        if not docs:
            return None

        # Split into chunks
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50,
            separators=["\n\n", "\n", ". ", " "],
        )
        chunks = splitter.split_documents(docs)
        print(f"[rag] {len(docs)} documents -> {len(chunks)} chunks")

        # Embed with MiniLM (free, runs locally, ~90MB)
        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"},
        )

        _vectorstore = FAISS.from_documents(chunks, embeddings)
        print("[rag] FAISS vector store built successfully")
        return _vectorstore

    except Exception as e:
        print(f"[rag] Failed to build vector store: {e}")
        return None


def query_medical_knowledge(query: str, k: int = 3) -> list[str]:
    """
    Return top-k relevant medical knowledge snippets for the query.
    Returns empty list if RAG is not available (graceful degradation).
    """
    vs = _build_vectorstore()
    if vs is None:
        return []

    try:
        results = vs.similarity_search(query, k=k)
        return [doc.page_content.strip() for doc in results]
    except Exception as e:
        print(f"[rag] Query failed: {e}")
        return []
