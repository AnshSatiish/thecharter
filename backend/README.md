# Backend

The backend follows the stages of the work, in order:

| Folder | Stage | Status |
|---|---|---|
| `eda/` | Explore the data: what we have, how much, how clean | Partner samples and synthetic dataset analysed |
| `preprocessing/` | Clean and prepare data for models | Empty; PDF text extraction currently lives in `inference/` |
| `model_training/` | Choose, train and evaluate models | Search and summarization models chosen by cross-validation; fine-tuning tested; see its README |
| `inference/` | Serve results: the FastAPI application the site calls | Built and tested |
| `data/` | Partner samples, synthetic dataset, country outlines, uploaded files | In use by `inference/` and `model_training/` |
| `db/` | Docker image for PostgreSQL with PostGIS and pgvector | Used by `docker-compose.yml` |

Run the API from `inference/`. See the main README for install steps.
