"""Compare keyword, semantic and hybrid search on a set of test queries.

Run from this folder with the backend's environment:

    ..\\..\\.venv\\Scripts\\python evaluate_search.py

It loads the sample projects into a temporary SQLite database, indexes them with the real
sentence model, runs every query in queries.json through the three search modes and writes
results.md. Each query lists the projects a person judged relevant.

Measures (queries that have an answer):
  Hit@1     share of queries whose first result is relevant
  Recall@3  share of the relevant projects that appear in the first three results
  MRR       mean of 1 / rank of the first relevant result (0 when none is returned)
Off-topic queries have no answer; for those the measure is how often a mode wrongly returns something.
"""
import json
import os
import sys
import tempfile
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
os.environ["DATABASE_URL"] = "sqlite:///" + (Path(tempfile.mkdtemp(prefix="charter-eval-")) / "eval.db").as_posix()
sys.path.insert(0, str(HERE.parents[1] / "inference"))

from sqlalchemy.orm import Session  # noqa: E402

from app.ai.embeddings import get_embedder  # noqa: E402
from app.db.session import engine  # noqa: E402
from app.scripts.seed import seed  # noqa: E402
from app.services.search import hybrid_search, keyword_search, semantic_search  # noqa: E402

MODES = {"keyword": keyword_search, "semantic": semantic_search, "hybrid": hybrid_search}


def measure(ranked: list[int], relevant: set[int]) -> dict[str, float]:
    first = next((i for i, pid in enumerate(ranked, start=1) if pid in relevant), None)
    return {
        "Hit@1": float(bool(ranked) and ranked[0] in relevant),
        "Recall@3": len(relevant & set(ranked[:3])) / len(relevant),
        "MRR": 1 / first if first else 0.0,
    }


def main() -> None:
    queries = json.loads((HERE / "queries.json").read_text(encoding="utf-8"))
    projects = seed(engine)
    scores: dict[tuple[str, str], list[dict[str, float]]] = defaultdict(list)
    wrong: dict[str, int] = defaultdict(int)
    rows = []
    with Session(engine) as db:
        for query in queries:
            relevant = set(query["relevant"])
            ranked = {mode: [h.project_id for h in fn(db, query["q"], 10)] for mode, fn in MODES.items()}
            rows.append((query, ranked))
            for mode, ids in ranked.items():
                if relevant:
                    result = measure(ids, relevant)
                    scores[(mode, query["type"])].append(result)
                    scores[(mode, "all")].append(result)
                elif ids:
                    wrong[mode] += 1

    def mean(mode: str, group: str, name: str) -> str:
        values = [s[name] for s in scores[(mode, group)]]
        return f"{sum(values) / len(values):.2f}"

    groups = ["all"] + sorted({q["type"] for q in queries if q["relevant"]})
    off_topic = sum(1 for q in queries if not q["relevant"])
    out = [
        "# Search evaluation",
        "",
        f"Model: `{get_embedder().name}`. Data: {projects} sample projects, {len(queries)} queries "
        f"({off_topic} off-topic). Produced by `evaluate_search.py`.",
        "",
        "With so few projects these numbers show that the pipeline works and how the modes differ; "
        "they are not a final measurement. The relevance cut-off (SEMANTIC_MIN_SCORE) was also tuned on these same "
        "projects, and the queries were written by the team. Rerun this, with queries from people outside the team, "
        "when the partner's projects are loaded.",
        "",
        "| Queries | Mode | Hit@1 | Recall@3 | MRR |",
        "|---|---|---|---|---|",
    ]
    for group in groups:
        for mode in MODES:
            count = len(scores[(mode, group)])
            out.append(f"| {group} ({count}) | {mode} | {mean(mode, group, 'Hit@1')} | {mean(mode, group, 'Recall@3')} | {mean(mode, group, 'MRR')} |")
    out += ["", f"Off-topic queries that wrongly returned a result (out of {off_topic}): "
            + ", ".join(f"{mode} {wrong[mode]}" for mode in MODES) + ".", "",
            "## Every query", "", "| Type | Query | Relevant | Keyword | Semantic | Hybrid |", "|---|---|---|---|---|---|"]
    for query, ranked in rows:
        cells = " | ".join(str(ranked[mode][:5]) for mode in MODES)
        out.append(f"| {query['type']} | {query['q']} | {query['relevant']} | {cells} |")

    report = "\n".join(out) + "\n"
    (HERE / "results.md").write_text(report, encoding="utf-8")
    print(report.encode("ascii", "replace").decode())


if __name__ == "__main__":
    main()
