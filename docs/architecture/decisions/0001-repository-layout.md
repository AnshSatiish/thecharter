# 0001. Repository layout

**Status:** proposed (on the `restructure` branch, for the team to review)
**Date:** 2026-11-16

## Context

The repository grew quickly. The API folder was called `inference/` although it is the whole application; admin routes were mixed into the public route files; `services/text.py` held PDF extraction, keyword extraction and the summary fallback together; the frontend was one 2,671-line `index.html`; `preprocessing/` and three `ai/` subfolders were empty; and the Figma prototype made up most of the file count. That made the code hard to split between team members and hard to review.

## Decision

- `backend/inference/` becomes `backend/api/`, organised in layers: `routes/` (HTTP only) → `services/` (logic) → `ai/` (models) and `db/` (storage). Models and schemas are split one file per resource.
- Public and admin routes are separate routers. The admin router carries `require_admin` once, so a new admin route cannot be left unprotected.
- Reciprocal rank fusion gets its own module (`services/search/fusion.py`) and its own unit tests.
- Tests are split by speed: `unit/` (no database), `integration/` (HTTP), `load/`.
- `eda/`, `preprocessing/` and `model_training/` become `backend/ml/` with `eda/`, `experiments/`, `evaluation/`.
- The frontend is split into `css/` and `js/` files loaded in the original order, with no change in behaviour, and assets move to `assets/` and `data/`.
- Supabase SQL files are numbered in run order under `supabase/migrations/`.
- The Figma prototype leaves the repository.

## What did not change

- **URLs.** Every API path, parameter and response is the same (checked by comparing the OpenAPI specification before and after). Moving admin routes under `/api/admin/` is a separate change.
- **Behaviour.** The full test suite passed before and after. The site was driven through the same 19 steps in a headless browser before and after the split, with and without the API, with identical results.

## Consequences

- Open branches made before the restructure will conflict. Merge or rebase them onto it soon, or re-apply their changes on top.
- Each folder can now have an owner in `.github/CODEOWNERS`.
- The frontend files still share one global scope. Converting them to ES modules is a possible later step.
