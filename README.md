# The Charter

**Mapping the new world.** A curated, map-based library of verified photojournalism and social science research, built for university students in international relations, political science, journalism and anthropology.

COMP 385 AI Capstone Project, Centennial College. Built for an external partner.

> **Status: in development.** Sections marked *Planned* are not implemented yet. See the [Roadmap](#roadmap) for what lands when.

## What is in this repository today

| Folder | What it is | Run it |
|---|---|---|
| `backend/eda/` | Exploratory data analysis: notebooks that describe the data before any modelling. Empty until partner data arrives. | |
| `backend/preprocessing/` | Cleaning and preparing data for models. Empty for now; PDF text extraction currently lives in the API (`inference/app/services/text.py`). | |
| `backend/model_training/` | Training and evaluating models. Empty for now; the current summarizer and keyword extractor are rule-based baselines that need no training. | |
| `backend/inference/` | The FastAPI application that serves results. Projects with filters (category, SDG, year, keyword, map bounding box), nearby search, authors, admin upload and verification, photo and PDF uploads with file storage, keyword, semantic and hybrid search (`GET /api/projects/search`), the baseline summarizer and keyword extraction, and the location check. Runs on SQLite with no setup, or PostgreSQL with PostGIS and pgvector. Tested with pytest. Admin auth is a shared token for now (JWT planned). | `cd backend/inference && python -m app.scripts.seed && uvicorn app.main:app --reload --port 8000` (after install, see below) |
| `backend/data/` | `samples/`: 7 sample projects loaded by the seed script. `geo/`: country outlines (Natural Earth 1:50m) used by the location check. `uploads/`: uploaded photographs and PDFs (git-ignored). | |
| `frontend/` | **The site the team is building on.** A 3D globe (D3, no API key, no build step). Passport-style sign-in (demo: any institutional email is accepted until accounts exist), field-passport profile, pin previews, project pages with a full-screen photo viewer and narration, filters, UN SDG colours, news layer, researcher mode, projection toggle, live latitude/longitude and country name under the cursor, and the admin upload. On localhost it loads from the backend; without it, it falls back to built-in sample data. With the backend running, "By meaning" is real semantic search and shows the passage that matched; without it, it falls back to a labelled placeholder with prepared examples. | `cd frontend && python -m http.server 8080`, then open http://localhost:8080 |
| `docs/requirements/` | Partner requirement documents: interactive map, admin and security, project summary. | |
| `docs/diagrams/` | Architecture, class and component diagrams, drawn in draw.io. Empty for now. | |
| `docs/reference/figma-app/` | The partner's original Figma Make prototype (React + Vite, mock data). Kept for reference; not the product. | `cd docs/reference/figma-app && npm install && npm run dev` |
| `docker-compose.yml` | PostgreSQL 16 with PostGIS 3.4 for the backend. | `docker compose up -d` |

Semantic search over text is built (`backend/inference/app/ai/embeddings/`). The other model-based AI pipelines (tagging, abstractive summaries, image search, news), JWT auth and Alembic migrations described below are not built yet; their folders in `backend/inference/app/ai/` are empty placeholders.

Project photographs in `frontend/img/` and `docs/reference/figma-app/src/assets/` belong to their authors and are included for development only (converted to JPEG to keep the repository small).

## Table of contents

- [The problem](#the-problem)
- [What the platform does](#what-the-platform-does)
- [AI capabilities](#ai-capabilities)
- [Tech stack](#tech-stack)
- [Repository structure](#repository-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Running the application](#running-the-application)
- [Testing](#testing)
- [Evaluation metrics](#evaluation-metrics)
- [Ethical and regulatory considerations](#ethical-and-regulatory-considerations)
- [Roadmap](#roadmap)
- [Team](#team)
- [References](#references)
- [License and data rights](#license-and-data-rights)

## The problem

Students increasingly form their understanding of world events from social media, where sourcing is unclear and verification is rare. Meanwhile, rigorous photojournalism and field research sits in scattered archives, university repositories and personal portfolios, hard to discover and harder to browse.

The Charter puts verified work on a world map so it is as easy to explore as a social feed, but every project carries an identified author, an institutional affiliation and a curation check.

The curation itself is the bottleneck. Every incoming project needs a category, UN Sustainable Development Goal tags, keywords, a location and a reliability check before it can be published. Done by hand, this does not scale past a few hundred projects. The AI work in this repository exists to make that curation fast without removing the human from the decision.

## What the platform does

- **Interactive world map.** Each pin is a photojournalism or research project. Clicking a pin opens a preview with the thumbnail, title, location, author and affiliation, plus a link to the full project.
- **Verification mark.** A blue mark indicates a project has been curated and its information checked.
- **Multi-parameter filtering.** By study category (wildlife and human interaction, anthropology, urban life, cross-border interactions, news), by UN SDG, by year and by keyword.
- **Results drawer.** A collapsible side panel listing projects matching the current filters.
- **News layer.** Regions with significant ongoing events are shaded, drawing attention to where news is happening now.
- **Researcher mode.** Toggles the map from projects to the academics and journalists working in each region, so students can find people as well as work.
- **Map controls.** Zoom, country border highlighting and a projection toggle between Mercator and an equal-area view.
- **Admin tools.** Upload and edit projects, manage author profiles, moderate the community forum, and control institutional access.

## AI capabilities

Four AI components, each serving curation or discovery. Every one keeps a human in the decision loop.

### Partner decisions

Agreed with the partner, and reflected in the backend:

- **Photo narration is written by the admin.** Each photograph carries a narration text typed by the admin at upload. It is never generated by AI.
- **Projects are uploaded as PDF files**, not links. The backend stores the PDF, extracts its text and keeps it searchable.
- **Keyword search and project text summarization are the AI priorities.** Search covers titles, descriptions, keywords, narration, summaries and the text of the uploaded PDFs. A summary and keywords are suggested from the PDF, and the admin can edit them.
- **No machine translation.** Spanish to English translation was dropped from scope. Projects are published in the language the admin enters.
- **The current summarizer is an extractive baseline.** It picks the most representative sentences from the text (English and Spanish) rather than writing new ones. BART or PEGASUS replaces it later and is measured against it.

### 1. Curation assistant

When an admin uploads a project, the system proposes:

- **Category and SDG labels** from a multi-label text classifier trained on the OSDG Community Dataset and fine-tuned on partner data
- **Keywords** extracted from the description
- **Map location** via named entity recognition over the text, followed by geocoding
- **Preview summary**, a short blurb for the map popup, plus a longer key-findings summary for the project page

The admin confirms or corrects every suggestion. Corrections are logged as training data, so the classifier improves as the library grows.

Models: transformer text classifier for tagging, BART or PEGASUS for summarization.

### 2. Multimodal semantic search

Search by meaning rather than exact keywords. A query such as "grief rituals in rural communities" returns relevant projects even when none of those words appear in the text.

**Built: text.** Each project's title, description, summary, photo narration and PDF text is cut into short passages. A pretrained multilingual sentence model (`paraphrase-multilingual-MiniLM-L12-v2`, open source, runs on the server with ONNX Runtime, no API key and no cost) turns every passage into a 384-number vector. A query is embedded the same way and compared with the passages by cosine similarity; the project's best passage is returned with the result, so the user can see why it matched. Vectors are stored in PostgreSQL with pgvector (HNSW index), or compared in Python on SQLite. A Spanish query finds English projects and the reverse.

Three modes are served by `GET /api/projects/search?q=...&mode=keyword|semantic|hybrid`:

- `keyword`: PostgreSQL full-text search with stemming, field weights (title, then keywords and place, then text, then PDFs) and ranking.
- `semantic`: ranked by meaning as described above.
- `hybrid` (default): both lists merged with reciprocal rank fusion, so exact names still rank first and paraphrases are still found.

The comparison of the three modes is in `backend/model_training/search_eval/` (see Evaluation).

**Planned: images.** Images embedded with CLIP alongside the text vectors, which also powers the **View similar** feature on each project page. CLIP has a short text context window, so it handles images and short captions while the sentence model handles descriptions and documents.

### 3. News hotspot layer

A scheduled job pulls geolocated news signals from GDELT, scores regional activity, and proposes which regions to shade. An admin approves or overrides before anything appears on the public map.

### 4. Provenance assistant *(Planned)*

Before a project receives the blue mark, the system produces a provenance report for the curator: image metadata consistency, evidence of prior publication elsewhere, and an AI-generated image likelihood score. The curator still makes the verification decision.

### Stretch goal: Ask The Charter *(Planned)*

A retrieval-augmented research assistant. A student asks a question in natural language and receives an answer composed only from projects in the library, with every claim linked to its source project. If no verified sources cover the question, it says so rather than answering from general knowledge.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, Google Maps JavaScript API |
| Backend | FastAPI (Python) |
| Relational database | PostgreSQL with PostGIS |
| Vector search | pgvector inside PostgreSQL (no separate vector database) |
| File storage | Local filesystem in development, object storage in production |
| Auth | JWT sessions, bcrypt password hashing, institutional email allowlist |
| AI | sentence-transformers model on ONNX Runtime (fastembed) for search today; PyTorch, Hugging Face Transformers and OpenCLIP planned for the other pipelines |
| Testing | pytest (backend). The frontend is checked with headless-browser scripts; a test runner is planned. |

PostGIS handles bounding-box queries so the map can request only the projects inside the current viewport. pgvector keeps the passage vectors next to the projects they belong to, so one database answers map, keyword and meaning queries.

## Repository structure

The backend follows the stages of the work: explore the data, prepare it, train models, serve results.

```
.
├── backend/
│   ├── eda/                     Exploratory data analysis notebooks
│   ├── preprocessing/           Cleaning and preparing data for models
│   ├── model_training/          Training and evaluation scripts, saved models
│   ├── inference/               The FastAPI application
│   │   ├── app/
│   │   │   ├── main.py          Application and router setup
│   │   │   ├── api/             Route handlers (projects, documents, authors, ai, geo today; auth planned)
│   │   │   ├── core/            Config and security (admin token today, JWT planned)
│   │   │   ├── db/              SQLAlchemy models, session, table and PostGIS setup (migrations planned)
│   │   │   ├── scripts/         Seed the sample dataset, build the country outlines
│   │   │   ├── ai/              Sentence embeddings for semantic search; placeholders for the other modules (tagging, summarization, geo, news)
│   │   │   └── services/        Search (keyword, semantic, hybrid) and its indexes, file storage, upload checks, text, geo, countries
│   │   ├── tests/               Unit and integration tests
│   │   └── requirements.txt
│   └── data/
│       ├── samples/             Small sample dataset for development
│       ├── geo/                 Country outlines for the location check
│       └── uploads/             Uploaded photographs and PDFs (git-ignored, created on first run)
├── frontend/                    The 3D globe site (static: index.html, outlines, images)
├── docs/
│   ├── requirements/            Partner requirement documents
│   ├── diagrams/                draw.io diagrams
│   └── reference/figma-app/     The partner's original Figma prototype
└── docker-compose.yml           PostgreSQL + PostGIS
```

## Getting started

### Prerequisites

- Python 3.11 or later
- Node.js 20 or later (only for the Figma reference app)
- Docker and Docker Compose (for PostgreSQL with PostGIS and pgvector)
- A Google Maps API key (see below)

### Installation

```bash
git clone <repository-url>
cd the-charter

# Optional: start PostgreSQL + PostGIS (without it the backend uses a local SQLite file)
docker compose up -d

# Backend API
cd backend/inference
python -m venv .venv
source .venv/bin/activate        # Windows PowerShell: .venv\Scripts\Activate.ps1   Git Bash: source .venv/Scripts/activate
pip install -r requirements.txt
cp .env.example .env             # then edit; delete the DATABASE_URL line to use SQLite
python -m app.scripts.seed       # create tables and load the sample dataset (safe to rerun)

# Frontend: nothing to install, it is a static site
```

### Google Maps API key

Create a key in the Google Cloud Console. The key itself is free, and the Dynamic Maps SKU includes 10,000 free map loads per month, which comfortably covers development and demos. A billing-enabled Google Cloud project is still required.

Restrict the key to your development and deployment domains before committing anything, and never commit the key itself.

## Environment variables

Copy `backend/inference/.env.example` to `backend/inference/.env`, then fill in the values. The frontend has no environment file yet.

**backend/inference/.env**

Used today:

```
DATABASE_URL=postgresql+psycopg://charter:charter@localhost:5432/charter   # unset: sqlite:///./charter.db
ENV=development                  # development | production
ADMIN_TOKEN=dev-admin-token      # sent as the X-Admin-Token header; required when ENV=production
CORS_ORIGINS=http://localhost:5173,http://localhost:3031,http://localhost:8080
UPLOAD_DIR=../data/uploads       # unset: backend/data/uploads; served by the API at /files
MAX_IMAGE_MB=25                  # per photograph (JPEG, PNG or WebP)
MAX_PDF_MB=50                    # per project PDF
SEMANTIC_SEARCH=true             # false: keyword search only, the model is never loaded
EMBEDDING_MODEL=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
EMBEDDING_CACHE_DIR=~/.cache/charter-models   # where the model is downloaded once (about 220 MB)
SEMANTIC_MIN_SCORE=0.28          # passages below this cosine similarity are treated as unrelated
```

Planned, not read by the code yet:

```
JWT_SECRET=<generate a long random string>
JWT_EXPIRY_MINUTES=60
ALLOWED_EMAIL_DOMAINS=example.edu,partner.org
GDELT_POLL_INTERVAL_HOURS=6
```

## Running the application

```bash
# Backend (from backend/inference/)
uvicorn app.main:app --reload --port 8000

# Frontend (from frontend/)
python -m http.server 8080
```

The site runs at http://localhost:8080. To use that port, add `http://localhost:8080` to `CORS_ORIGINS` if it is not already there. Interactive API documentation is at http://localhost:8000/docs, and http://localhost:8000/health reports which database is in use.

Main endpoints: `GET /api/projects` (filters `category`, `sdg`, `year_from`, `year_to`, `q`, `bbox=minLng,minLat,maxLng,maxLat`), `GET /api/projects/near?lat=&lng=&km=`, `GET /api/projects/{id}`, `GET /api/authors`, `GET /api/authors/{id}`. Admin only, with the `X-Admin-Token` header: `POST /api/projects` and `PATCH /api/projects/{id}/verify`.

Uploads and text (admin only unless noted):

- `POST /api/projects/{id}/images`: multipart `files` plus one `captions` field per file, in the same order. The captions are the admin's narration.
- `POST /api/projects/{id}/documents`: multipart `file` (PDF) and optional `title`. Returns the page count, a suggested summary and keywords.
- `GET /api/projects/{id}/documents` (public) and `DELETE /api/documents/{id}`.
- `PATCH /api/projects/{id}`: edit `title`, `description`, `summary`, `captions`, `keywords`.
- `POST /api/ai/extract-pdf`: reads a PDF and returns a suggested summary and keywords without saving anything, so the upload form can be prefilled.
- `POST /api/ai/summarize` and `POST /api/ai/keywords` (public): the same baseline on any text.

Uploaded files are served at `/files/...`. The `q` filter on `GET /api/projects` also searches narration, summaries and the text of uploaded PDFs.

Search:

- `GET /api/projects/search?q=...&mode=hybrid&limit=20` (public): best matches first. Each result has the project, how it was found (`matched_by`), and for a match by meaning the `passage` that matched and its `similarity`.

The search indexes are updated whenever a project or one of its PDFs is saved, and by the seed script. To rebuild them for every project (after changing `EMBEDDING_MODEL`, or on a database filled before search existed):

```bash
python -m app.scripts.reindex
```

The first run downloads the sentence model. If the model cannot be loaded, saving still works and hybrid search returns keyword results.

## Testing

```bash
# Backend unit and integration tests (temporary SQLite database)
cd backend/inference && pytest

# Same suite against PostGIS, including the postgres-marked test. Use a throwaway database: tables are recreated.
docker exec thecharter-db-1 createdb -U charter charter_test
DATABASE_URL=postgresql://charter:charter@localhost:5432/charter_test pytest

# With coverage
pytest --cov=app --cov-report=term-missing
```

Test layers:

- **Unit tests** cover individual functions and AI pipeline stages
- **Integration tests** cover API endpoints against a test database, including upload, search and auth flows
- **End-user testing** is run with a small group of students before the final demonstration, with findings recorded in `docs/user-testing.md`

## Evaluation metrics

Each AI component is measured rather than assumed to work.

| Component | Metric | Target |
|---|---|---|
| Category and SDG tagging | Macro F1 on a held-out set | To be set after baseline |
| Summarization | ROUGE-1, ROUGE-L, plus curator rating | To be set after baseline |
| Semantic search | Hit@1, Recall@3 and MRR on a hand-built query set, against the keyword baseline | First run on the 7 sample projects: keyword 0.62 / 0.67 / 0.66, semantic and hybrid 1.00 / 1.00 / 1.00 (`backend/model_training/search_eval/results.md`). Too few projects to be a final number; rerun on partner data. |
| Location extraction | Percentage of pins placed correctly without edit | To be set after baseline |
| News shading | Agreement with curator-selected regions | To be set after baseline |
| Curation time | Minutes per project, before and after | Reduction against the manual baseline |

Baselines are established once partner data arrives. Cross-validation is used for the classifier, and all reported figures come from data the model has not seen during training.

## Ethical and regulatory considerations

**Consent and representation.** Projects frequently document communities, including Indigenous communities. Photographer submissions record whether consent was obtained from the people pictured.

**Researcher safety.** Researcher mode shows journalists and academics on a map. Precise locations can put people reporting on conflict or organized crime at risk, so researcher locations are opt-in and shown at region rather than street level.

**Data bias.** The news layer derives from news coverage volume, which reflects media attention rather than the severity of an event. Regions with little English-language coverage will be under-represented. This limitation is measured and stated in the interface rather than hidden.

Training data carries its own bias. Category and SDG classifiers trained largely on English-language academic text will handle some regions and vocabularies better than others, and per-group performance is reported rather than only an overall average.

**Human oversight.** No AI output is published without a human decision. Tags, summaries, locations, verification marks and news shading are all proposals until a curator or admin accepts them.

**Privacy and regulation.** The platform stores institutional user profiles, so handling follows PIPEDA in Canada, and GDPR where European users are involved. Passwords are hashed with bcrypt, access is restricted by an admin-controlled email allowlist, and personal data is never placed in URL parameters.

**Copyright.** Photographs remain the property of their authors. Licensing terms for institutional use are defined with the partner, and the platform stores rights metadata per project.

## Roadmap

**Iteration 1 (week 6).** AI capability first pass: tagging classifier, summarization, embeddings and search working end to end on sample data. Exploratory data analysis complete. Use cases, requirements and stakeholder register documented.

**Iteration 2 (week 10).** AI code refactored across all AI use cases with unit tests. Full architecture, class and component diagrams. Project plan, test plan and UI/UX design complete.

**Final (week 14).** Full stack complete with integration tests, provenance assistant, news layer live, and end-user testing findings incorporated.

## Team

| Name | Responsibility |
|---|---|
| (name) | Summarization and tagging models |
| (name) | Semantic search and news layer |
| (name) | Provenance, moderation, ethics documentation |
| (name) | Backend, databases, authentication |
| (name) | Frontend, map integration, admin interface |

Course: COMP 385 AI Capstone, Centennial College.

## References

- Radford, A., et al. (2021). Learning transferable visual models from natural language supervision. https://arxiv.org/abs/2103.00020
- Cherti, M., et al. (2023). Reproducible scaling laws for contrastive language-image learning. https://arxiv.org/abs/2212.07143
- Lewis, M., et al. (2020). BART: Denoising sequence-to-sequence pre-training for natural language generation, translation, and comprehension. https://arxiv.org/abs/1910.13461
- Zhang, J., et al. (2020). PEGASUS: Pre-training with extracted gap-sentences for abstractive summarization. https://arxiv.org/abs/1912.08777
- Reimers, N., & Gurevych, I. (2019). Sentence-BERT: Sentence embeddings using Siamese BERT-networks. https://arxiv.org/abs/1908.10084
- Leetaru, K., & Schrodt, P. (2013). GDELT: Global data on events, location and tone. http://data.gdeltproject.org/documentation/ISA.2013.GDELT.pdf
- Chroma. (2026). Multimodal embeddings. https://docs.trychroma.com/docs/embeddings/multimodal
- Google. (2026). Google Maps Platform pricing overview. https://developers.google.com/maps/billing-and-pricing/overview

## License and data rights

Code in this repository is coursework produced for COMP 385 at Centennial College in collaboration with an external partner. Ownership and licensing are governed by the agreement with the partner.

Photographs, project descriptions and research documents belong to their respective authors and are not covered by any code license in this repository. The sample dataset in `backend/data/samples/` is for development only and must not be redistributed.
