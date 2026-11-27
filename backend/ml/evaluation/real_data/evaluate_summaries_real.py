"""Summarizers evaluated on the partner's real projects only: `python evaluation/real_data/evaluate_summaries_real.py` (from backend/ml).

No generated data. The reference summaries are text the authors themselves wrote:
  photo projects  input: the project's photo narration (its captions); reference: the author's project description.
                  The 7 photojournalism projects (the two thesis projects have captions of 3 to 15 words, too short).
  theses          input: the first 2,100 words of the thesis introduction (the 6 pieces of 350 words the application
                  reads); reference: the thesis abstract written by its author. Projects 29 and 30, from the
                  partner's PDFs in frontend/assets/pdfs.

Methods, all with fixed settings (nothing tuned: 9 documents are too few to tune on without testing on them):
  Lead-2                      the first two sentences
  TF-IDF + cosine             the application's fallback (app/ai/summarization/extractive.py), two sentences
  four pretrained models      distilbart-cnn-6-6, t5-small, flan-t5-small, flan-t5-base: greedy decoding, up to 90 new
                              tokens, long text in 350-word pieces as the application does
The application's main model, Llama 3.2 3B on Ollama, is not run here (Ollama is not installed on the test machine).

ROUGE F1 against the reference, mean and standard deviation over the documents.
Writes results_summaries.json and results_summaries.md next to this script.
"""
import json
import re
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
ML = HERE.parents[1]
sys.path.insert(0, str(ML))
sys.path.insert(0, str(ML / "experiments"))
import common  # noqa: E402,F401
from common import BACKEND, SAMPLES  # noqa: E402

import numpy as np  # noqa: E402
from rouge_score import rouge_scorer  # noqa: E402

from app.ai.summarization import summarize  # noqa: E402
from app.text.normalize import split_sentences  # noqa: E402
from app.text.pdf import extract_pdf_text  # noqa: E402
from transformers_summarizer import TransformersSummarizer  # noqa: E402

PDFS = BACKEND.parent / "frontend" / "assets" / "pdfs"
# Where each thesis's English abstract starts, and the chapter its introduction starts at (after the table of contents).
THESES = {
    29: {"pdf": "p29.pdf", "abstract_starts": "The institution of panchayat", "intro_heading": r"(?im)^\s*introduction\s*$"},
    30: {"pdf": "p30.pdf", "abstract_starts": "The Kyrgyz mountainscape", "intro_heading": r"(?i)the introduction: on pastures"},
}
INPUT_WORDS = 2100
MODELS = {
    "distilbart-cnn-6-6": ("sshleifer/distilbart-cnn-6-6", ""),
    "t5-small (summarization)": ("Falconsai/text_summarization", "summarize: "),
    "flan-t5-small": ("google/flan-t5-small", "Summarize: "),
    "flan-t5-base": ("google/flan-t5-base", "Summarize: "),
}
SCORER = rouge_scorer.RougeScorer(["rouge1", "rouge2", "rougeL"], use_stemmer=True)
ROMAN_PAGE = re.compile(r"(?m)^\s*[ivxlc]+\s*$")


def unwrap(text: str) -> str:
    """Join lines broken by the PDF layout, including words hyphenated at a line end."""
    text = re.sub(r"(\w)-\s*\n\s*(\w)", r"\1\2", text)
    return " ".join(text.split())


def thesis_parts(pid: int) -> tuple[str, str]:
    spec = THESES[pid]
    text, _ = extract_pdf_text((PDFS / spec["pdf"]).read_bytes())
    start = text.index(spec["abstract_starts"])
    end = ROMAN_PAGE.search(text, start).start()
    abstract = unwrap(text[start:end])
    heads = [m.end() for m in re.finditer(spec["intro_heading"], text)]
    body = text[heads[1] if len(heads) > 1 else heads[0]:]  # the first match is the table of contents
    words = unwrap(body).split()
    return " ".join(words[:INPUT_WORDS]), abstract


