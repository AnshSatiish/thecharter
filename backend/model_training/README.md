# Model training

Training and evaluation scripts, and the saved models they produce.

Nothing here yet. The summarizer and keyword extractor the API uses today are rule-based baselines (`../inference/app/services/text.py`) that need no training. They give the "before" numbers for the evaluation table in the main README.

Planned, in the order of the roadmap:

- Category and SDG classifier (OSDG Community Dataset, fine-tuned on partner data): macro F1 on a held-out set
- Abstractive summarizer (BART or PEGASUS) compared against the extractive baseline: ROUGE-1, ROUGE-L, curator rating
- Text and image embeddings for search: Recall@5 on a hand-built query set

Keep large model files out of git; store them outside the repository or with Git LFS.
