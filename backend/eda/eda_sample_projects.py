"""Exploratory data analysis of the partner's sample projects and of the synthetic dataset.

Run from this folder with the backend's environment (needs matplotlib):

    ..\\.venv\\Scripts\\python eda_sample_projects.py

Reads ../data/samples/projects.json, prints the numbers used in the report, writes
eda_summary.json and saves three figures in figures/.

The partner has supplied 7 projects so far, so this describes the sample, not the
final library. Rerun it when the full dataset arrives.
"""
import json
import os
import sys
import tempfile
from collections import Counter
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402

HERE = Path(__file__).resolve().parent
FIGURES = HERE / "figures"
SAMPLES = HERE.parent / "data" / "samples" / "projects.json"
SYNTHETIC = HERE.parent / "data" / "synthetic" / "projects.json"
QUERIES = HERE.parent / "model_training" / "search_eval" / "queries.json"

BLUE, ORANGE = "#2a78d6", "#eb6834"
INK, MUTED, GRID = "#0b0b0b", "#52514e", "#e4e3df"
plt.rcParams.update({
    "font.family": "DejaVu Sans", "font.size": 9, "axes.edgecolor": GRID, "axes.labelcolor": MUTED,
    "xtick.color": MUTED, "ytick.color": MUTED, "text.color": INK, "axes.spines.top": False,
    "axes.spines.right": False, "axes.titlesize": 10, "axes.titleweight": "bold", "axes.titlelocation": "left",
    "figure.dpi": 200, "savefig.bbox": "tight", "savefig.facecolor": "white",
})
CATEGORY_LABELS = {
    "wildlife": "Wildlife and human interaction", "anthropology": "Anthropology", "urban": "Urban life",
    "border": "Cross-border interactions", "news": "News",
}


def words(text: str | None) -> int:
    return len((text or "").split())


def short(title: str, limit: int = 30) -> str:
    title = title.split(":")[0]
    return title if len(title) <= limit else title[: limit - 1].rstrip() + "…"


def figure_categories_and_sdgs(projects: list[dict]) -> None:
    categories = Counter(p["category"] for p in projects)
    sdgs = Counter(s for p in projects for s in p["sdgs"])
    fig, (left, right) = plt.subplots(1, 2, figsize=(7.2, 2.9), gridspec_kw={"width_ratios": [1, 1.25]})

    names = list(CATEGORY_LABELS)
    left.barh([CATEGORY_LABELS[n] for n in names][::-1], [categories.get(n, 0) for n in names][::-1], color=BLUE, height=0.55)
    left.set_title("Projects per study category")
    left.set_xlabel("Projects")
    left.set_xticks(range(0, max(categories.values()) + 2))
    for y, n in enumerate([categories.get(n, 0) for n in names][::-1]):
        left.text(n + 0.08, y, str(n), va="center", color=INK)

    codes = sorted(sdgs, key=lambda s: int(s[3:]))
    right.bar([c[3:] for c in codes], [sdgs[c] for c in codes], color=BLUE, width=0.6)
    right.set_title("Projects tagged with each UN SDG")
    right.set_xlabel("SDG number")
    right.set_ylabel("Projects")
    right.set_yticks(range(0, max(sdgs.values()) + 1))
    for axis in (left, right):
        axis.grid(axis="x" if axis is left else "y", color=GRID, linewidth=0.6)
        axis.set_axisbelow(True)
    fig.tight_layout()
    fig.savefig(FIGURES / "categories_and_sdgs.png")
    plt.close(fig)


def figure_text_lengths(projects: list[dict]) -> None:
    ordered = sorted(projects, key=lambda p: words(p["description"]) + sum(map(words, p.get("captions") or [])))
    labels = [short(p["title"]) for p in ordered]
    description = [words(p["description"]) for p in ordered]
    narration = [sum(map(words, p.get("captions") or [])) for p in ordered]
    fig, axis = plt.subplots(figsize=(7.2, 3.0))
    axis.barh(labels, description, color=BLUE, height=0.55, label="Description", edgecolor="white", linewidth=1.5)
    axis.barh(labels, narration, left=description, color=ORANGE, height=0.55, label="Photo narration (4 photographs)",
              edgecolor="white", linewidth=1.5)
    for y, (d, n) in enumerate(zip(description, narration)):
        axis.text(d + n + 6, y, f"{d + n}", va="center", color=INK)
    axis.set_title("Words of text per project")
    axis.set_xlabel("Words")
    axis.grid(axis="x", color=GRID, linewidth=0.6)
    axis.set_axisbelow(True)
    axis.legend(frameon=False, loc="lower right")
    fig.tight_layout()
    fig.savefig(FIGURES / "text_lengths.png")
    plt.close(fig)


