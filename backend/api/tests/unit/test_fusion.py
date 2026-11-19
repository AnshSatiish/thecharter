"""Reciprocal rank fusion (app/services/search/fusion.py): merging keyword and semantic results.

fuse() is a pure function, so these tests need no database, no model and no client.
Each project scores 1 / (RRF_K + rank) in every list it appears in; the scores are added.
"""
import copy
import random

import pytest

from app.services.search import RRF_K, Hit, fuse


def kw(*project_ids: int, score: float = 1.0) -> list[Hit]:
    """A keyword result list, best first."""
    return [Hit(pid, score, ["keyword"]) for pid in project_ids]


def sem(*project_ids: int) -> list[Hit]:
    """A semantic result list, best first. Similarity falls with rank, as it does from the real model."""
    return [
        Hit(pid, 0.9 - i / 100, ["semantic"], similarity=round(0.9 - i / 100, 4), passage=f"passage {pid}",
            passage_source="project", document_id=None)
        for i, pid in enumerate(project_ids)
    ]


def order(hits: list[Hit]) -> list[int]:
    return [h.project_id for h in hits]


# ---------- the formula ----------

def test_rrf_constant_is_the_standard_60():
    assert RRF_K == 60


def test_fuse_rewards_results_in_both_lists():
    keyword = [Hit(1, 0.9, ["keyword"]), Hit(2, 0.5, ["keyword"])]
    semantic = [Hit(3, 0.8, ["semantic"], passage="p3"), Hit(2, 0.7, ["semantic"], passage="p2")]
    merged = fuse(keyword, semantic, limit=10)
    assert [h.project_id for h in merged] == [2, 1, 3]
    assert merged[0].matched_by == ["semantic", "keyword"] and merged[0].passage == "p2"
    assert fuse(keyword, semantic, limit=1)[0].project_id == 2


def test_single_list_scores_are_one_over_k_plus_rank():
    merged = fuse(kw(10, 20, 30), [], limit=10)
    assert [h.score for h in merged] == pytest.approx([1 / 61, 1 / 62, 1 / 63])


def test_scores_add_up_across_both_lists():
    # Project 7 is 1st by keyword and 3rd by meaning: 1/61 + 1/63.
    merged = fuse(kw(7, 8), sem(5, 6, 7), limit=10)
    seven = next(h for h in merged if h.project_id == 7)
    assert seven.score == pytest.approx(1 / (RRF_K + 1) + 1 / (RRF_K + 3))


def test_raw_scores_are_ignored_only_rank_counts():
    # Keyword and semantic scores are on different scales; fusion must not compare them.
    keyword = [Hit(1, 0.01, ["keyword"]), Hit(2, 9999.0, ["keyword"])]
    merged = fuse(keyword, [], limit=10)
    assert order(merged) == [1, 2]
    assert merged[0].score == pytest.approx(1 / 61)


def test_found_by_both_beats_top_of_one_list():
    # 3rd in both lists (2/63 = 0.0317) outranks 1st in only one list (1/61 = 0.0164).
    merged = fuse(kw(1, 2, 9), sem(3, 4, 9), limit=10)
    assert merged[0].project_id == 9


def test_found_by_both_but_far_down_loses_to_a_top_result():
    # 70th in both lists (2/130 = 0.0154) is still below 1st in one list (1/61 = 0.0164).
    filler_kw = list(range(1000, 1069))
    filler_sem = list(range(2000, 2069))
    merged = fuse(kw(1, *filler_kw[1:], 9), sem(*filler_sem, 9), limit=200)
    ranks = order(merged)
    assert ranks.index(1) < ranks.index(9)


# ---------- empty and partial input ----------

def test_both_lists_empty():
    assert fuse([], [], limit=10) == []


def test_only_semantic_results_keep_their_order_and_passages():
    merged = fuse([], sem(4, 2, 8), limit=10)
    assert order(merged) == [4, 2, 8]
    assert all(h.matched_by == ["semantic"] for h in merged)
    assert merged[0].passage == "passage 4" and merged[0].similarity == pytest.approx(0.9)