def documents() -> list[dict]:
    docs = []
    for rec in json.loads(SAMPLES.read_text(encoding="utf-8")):
        if rec["id"] in THESES:
            source, reference = thesis_parts(rec["id"])
            docs.append({"id": rec["id"], "kind": "thesis", "input": source, "reference": reference})
        else:
            docs.append({"id": rec["id"], "kind": "photo project", "input": "\n\n".join(rec["captions"]),
                         "reference": rec["description"]})
    return docs


def rouge(candidate: str, reference: str) -> dict[str, float]:
    s = SCORER.score(reference, candidate)
    return {k: s[k].fmeasure for k in ("rouge1", "rouge2", "rougeL")}


def main() -> None:
    docs = documents()
    methods = {
        "Lead-2 (first two sentences)": lambda t: " ".join(split_sentences(t)[:2]),
        "TF-IDF + cosine (application fallback)": lambda t: summarize(t, max_sentences=2),
    }
    report = {"documents": [{k: d[k] for k in ("id", "kind")} | {"input_words": len(d["input"].split()),
                                                                 "reference_words": len(d["reference"].split())} for d in docs],
              "methods": {}}
    outputs = {}
    for label, fn in methods.items():
        t0 = time.perf_counter()
        outputs[label] = [fn(d["input"]) for d in docs]
        report["methods"][label] = {"kind": "extractive", "seconds_per_doc": round((time.perf_counter() - t0) / len(docs), 3)}
    for label, (name, prefix) in MODELS.items():
        summarizer = TransformersSummarizer(name, max_new_tokens=90, num_beams=1, prefix=prefix)
        t0 = time.perf_counter()
        try:
            outputs[label] = [summarizer.summarize(d["input"]) for d in docs]
        except RuntimeError as exc:
            report["methods"][label] = {"error": str(exc)[:200]}
            print(label, "failed:", exc)
            continue
        report["methods"][label] = {"kind": "pretrained model", "model": name,
                                    "seconds_per_doc": round((time.perf_counter() - t0) / len(docs), 2)}
        print(label, "done")
    for label, outs in outputs.items():
        scores = [rouge(o, d["reference"]) for o, d in zip(outs, docs)]
        m = report["methods"][label]
        for key in ("rouge1", "rouge2", "rougeL"):
            values = [s[key] for s in scores]
            m[key] = {"mean": float(np.mean(values)), "sd": float(np.std(values, ddof=1))}
        for kind in ("photo project", "thesis"):
            idx = [i for i, d in enumerate(docs) if d["kind"] == kind]
            m[f"rougeL_{kind}"] = float(np.mean([scores[i]["rougeL"] for i in idx]))
        m["outputs"] = {str(d["id"]): o for d, o in zip(docs, outs)}
    (HERE / "results_summaries.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    n_photo = sum(1 for d in docs if d["kind"] == "photo project")
    out = ["# Summarizers on the partner's real projects", "",
           f"{len(docs)} documents: {n_photo} photo projects (narration summarized, the author's description as reference) and "
           f"{len(docs) - n_photo} theses (the first {INPUT_WORDS} words of the introduction summarized, the author's abstract as "
           "reference). ROUGE F1, mean ± standard deviation over the documents; fixed settings, nothing tuned. "
           "No generated data. Produced by `evaluate_summaries_real.py`.", "",
           "| Method | ROUGE-1 | ROUGE-2 | ROUGE-L | ROUGE-L photo projects | ROUGE-L theses | Seconds per document |",
           "|---|---|---|---|---|---|---|"]
    for label, m in report["methods"].items():
        if "error" in m:
            out.append(f"| {label} | failed | | | | | |")
            continue
        cell = lambda k: f"{m[k]['mean']:.3f} ± {m[k]['sd']:.3f}"  # noqa: E731
        out.append(f"| {label} | {cell('rouge1')} | {cell('rouge2')} | {cell('rougeL')} | {m['rougeL_photo project']:.3f} | "
                   f"{m['rougeL_thesis']:.3f} | {m['seconds_per_doc']} |")
    (HERE / "results_summaries.md").write_text("\n".join(out) + "\n", encoding="utf-8")
    print("\n".join(out).encode("ascii", "replace").decode())


if __name__ == "__main__":
    main()
