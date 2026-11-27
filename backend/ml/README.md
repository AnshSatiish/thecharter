# Machine learning: data analysis, model selection and evaluation

Every AI choice in the application is measured here. **The current results use only the partner's real projects**
(`evaluation/real_data/` and `eda/`); every number in the Progress 2 report comes from those files. No projects,
queries or reference summaries are generated: search queries and reference summaries are text the projects' own authors
wrote.

Generated data used in earlier experiments (30 projects, their reference summaries and 122 queries) has been deleted
from the repository, with the scripts and results built on it.

```bash
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
```

Run every script from this folder (`backend/ml/`) with the backend's virtual environment active, for example
`python evaluation/real_data/evaluate_search_real.py`.

```
ml/
├── common.py                        Temporary database, the API's ranking rule, the measures
├── eda/                             Exploratory data analysis (script, eda_summary.json, figures/)
├── evaluation/real_data/            Search and summary evaluation on the partner's projects, results and figures
└── experiments/transformers_summarizer.py   Hugging Face wrapper used by evaluate_summaries_real.py
```

## Real-data evaluation (current)

| Script | What it does | Output | Time on a laptop CPU |
|---|---|---|---|
| `evaluation/real_data/evaluate_search_real.py` | 45 queries from the partner's 9 projects (9 descriptions, 36 photo captions), each held out of the index while it is searched. Runs the application's keyword, semantic and hybrid search, then ranks with keyword, TF-IDF and three embedding models without a cut-off. Nothing tuned. | `evaluation/real_data/results.json`, `results.md` | about 3 minutes |
| `evaluation/real_data/evaluate_summaries_real.py` | 9 documents: 7 photo projects (narration summarized, the author's description as reference) and 2 theses (first 2,100 words of the introduction, the author's abstract as reference). Lead-2, the TF-IDF + cosine fallback and four pretrained models, scored with ROUGE. Fixed settings. | `evaluation/real_data/results_summaries.json`, `results_summaries.md` | about 5 minutes |
| `evaluation/real_data/figures_real.py` | Draws the search, confusion-matrix and summarizer figures from the two result files. | `evaluation/real_data/figures/` | seconds |

Results (November 27, 2026): hybrid search put the right project first for 44 of 45 queries, keyword search 41,
bge-small-en-v1.5 alone 42, TF-IDF 44; every method had the right project in its first three for all 45. Summaries:
ROUGE-L 0.11 to 0.18 with standard deviations of 0.06 to 0.12, so no summarizer is clearly better; TF-IDF + cosine is
best on the two theses. Nine projects are too few to tune settings or to fine-tune, so the settings in
`../api/app/core/config.py` are kept unchanged and the pretrained weights are used. Llama 3.2 3B (the application's
summarizer) is not scored yet because Ollama is not installed on the test machine.

## Exploratory data analysis

`eda/eda_sample_projects.py` describes the partner's 9 projects before any modelling: size and completeness, category and SDG balance, text lengths, keywords, coverage, and how close the projects are to each other in meaning. It writes `eda/eda_summary.json` and three figures in `eda/figures/`. Run it with `python eda/eda_sample_projects.py`.
