-- The Charter: live storage for projects uploaded by administrators.
--
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste this file -> Run.
-- Safe to run again: it only creates what is missing.
--
-- What it sets up
--   projects        one row per uploaded project; everyone can read, only administrators can write
--   admins          the Supabase accounts allowed to upload (add one with the statement at the end)
--   project-files   a storage bucket for photographs and PDFs; public to read, administrators to write
--
-- The site uses the project's public "anon" key. That key is safe to publish: the row-level security
-- policies below are what decide who may read and write.

create table if not exists public.projects (
  id              bigint generated always as identity primary key,
  title           text not null check (char_length(title) between 1 and 500),
  description     text not null default '',
  category        text not null check (category in ('wildlife', 'anthropology', 'urban', 'border', 'news')),
  location_name   text not null,
  lat             double precision not null check (lat between -90 and 90),
  lng             double precision not null check (lng between -180 and 180),
  date            date not null default current_date,
  keywords        text[] not null default '{}',
  sdgs            text[] not null default '{}',
  images          text[] not null default '{}',   -- public URLs of the photographs
  captions        text[] not null default '{}',   -- narration written by the administrator, one per photograph
  summary         text,
  author_name     text not null,
  author_affiliation text,
  author_profession  text,
  author_role     text not null default 'journalist' check (author_role in ('academic', 'journalist')),
  author_website  text,
  document_url    text,                           -- the project PDF, if one was uploaded
  document_name   text,
  document_size   bigint,
  verified        boolean not null default false, -- the blue curation mark
  created_at      timestamptz not null default now(),
  created_by      uuid default auth.uid() references auth.users (id) on delete set null
);

create table if not exists public.admins (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  added_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.projects enable row level security;
alter table public.admins enable row level security;

drop policy if exists "Anyone can read projects" on public.projects;
create policy "Anyone can read projects" on public.projects for select to anon, authenticated using (true);
drop policy if exists "Admins add projects" on public.projects;
create policy "Admins add projects" on public.projects for insert to authenticated with check (public.is_admin());
drop policy if exists "Admins edit projects" on public.projects;
create policy "Admins edit projects" on public.projects for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins remove projects" on public.projects;
create policy "Admins remove projects" on public.projects for delete to authenticated using (public.is_admin());

drop policy if exists "Admins see themselves" on public.admins;
create policy "Admins see themselves" on public.admins for select to authenticated using (user_id = auth.uid());

-- Storage bucket: public read, 50 MB per file, photographs and PDFs only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('project-files', 'project-files', true, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

drop policy if exists "Admins upload project files" on storage.objects;
create policy "Admins upload project files" on storage.objects for insert to authenticated
  with check (bucket_id = 'project-files' and public.is_admin());
drop policy if exists "Admins change project files" on storage.objects;
create policy "Admins change project files" on storage.objects for update to authenticated
  using (bucket_id = 'project-files' and public.is_admin());
drop policy if exists "Admins delete project files" on storage.objects;
create policy "Admins delete project files" on storage.objects for delete to authenticated
  using (bucket_id = 'project-files' and public.is_admin());

-- Make an account an administrator (create the account first: Authentication -> Users -> Add user):
--   insert into public.admins (user_id) select id from auth.users where email = 'name@example.com';
