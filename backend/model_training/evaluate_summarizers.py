"""Choose the summarizer by measurement: `..\\.venv\\Scripts\\python evaluate_summarizers.py`.

Each of the 30 synthetic projects has a field-report text (what an administrator would upload as
a PDF) and a two-sentence reference summary. Every method summarizes the report text and is scored
against the reference with ROUGE-1, ROUGE-2 and ROUGE-L (F1). Generation settings of the AI models
(beam search width and summary length) are tuned by 5-fold cross-validation over the projects:
chosen on 24 projects, measured on the other 6, five times.

Writes results/summarization.json, results/summarization.md and figures/summarization.png.
"""
import gc
import itertools
import json
import logging
import random
import time

import common  # noqa: F401
from common import HERE, SEED, SYNTHETIC

import numpy as np
from rouge_score import rouge_scorer

from app.ai.summarization import AbstractiveSummarizer
from app.services.text import split_sentences, summarize

logging.disable(logging.WARNING)
RESULTS = HERE / "results"
FIGURES = HERE / "figures"
AI_MODELS = {
    "flan-t5-small": ("google/flan-t5-small", "Summarize: "),
    "t5-small (summarization)": ("Falconsai/text_summarization", "summarize: "),
    "distilbart-cnn-6-6": ("sshleifer/distilbart-cnn-6-6", ""),
    "flan-t5-base": ("google/flan-t5-base", "Summarize: "),
}
GRID = list(itertools.product((1, 4), (60, 90)))  # (beams, max new tokens)
SCORER = rouge_scorer.RougeScorer(["rouge1", "rouge2", "rougeL"], use_stemmer=True)


def rouge(candidate: str, reference: str) -> dict[str, float]:
    s = SCORER.score(reference, candidate)
    return {k: s[k].fmeasure for k in ("rouge1", "rouge2", "rougeL")}


def project_folds(n: int, k: int = 5) -> list[list[int]]:
    idx = list(range(n))
    random.Random(SEED).shuffle(idx)
    return [idx[f::k] for f in range(k)]


def cross_validate(per_setting: dict, n: int) -> dict:
    """per_setting[setting] = list of ROUGE dicts, one per document. Pick by ROUGE-L on the training folds."""
    held, chosen = [], []
    for k, test in enumerate(project_folds(n)):
        train = [i for f, part in enumerate(project_folds(n)) if f != k for i in part]
        best = max(per_setting, key=lambda s: np.mean([per_setting[s][i]["rougeL"] for i in train]))
        chosen.append(best)
        held.append({m: float(np.mean([per_setting[best][i][m] for i in test])) for m in ("rouge1", "rouge2", "rougeL")})
    out = {m: {"mean": float(np.mean([h[m] for h in held])), "sd": float(np.std([h[m] for h in held], ddof=1))}
           for m in ("rouge1", "rouge2", "rougeL")}
    out["chosen"] = [list(c) if isinstance(c, tuple) else c for c in chosen]
    return out


