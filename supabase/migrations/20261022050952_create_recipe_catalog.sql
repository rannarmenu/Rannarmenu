-- Rannar Menu recipe catalogue and least-privilege access policies.
create extension if not exists pgcrypto with schema extensions;

create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'admin' check (role in ('owner','admin','editor')),
  created_at timestamptz not null default now()
);

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (char_length(slug) between 1 and 220),
  title text not null check (char_length(title) between 2 and 180),
  summary text not null default '' check (char_length(summary) <= 1200),
  category text not null default 'অন্যান্য' check (char_length(category) between 1 and 80),
  cuisine text not null default 'বাংলাদেশি' check (char_length(cuisine) <= 80),
  ingredients jsonb not null default '[]'::jsonb check (jsonb_typeof(ingredients) = 'array'),
  instructions jsonb not null default '[]'::jsonb check (jsonb_typeof(instructions) = 'array'),
  prep_minutes integer not null default 0 check (prep_minutes between 0 and 1440),
  cook_minutes integer not null default 0 check (cook_minutes between 0 and 1440),
  servings integer not null default 2 check (servings between 1 and 100),
  difficulty text not null default 'easy' check (difficulty in ('easy','medium','hard')),
  image_url text check (image_url is null or image_url = '' or image_url ~ '^https://'),
  tags text[] not null default '{}',
  source_name text,
  source_url text check (source_url is null or source_url = '' or source_url ~ '^https://'),
  source_license text,
  source_attribution text,
  is_published boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  search_document tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(summary,'')), 'B') ||
    setweight(to_tsvector('simple', coalesce(category,'')), 'C')
  ) stored
);

create index recipes_published_category_idx on public.recipes(category) where is_published = true;
create index recipes_created_at_idx on public.recipes(created_at desc);
create index recipes_search_document_idx on public.recipes using gin(search_document);
create index recipes_title_lower_idx on public.recipes(lower(title));

create table public.recipe_import_batches (
  id uuid primary key default gen_random_uuid(),
  file_name text not null check (char_length(file_name) <= 255),
  source_name text,
  status text not null default 'running' check (status in ('running','completed','completed_with_errors','failed')),
  records_read integer not null default 0 check (records_read >= 0),
  valid_records integer not null default 0 check (valid_records >= 0),
  upserted_records integer not null default 0 check (upserted_records >= 0),
  error_records integer not null default 0 check (error_records >= 0),
  report jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index recipe_import_batches_created_at_idx on public.recipe_import_batches(created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;
revoke all on function public.set_updated_at() from public, anon, authenticated;
create trigger recipes_set_updated_at
before update on public.recipes
for each row execute function public.set_updated_at();

alter table public.admin_users enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_import_batches enable row level security;

revoke all on public.admin_users from anon, authenticated;
revoke all on public.recipes from anon, authenticated;
revoke all on public.recipe_import_batches from anon, authenticated;
grant select on public.admin_users to authenticated;
grant select on public.recipes to anon, authenticated;
grant insert, update, delete on public.recipes to authenticated;
grant select, insert, update on public.recipe_import_batches to authenticated;

create policy "Users can read their own admin membership" on public.admin_users
for select to authenticated using ((select auth.uid()) = user_id);

create policy "Published recipes are public" on public.recipes
for select to anon, authenticated using (is_published = true);
create policy "Admins can read every recipe" on public.recipes
for select to authenticated using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));
create policy "Admins can create recipes" on public.recipes
for insert to authenticated with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));
create policy "Admins can update recipes" on public.recipes
for update to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())))
with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));
create policy "Admins can delete recipes" on public.recipes
for delete to authenticated using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));
create policy "Admins can read recipe import batches" on public.recipe_import_batches
for select to authenticated using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));
create policy "Admins can create recipe import batches" on public.recipe_import_batches
for insert to authenticated with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));
create policy "Admins can update recipe import batches" on public.recipe_import_batches
for update to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())))
with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));
