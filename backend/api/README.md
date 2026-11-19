# The Charter API

FastAPI application behind the site: projects with filters, nearby search, authors, keyword / semantic / hybrid search, photo and PDF uploads, AI summaries from a local Ollama model with a TF-IDF fallback, keyword suggestions and the location check. Runs on SQLite with no setup, or PostgreSQL with PostGIS and pgvector.

## Run it

```bash
# from backend/api/
python -m venv ../.venv
source ../.venv/bin/activate            # Windows: ..\.venv\Scripts\activate
pip install -r requirements-dev.txt

# Optional, for AI summaries: install Ollama (https://ollama.com), then download the model once
ollama pull llama3.2:3b                 # without it, summaries use the TF-IDF fallback

python -m app.scripts.seed              # sample projects + search index (first run downloads the 66 MB sentence model)
uvicorn app.main:app --reload --port 8000
```

Interactive API docs: http://localhost:8000/docs. Admin routes need the header `X-Admin-Token: dev-admin-token` in development.

## Test it

```bash
pytest tests/unit          # pure functions, under a second, no database or model
pytest                     # everything (unit + integration + load)
pytest --cov=app --cov-report=term-missing
ruff check .               # lint
```

Tests use a throwaway SQLite database and stand-ins for the sentence model and the summarizer, so they need no downloads and no Ollama server. The two PostgreSQL-only tests are skipped unless `DATABASE_URL` points at a disposable PostgreSQL database.

## How the code is organised

Each layer has one job. A route never runs SQL itself; a service never knows about URLs; model code never knows about HTTP.

```
app/
├── main.py             Creates the app; mounts the public routers, then the admin router, under /api
├── core/               config.py (settings), security.py (require_admin), deps.py (DB and Storage dependencies)
├── db/                 session.py, init_db.py (tables, PostGIS, pgvector), models/ (one file per table)
├── schemas/            Pydantic request/response models, one file per resource
├── routes/
│   ├── public/         Anyone: projects, search, authors, documents (list), geo, ai (keywords)
│   └── admin/          Behind require_admin, applied once on the router: projects, documents, ai
├── services/           Business logic
│   ├── projects.py     List/filter, nearby, create, edit, verify, add photos
│   ├── documents.py    Add / list / delete project PDFs
│   ├── authors.py
│   ├── files/          storage.py (LocalStorage), validation.py (size and type checks on the bytes)
│   ├── search/         keyword.py, semantic.py, fusion.py (reciprocal rank fusion), hybrid.py, indexing.py
│   └── geo/            distance.py, countries.py, location_check.py
├── ai/                 embeddings/ (model + chunking), summarization/ (Ollama + TF-IDF fallback), keywords.py
├── text/               normalize.py (fold, stopwords, sentences), pdf.py (text extraction)
└── scripts/            seed.py, reindex.py, build_countries.py   →  python -m app.scripts.<name>

tests/
├── conftest.py         Throwaway database, stand-in embedder and summarizer, helpers
├── unit/               No database, no client: fusion, hybrid wiring, semantic cut-offs, chunking, text, keywords,
│                       summaries, storage, upload validation, security and settings, geography
├── integration/        Through the HTTP client: public endpoints, search, database setup
│   └── admin/          Admin endpoints: projects, photos, documents, AI helpers
└── load/               Full connection pool answers 503; processes starting together do not deadlock
```

### Adding an endpoint

1. Request/response models go in `schemas/<resource>.py` and are exported from `schemas/__init__.py`.
2. The logic goes in `services/`.
3. The route goes in `routes/public/` or `routes/admin/`. A new admin file must be included in `routes/admin/__init__.py`, which is what protects it. A new public file must be added to `routers` in `routes/public/__init__.py`.
4. Add a unit test for the logic and an integration test for the route.

### URLs

The URLs did not change in the restructure: admin routes still live at `POST /api/projects`, `PATCH /api/projects/{id}`, and so on, so the frontend works unchanged. Moving them under `/api/admin/` is a separate change that needs the frontend updated in the same pull request.
