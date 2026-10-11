"""Sentence embeddings for semantic search.

A pretrained multilingual sentence model turns a passage into a vector; passages with similar
meanings get similar vectors, in English or Spanish. The model is open source and runs on this
machine through ONNX Runtime (fastembed), so there is no API key and no cost. It is downloaded
once (about 220 MB) into EMBEDDING_CACHE_DIR.
"""
import math
import threading
from typing import Protocol

from app.core.config import get_settings


class EmbedderUnavailable(RuntimeError):
    """Semantic search is switched off, or the model could not be loaded."""


class Embedder(Protocol):
    name: str

    def embed(self, texts: list[str]) -> list[list[float]]:
        """One unit-length vector per text."""


def normalize(vector: list[float]) -> list[float]:
    length = math.sqrt(sum(x * x for x in vector))
    return [round(x / length, 6) for x in vector] if length else list(vector)


class FastEmbedEmbedder:
    def __init__(self, name: str, cache_dir: str) -> None:
        self.name = name
        self._cache_dir = cache_dir
        self._model = None
        self._lock = threading.Lock()

    def _load(self):
        with self._lock:
            if self._model is None:
                try:
                    from fastembed import TextEmbedding

                    self._model = TextEmbedding(self.name, cache_dir=self._cache_dir)
                except Exception as exc:  # missing package, no network for the first download, unknown model
                    raise EmbedderUnavailable(f"Could not load {self.name}: {exc}") from exc
        return self._model

    def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        return [normalize(v.tolist()) for v in self._load().embed(texts)]


_embedder: Embedder | None = None


def get_embedder() -> Embedder:
    """The configured embedder. The model itself loads on first use."""
    global _embedder
    settings = get_settings()
    if not settings.semantic_search:
        raise EmbedderUnavailable("Semantic search is switched off (SEMANTIC_SEARCH=false)")
    if _embedder is None:
        _embedder = FastEmbedEmbedder(settings.embedding_model, str(settings.embedding_cache_dir))
    return _embedder


def set_embedder(embedder: Embedder | None) -> None:
    """Swap the embedder (tests use a small deterministic one). None restores the configured model."""
    global _embedder
    _embedder = embedder
