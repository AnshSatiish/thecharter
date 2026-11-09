-- The Charter: extra locks on the live database, on top of the row-level security in schema.sql and pages.sql.
--
-- Run in the Supabase dashboard: SQL Editor -> New query -> paste this file -> Run. Safe to run again, and
-- safe to run before pages.sql (tables that do not exist yet are skipped; run this file again afterwards).
--
-- Why: Supabase gives the public roles (anon = visitors, authenticated = signed-in accounts) every privilege
-- on new tables and relies on row-level security alone to stop them. This removes the privileges they never
-- need, so a mistake in one policy cannot open a table. It changes nothing the site does today.
-- Full guide: docs/security/postgresql.md

do $$
declare
  t text;
begin
  -- Content tables: visitors may only read; signed-in accounts keep insert/update/delete, which the
  -- "Admins ..." policies still limit to administrators.
  foreach t in array array['projects', 'events', 'sponsors'] loop
    if to_regclass('public.' || t) is not null then
      execute format('revoke insert, update, delete, truncate, references, trigger on public.%I from anon', t);
      execute format('revoke truncate, references, trigger on public.%I from authenticated', t);
      execute format('alter table public.%I enable row level security', t);
    end if;
  end loop;

  -- The list of administrators: never visible to visitors, never writable from the site.
  -- New administrators are added in the SQL editor only (see the end of schema.sql).
  if to_regclass('public.admins') is not null then
    revoke all on public.admins from anon;
    revoke insert, update, delete, truncate, references, trigger on public.admins from authenticated;
    alter table public.admins enable row level security;
  end if;
end $$;

-- is_admin() runs with its owner's rights (security definer): only the two site roles may call it.
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Check: every table in the public schema should appear here with rls = true.
select c.relname as table_name, c.relrowsecurity as rls,
       has_table_privilege('anon', c.oid, 'INSERT') as visitors_can_insert,
       has_table_privilege('anon', c.oid, 'SELECT') as visitors_can_read
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by 1;
