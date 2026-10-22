"""Shared set-up for the model training and evaluation scripts in this folder.

Builds a temporary database with the 7 partner sample projects and the 30 synthetic projects
(backend/data/synthetic), each synthetic project with its report text attached as a document,
exactly as the API would store an uploaded PDF. Passages are cut by the API's own code, so the
experiments measure what the application runs.

Import this module before anything from `app`: it points the API at the temporary database.
"""
import json
import os
import random
import sys
import tempfile
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
BACKEND = HERE.parent
DATA = BACKEND / "data"
os.environ["DATABASE_URL"] = "sqlite:///" + (Path(tempfile.mkdtemp(prefix="charter-train-")) / "train.db").as_posix()
os.environ["SEMANTIC_SEARCH"] = "false"  # the scripts embed passages themselves, with the model under test
sys.path.insert(0, str(BACKEND / "inference"))

import numpy as np  # noqa: E402
from sqlalchemy import select  # noqa: E402
from sqlalchemy.orm import Session, selectinload  # noqa: E402

from app.core.config import get_settings  # noqa: E402
from app.db.models import Document, Project  # noqa: E402
from app.db.session import engine  # noqa: E402
from app.scripts.seed import seed  # noqa: E402
from app.services.search_index import passages  # noqa: E402

SAMPLES = DATA / "samples" / "projects.json"
SYNTHETIC = DATA / "synthetic" / "projects.json"
QUERIES = HERE / "search_eval" / "queries.json"
SEED = 42


def build_corpus() -> None:
    """Load sample and synthetic projects into the temporary database (no embeddings yet)."""
    seed(engine, SAMPLES)
    seed(engine, SYNTHETIC)
    with Session(engine) as db:
        for rec in json.loads(SYNTHETIC.read_text(encoding="utf-8")):
            db.add(Document(project_id=rec["id"], title=f"{rec['title']} (field report)", filename=f"report-{rec['id']}.pdf",
                            path=f"synthetic/report-{rec['id']}.pdf", size_bytes=len(rec["document_text"]), pages=1,
                            text=rec["document_text"]))
        db.commit()


def corpus_passages(chunk_words: int) -> tuple[list[int], list[str]]:
    """(project id, passage text) for every passage, cut as the API cuts them at this passage length."""
    get_settings().embedding_chunk_words = chunk_words
    owners, texts = [], []
    with Session(engine) as db:
        stmt = select(Project).options(selectinload(Project.documents).undefer(Document.text)).order_by(Project.id)
        for project in db.scalars(stmt).unique():
            for _, _, text in passages(project):
                owners.append(project.id)
                texts.append(text)
    return owners, texts


def load_queries() -> list[dict]:
    return json.loads(QUERIES.read_text(encoding="utf-8"))


def folds(queries: list[dict], k: int = 5, seed: int = SEED) -> list[list[int]]:
    """Stratified k-fold split of query indices: every fold has the same mix of query types."""
    by_type: dict[str, list[int]] = defaultdict(list)
    for i, q in enumerate(queries):
        by_type[q["type"]].append(i)
    rng = random.Random(seed)
    out: list[list[int]] = [[] for _ in range(k)]
    offset = 0
    for kind in sorted(by_type):
        idx = by_type[kind]
        rng.shuffle(idx)
        for j, i in enumerate(idx):
            out[(j + offset) % k].append(i)
        offset += len(idx)
    return out


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