def test_only_keyword_results_keep_their_order_and_have_no_passage():
    merged = fuse(kw(4, 2, 8), [], limit=10)
    assert order(merged) == [4, 2, 8]
    assert all(h.matched_by == ["keyword"] for h in merged)
    assert all(h.passage is None and h.similarity is None and h.document_id is None for h in merged)


# ---------- limit ----------

@pytest.mark.parametrize(("limit", "expected"), [(0, 0), (1, 1), (3, 3), (5, 5), (50, 5)])
def test_limit_truncates_after_ranking(limit, expected):
    merged = fuse(kw(1, 2, 3), sem(3, 4, 5), limit=limit)
    assert len(merged) == expected


def test_limit_keeps_the_best_not_the_first_seen():
    # Project 3 is last in the keyword list but in both lists, so it must survive limit=1.
    assert order(fuse(kw(1, 2, 3), sem(3), limit=1)) == [3]


# ---------- what the merged hit carries ----------

def test_matched_by_lists_semantic_then_keyword():
    merged = fuse(kw(1), sem(1), limit=10)
    assert merged[0].matched_by == ["semantic", "keyword"]


def test_passage_comes_from_the_semantic_hit():
    semantic = [Hit(1, 0.8, ["semantic"], similarity=0.8, passage="from the PDF", passage_source="document", document_id=42)]
    merged = fuse(kw(1), semantic, limit=10)[0]
    assert (merged.passage, merged.similarity, merged.passage_source, merged.document_id) == (
        "from the PDF", 0.8, "document", 42,
    )


def test_inputs_are_not_modified():
    keyword, semantic = kw(1, 2), sem(2, 3)
    before = copy.deepcopy((keyword, semantic))
    fuse(keyword, semantic, limit=10)
    assert (keyword, semantic) == before


def test_returns_new_hit_objects():
    keyword, semantic = kw(1), sem(2)
    merged = fuse(keyword, semantic, limit=10)
    assert all(h is not original for h in merged for original in keyword + semantic)


# ---------- ties ----------

def test_tie_goes_to_the_closer_meaning():
    # Both are 1st in their list (score 1/61 each); the semantic one has a similarity, the keyword one has none.
    merged = fuse(kw(5), sem(9), limit=10)
    assert order(merged) == [9, 5]


def test_tie_with_equal_similarity_goes_to_the_lower_project_id():
    no_passage = [Hit(9, 0.5, ["semantic"])]  # similarity None counts as 0, like a keyword hit
    assert order(fuse(kw(3), no_passage, limit=10)) == [3, 9]
    assert order(fuse(kw(9), [Hit(3, 0.5, ["semantic"])], limit=10)) == [3, 9]


# ---------- properties over random input ----------

@pytest.mark.parametrize("seed", range(25))
def test_random_lists_score_and_sort_correctly(seed):
    rng = random.Random(seed)
    pool = list(range(1, 40))
    keyword = kw(*rng.sample(pool, rng.randint(0, 15)))
    semantic = sem(*rng.sample(pool, rng.randint(0, 15)))
    merged = fuse(keyword, semantic, limit=100)

    # Every project from either list appears exactly once.
    expected_ids = {h.project_id for h in keyword + semantic}
    assert sorted(order(merged)) == sorted(expected_ids)

    # Each score is the sum of 1 / (K + rank) over the lists the project is in.
    for hit in merged:
        expected = sum(1 / (RRF_K + rank) for hits in (keyword, semantic)
                       for rank, h in enumerate(hits, start=1) if h.project_id == hit.project_id)
        assert hit.score == pytest.approx(expected)

    # Best first, and the same input always gives the same order.
    assert [h.score for h in merged] == sorted((h.score for h in merged), reverse=True)
    assert order(fuse(keyword, semantic, limit=100)) == order(merged)