def passages_and_similarity(projects: list[dict]) -> tuple[dict[int, int], np.ndarray]:
    """Index the sample with the real sentence model and compare the projects with each other."""
    os.environ["DATABASE_URL"] = "sqlite:///" + (Path(tempfile.mkdtemp(prefix="charter-eda-")) / "eda.db").as_posix()
    sys.path.insert(0, str(HERE.parent / "inference"))
    from sqlalchemy import select
    from sqlalchemy.orm import Session

    from app.db.models import SearchChunk
    from app.db.session import engine
    from app.scripts.seed import seed

    seed(engine)
    with Session(engine) as db:
        rows = db.execute(select(SearchChunk.project_id, SearchChunk.embedding)).all()
    counts = Counter(r.project_id for r in rows)
    ids = [p["id"] for p in projects]
    # One vector per project: the mean of its passage vectors, rescaled to unit length.
    means = []
    for pid in ids:
        mean = np.mean([r.embedding for r in rows if r.project_id == pid], axis=0)
        means.append(mean / np.linalg.norm(mean))
    means = np.asarray(means)
    return dict(counts), means @ means.T


def figure_similarity(projects: list[dict], similarity: np.ndarray) -> None:
    labels = [short(p["title"], 24) for p in projects]
    fig, axis = plt.subplots(figsize=(6.0, 4.6))
    image = axis.imshow(similarity, cmap="Blues", vmin=0, vmax=1)
    axis.set_xticks(range(len(labels)), labels, rotation=40, ha="right")
    axis.set_yticks(range(len(labels)), labels)
    for i in range(len(labels)):
        for j in range(len(labels)):
            axis.text(j, i, f"{similarity[i, j]:.2f}", ha="center", va="center", fontsize=7.5,
                      color="white" if similarity[i, j] > 0.6 else INK)
    axis.set_title("How close the projects are in meaning (cosine similarity)")
    for spine in axis.spines.values():
        spine.set_visible(False)
    axis.tick_params(length=0)
    fig.colorbar(image, ax=axis, fraction=0.045, pad=0.03).outline.set_visible(False)
    fig.tight_layout()
    fig.savefig(FIGURES / "project_similarity.png")
    plt.close(fig)


def figure_dataset(projects: list[dict], synthetic: list[dict]) -> None:
    """Projects per category by source, and how much text each project has."""
    names = list(CATEGORY_LABELS)
    sample_n = [sum(p["category"] == n for p in projects) for n in names]
    synth_n = [sum(p["category"] == n for p in synthetic) for n in names]
    fig, (left, right) = plt.subplots(1, 2, figsize=(7.2, 2.9), gridspec_kw={"width_ratios": [1.25, 1]})
    labels = [CATEGORY_LABELS[n] for n in names][::-1]
    left.barh(labels, sample_n[::-1], color=BLUE, height=0.55, label="Partner samples", edgecolor="white", linewidth=1.5)
    left.barh(labels, synth_n[::-1], left=sample_n[::-1], color=ORANGE, height=0.55, label="Synthetic", edgecolor="white", linewidth=1.5)
    for y, (a, b) in enumerate(zip(sample_n[::-1], synth_n[::-1])):
        left.text(a + b + 0.15, y, str(a + b), va="center", color=INK)
    left.set_title("Projects per study category")
    left.set_xlabel("Projects")
    left.legend(frameon=False, loc="upper center", bbox_to_anchor=(0.45, -0.22), ncols=2, fontsize=8)
    sample_words = [words(p["description"]) + sum(map(words, p.get("captions") or [])) for p in projects]
    synth_words = [words(p["description"]) + words(p["document_text"]) for p in synthetic]
    right.boxplot([sample_words, synth_words], tick_labels=["Partner samples\n(description +\nnarration)", "Synthetic\n(description +\nreport)"],
                  widths=0.5, patch_artist=True, medianprops={"color": INK},
                  boxprops={"facecolor": "#dce6f2", "edgecolor": MUTED}, whiskerprops={"color": MUTED}, capprops={"color": MUTED})
    right.set_title("Words of text per project")
    right.set_ylabel("Words")
    right.tick_params(axis="x", labelsize=8)
    for axis in (left, right):
        axis.grid(axis="x" if axis is left else "y", color=GRID, linewidth=0.6)
        axis.set_axisbelow(True)
    fig.tight_layout()
    fig.savefig(FIGURES / "dataset_composition.png")
    plt.close(fig)


