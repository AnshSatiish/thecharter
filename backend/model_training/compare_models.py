"""Choose the search model by measurement: `..\\.venv\\Scripts\\python compare_models.py`.

Compares two lexical baselines (keyword full-text search and TF-IDF) with three pretrained
sentence-embedding models, each alone and combined with keyword search (hybrid, what the site
runs), on the 37-project corpus and the judged query set. Every method's settings (passage length,
similarity cut-offs) are tuned by 5-fold cross-validation over the queries: chosen on four folds,
measured on the fifth, five times. Results are the mean and standard deviation of the held-out
folds, so no reported number comes from queries that were used to pick the settings. The final
settings for the application are then chosen on all the queries.

Writes results/model_comparison.json, results/model_comparison.md and figures/model_comparison.png.
"""
import itertools
import json
import logging
import time

import common  # noqa: F401  (sets up the temporary database first)
from common import HERE, average, build_corpus, corpus_passages, folds, load_queries, measures, rank_semantic

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sqlalchemy.orm import Session

from app.ai.embeddings import FastEmbedEmbedder
from app.core.config import get_settings
from app.db.session import engine
from app.services.search import Hit, fuse, keyword_search

logging.disable(logging.WARNING)
RESULTS = HERE / "results"
FIGURES = HERE / "figures"
MODELS = {
    "all-MiniLM-L6-v2": "sentence-transformers/all-MiniLM-L6-v2",
    "paraphrase-multilingual-MiniLM-L12-v2": "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
    "bge-small-en-v1.5": "BAAI/bge-small-en-v1.5",
}
CHUNK_WORDS = (40, 60, 90)
MIN_SCORES = [round(x, 3) for x in np.arange(0.0, 0.801, 0.025)]
RELATIVE_CUTS = (0.0, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95)
KEYS = ("hit1", "recall3", "mrr", "list_f1", "rejected")


def by_setting(rank, queries, grid):
    """Measures for every setting on every query: {setting: [measure dict per query]}."""
    return {g: [measures(rank(g, i), set(q["relevant"])) for i, q in enumerate(queries)] for g in grid}


def cross_validate(per_query: dict, queries: list[dict]) -> dict:
    """Each fold picks the setting with the best list F1 (ties: MRR) on its training folds and is measured on its test fold."""
    split = folds(queries)
    per_fold, chosen, held_out = [], [], {}
    for k, test in enumerate(split):
        train = [i for f, part in enumerate(split) if f != k for i in part]
        score = lambda g: (average([per_query[g][i] for i in train])["list_f1"],  # noqa: E731
                           average([per_query[g][i] for i in train]).get("mrr", 0))
        best = max(per_query, key=score)
        chosen.append(best)
        per_fold.append(average([per_query[best][i] for i in test]))
        held_out.update({i: per_query[best][i] for i in test})
    final = max(per_query, key=lambda g: (average(per_query[g])["list_f1"], average(per_query[g]).get("mrr", 0)))
    by_type = {}
    for kind in sorted({q["type"] for q in queries}):
        idx = [i for i, q in enumerate(queries) if q["type"] == kind]
        by_type[kind] = average([held_out[i] for i in idx]) | {"n": len(idx)}
    summary = {key: {"mean": float(np.mean([f[key] for f in per_fold if key in f])),
                     "sd": float(np.std([f[key] for f in per_fold if key in f], ddof=1))} for key in KEYS}
    return summary | {"chosen": [list(c) for c in chosen], "final": list(final), "by_type": by_type}


