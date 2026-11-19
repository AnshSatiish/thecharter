"""Choosing each project's best passage and dropping weak matches (best_per_project in semantic.py)."""
import pytest

from app.core.config import get_settings
from app.services.search.semantic import best_per_project


@pytest.fixture
def cutoffs(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "semantic_min_score", 0.5)
    monkeypatch.setattr(settings, "semantic_relative_cut", 0.8)


def row(project_id, similarity, text="t", document_id=None, source="project"):
    return (project_id, document_id, source, text, similarity)


def test_keeps_only_the_best_passage_per_project(cutoffs):
    rows = [row(1, 0.9, "best of 1"), row(2, 0.85), row(1, 0.84, "second of 1")]
    hits = best_per_project(rows, limit=10)
    assert [h.project_id for h in hits] == [1, 2]
    assert hits[0].passage == "best of 1" and hits[0].matched_by == ["semantic"]


def test_drops_passages_below_the_absolute_floor(cutoffs):
    assert best_per_project([row(1, 0.49)], limit=10) == []


def test_drops_passages_far_below_the_best_result(cutoffs):
    # Best is 0.9, so the relative floor is 0.72: 0.75 stays, 0.7 goes, and so does everything after it.
    hits = best_per_project([row(1, 0.9), row(2, 0.75), row(3, 0.7), row(4, 0.69)], limit=10)
    assert [h.project_id for h in hits] == [1, 2]


def test_stops_on_nan_from_a_blank_vector(cutoffs):
    assert [h.project_id for h in best_per_project([row(1, 0.9), row(2, float("nan")), row(3, 0.88)], limit=10)] == [1]


def test_carries_the_document_and_rounds_similarity(cutoffs):
    hit = best_per_project([row(5, 0.876543, "pdf text", document_id=3, source="document")], limit=10)[0]
    assert (hit.document_id, hit.passage_source, hit.similarity) == (3, "document", 0.8765)


def test_limit(cutoffs):
    assert len(best_per_project([row(i, 0.9) for i in range(5)], limit=2)) == 2
