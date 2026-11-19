"""hybrid_search wiring (app/services/search/hybrid.py), with keyword and semantic search replaced by stubs."""
import pytest

from app.services.search import Hit, hybrid
from app.services.search.fusion import RRF_K


def test_hybrid_asks_for_strict_keywords_and_fuses_both_lists(monkeypatch):
    calls = {}

    def fake_keyword(db, q, limit, strict=False):
        calls["keyword"] = (db, q, limit, strict)
        return [Hit(1, 0.4, ["keyword"])]

    def fake_semantic(db, q, limit):
        calls["semantic"] = (db, q, limit)
        return [Hit(2, 0.8, ["semantic"], similarity=0.8, passage="p"), Hit(1, 0.7, ["semantic"], similarity=0.7, passage="q")]

    monkeypatch.setattr(hybrid, "keyword_search", fake_keyword)
    monkeypatch.setattr(hybrid, "semantic_search", fake_semantic)

    results = hybrid.hybrid_search("db", "lake fishing", limit=5)

    # Strict: a project sharing one stray word with a long query must not get in through keywords.
    assert calls["keyword"] == ("db", "lake fishing", 5, True)
    assert calls["semantic"] == ("db", "lake fishing", 5)
    assert [h.project_id for h in results] == [1, 2]
    assert results[0].score == pytest.approx(1 / (RRF_K + 1) + 1 / (RRF_K + 2))


def test_hybrid_respects_the_limit(monkeypatch):
    monkeypatch.setattr(hybrid, "keyword_search", lambda db, q, limit, strict=False: [Hit(i, 1.0, ["keyword"]) for i in range(10)])
    monkeypatch.setattr(hybrid, "semantic_search", lambda db, q, limit: [])
    assert len(hybrid.hybrid_search(None, "x", limit=3)) == 3
