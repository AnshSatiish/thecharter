# The Charter API on Linux, without the AI summarizer (no PyTorch): search, projects, uploads.
#   docker build -t thecharter-api backend/inference
#   docker run -p 8000:8000 -e DATABASE_URL=postgresql+psycopg://... -e ADMIN_TOKEN=... thecharter-api
# The sentence model (about 66 MB) downloads on first start; mount a volume at /models to keep it.
FROM python:3.11-slim
WORKDIR /srv
RUN pip install --no-cache-dir "fastapi~=0.141.1" "uvicorn[standard]~=0.54.0" "SQLAlchemy~=2.0.54" "pydantic~=2.13.5" \
    "pydantic-settings~=2.15.0" "psycopg[binary]~=3.3.6" "pypdf~=6.19.0" "python-multipart~=0.0.32" \
    "fastembed~=0.9.0" "numpy~=2.4"
COPY app ./app
ENV AI_SUMMARY=false EMBEDDING_CACHE_DIR=/models UPLOAD_DIR=/srv/uploads
EXPOSE 8000
# One process per CPU is the usual starting point; WORKERS overrides it. Optional LIMIT_CONCURRENCY caps the
# connections each process accepts (idle keep-alive connections count too); the rest get "503 busy" at once.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers ${WORKERS:-2} ${LIMIT_CONCURRENCY:+--limit-concurrency $LIMIT_CONCURRENCY}"]
