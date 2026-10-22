"""Fine-tune the sentence-embedding model on the project corpus: `..\\.venv\\Scripts\\python finetune_embeddings.py`.

Training is self-supervised, so no test query is ever used for training. For each project, short
"anchor" texts (its title, its keywords, its place and category) are paired with the passages of
its own body text, and the model learns to place each anchor close to its project's passages and
far from other projects' passages (multiple-negatives ranking loss, in-batch negatives).

Evaluation is 5-fold cross-validation over projects: the model is fine-tuned on the pairs of four
folds of projects and tested on queries about the fifth, which it has never trained on. The
pretrained model is scored on exactly the same held-out queries, so the comparison is paired.

Writes results/finetune_e<epochs>_lr<rate>.json and .md. With --save, also fine-tunes on every
project and saves the model in models/ (not committed; rerun to recreate it).
"""
import argparse
import json
import logging
import random
import time

import common  # noqa: F401  (sets up the temporary database first)
from common import HERE, SEED, build_corpus, corpus_passages, load_queries, measures, average

import numpy as np
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Project
from app.db.session import engine

logging.disable(logging.WARNING)
RESULTS = HERE / "results"
MODELS = HERE / "models"
CATEGORY_WORDS = {"wildlife": "wildlife and human interaction", "anthropology": "anthropology", "urban": "urban life",
                  "border": "cross-border interactions", "news": "news"}


def training_pairs(project_ids: set[int], owners: list[int], texts: list[str], per_project: int = 16) -> list[tuple[str, str]]:
    """(anchor, passage) pairs for the given projects. The first passage repeats the title, so it is skipped."""
    rng = random.Random(SEED)
    pairs = []
    with Session(engine) as db:
        projects = {p.id: p for p in db.scalars(select(Project).where(Project.id.in_(project_ids))).unique()}
    for pid, project in projects.items():
        body = [t for o, t in zip(owners, texts) if o == pid][1:]
        anchors = [project.title, ", ".join(project.keywords or []),
                   f"{project.location_name}, {CATEGORY_WORDS.get(project.category, project.category)}"]
        candidates = [(a, b) for a in anchors for b in body]
        rng.shuffle(candidates)
        pairs += candidates[:per_project]
    rng.shuffle(pairs)
    return pairs


def fine_tune(base: str, pairs: list[tuple[str, str]], epochs: int, lr: float):
    import torch
    from sentence_transformers import InputExample, SentenceTransformer, losses
    from torch.utils.data import DataLoader

    torch.manual_seed(SEED)
    model = SentenceTransformer(base, device="cpu")
    loader = DataLoader([InputExample(texts=[a, b]) for a, b in pairs], shuffle=True, batch_size=16)
    loss = losses.MultipleNegativesRankingLoss(model)
    model.fit(train_objectives=[(loader, loss)], epochs=epochs, warmup_steps=int(0.1 * len(loader) * epochs),
              optimizer_params={"lr": lr}, show_progress_bar=False)
    return model


