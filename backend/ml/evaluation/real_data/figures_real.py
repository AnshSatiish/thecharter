"""Figures for the real-data evaluation: `python evaluation/real_data/figures_real.py` (from backend/ml).

Reads results.json and results_summaries.json next to this script and writes PNGs to figures/.
"""
import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402

HERE = Path(__file__).resolve().parent
FIGURES = HERE / "figures"
SAMPLES = HERE.parents[2] / "data" / "samples" / "projects.json"
BLUE, ORANGE, INK, MUTED, GRID = "#2a78d6", "#eb6834", "#0b0b0b", "#52514e", "#e4e3df"
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 8.5, "axes.edgecolor": GRID, "axes.labelcolor": MUTED,
                     "xtick.color": MUTED, "ytick.color": MUTED, "axes.spines.top": False, "axes.spines.right": False,
                     "axes.titlesize": 10, "axes.titleweight": "bold", "axes.titlelocation": "left",
                     "figure.dpi": 200, "savefig.bbox": "tight", "savefig.facecolor": "white"})
SHORT = {"Keyword (full-text)": "Keyword\nfull-text", "TF-IDF": "TF-IDF", "all-MiniLM-L6-v2": "all-MiniLM\nL6-v2",
         "paraphrase-multilingual-MiniLM-L12-v2": "multilingual\nMiniLM-L12", "bge-small-en-v1.5": "bge-small\nen-v1.5"}


def search_figures(report: dict) -> None:
    labels = list(report["ranking"])
    fig, axis = plt.subplots(figsize=(7.2, 3.0))
    x = np.arange(len(labels))
    for j, (key, colour, name) in enumerate((("hit1", BLUE, "Hit@1"), ("mrr", ORANGE, "MRR"))):
        values = [report["ranking"][l]["all"][key] for l in labels]
        axis.bar(x + (j - 0.5) * 0.36, values, 0.34, color=colour, label=name)
        for xi, v in zip(x + (j - 0.5) * 0.36, values):
            axis.text(xi, v + 0.01, f"{v:.2f}", ha="center", fontsize=7)
    axis.set_xticks(x, [SHORT.get(l, l) for l in labels])
    axis.set_ylim(0.8, 1.04)
    axis.set_ylabel(f"Share of {report['queries']} held-out queries")
    axis.set_title("Search methods on the partner's projects (no cut-off)")
    axis.grid(axis="y", color=GRID, linewidth=0.6)
    axis.set_axisbelow(True)
    axis.legend(frameon=False, ncols=2, loc="upper left")
    fig.savefig(FIGURES / "search_methods_real.png")
    plt.close(fig)

    titles = {p["id"]: p["title"] for p in json.loads(SAMPLES.read_text(encoding="utf-8"))}
    matrix = report["confusion"]["hybrid"]
    rows = list(matrix)
    cols = rows + ["none"]
    counts = np.array([[matrix[r][c] for c in cols] for r in rows])
    short = lambda pid: (titles[int(pid)][:22] + "…") if len(titles[int(pid)]) > 23 else titles[int(pid)]  # noqa: E731
    fig, axis = plt.subplots(figsize=(7.2, 5.0))
    signed = np.where(np.eye(len(rows), len(cols), dtype=bool), counts, -counts)
    cmap = matplotlib.colormaps["RdYlGn"].copy()
    cmap.set_bad("white")  # empty cells stay white: green = right project first, red = another project first
    axis.imshow(np.ma.masked_where(counts == 0, signed), cmap=cmap, vmin=-5, vmax=5)
    for i in range(len(rows)):
        for j in range(len(cols)):
            if counts[i, j]:
                axis.text(j, i, str(counts[i, j]), ha="center", va="center", fontsize=9, fontweight="bold", color=INK)
    axis.set_xticks(range(len(cols)), cols)
    axis.set_yticks(range(len(rows)), [f"{short(r)} ({r})" for r in rows])
    axis.set_xlabel("Project returned first (id)")
    axis.set_title(f"Hybrid search: project of each held-out query vs first result ({sum(counts.ravel())} queries)")
    for spine in axis.spines.values():
        spine.set_visible(False)
    axis.tick_params(length=0)
    fig.savefig(FIGURES / "confusion_real.png")
    plt.close(fig)


def summary_figure(report: dict) -> None:
    ok = [l for l, m in report["methods"].items() if "error" not in m]
    short = {"Lead-2 (first two sentences)": "Lead-2", "TF-IDF + cosine (application fallback)": "TF-IDF +\ncosine",
             "distilbart-cnn-6-6": "distilbart\ncnn-6-6", "t5-small (summarization)": "t5-small", "flan-t5-small": "flan-t5\nsmall",
             "flan-t5-base": "flan-t5\nbase"}
    fig, axis = plt.subplots(figsize=(7.2, 3.0))
    x = np.arange(len(ok))
    for j, (key, colour, name) in enumerate((("rouge1", BLUE, "ROUGE-1"), ("rougeL", ORANGE, "ROUGE-L"))):
        means = [report["methods"][l][key]["mean"] for l in ok]
        sds = [report["methods"][l][key]["sd"] for l in ok]
        axis.bar(x + (j - 0.5) * 0.36, means, 0.34, yerr=sds, capsize=3, color=colour, label=name,
                 error_kw={"elinewidth": 1, "ecolor": MUTED})
        for xi, v in zip(x + (j - 0.5) * 0.36, means):
            axis.text(xi + 0.02, v + 0.005, f"{v:.2f}", ha="left", fontsize=6.5)
    axis.set_xticks(x, [short.get(l, l) for l in ok])
    axis.set_ylabel("ROUGE F1 (mean over documents)")
    axis.set_title(f"Summarizers on the partner's documents ({len(report['documents'])} documents)")
    axis.grid(axis="y", color=GRID, linewidth=0.6)
    axis.set_axisbelow(True)
    axis.legend(frameon=False, ncols=2, loc="upper right")
    fig.savefig(FIGURES / "summarizers_real.png")
    plt.close(fig)


if __name__ == "__main__":
    FIGURES.mkdir(exist_ok=True)
    search_figures(json.loads((HERE / "results.json").read_text(encoding="utf-8")))
    summaries = HERE / "results_summaries.json"
    if summaries.exists():
        summary_figure(json.loads(summaries.read_text(encoding="utf-8")))
    print("figures in", FIGURES)
