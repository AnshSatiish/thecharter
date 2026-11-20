# Contributing to The Charter

Every team member works through pull requests, and every pull request is reviewed by someone who did not write it. Reviewing is how each of us learns the parts we did not build.

## The flow

1. **Pick or open an issue.** One issue is one piece of work a person can finish in a few days. Assign yourself.
2. **Branch from `main`:** `git switch main && git pull && git switch -c <type>/<short-name>`
   - `feat/admin-review-queue`, `fix/bbox-antimeridian`, `test/fusion-edge-cases`, `docs/api-readme`, `refactor/split-schemas`
3. **Commit small and often.** Write the message as what the commit does: `Add unit tests for reciprocal rank fusion`.
4. **Open a pull request early** (as a draft if it is not finished) and fill in the template. Link the issue with `Closes #12`.
5. **CI must pass**: backend lint and tests, frontend syntax and file checks (`.github/workflows/`).
6. **One approval from another team member**, then merge with "Squash and merge". Delete the branch.

Never push directly to `main`. Repository admins: protect `main` under Settings → Branches (require a pull request, one approval and passing checks).

## Before you open a pull request

```bash
# backend/api/
ruff check .
pytest tests/unit      # a few seconds, no database or model
pytest                 # everything
```

For frontend changes, run `python -m http.server 8080` in `frontend/` and click through what you changed. With the API running on port 8000 the site uses it; without it, the site shows projects from Supabase together with the built-in sample, or the sample alone.

## Where things go

- **API endpoint:** schema in `backend/api/app/schemas/`, logic in `app/services/`, route in `app/routes/public/` or `app/routes/admin/`. See `backend/api/README.md`.
- **Model or algorithm:** code in `backend/api/app/ai/`. The experiment that chose it goes in `backend/ml/experiments/`, with results in `backend/ml/results/`.
- **Frontend:** the file for that part of the page in `frontend/js/` and `frontend/css/`. See `frontend/README.md` for the load-order rule.
- **Database change on the live site:** a new numbered file in `supabase/migrations/`.
- **A decision the team made** (a library, an approach, a trade-off): a short note in `docs/architecture/decisions/`.

## Tests

- Every bug fix comes with a test that fails without the fix.
- Pure logic (no database, no HTTP) gets a unit test in `tests/unit/`.
- An endpoint gets an integration test in `tests/integration/` (admin endpoints in `tests/integration/admin/`).
- Tests never download models: `tests/conftest.py` swaps in a small stand-in embedder and summarizer.

## Code style

- Python: ruff (`backend/api/ruff.toml`), type hints on function signatures, a docstring on every module saying what it is for.
- JavaScript and CSS: follow the style of the file you are in. Two-space indentation (`.editorconfig`).
- Names say what something is: `location_check.py`, not `utils2.py`.
- No secrets in the repository. `.env` files are git-ignored; `.env.example` lists the main variables; every setting is in `backend/api/app/core/config.py`.
