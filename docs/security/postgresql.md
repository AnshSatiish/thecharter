# Securing PostgreSQL

The Charter uses PostgreSQL in two places:

| Where | What it holds | Who connects |
|---|---|---|
| **Supabase** (the live site) | uploaded projects, administrators, events, sponsors, photographs and PDFs | visitors' browsers, through Supabase's API with the public `anon` key |
| **Docker** (`docker-compose.yml`, the FastAPI backend) | the full library, search passages with their vectors (pgvector), map data (PostGIS) | only the FastAPI server |

The rules are the same in both: nobody gets more access than their job needs, secrets never reach the browser,
and every request is checked by the database itself, not only by the website.

---

## 1. Supabase (live site)

### What is already in place

- **Row-level security (RLS) on every table** (`supabase/schema.sql`, `supabase/pages.sql`). The database checks
  each row against a policy: everyone may read projects, events and sponsors; only accounts listed in
  `public.admins` may add, change or remove them. The check runs inside PostgreSQL, so editing the website's
  JavaScript cannot get around it.
- **`is_admin()`** is a `security definer` function with a fixed `search_path`, so it cannot be tricked into
  reading a look-alike table.
- **Only the `anon` key is in the website** (`frontend/config.js`). It is designed to be public: it can do only
  what the RLS policies allow. The `service_role` key skips RLS and must never be put in the frontend,
  committed to git, or pasted into chat.
- **Storage bucket rules**: anyone can view files, only administrators can upload, 50 MB per file, JPEG, PNG,
  WebP and PDF only.
- **Administrators sign in with Supabase Auth.** Being an administrator is decided by the database
  (`public.admins`), not by the role picked on the sign-in screen.

### Steps to do once (in the Supabase dashboard)

1. **Run `supabase/security.sql`** (SQL Editor -> New query -> paste -> Run). It removes privileges that visitors
   never need: writing to tables, seeing the administrators list, `TRUNCATE`. Then a mistake in one RLS policy
   cannot open a table. The last query lists every table: `rls` must be `true` and `visitors_can_insert` must be
   `false` everywhere. This was tested on a copy set up like Supabase: visitors can read but not write, signed-in
   students are refused, administrators can still add, edit and remove.
2. **Turn off public sign-ups**: Authentication -> Sign In / Providers -> uncheck *Allow new users to sign up*.
   Administrators are added by hand (Authentication -> Users -> Add user, then the `insert into public.admins`
   line at the end of `schema.sql`). Students do not need an account.
3. **Two-factor authentication** on every Supabase account that can open the project (Account -> Security).
4. **Database password**: Project Settings -> Database. Use a long random one and keep it in a password manager.
   The site never needs it. Change it if it was ever shared.
5. **Enforce SSL** on direct connections: Project Settings -> Database -> SSL Configuration -> *Enforce SSL on
   incoming connections*.
6. **Network restrictions** (if the backend connects directly): Project Settings -> Database -> Network
   Restrictions, allow only the backend server's IP address.
7. **Security Advisor**: Database -> Advisors -> Security Advisor. Fix every error it lists (for example a table
   without RLS) and run it again after each schema change.
8. **Backups**: the free plan keeps no backups you can restore. Before each demo or big change, export the
   data (Database -> Backups if available on the plan, or `pg_dump` with the connection string).

### Rules for future changes

- Every new table: `alter table ... enable row level security;` plus explicit policies, then run
  `security.sql` again.
- Never write a policy with `using (true)` for `insert`, `update` or `delete`.
- Never put `service_role` in the frontend. Code that needs it runs on a server.
- New `security definer` functions: always `set search_path = public`, and grant `execute` only to the roles
  that need it.

---

## 2. The backend database (Docker + FastAPI)

### What is already in place

- **Every query is parameterised** (SQLAlchemy and bound `:parameters`). Search words are never pasted into
  SQL, so SQL injection is not possible through the search box. The only values formatted into SQL are numbers
  and names written in the code.
- **Uploads and edits need the admin token** (`ADMIN_TOKEN`); in production the server refuses to start
  without one.
- **The database port is only open to this computer** (`127.0.0.1:5432` in `docker-compose.yml`). Before this
  change, anyone on the same Wi-Fi could connect with the password `charter`.

### Steps for any deployment beyond a laptop

1. **A strong password**: set `POSTGRES_PASSWORD` in the environment before `docker compose up`
   (`docker-compose.yml` reads it) and use the same one in `DATABASE_URL`. Never commit it.
2. **Encrypted connections**: add `?sslmode=require` to `DATABASE_URL` when the database is on another machine.
3. **A role with only the rights the API needs.** The container's `charter` user owns everything; the API
   should connect as a smaller role:

   ```sql
   create role charter_api login password 'a long random password';
   grant connect on database charter to charter_api;
   grant usage on schema public to charter_api;
   grant select, insert, update, delete on all tables in schema public to charter_api;
   grant usage, select on all sequences in schema public to charter_api;
   -- A runaway query is stopped instead of holding the server:
   alter role charter_api set statement_timeout = '5s';
   alter role charter_api set idle_in_transaction_session_timeout = '30s';
   ```

   Create the tables once as `charter` (`python -m app.scripts.seed`), then run the API with
   `DATABASE_URL=postgresql+psycopg://charter_api:...@host:5432/charter`.
4. **Limit connections**: the API keeps at most `DB_POOL_SIZE + DB_MAX_OVERFLOW` connections (5 + 15 by
   default) per worker, and answers *503 busy* instead of waiting when they are all in use. Keep
   workers x (pool + overflow) below PostgreSQL's `max_connections` (100 by default).
5. **Firewall**: only the API server may reach port 5432. The database is never exposed to the internet.
6. **Backups**: a daily `pg_dump -Fc charter > charter-YYYY-MM-DD.dump`, kept off the server, and a restore
   tried at least once.
7. **Updates**: rebuild the image (`docker compose build --pull`) for PostgreSQL security fixes.

---

## Checklist

- [ ] `supabase/security.sql` run, last query shows `rls = true` and `visitors_can_insert = false`
- [ ] Public sign-ups off
- [ ] Two-factor authentication on every Supabase account
- [ ] Database password long, random, not shared
- [ ] SSL enforced
- [ ] Security Advisor clean
- [ ] Backup exported before the demo
- [ ] `service_role` key nowhere in the repo or the site