def main() -> None:
    RESULTS.mkdir(exist_ok=True)
    FIGURES.mkdir(exist_ok=True)
    docs = json.loads(SYNTHETIC.read_text(encoding="utf-8"))
    n = len(docs)
    report = {"documents": n, "methods": {}}

    baselines = {
        "Lead-2 (first two sentences)": lambda text: " ".join(split_sentences(text)[:2]),
        "TF-IDF extractive (current fallback)": lambda text: summarize(text, max_sentences=2),
    }
    for label, fn in baselines.items():
        t0 = time.perf_counter()
        scores = [rouge(fn(d["document_text"]), d["reference_summary"]) for d in docs]
        result = cross_validate({"fixed": scores}, n)
        result.update(kind="baseline", seconds_per_doc=round((time.perf_counter() - t0) / n, 3), chosen=None,
                      example=fn(docs[0]["document_text"]))
        report["methods"][label] = result
        print(label, {m: round(result[m]["mean"], 3) for m in ("rouge1", "rouge2", "rougeL")})

    for label, (name, prefix) in AI_MODELS.items():
        per_setting, seconds = {}, []
        try:
            for beams, tokens in GRID:
                summarizer = AbstractiveSummarizer(name, max_new_tokens=tokens, num_beams=beams, prefix=prefix)
                if per_setting:  # reuse the loaded weights
                    summarizer._model, summarizer._tokenizer = model, tokenizer
                t0 = time.perf_counter()
                outputs = [summarizer.summarize(d["document_text"]) for d in docs]
                seconds.append((time.perf_counter() - t0) / n)
                tokenizer, model = summarizer._tokenizer, summarizer._model
                per_setting[(beams, tokens)] = [rouge(o, d["reference_summary"]) for o, d in zip(outputs, docs)]
                if (beams, tokens) == GRID[-1]:
                    example = outputs[0]
        except Exception as exc:  # out of memory or download failure: record and continue
            report["methods"][label] = {"error": str(exc)[:200]}
            print(label, "failed:", exc)
            continue
        result = cross_validate(per_setting, n)
        size = sum(p.numel() for p in model.parameters()) / 1e6
        result.update(kind="pretrained AI model", model=name, parameters_m=round(size), seconds_per_doc=round(float(np.mean(seconds)), 2),
                      example=example)
        report["methods"][label] = result
        print(label, {m: round(result[m]["mean"], 3) for m in ("rouge1", "rouge2", "rougeL")}, "chosen", result["chosen"])
        del model, tokenizer, summarizer
        gc.collect()

    (RESULTS / "summarization.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    lines = ["# Summarizer comparison", "",
             f"{n} synthetic field reports with reference summaries. ROUGE F1, mean ± standard deviation over 5 held-out folds; "
             "AI models' beam width and length tuned on the training folds. Produced by `evaluate_summarizers.py`.", "",
             "| Method | ROUGE-1 | ROUGE-2 | ROUGE-L | Parameters (M) | Seconds per report | Settings chosen (beams, max tokens) |",
             "|---|---|---|---|---|---|---|"]
    for label, m in report["methods"].items():
        if "error" in m:
            lines.append(f"| {label} | failed: {m['error'][:60]} | | | | | |")
            continue
        cell = lambda k: f"{m[k]['mean']:.3f} ± {m[k]['sd']:.3f}"  # noqa: E731
        chosen = "; ".join(f"{c[0]}, {c[1]}" for c in m["chosen"]) if m.get("chosen") and m["chosen"][0] != "fixed" else "-"
        lines.append(f"| {label} | {cell('rouge1')} | {cell('rouge2')} | {cell('rougeL')} | {m.get('parameters_m', '-')} | "
                     f"{m['seconds_per_doc']} | {chosen} |")
    (RESULTS / "summarization.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))

    plot(report)


SHORT_NAMES = {
    "Lead-2 (first two sentences)": "Lead-2",
    "TF-IDF extractive (current fallback)": "TF-IDF\nextractive",
    "flan-t5-small": "flan-t5\nsmall",
    "t5-small (summarization)": "t5-small\nsummarizer",
    "distilbart-cnn-6-6": "distilbart\ncnn-6-6",
    "flan-t5-base": "flan-t5\nbase",
}


def plot(report: dict) -> None:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    ok = [l for l, m in report["methods"].items() if "error" not in m]
    fig, axis = plt.subplots(figsize=(7.2, 3.2))
    for j, (key, colour, name) in enumerate((("rouge1", "#2a78d6", "ROUGE-1"), ("rougeL", "#eb6834", "ROUGE-L"))):
        x = np.arange(len(ok)) + (j - 0.5) * 0.36
        means = [report["methods"][l][key]["mean"] for l in ok]
        axis.bar(x, means, 0.34, yerr=[report["methods"][l][key]["sd"] for l in ok], capsize=3, color=colour, label=name,
                 error_kw={"elinewidth": 1, "ecolor": "#52514e"})
        for xi, v in zip(x, means):
            axis.text(xi, v + 0.045, f"{v:.2f}", ha="center", fontsize=7)
    axis.set_xticks(range(len(ok)), [SHORT_NAMES.get(l, l) for l in ok], fontsize=7.5)
    for tick, label in zip(axis.get_xticklabels(), ok):
        if report["methods"][label]["kind"] == "baseline":
            tick.set_color("#52514e")
    axis.set_ylim(0, 0.45)
    axis.set_ylabel("ROUGE F1 (mean of 5 folds)", fontsize=8)
    axis.set_title("Summarizers compared against reference summaries", fontsize=10, fontweight="bold", loc="left")
    for side in ("top", "right"):
        axis.spines[side].set_visible(False)
    axis.grid(axis="y", color="#e4e3df", linewidth=0.6)
    axis.set_axisbelow(True)
    axis.legend(frameon=False, ncols=2, loc="upper left", fontsize=8)
    fig.savefig(FIGURES / "summarization.png", dpi=200, bbox_inches="tight", facecolor="white")


if __name__ == "__main__":
    import sys

    if "--plot-only" in sys.argv:  # redraw the figure from the saved results
        plot(json.loads((RESULTS / "summarization.json").read_text(encoding="utf-8")))
    else:
        main()
