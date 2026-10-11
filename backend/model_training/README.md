# Model training

Training and evaluation scripts, and the saved models they produce.

## Search evaluation (`search_eval/`)

Semantic search uses a pretrained sentence model as it is; nothing is trained yet. `search_eval/evaluate_search.py` measures it against the keyword baseline:

```bash
cd search_eval
..\..\.venv\Scripts\python evaluate_search.py
```

It loads the sample projects, runs every query in `queries.json` through keyword, semantic and hybrid search, and writes `results.md`. The queries are of four kinds: exact names, paraphrases that avoid the project's own words, Spanish, and off-topic (which should return nothing). To add a query, add a line to `queries.json` with the ids of the projects a person judges relevant.

The next step here is fine-tuning the sentence model on the partner's projects once there are enough of them, and comparing it with the pretrained model using the same script.

## Not started

The summarizer and keyword extractor the API uses today are rule-based baselines (`../inference/app/services/text.py`) that need no training. They give the "before" numbers for the evaluation table in the main README.

Planned, in the order of the roadmap:

- Category and SDG classifier (OSDG Community Dataset, fine-tuned on partner data): macro F1 on a held-out set
- Abstractive summarizer (BART or PEGASUS) compared against the extractive baseline: ROUGE-1, ROUGE-L, curator rating
- Image embeddings (CLIP) for search, and a fine-tuned text model: same measures as `search_eval/`

Keep large model files out of git; store them outside the repository or with Git LFS.
