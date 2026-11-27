"""Search evaluated on the partner's real projects only: `python evaluation/real_data/evaluate_search_real.py` (from backend/ml).

No generated data. The corpus is the partner's sample projects (backend/data/samples/projects.json) with the two
thesis PDFs the partner supplied (frontend/assets/pdfs/p29.pdf, p30.pdf) attached as documents, exactly as an
upload stores them.

The queries are text the projects' own authors wrote, held out of the index:
  description  each project's description is removed from the index and used as the query
  caption      each photo caption is removed from its project and used as the query
A query is cut to 200 characters, the API's limit. The right answer is the project the text came from.

Two comparisons:
  1. The application as configured (app/core/config.py): keyword, semantic and hybrid search through the API's
     own search code, with its cut-offs. Also gives a confusion matrix: which project came first for each query.
  2. Ranking quality of the candidate models without any cut-off: keyword full-text, TF-IDF and three
     sentence-embedding models over the same passages.

Nothing is tuned here: with 9 projects there is too little data to choose settings without testing on them.
Writes results.json and results.md next to this script.
"""
import json
import logging
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1]))  # backend/ml, for common.py
import common  # noqa: E402,F401  (temporary database first)
from common import BACKEND, SAMPLES, average, measures, rank_semantic  # noqa: E402

import numpy as np  # noqa: E402
from sklearn.feature_extraction.text import TfidfVectorizer  # noqa: E402
from sqlalchemy import select  # noqa: E402
from sqlalchemy.orm import Session, selectinload  # noqa: E402

from app.ai.embeddings import FastEmbedEmbedder, get_embedder  # noqa: E402
from app.core.config import get_settings  # noqa: E402
from app.db.models import Document, Project  # noqa: E402
from app.db.session import engine  # noqa: E402
from app.scripts.seed import seed  # noqa: E402
from app.services.search import hybrid_search, keyword_search, semantic_search  # noqa: E402
from app.services.search.indexing import passages, reindex_all, reindex_project  # noqa: E402
from app.text.pdf import extract_pdf_text  # noqa: E402

logging.disable(logging.WARNING)
PDFS = {29: BACKEND.parent / "frontend" / "assets" / "pdfs" / "p29.pdf",
        30: BACKEND.parent / "frontend" / "assets" / "pdfs" / "p30.pdf"}
MODELS = {
    "all-MiniLM-L6-v2": "sentence-transformers/all-MiniLM-L6-v2",
    "paraphrase-multilingual-MiniLM-L12-v2": "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
    "bge-small-en-v1.5": "BAAI/bge-small-en-v1.5",
}
APP_MODES = {"keyword": keyword_search, "semantic": semantic_search, "hybrid": hybrid_search}
QUERY_CHARS = 200


def clip(text: str) -> str:
    text = " ".join(text.split())
    return text if len(text) <= QUERY_CHARS else text[:QUERY_CHARS].rsplit(" ", 1)[0]


def build() -> list[dict]:
    settings = get_settings()
    settings.semantic_search = True  # common.py switched it off for the training scripts
    seed(engine, SAMPLES)
    with Session(engine) as db:
        for pid, path in PDFS.items():
            text, pages = extract_pdf_text(path.read_bytes())
            project = db.get(Project, pid)
            db.add(Document(project_id=pid, title=f"{project.title} (PDF)", filename=path.name, path=f"samples/{path.name}",
                            size_bytes=path.stat().st_size, pages=pages, text=text))
        db.commit()
        reindex_all(db)
    queries = []
    for rec in json.loads(SAMPLES.read_text(encoding="utf-8")):
        queries.append({"kind": "description", "project": rec["id"], "index": None, "q": clip(rec["description"])})
        for i, caption in enumerate(rec.get("captions") or []):
            queries.append({"kind": "caption", "project": rec["id"], "index": i, "q": clip(caption)})
    return queries