def synthetic_summary(synthetic: list[dict]) -> dict:
    queries = json.loads(QUERIES.read_text(encoding="utf-8"))
    report_words = [words(p["document_text"]) for p in synthetic]
    summary_words = [words(p["reference_summary"]) for p in synthetic]
    return {
        "projects": len(synthetic),
        "categories": dict(Counter(p["category"] for p in synthetic)),
        "countries": len({p["location_name"].split(",")[-1].strip() for p in synthetic}),
        "years": dict(sorted(Counter(p["date"][:4] for p in synthetic).items())),
        "report_words": {"min": min(report_words), "median": int(np.median(report_words)), "max": max(report_words)},
        "reference_summary_words": {"min": min(summary_words), "median": int(np.median(summary_words)), "max": max(summary_words)},
        "sdgs_used": len({s for p in synthetic for s in p["sdgs"]}),
        "queries": {"total": len(queries), "with_answer": sum(1 for q in queries if q["relevant"]),
                    "by_type": dict(sorted(Counter(q["type"] for q in queries).items())),
                    "multi_relevant": sum(1 for q in queries if len(q["relevant"]) > 1)},
    }


def main() -> None:
    FIGURES.mkdir(exist_ok=True)
    projects = json.loads(SAMPLES.read_text(encoding="utf-8"))
    passage_counts, similarity = passages_and_similarity(projects)

    description = [words(p["description"]) for p in projects]
    captions = [words(c) for p in projects for c in p.get("captions") or []]
    fields = ["title", "description", "category", "location_name", "lat", "lng", "date", "keywords", "sdgs", "images",
              "captions", "summary", "author"]
    off_diagonal = similarity[~np.eye(len(projects), dtype=bool)]
    pairs = [(float(similarity[i, j]), projects[i]["id"], projects[j]["id"])
             for i in range(len(projects)) for j in range(i + 1, len(projects))]
    summary = {
        "projects": len(projects),
        "authors": len({p["author"]["name"] for p in projects}),
        "categories": dict(Counter(p["category"] for p in projects)),
        "categories_without_projects": [c for c in CATEGORY_LABELS if c not in {p["category"] for p in projects}],
        "sdg_tags": dict(sorted(Counter(s for p in projects for s in p["sdgs"]).items(), key=lambda kv: int(kv[0][3:]))),
        "sdgs_per_project_mean": round(float(np.mean([len(p["sdgs"]) for p in projects])), 1),
        "sdgs_never_used": [f"SDG{n}" for n in range(1, 18) if f"SDG{n}" not in {s for p in projects for s in p["sdgs"]}],
        "years": dict(Counter(p["date"][:4] for p in projects)),
        "original_language": dict(Counter(p.get("original_language", "en") for p in projects)),
        "author_roles": dict(Counter(p["author"].get("role", "journalist") for p in projects)),
        "description_words": {"min": min(description), "median": int(np.median(description)), "max": max(description)},
        "photos_per_project": dict(Counter(len(p["images"]) for p in projects)),
        "caption_words": {"captions": len(captions), "min": min(captions), "median": int(np.median(captions)), "max": max(captions)},
        "keywords_per_project": {"min": min(len(p["keywords"]) for p in projects), "max": max(len(p["keywords"]) for p in projects)},
        "distinct_keywords": len({k.lower() for p in projects for k in p["keywords"]}),
        "keywords_shared_by_projects": {k: n for k, n in Counter(k.lower() for p in projects for k in p["keywords"]).items() if n > 1},
        "missing_or_empty_fields": {f: sum(1 for p in projects if not p.get(f) and p.get(f) != 0) for f in fields
                                    if any(not p.get(f) and p.get(f) != 0 for p in projects)},
        "projects_with_pdf": 0,
        "latitude_range": [min(p["lat"] for p in projects), max(p["lat"] for p in projects)],
        "southern_hemisphere_projects": sum(1 for p in projects if p["lat"] < 0),
        "passages": {"total": sum(passage_counts.values()), "per_project_min": min(passage_counts.values()),
                     "per_project_max": max(passage_counts.values())},
        "project_similarity": {"min": round(float(off_diagonal.min()), 2), "mean": round(float(off_diagonal.mean()), 2),
                               "max": round(float(off_diagonal.max()), 2),
                               "closest_pair": max(pairs)[1:], "furthest_pair": min(pairs)[1:]},
    }
    synthetic = json.loads(SYNTHETIC.read_text(encoding="utf-8"))
    summary["synthetic"] = synthetic_summary(synthetic)
    (HERE / "eda_summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2, ensure_ascii=True))

    figure_categories_and_sdgs(projects)
    figure_text_lengths(projects)
    figure_similarity(projects, similarity)
    figure_dataset(projects, synthetic)
    print("Figures written to", FIGURES)


if __name__ == "__main__":
    main()
