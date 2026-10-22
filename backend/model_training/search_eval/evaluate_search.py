"""End-to-end check of the search the application runs: `..\\..\\.venv\\Scripts\\python evaluate_search.py`.

Loads the 7 partner sample projects and the 30 synthetic projects (with their report texts as
documents), indexes them with the application's own code and its configured model and settings
(app/core/config.py), and runs every query in queries.json through the three search modes of
GET /api/projects/search. Nothing is tuned here: the settings were chosen by cross-validation in
../compare_models.py, so this is a check that the deployed configuration behaves as measured.

Measures (queries that have an answer):
  Hit@1     share of queries whose first result is relevant
  Recall@3  share of the relevant projects that appear in the first three results
  MRR       mean of 1 / rank of the first relevant result (0 when none is returned)
Off-topic queries have no answer; for those the measure is whether nothing was returned.

Writes results.md next to this script.
"""
import sys
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
import common  # noqa: E402,F401  (temporary database first)
from common import average, build_corpus, load_queries, measures  # noqa: E402

from sqlalchemy.orm import Session  # noqa: E402

from app.ai.embeddings import get_embedder  # noqa: E402
from app.core.config import get_settings  # noqa: E402
from app.db.session import engine  # noqa: E402
from app.services.search import hybrid_search, keyword_search, semantic_search  # noqa: E402
from app.services.search_index import reindex_all  # noqa: E402

MODES = {"keyword": keyword_search, "semantic": semantic_search, "hybrid": hybrid_search}


def main() -> None:
    settings = get_settings()
    settings.semantic_search = True  # common.py switched it off for the training scripts
    build_corpus()
    with Session(engine) as db:
        reindex_all(db)
        queries = load_queries()
        rows = defaultdict(lambda: defaultdict(list))
        table = []
        for q in queries:
            ranked = {mode: [h.project_id for h in fn(db, q["q"], 10)] for mode, fn in MODES.items()}
            table.append((q, ranked))
            for mode, ids in ranked.items():
                m = measures(ids, set(q["relevant"]))
                rows[mode]["all"].append(m)
                rows[mode][q["type"]].append(m)

    kinds = ["all"] + sorted({q["type"] for q in queries} - {"off-topic"})
    off = sum(1 for q in queries if not q["relevant"])
    out = [
        "# Search evaluation (application settings)", "",
        f"Model `{get_embedder().name}`, passages of up to {settings.embedding_chunk_words} words, cut-off "
        f"{settings.semantic_min_score} and relative cut {settings.semantic_relative_cut} (chosen by cross-validation in "
        f"`compare_models.py`). Corpus: 37 projects (7 partner samples, 30 synthetic). {len(queries)} queries, "
        f"{len(queries) - off} with an answer and {off} off-topic. Produced by `evaluate_search.py`.", "",
        "| Queries | Mode | Hit@1 | Recall@3 | MRR |", "|---|---|---|---|---|",
    ]
    for kind in kinds:
        for mode in MODES:
            answered = [m for m in rows[mode][kind] if "hit1" in m]
            a = average(answered)
            out.append(f"| {kind} ({len(answered)}) | {mode} | {a['hit1']:.2f} | {a['recall3']:.2f} | {a['mrr']:.2f} |")
    out += ["", f"Off-topic queries correctly returning nothing (out of {off}): "
            + ", ".join(f"{mode} {int(sum(m['rejected'] for m in rows[mode]['off-topic']))}" for mode in MODES) + ".", "",
            "## Every query", "", "| Type | Query | Relevant | Keyword | Semantic | Hybrid |", "|---|---|---|---|---|---|"]
    for q, ranked in table:
        out.append(f"| {q['type']} | {q['q']} | {q['relevant']} | " + " | ".join(str(ranked[m][:5]) for m in MODES) + " |")
    report = "\n".join(out) + "\n"
    (HERE / "results.md").write_text(report, encoding="utf-8")
    print("\n".join(out[: 8 + 3 * len(kinds) + 2]).encode("ascii", "replace").decode())


if __name__ == "__main__":
    main()