def hold_out(project: Project, query: dict):
    """Remove the query's text from its project; returns a function that puts it back."""
    description, captions = project.description, list(project.captions or [])
    if query["kind"] == "description":
        project.description = ""
    else:
        project.captions = [c for i, c in enumerate(captions) if i != query["index"]]

    def restore():
        project.description, project.captions = description, captions
    return restore


def main() -> None:
    queries = build()
    settings = get_settings()
    app_ranked, held_passages, base_passages = [], [], {}
    with Session(engine) as db:
        load = select(Project).options(selectinload(Project.documents).undefer(Document.text)).order_by(Project.id)
        projects = {p.id: p for p in db.scalars(load).unique()}
        ids = sorted(projects)
        base_passages = {pid: [t for _, _, t in passages(p)] for pid, p in projects.items()}
        t0 = time.perf_counter()
        for q in queries:
            project = projects[q["project"]]
            restore = hold_out(project, q)
            db.flush()
            reindex_project(db, project.id)
            held_passages.append([t for _, _, t in passages(project)])
            app_ranked.append({mode: [h.project_id for h in fn(db, q["q"], 10)] for mode, fn in APP_MODES.items()})
            keyword_any = [h.project_id for h in keyword_search(db, q["q"], 10)]
            app_ranked[-1]["keyword_any"] = keyword_any
            restore()
            db.flush()
            reindex_project(db, project.id)
        app_seconds = time.perf_counter() - t0

    report = {"projects": len(ids), "queries": len(queries),
              "by_kind": {k: sum(1 for q in queries if q["kind"] == k) for k in ("description", "caption")},
              "settings": {"model": get_embedder().name, "passage_words": settings.embedding_chunk_words,
                           "min_score": settings.semantic_min_score, "relative_cut": settings.semantic_relative_cut},
              "application": {}, "ranking": {}, "confusion": {}, "every_query": []}

    # ---------- 1. the application as configured ----------
    for mode in APP_MODES:
        rows = [measures(r[mode], {q["project"]}) for q, r in zip(queries, app_ranked)]
        report["application"][mode] = {
            "all": average(rows) | {"n": len(rows), "returned_nothing": sum(1 for r in app_ranked if not r[mode])},
            **{k: average([m for m, q in zip(rows, queries) if q["kind"] == k]) for k in ("description", "caption")},
        }
        matrix = {str(a): {str(b): 0 for b in ids + ["none"]} for a in ids}
        for q, r in zip(queries, app_ranked):
            matrix[str(q["project"])][str(r[mode][0]) if r[mode] else "none"] += 1
        report["confusion"][mode] = matrix

    # ---------- 2. ranking quality without a cut-off ----------
    def rank_from(scores_by_passage: list[np.ndarray], owners_by_query: list[np.ndarray]) -> list[list[int]]:
        return [rank_semantic(s, o, -1.0, 0.0) for s, o in zip(scores_by_passage, owners_by_query)]

    corpora = []  # per query: (owners, texts) with the query's text held out of its project
    for q, held in zip(queries, held_passages):
        owners, texts = [], []
        for pid in ids:
            for t in (held if pid == q["project"] else base_passages[pid]):
                owners.append(pid)
                texts.append(t)
        corpora.append((np.asarray(owners), texts))

    ranked_by_method = {"Keyword (full-text)": [r["keyword_any"] for r in app_ranked]}
    tfidf = []
    for q, (owners, texts) in zip(queries, corpora):
        vectorizer = TfidfVectorizer(stop_words="english", sublinear_tf=True, ngram_range=(1, 2))
        matrix = vectorizer.fit_transform(texts)
        tfidf.append((vectorizer.transform([q["q"]]) @ matrix.T).toarray()[0])
    ranked_by_method["TF-IDF"] = rank_from(tfidf, [c[0] for c in corpora])

    cache_dir = str(Path(settings.embedding_cache_dir).expanduser())
    for label, name in MODELS.items():
        model = FastEmbedEmbedder(name, cache_dir)
        every_text = sorted({t for _, texts in corpora for t in texts})
        t0 = time.perf_counter()
        vectors = dict(zip(every_text, np.asarray(model.embed(every_text), dtype=np.float32)))
        index_seconds = time.perf_counter() - t0
        sims = []
        t0 = time.perf_counter()
        for q, (owners, texts) in zip(queries, corpora):
            query = np.asarray(model.embed_query(q["q"]), dtype=np.float32)
            sims.append(np.stack([vectors[t] for t in texts]) @ query)
        ranked_by_method[label] = rank_from(sims, [c[0] for c in corpora])
        report.setdefault("timing", {})[label] = {"index_s": round(index_seconds, 1),
                                                  "query_ms": round((time.perf_counter() - t0) / len(queries) * 1000, 1)}
        print(label, "done")

    for label, ranked in ranked_by_method.items():
        rows = [measures(r, {q["project"]}) for q, r in zip(queries, ranked)]
        hit3 = [float(q["project"] in r[:3]) for q, r in zip(queries, ranked)]
        report["ranking"][label] = {
            "all": average(rows) | {"hit3": float(np.mean(hit3)), "n": len(rows)},
            **{k: average([m for m, q in zip(rows, queries) if q["kind"] == k]) | {
                "hit3": float(np.mean([h for h, q in zip(hit3, queries) if q["kind"] == k]))} for k in ("description", "caption")},
        }
    for q, r in zip(queries, app_ranked):
        report["every_query"].append({"kind": q["kind"], "project": q["project"], "q": q["q"],
                                      **{mode: r[mode][:5] for mode in APP_MODES}})
    report["app_seconds"] = round(app_seconds, 1)
    (HERE / "results.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    write_markdown(report, ids)


def write_markdown(report: dict, ids: list[int]) -> None:
    s = report["settings"]
    out = ["# Search evaluation on the partner's real projects", "",
           f"{report['projects']} partner projects (with the two thesis PDFs). {report['queries']} queries taken from the projects' "
           f"own text and held out of the index: {report['by_kind']['description']} descriptions and {report['by_kind']['caption']} "
           f"photo captions, each cut to {QUERY_CHARS} characters. No generated data. Produced by `evaluate_search_real.py`.", "",
           f"## 1. The application as configured ({s['model']}, {s['passage_words']}-word passages, cut-offs {s['min_score']} "
           f"and {s['relative_cut']})", "",
           "| Mode | Queries | Hit@1 | MRR | Returned nothing |", "|---|---|---|---|---|"]
    for mode, r in report["application"].items():
        for kind in ("all", "description", "caption"):
            a = r[kind]
            nothing = r["all"]["returned_nothing"] if kind == "all" else ""
            n = r["all"]["n"] if kind == "all" else report["by_kind"][kind]
            out.append(f"| {mode} | {kind} ({n}) | {a['hit1']:.2f} | {a['mrr']:.2f} | {nothing} |")
    out += ["", "## 2. Ranking quality without a cut-off", "", "| Method | Queries | Hit@1 | Hit@3 | MRR |", "|---|---|---|---|---|"]
    for label, r in report["ranking"].items():
        for kind in ("all", "description", "caption"):
            a = r[kind]
            n = r["all"]["n"] if kind == "all" else report["by_kind"][kind]
            out.append(f"| {label} | {kind} ({n}) | {a['hit1']:.2f} | {a['hit3']:.2f} | {a['mrr']:.2f} |")
    out += ["", "## Confusion matrix, hybrid search (rows: the project the query came from; columns: first result)", "",
            "| From \\ First | " + " | ".join(str(i) for i in ids) + " | none |", "|" + "---|" * (len(ids) + 2)]
    for a, row in report["confusion"]["hybrid"].items():
        out.append(f"| {a} | " + " | ".join(str(row[str(b)]) for b in ids + ["none"]) + " |")
    (HERE / "results.md").write_text("\n".join(out) + "\n", encoding="utf-8")
    print("\n".join(out).encode("ascii", "replace").decode())


if __name__ == "__main__":
    main()
