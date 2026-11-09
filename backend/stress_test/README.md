# Stress test of the search API

`loadtest.py` simulates N users who search non-stop: each sends a search, waits for the answer and sends the
next at once. That is much harsher than N real visitors, who search now and then while they look at the globe.
A user gives up after 10 seconds. Results are written to `results/`.

## How to run it

```bash
docker compose up -d                                   # PostgreSQL + PostGIS + pgvector (repo root)
cd backend/inference && python -m app.scripts.seed     # sample projects and search index
docker build -t thecharter-api backend/inference
docker run -d --name charter-api --network thecharter_default --cpus=2 --memory=2g -p 127.0.0.1:8000:8000 \
  -e DATABASE_URL=postgresql+psycopg://charter:charter@db:5432/charter -e WORKERS=2 -e EMBEDDING_THREADS=1 \
  -v charter-models:/models thecharter-api
cd backend && python stress_test/loadtest.py --levels 1 10 25 50 100 --seconds 20 --label my_run
```

For a bigger library: `python stress_test/make_dataset.py 1000 stress_test/results/projects_1000.json`, then seed
that file. Delete the copies afterwards (`id >= 100000`).

## Results (2026-11-09)

The API ran in a Linux container limited to **2 CPUs and 2 GB** (about a small cloud server), 2 worker processes,
the database in a second container. The load generator ran on the same laptop (Intel i5-1235U, 8 GB), so the
rows above 50 users are limited by the laptop as much as by the API and are left out below.

**Sample library (9 projects)**, `linux_2cpu_2workers_9projects.json`:

| Simultaneous non-stop users | Keyword: searches/s | Keyword: 95% answered within | Hybrid: searches/s | Hybrid: 95% answered within | Errors |
|---|---|---|---|---|---|
| 1 | 55 | 23 ms | 16 | 93 ms | 0 |
| 5 | 45 | 0.26 s | 44 | 0.22 s | 0 |
| 10 | 44 | 0.75 s | 50 | 0.71 s | 0 |
| 25 | 46 | 1.5 s | 30 | 2.2 s | 0 |
| 50 | 21 | 6.1 s | 19 | 6.9 s | 0 |
| 100 | 13 | 16 s | 24 | 8.2 s | 15 and 7 (mostly 503 busy) |

**1,009 projects** (3,634 passages), `linux_2cpu_2workers_1009projects.json`: one search takes 26 ms (keyword)
and 54 ms (hybrid), against 17 ms and 54 ms with 9 projects. The vector index (HNSW) and the full-text index (GIN)
keep the search itself fast; most of the time per request goes into building the answer (up to 20 projects).

**What the numbers mean**

- One server of this size answers about **40 to 50 searches a second**. A visitor searches perhaps once every
  30 to 60 seconds, so that is in the order of **1,000 people browsing at the same time**, with answers under a
  second. Above that, add worker processes and CPUs (the API keeps no state, so copies can run side by side).
- The slow part of a hybrid search is the sentence model reading the query (8 ms of CPU); the database part is
  1 to 7 ms.

## Problems the test found, and the fixes

| Found | Fix |
|---|---|
| At 100 users, **every** request failed: they waited 30 s for one of 15 database connections, then got a 500 error (`before_fixes_windows_1worker_9projects.json`). | The pool size is a setting (`DB_POOL_SIZE`, `DB_MAX_OVERFLOW`), and after `DB_POOL_TIMEOUT` (5 s) the API answers **503 busy** with `Retry-After` instead of a 500. |
| With several worker processes the server **would not start**: each process ran `ALTER TABLE` at the same time and PostgreSQL stopped them with a deadlock. | Schema setup takes a PostgreSQL advisory lock, so processes set it up one after another (`app/db/init_db.py`, test in `tests/test_load.py`). |
| A slow or failing backend left the site with no results. | The site waits 8 s at most; on a 503 or no answer it searches in the browser instead (by meaning with the in-browser model, or by keyword). |
| Every process could use all CPU cores for the model, so simultaneous searches competed for them. | `EMBEDDING_THREADS=1` gives each search one core. |

`LIMIT_CONCURRENCY` (uvicorn `--limit-concurrency`) was tried (`linux_2cpu_2workers_limit16_9projects.json`):
it counts idle open connections too, so it turned users away too early, and it is off by default.
