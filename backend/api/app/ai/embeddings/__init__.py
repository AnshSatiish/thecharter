"""Sentence embeddings for semantic search: the model wrapper (embedder.py) and passage splitting (chunking.py)."""
from app.ai.embeddings.embedder import (
    Embedder,
    EmbedderUnavailable,
    FastEmbedEmbedder,
    get_embedder,
    normalize,
    set_embedder,
)

__all__ = ["Embedder", "EmbedderUnavailable", "FastEmbedEmbedder", "get_embedder", "normalize", "set_embedder"]
