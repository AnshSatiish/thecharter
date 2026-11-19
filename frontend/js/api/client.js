// Where data comes from: the FastAPI backend on localhost, otherwise Supabase (config.js).
// Pins come from the FastAPI backend when it is running (see backend/), otherwise from this built-in sample.
const API_BASE = window.CHARTER_API ?? (["localhost","127.0.0.1"].includes(location.hostname) ? "http://localhost:8000" : null);
const DEV_ADMIN_TOKEN = "dev-admin-token"; // development only; JWT sessions replace this (backend/api/app/core/security.py)
let apiLive = false;
// Without our backend (the deployed site), uploaded projects live in Supabase: see config.js and supabase/migrations/001_schema.sql.
const sb = window.CHARTER_SUPABASE_URL && window.CHARTER_SUPABASE_KEY && window.supabase
  ? window.supabase.createClient(window.CHARTER_SUPABASE_URL, window.CHARTER_SUPABASE_KEY) : null;
const SB_BUCKET = "project-files";
let sbLive = false;
