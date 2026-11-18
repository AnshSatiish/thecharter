# Model training and evaluation

Every AI choice in the application is made here, by measurement, and every number in the progress report comes from a file in `results/` or `figures/`.

```bash
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
```

Run each script from this folder with the backend's environment, for example `..\.venv\Scripts\python compare_models.py`.

| Script | What it does | Output | Time on a laptop CPU |
|---|---|---|---|
| `compare_models.py` | Compares keyword full-text search, TF-IDF and three pretrained embedding models (all-MiniLM-L6-v2, paraphrase-multilingual-MiniLM-L12-v2, bge-small-en-v1.5), each alone and in hybrid with keyword search. Passage length and cut-offs are tuned by 5-fold cross-validation over the queries. | `results/model_comparison.*`, `figures/model_comparison.png` | about 3 minutes |
| `finetune_embeddings.py` | Fine-tunes the chosen model on pairs built from the corpus (title, keywords or place with the project's own passages), with 5-fold cross-validation over projects so each test fold is unseen. `--epochs` and `--lr` set the training; `--save` keeps a model in `models/` (not committed). | `results/finetune_e<epochs>_lr<rate>.*` | 10 to 20 minutes |
| `evaluate_summarizers.py` | Compares Lead-2 and TF-IDF sentence selection with four pretrained summarization models by ROUGE against the reference summaries. AI generation settings are tuned by five-fold cross-validation. `--plot-only` redraws the figure. | `results/summarization.*`, `figures/summarization.png` | 20 to 30 minutes |
| `search_eval/evaluate_search.py` | Runs every query through the application's own search code with its final settings. | `search_eval/results.md` | about 1 minute |
| `common.py` | Shared set-up: a temporary database with the 7 partner samples and the 30 synthetic projects, passages cut by the API's code, the query folds and the measures. | | |

## Data

- `../data/samples/projects.json`: the partner's 7 sample projects.
- `../data/synthetic/projects.json`: 30 synthetic projects written by the team to the partner's record format, 6 per category, each with a field report (stored as the project's document, like an uploaded PDF) and a reference summary. Marked `"synthetic": true`; never loaded into the site.
- `search_eval/queries.json`: 122 judged queries (38 exact names, 70 paraphrases, 5 topics, 9 off-topic), each with the ids of the projects a person judged relevant.

## What the experiments decided

- Search model: **bge-small-en-v1.5**, the most accurate and the smallest of the three models; passages of 40 words, minimum similarity 0.575, relative cut-off 0.95. These are the defaults in `../inference/app/core/config.py`.
- Fine-tuning did not improve the pretrained model on unseen projects (two settings tried), so the pretrained weights are used.
- The evaluation compared DistilBART and three other Transformers summarizers; the extractive TF-IDF method scored higher on this dataset, but selects original sentences instead of rewriting them. The application now uses Ollama with `llama3.2:3b`; that model has not yet been evaluated against the reference summaries.

The updated evaluation compares the current TF-IDF fallback with DistilBART and three other pretrained models. Both AI-generated and extractive summaries are drafts for the administrator to review.

All results come from a corpus that is mostly synthetic and from queries written by the team. Rerun the scripts when the partner's full data arrives.
