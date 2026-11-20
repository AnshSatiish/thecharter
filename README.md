# The Charter

**Mapping the new world.** The Charter is a map-based research and photojournalism discovery platform developed as a COMP 385 AI Capstone Project at Centennial College for an external partner. It brings projects, locations, authors, photographs, and documents together for students and researchers.

> **Status:** In development. This README distinguishes implemented components from work that is not yet available. See the component READMEs for implementation details.

## What is implemented

- **Interactive globe frontend:** A static HTML, CSS, and JavaScript application using D3. It includes project pins, previews, filtering, project pages, and a photo viewer. It requires no React build or Google Maps API key.
- **FastAPI backend:** Project and author endpoints, filtering and nearby lookup, admin project management and verification routes, photo/PDF uploads, PDF text extraction, and keyword suggestions.
- **Project search:** Keyword, semantic, and hybrid search through `GET /api/projects/search`. Hybrid search combines keyword and semantic rankings using reciprocal rank fusion. Semantic results can identify the matching passage.
- **Text summarization:** Local Ollama integration using `llama3.2:3b`, with a TF-IDF extractive fallback when the model is unavailable.
- **Database:** SQLite for local development or PostgreSQL 16 with PostGIS and pgvector using Docker. Supabase SQL migrations are maintained separately for hosted data.
- **Evaluation and tests:** Model comparison, search evaluation, unit and integration tests, and search API load testing.

Some frontend screens and workflows are demonstration-oriented. In particular, the current passport-style email gate is **not production authentication**.

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | HTML, CSS, JavaScript, D3 |
| API | Python, FastAPI |
| Local database | SQLite |
| Containerized database | PostgreSQL 16, PostGIS, pgvector |
| Hosted data configuration | Supabase SQL migrations |
| Semantic retrieval | `BAAI/bge-small-en-v1.5` |
| AI summarization | Ollama (`llama3.2:3b`) and TF-IDF fallback |
| Testing | pytest, API load tests |
| Development infrastructure | Docker Compose |

## Repository layout

```text
.
├── backend/
│   ├── api/             FastAPI application and tests
│   ├── data/            Partner samples, synthetic evaluation data, geography
│   ├── db/              PostgreSQL/PostGIS/pgvector Docker image
│   ├── ml/              EDA, model comparison, experiments, evaluation
│   └── load_testing/    Search API load tests and results
├── frontend/            Static D3 globe website
├── supabase/            Hosted database SQL migrations
├── docs/                Requirements, architecture, reports, security
├── docker-compose.yml  Database services
└── README.md
```

See [backend/README.md](backend/README.md), [backend/api/README.md](backend/api/README.md), [backend/ml/README.md](backend/ml/README.md), and [frontend/README.md](frontend/README.md) for detailed structure.

## Getting started

### Prerequisites

- Python 3.11 or later
- Docker and Docker Compose **only if using PostgreSQL**
- Ollama **optional**, for local abstractive summarization

### Clone and set up the API

```bash
git clone https://github.com/AnshSatiish/thecharter.git
cd thecharter
cd backend
python -m venv .venv
```

Activate the environment:

```bash
# macOS/Linux
source .venv/bin/activate

# Windows PowerShell
# .venv\Scripts\Activate.ps1
```

Install dependencies and configure the API:

```bash
pip install -r api/requirements-dev.txt
cd api
```

Copy `.env.example` to `.env` and review the settings. Without `DATABASE_URL` the API uses a local SQLite file (`./charter.db`). To use PostgreSQL, start the Docker services from the repository root with `docker compose up -d` and uncomment `DATABASE_URL` in `.env`.

Initialize sample data and start the API:

```bash
python -m app.scripts.seed
uvicorn app.main:app --reload --port 8000
```

API documentation: http://localhost:8000/docs  
Health endpoint: http://localhost:8000/health

### Run the frontend

In another terminal:

```bash
cd frontend
python -m http.server 8080
```

Open http://localhost:8080. On localhost, the frontend uses the FastAPI backend; without it, the page shows projects uploaded to Supabase together with the built-in sample data, and without either, the sample data alone. No npm install or map API key is required.

### Optional local summarization

Install and start Ollama separately, then download the model:

```bash
ollama pull llama3.2:3b
```

When Ollama is unavailable, the API documentation describes a TF-IDF extractive fallback.

## Search and machine learning

The API provides three search modes:

| Mode | Description |
| --- | --- |
| `keyword` | Lexical/full-text ranking |
| `semantic` | Embedding-based passage similarity |
| `hybrid` | Combines both ranked lists using reciprocal rank fusion |

Example:

```text
GET /api/projects/search?q=climate%20migration&mode=hybrid&limit=20
```

The model experiments selected `BAAI/bge-small-en-v1.5`, with 40-word passages and evaluated similarity thresholds. The ML directory documents five-fold cross-validation, fine-tuning experiments, summarizer comparisons, and end-to-end search evaluation.

**Evaluation limitation:** The reported experiments use seven partner sample projects and 30 synthetic projects. The synthetic projects are for experimentation and evaluation, not for loading into the public site. Results should not be presented as independently validated performance on a large real-world collection.

## Testing

From `backend/api/` with dependencies installed:

```bash
pytest tests/unit
pytest
pytest --cov=app --cov-report=term-missing
ruff check .
```

The API tests cover unit and integration behavior; PostgreSQL-specific tests require a disposable PostgreSQL test database. See [backend/api/README.md](backend/api/README.md) and [backend/load_testing/](backend/load_testing/) for details.

## Current limitations and future work

The following should **not** be described as completed production features:

- Production user authentication and JWT-based sessions
- Automated category/SDG tagging pipeline
- CLIP-based image similarity search
- Automated news hotspot ingestion and approval
- Automated provenance or AI-image credibility scoring
- Retrieval-augmented research chatbot
- Database migrations through Alembic

Administrative verification is a human-controlled workflow, **not** an automated credibility guarantee. The current admin API uses a shared token; use appropriate secrets and security controls before any public deployment.

## Data, ethics, and rights

The Charter is designed to help users discover and examine research material, not to replace source evaluation or human editorial judgment. Project locations, author information, and photographs require careful handling. Demo imagery and partner materials may have rights or privacy restrictions; do not assume that inclusion in this repository grants reuse permission.

## Documentation

- [Backend overview](backend/README.md)
- [FastAPI application](backend/api/README.md)
- [Machine learning experiments](backend/ml/README.md)
- [Frontend](frontend/README.md)
- [Project documentation](docs/)

## Project context

**COMP 385 — AI Capstone Project, Centennial College.** Developed by the project team for an external partner. The repository remains under active development.