def main() -> None:
    RESULTS.mkdir(exist_ok=True)
    FIGURES.mkdir(exist_ok=True)
    build_corpus()
    queries = load_queries()
    corpora = {c: corpus_passages(c) for c in CHUNK_WORDS}
    report = {"projects": len(set(corpora[60][0])), "queries": len(queries),
              "with_answer": sum(1 for q in queries if q["relevant"]),
              "query_types": {k: sum(1 for q in queries if q["type"] == k) for k in sorted({q["type"] for q in queries})},
              "passages": {str(c): len(corpora[c][1]) for c in CHUNK_WORDS}, "methods": {}}
    grid = list(itertools.product(CHUNK_WORDS, MIN_SCORES, RELATIVE_CUTS))

    # ---------- keyword full-text search: nothing to tune ----------
    with Session(engine) as db:
        t0 = time.perf_counter()
        keyword_lists = [[h.project_id for h in keyword_search(db, q["q"], 10)] for q in queries]
        keyword_ms = (time.perf_counter() - t0) / len(queries) * 1000
        strict_lists = [[h.project_id for h in keyword_search(db, q["q"], 10, strict=True)] for q in queries]
    result = cross_validate({("-",): [measures(keyword_lists[i], set(q["relevant"])) for i, q in enumerate(queries)]}, queries)
    report["methods"]["Keyword (full-text)"] = result | {"kind": "lexical", "size_mb": 0, "query_ms": round(keyword_ms, 1)}

    def run(label, kind, sims_by_chunk, size_mb, query_ms, model=None):
        owners = {c: np.asarray(corpora[c][0]) for c in CHUNK_WORDS}
        semantic = lambda g, i: rank_semantic(sims_by_chunk[g[0]][i], owners[g[0]], g[1], g[2])  # noqa: E731
        report["methods"][label] = cross_validate(by_setting(semantic, queries, grid), queries) | {
            "kind": kind, "size_mb": size_mb, "query_ms": query_ms, "model": model}

        def hybrid(g, i):
            sem = [Hit(pid, 0.0, ["semantic"]) for pid in semantic(g, i)]
            kw = [Hit(pid, 0.0, ["keyword"]) for pid in strict_lists[i]]
            return [h.project_id for h in fuse(kw, sem, 10)]

        if kind == "embedding":
            report["methods"][f"Hybrid: keyword + {label}"] = cross_validate(by_setting(hybrid, queries, grid), queries) | {
                "kind": "hybrid", "size_mb": size_mb, "query_ms": query_ms, "model": model}
        print(label, {k: round(report["methods"][label][k]["mean"], 3) for k in KEYS})

    # ---------- TF-IDF over the same passages ----------
    sims = {}
    for c, (owners, texts) in corpora.items():
        vectorizer = TfidfVectorizer(stop_words="english", sublinear_tf=True, ngram_range=(1, 2))
        matrix = vectorizer.fit_transform(texts)
        sims[c] = (vectorizer.transform([q["q"] for q in queries]) @ matrix.T).toarray()
    run("TF-IDF", "lexical", sims, 0, None)

    # ---------- pretrained sentence-embedding models ----------
    for label, name in MODELS.items():
        model = FastEmbedEmbedder(name, str(get_settings().embedding_cache_dir))._load()
        sims, query_ms = {}, None
        for c, (owners, texts) in corpora.items():
            vectors = np.asarray(list(model.passage_embed(texts)), dtype=np.float32)
            vectors /= np.linalg.norm(vectors, axis=1, keepdims=True)
            t0 = time.perf_counter()
            qv = np.asarray(list(model.query_embed([q["q"] for q in queries])), dtype=np.float32)
            query_ms = round((time.perf_counter() - t0) / len(queries) * 1000, 1)
            qv /= np.linalg.norm(qv, axis=1, keepdims=True)
            sims[c] = qv @ vectors.T
        size = sum(f.stat().st_size for f in get_settings().embedding_cache_dir.rglob("*.onnx")
                   if name.split("/")[-1].lower() in str(f).lower()) / 1e6
        run(label, "embedding", sims, round(size), query_ms, name)

    (RESULTS / "model_comparison.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    write_markdown(report)
    plot(report)


def write_markdown(report: dict) -> None:
    lines = [
        "# Search model comparison", "",
        f"{report['projects']} projects (7 partner samples, 30 synthetic), {report['queries']} queries "
        f"({report['with_answer']} with an answer; types: " + ", ".join(f"{k} {v}" for k, v in report["query_types"].items()) + "). "
        "Every method's settings were tuned by 5-fold cross-validation over the queries; figures are the mean ± standard "
        "deviation over the five held-out folds. Produced by `compare_models.py`.", "",
        "| Method | Hit@1 | Recall@3 | MRR | List F1 | Off-topic rejected | Size (MB) | Query (ms) |",
        "|---|---|---|---|---|---|---|---|",
    ]
    for label, m in report["methods"].items():
        cell = lambda k: f"{m[k]['mean']:.2f} ± {m[k]['sd']:.2f}"  # noqa: E731
        lines.append(f"| {label} | {cell('hit1')} | {cell('recall3')} | {cell('mrr')} | {cell('list_f1')} | {cell('rejected')} | "
                     f"{m['size_mb']} | {m['query_ms'] if m['query_ms'] is not None else '-'} |")
    lines += ["", "Hit@1 on held-out queries by kind of query:", "",
              "| Method | " + " | ".join(f"{k} ({v})" for k, v in report["query_types"].items() if k != "off-topic") + " |",
              "|---|" + "---|" * (len(report["query_types"]) - 1)]
    for label, m in report["methods"].items():
        lines.append(f"| {label} | " + " | ".join(f"{m['by_type'][k]['hit1']:.2f}" for k in report["query_types"] if k != "off-topic") + " |")
    lines += ["", "Settings (passage words, minimum similarity, relative cut) chosen in each fold, and on all queries (final):", ""]
    for label, m in report["methods"].items():
        if m["final"] != ["-"]:
            lines.append(f"- {label}: " + "; ".join(", ".join(str(x) for x in c) for c in m["chosen"]) + f" | final: {', '.join(str(x) for x in m['final'])}")
    (RESULTS / "model_comparison.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))


def plot(report: dict) -> None:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    labels = list(report["methods"])
    short = {l: l.replace("Hybrid: keyword + ", "Hybrid\n").replace("paraphrase-multilingual-MiniLM-L12-v2", "multilingual-\nMiniLM-L12")
             .replace("Keyword (full-text)", "Keyword").replace("all-MiniLM-L6-v2", "MiniLM-L6").replace("bge-small-en-v1.5", "bge-small")
             for l in labels}
    fig, axis = plt.subplots(figsize=(7.4, 3.3))
    for j, (key, colour, name) in enumerate((("mrr", "#2a78d6", "MRR"), ("list_f1", "#eb6834", "List F1"))):
        means = [report["methods"][l][key]["mean"] for l in labels]
        sds = [report["methods"][l][key]["sd"] for l in labels]
        x = np.arange(len(labels)) + (j - 0.5) * 0.38
        axis.bar(x, means, 0.36, yerr=sds, capsize=2.5, color=colour, label=name, error_kw={"elinewidth": 0.8, "ecolor": "#52514e"})
    axis.set_xticks(range(len(labels)), [short[l] for l in labels], fontsize=7)
    axis.set_ylim(0, 1.12)
    axis.set_ylabel("Held-out score (mean of 5 folds)", fontsize=8)
    axis.set_title("Search methods compared by 5-fold cross-validation", fontsize=10, fontweight="bold", loc="left")
    for side in ("top", "right"):
        axis.spines[side].set_visible(False)
    axis.grid(axis="y", color="#e4e3df", linewidth=0.6)
    axis.set_axisbelow(True)
    axis.legend(frameon=False, ncols=2, loc="upper left", fontsize=8)
    fig.savefig(FIGURES / "model_comparison.png", dpi=200, bbox_inches="tight", facecolor="white")


if __name__ == "__main__":
    main()