def evaluate(model, owners: list[int], texts: list[str], queries: list[dict]) -> list[dict]:
    """Ranking quality only (no cut-off), so the two models are compared on their representations."""
    passages = model.encode(texts, normalize_embeddings=True, batch_size=32)
    q = model.encode([x["q"] for x in queries], normalize_embeddings=True)
    owners_arr = np.asarray(owners)
    rows = []
    for i, query in enumerate(queries):
        sims = passages @ q[i]
        ranked = []
        for j in np.argsort(-sims):
            if owners_arr[j] not in ranked:
                ranked.append(int(owners_arr[j]))
            if len(ranked) == 10:
                break
        rows.append(measures(ranked, set(query["relevant"])))
    return rows


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="sentence-transformers/all-MiniLM-L6-v2")
    parser.add_argument("--chunk-words", type=int, default=60)
    parser.add_argument("--epochs", type=int, default=2)
    parser.add_argument("--lr", type=float, default=2e-5)
    parser.add_argument("--save", action="store_true")
    args = parser.parse_args()

    from sentence_transformers import SentenceTransformer

    RESULTS.mkdir(exist_ok=True)
    build_corpus()
    owners, texts = corpus_passages(args.chunk_words)
    queries = [q for q in load_queries() if q["relevant"]]
    project_ids = sorted(set(owners))
    rng = random.Random(SEED)
    shuffled = project_ids[:]
    rng.shuffle(shuffled)
    project_folds = [set(shuffled[k::5]) for k in range(5)]
    base_model = SentenceTransformer(args.base, device="cpu")

    folds_out = []
    for k, held_out in enumerate(project_folds):
        test = [q for q in queries if set(q["relevant"]) <= held_out]
        train_projects = set(project_ids) - held_out
        pairs = training_pairs(train_projects, owners, texts)
        t0 = time.perf_counter()
        tuned = fine_tune(args.base, pairs, args.epochs, args.lr)
        minutes = (time.perf_counter() - t0) / 60
        before, after = average(evaluate(base_model, owners, texts, test)), average(evaluate(tuned, owners, texts, test))
        folds_out.append({"fold": k + 1, "test_queries": len(test), "train_pairs": len(pairs), "minutes": round(minutes, 1),
                          "pretrained": before, "fine_tuned": after})
        print(f"fold {k + 1}: {len(test)} queries, {len(pairs)} pairs, {minutes:.1f} min | "
              f"MRR {before['mrr']:.3f} -> {after['mrr']:.3f}, Hit@1 {before['hit1']:.3f} -> {after['hit1']:.3f}")

    def stat(which, key):
        values = [f[which][key] for f in folds_out]
        return {"mean": float(np.mean(values)), "sd": float(np.std(values, ddof=1))}

    summary = {which: {key: stat(which, key) for key in ("hit1", "recall3", "mrr")} for which in ("pretrained", "fine_tuned")}
    report = {"base": args.base, "chunk_words": args.chunk_words, "epochs": args.epochs, "lr": args.lr,
              "loss": "MultipleNegativesRankingLoss", "batch_size": 16, "folds": folds_out, "summary": summary}
    (RESULTS / f"finetune_e{args.epochs}_lr{args.lr:g}.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    lines = ["# Fine-tuning the embedding model", "",
             f"Base model `{args.base}`, {args.epochs} epochs, learning rate {args.lr}, batch 16, multiple-negatives "
             "ranking loss. 5-fold cross-validation over projects: each fold is fine-tuned without the held-out projects and "
             "tested on the queries about them. Ranking measured without a cut-off. Produced by `finetune_embeddings.py`.", "",
             "| Model | Hit@1 | Recall@3 | MRR |", "|---|---|---|---|"]
    for which, label in (("pretrained", "Pretrained"), ("fine_tuned", "Fine-tuned")):
        s = summary[which]
        lines.append(f"| {label} | " + " | ".join(f"{s[k]['mean']:.2f} ± {s[k]['sd']:.2f}" for k in ("hit1", "recall3", "mrr")) + " |")
    lines += ["", "| Fold | Test queries | Training pairs | Minutes | MRR pretrained | MRR fine-tuned |", "|---|---|---|---|---|---|"]
    for f in folds_out:
        lines.append(f"| {f['fold']} | {f['test_queries']} | {f['train_pairs']} | {f['minutes']} | "
                     f"{f['pretrained']['mrr']:.3f} | {f['fine_tuned']['mrr']:.3f} |")
    (RESULTS / f"finetune_e{args.epochs}_lr{args.lr:g}.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))

    if args.save:
        model = fine_tune(args.base, training_pairs(set(project_ids), owners, texts), args.epochs, args.lr)
        out = MODELS / ("charter-" + args.base.split("/")[-1])
        model.save(str(out))
        print("saved", out)


if __name__ == "__main__":
    main()
