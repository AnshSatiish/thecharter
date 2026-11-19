"""Embedding helpers that need no model (app/ai/embeddings/embedder.py)."""
import math

import pytest

from app.ai.embeddings import EmbedderUnavailable, get_embedder, normalize


def test_normalize_gives_a_unit_vector():
    vector = normalize([3.0, 4.0])
    assert vector == [0.6, 0.8]
    assert math.isclose(sum(x * x for x in vector), 1.0)


def test_normalize_leaves_the_zero_vector_alone():
    assert normalize([0.0, 0.0]) == [0.0, 0.0]


def test_switched_off_semantic_search_is_reported_as_unavailable(monkeypatch):
    from app.core.config import get_settings

    monkeypatch.setattr(get_settings(), "semantic_search", False)
    with pytest.raises(EmbedderUnavailable, match="switched off"):
        get_embedder()
