"""Reciprocal rank fusion (RRF): merge the keyword and semantic result lists into one ranking.

A pure function with no database or model, so it is unit-tested directly (tests/unit/test_fusion.py).

Each project scores 1 / (RRF_K + rank) in every list it appears in, and the scores are added.
Rank, not the raw score, is what counts: keyword and semantic scores are on different scales
and cannot be compared, but "first in its list" means the same thing in both. A project found
by both methods therefore beats one found by only one, unless it ranks far down both lists.
"""
from app.services.search.hit import Hit

RRF_K = 60  # the usual constant: a rank-1 result scores 1/61, rank 2 scores 1/62, and so on


def fuse(keyword: list[Hit], semantic: list[Hit], limit: int) -> list[Hit]:
    """Merge two ranked lists, best first.

    - `matched_by` lists how the project was found, semantic first ("semantic", "keyword").
    - The passage, similarity and document come from the semantic hit (keyword hits have none).
    - Ties go to the closer meaning (higher similarity), then to the lower project id, so the
      order is always the same for the same input.
    - The input lists are not modified.
    """
    merged: dict[int, Hit] = {}
    for hits in (semantic, keyword):
        for rank, hit in enumerate(hits, start=1):
            target = merged.setdefault(hit.project_id, Hit(hit.project_id, 0.0))
            target.score += 1 / (RRF_K + rank)
            target.matched_by += hit.matched_by
            if hit.passage:
                target.similarity, target.passage = hit.similarity, hit.passage
                target.passage_source, target.document_id = hit.passage_source, hit.document_id
    return sorted(merged.values(), key=lambda h: (-h.score, -(h.similarity or 0), h.project_id))[:limit]
