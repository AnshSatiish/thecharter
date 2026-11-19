# Supabase (the deployed site's database)

The live site on Vercel does not call the FastAPI backend. Projects uploaded by administrators, the Events and Sponsors lists, and administrator sign-in are stored in Supabase. The frontend reaches it with the public "anon" key in `frontend/config.js`; row-level security in these files decides what that key may read and write.

## Run order

In the Supabase dashboard: **SQL Editor → New query → paste the file → Run**. Every file is safe to run again.

| File | What it sets up |
|---|---|
| `migrations/001_schema.sql` | `projects` table, `admins` table, `is_admin()` and the `project-files` storage bucket, with row-level security |
| `migrations/002_pages.sql` | `events` and `sponsors` tables for the Events and Sponsors pages (needs 001) |
| `migrations/003_security.sql` | Removes privileges the public roles never need, on top of row-level security. Run it again after adding tables |

## Add an administrator

Create the account first (Authentication → Users → Add user), then run:

```sql
insert into public.admins (user_id) select id from auth.users where email = 'name@example.com';
```

Full security guide: `docs/security/postgresql.md`.
