-- The Charter: events and sponsors shown on the site's Events and Sponsors pages.
--
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste this file -> Run.
-- Needs schema.sql first (it defines public.is_admin). Safe to run again.
--
-- Everyone can read both lists; only administrators (public.admins) can add, change or remove rows.
-- Sponsor logos go to the existing project-files bucket, under sponsors/.

create table if not exists public.events (
  id            bigint generated always as identity primary key,
  title         text not null check (char_length(title) between 1 and 300),
  kind          text not null default 'other' check (kind in ('exhibition', 'talk', 'workshop', 'screening', 'fieldwork', 'other')),
  starts_on     date not null,
  ends_on       date check (ends_on is null or ends_on >= starts_on),
  location_name text,
  online        boolean not null default false,
  url           text,
  description   text,
  created_at    timestamptz not null default now(),
  created_by    uuid default auth.uid() references auth.users (id) on delete set null
);

create table if not exists public.sponsors (
  id         bigint generated always as identity primary key,
  name       text not null check (char_length(name) between 1 and 200),
  tier       text not null default 'supporter' check (tier in ('partner', 'supporter')),
  url        text,
  logo_url   text,
  blurb      text,
  sort       integer not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete set null
);

alter table public.events enable row level security;
alter table public.sponsors enable row level security;

drop policy if exists "Anyone can read events" on public.events;
create policy "Anyone can read events" on public.events for select to anon, authenticated using (true);
drop policy if exists "Admins add events" on public.events;
create policy "Admins add events" on public.events for insert to authenticated with check (public.is_admin());
drop policy if exists "Admins edit events" on public.events;
create policy "Admins edit events" on public.events for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins remove events" on public.events;
create policy "Admins remove events" on public.events for delete to authenticated using (public.is_admin());

drop policy if exists "Anyone can read sponsors" on public.sponsors;
create policy "Anyone can read sponsors" on public.sponsors for select to anon, authenticated using (true);
drop policy if exists "Admins add sponsors" on public.sponsors;
create policy "Admins add sponsors" on public.sponsors for insert to authenticated with check (public.is_admin());
drop policy if exists "Admins edit sponsors" on public.sponsors;
create policy "Admins edit sponsors" on public.sponsors for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins remove sponsors" on public.sponsors;
create policy "Admins remove sponsors" on public.sponsors for delete to authenticated using (public.is_admin());
