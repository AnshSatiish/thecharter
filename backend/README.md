# Backend

The backend follows the stages of the work, in order:

| Folder | Stage | Status |
|---|---|---|
| `eda/` | Explore the data: what we have, how much, how clean | Empty until partner data arrives |
| `preprocessing/` | Clean and prepare data for models | Empty; PDF text extraction currently lives in `inference/` |
| `model_training/` | Train and evaluate models | Empty; today's summarizer and keyword extractor are rule-based baselines |
| `inference/` | Serve results: the FastAPI application the site calls | Built and tested |
| `data/` | Sample dataset, country outlines, uploaded files | In use by `inference/` |

Run the API from `inference/`. See the main README for install steps.
