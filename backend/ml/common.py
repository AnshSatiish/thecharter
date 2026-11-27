"""Shared set-up for the evaluation scripts in evaluation/real_data.

Points the API at a temporary SQLite database (the scripts load the partner's projects into it), and holds the
ranking rule and the measures, so the evaluation measures what the application runs. Only the partner's real
projects are used; no data is generated.

Import this module before anything from `app`: it points the API at the temporary database.
"""
import os
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
BACKEND = HERE.parent
DATA = BACKEND / "data"
os.environ["DATABASE_URL"] = "sqlite:///" + (Path(tempfile.mkdtemp(prefix="charter-train-")) / "train.db").as_posix()
os.environ["SEMANTIC_SEARCH"] = "false"  # the scripts embed passages themselves, with the model under test
sys.path.insert(0, str(BACKEND / "api"))

import numpy as np  # noqa: E402


SAMPLES = DATA / "samples" / "projects.json"


# ---------- ranking and measures ----------

def rank_semantic(similarity: np.ndarray, owners: np.ndarray, min_score: float, relative_cut: float, limit: int = 10) -> list[int]:
    """Same rule as the API: score each project by its best passage, drop passages below the cut-offs."""
    order = np.argsort(-similarity)
    ranked: list[int] = []
    floor = min_score
    for i in order:
        s = float(similarity[i])
        if not s >= floor:
            break
        pid = int(owners[i])
        if pid in ranked:
            continue
        if not ranked:
            floor = max(floor, s * relative_cut)
        ranked.append(pid)
        if len(ranked) == limit:
            break
    return ranked


def measures(ranked: list[int], relevant: set[int]) -> dict[str, float]:
    """Hit@1, Recall@3 and reciprocal rank for queries with an answer; list F1 for every query.

    List F1 compares the whole returned list with the relevant set. For an off-topic query it is 1
    when nothing is returned and 0 otherwise, so it rewards a good cut-off as well as a good ranking.
    """
    if not relevant:
        return {"list_f1": float(not ranked), "rejected": float(not ranked)}
    first = next((r for r, pid in enumerate(ranked, start=1) if pid in relevant), None)
    hits = len(relevant & set(ranked))
    precision = hits / len(ranked) if ranked else 0.0
    recall = hits / len(relevant)
    return {
        "hit1": float(bool(ranked) and ranked[0] in relevant),
        "recall3": len(relevant & set(ranked[:3])) / len(relevant),
        "mrr": 1 / first if first else 0.0,
        "list_f1": 2 * precision * recall / (precision + recall) if hits else 0.0,
    }


def average(rows: list[dict[str, float]]) -> dict[str, float]:
    keys = sorted({k for r in rows for k in r})
    return {k: float(np.mean([r[k] for r in rows if k in r])) for k in keys}
