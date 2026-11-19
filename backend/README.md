# Backend

| Folder | What it is | Status |
|---|---|---|
| `api/` | The FastAPI application the site calls: projects, search, uploads, AI helpers, admin routes | Built and tested (see `api/README.md`) |
| `ml/` | How every model was chosen: exploratory data analysis, model comparison, fine-tuning, search evaluation | Search and summarization models chosen by cross-validation (see `ml/README.md`) |
| `load_testing/` | Load test of the search API and its results | Run on 2 CPUs / 2 GB (see `load_testing/README.md`) |
| `data/` | Partner samples, synthetic dataset, country outlines, uploaded files (`uploads/`, git-ignored) | Used by `api/` and `ml/` |
| `db/` | Docker image for PostgreSQL 16 with PostGIS and pgvector | Used by `docker-compose.yml` at the repo root |

Run the API from `api/`. See the main README for install steps.
