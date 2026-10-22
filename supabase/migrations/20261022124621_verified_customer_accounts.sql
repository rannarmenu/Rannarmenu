-- Verified customer accounts, private profile data, saved recipes and recipe-detail protection.
-- Public visitors receive a deliberately reduced recipe preview only.

create or replace function public.is_verified_customer()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select
    exists (
      select 1
      from auth.users u
      where u.id = (select auth.uid())
        and (
          (u.email is not null and u.email_confirmed_at is not null)
          or (u.phone is not null and u.phone_confirmed_at is not null)
        )
    )
    or exists (
      select 1 from public.admin_users a
      where a.user_id = (select auth.uid())
    );
$function$;
revoke all on function public.is_verified_customer() from public, anon;
grant execute on function public.is_verified_customer() to authenticated;

create table if not exists public.customer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 80),
  avatar_path text check (avatar_path is null or char_length(avatar_path) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.customer_profiles enable row level security;
revoke all on public.customer_profiles from public, anon, authenticated;
grant select, insert, update on public.customer_profiles to authenticated;
drop policy if exists "Customers create their own verified profile" on public.customer_profiles;
create policy "Customers create their own verified profile"
on public.customer_profiles for insert to authenticated
with check (user_id = (select auth.uid()) and public.is_verified_customer());
drop policy if exists "Customers read their own verified profile" on public.customer_profiles;
create policy "Customers read their own verified profile"
on public.customer_profiles for select to authenticated
using (user_id = (select auth.uid()) and public.is_verified_customer());
drop policy if exists "Customers update their own verified profile" on public.customer_profiles;
create policy "Customers update their own verified profile"
on public.customer_profiles for update to authenticated
using (user_id = (select auth.uid()) and public.is_verified_customer())
with check (user_id = (select auth.uid()) and public.is_verified_customer());

create or replace function public.create_customer_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.customer_profiles (user_id, full_name)
  values (
    new.id,
    coalesce(
      nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'name'), ''),
      ''
    )
  )
  on conflict (user_id) do nothing;
  return new;
end;
$function$;
revoke all on function public.create_customer_profile() from public, anon, authenticated;
drop trigger if exists on_auth_user_created_customer_profile on auth.users;
create trigger on_auth_user_created_customer_profile
after insert on auth.users
for each row execute function public.create_customer_profile();

drop trigger if exists customer_profiles_set_updated_at on public.customer_profiles;
create trigger customer_profiles_set_updated_at
before update on public.customer_profiles
for each row execute function public.set_updated_at();

create table if not exists public.user_saved_recipes (
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);
create index if not exists user_saved_recipes_recipe_id_idx
on public.user_saved_recipes(recipe_id);
alter table public.user_saved_recipes enable row level security;
revoke all on public.user_saved_recipes from public, anon, authenticated;
grant select, insert, delete on public.user_saved_recipes to authenticated;
drop policy if exists "Customers read their own saved recipes" on public.user_saved_recipes;
create policy "Customers read their own saved recipes"
on public.user_saved_recipes for select to authenticated
using (user_id = (select auth.uid()) and public.is_verified_customer());
drop policy if exists "Customers save recipes for themselves" on public.user_saved_recipes;
create policy "Customers save recipes for themselves"
on public.user_saved_recipes for insert to authenticated
with check (user_id = (select auth.uid()) and public.is_verified_customer());
drop policy if exists "Customers unsave their own recipes" on public.user_saved_recipes;
create policy "Customers unsave their own recipes"
on public.user_saved_recipes for delete to authenticated
using (user_id = (select auth.uid()) and public.is_verified_customer());

-- Remove broad anonymous access to the base table. Verified customers can read
-- published details; the existing trusted-admin policy continues to protect drafts.
drop policy if exists "Published recipes are public" on public.recipes;
drop policy if exists "Verified customers can read published recipe details" on public.recipes;
create policy "Verified customers can read published recipe details"
on public.recipes for select to authenticated
using (is_published = true and public.is_verified_customer());
revoke select on public.recipes from anon;
grant select on public.recipes to authenticated;

-- This definer-owned, security-barrier view is a strict allowlist of public fields.
-- It intentionally has no ingredients, instructions or full recipe JSON column.
create or replace view public.recipe_previews
with (security_barrier = true)
as
select
  r.id,
  r.slug,
  r.title,
  r.summary,
  r.category,
  r.cuisine,
  r.prep_minutes,
  r.cook_minutes,
  r.servings,
  r.difficulty,
  r.image_url,
  r.tags,
  r.source_name,
  r.source_url,
  r.source_license,
  r.source_attribution,
  r.created_at,
  r.published_at,
  r.image_source_url,
  r.image_credit,
  r.image_license
from public.recipes r
where r.is_published = true;
revoke all on public.recipe_previews from public;
grant select on public.recipe_previews to anon, authenticated;

-- The former public search RPC returned complete recipe rows. Disable it so it
-- cannot be used to bypass the new detail gate.
revoke all on function public.search_published_recipes_multilingual(jsonb, text, uuid[], boolean, integer, integer)
from public, anon, authenticated;

-- Public-facing search returns only preview-safe fields. Ingredient/step text
-- can influence matching only for an already verified customer.
create or replace function public.search_recipe_previews_multilingual(
  p_search_groups jsonb default '[]'::jsonb,
  p_category text default null,
  p_saved_ids uuid[] default null,
  p_only_saved boolean default false,
  p_limit integer default 24,
  p_offset integer default 0
)
returns table (recipe jsonb, total_count bigint)
language sql
stable
security definer
set search_path = ''
as $function$
  with access_context as (
    select public.is_verified_customer() as can_search_details
  ),
  candidates as (
    select
      r.id,
      r.slug,
      r.title,
      r.summary,
      r.category,
      r.cuisine,
      r.prep_minutes,
      r.cook_minutes,
      r.servings,
      r.difficulty,
      r.image_url,
      r.tags,
      r.source_name,
      r.source_url,
      r.source_license,
      r.source_attribution,
      r.created_at,
      r.published_at,
      r.image_source_url,
      r.image_credit,
      r.image_license,
      pg_catalog.concat_ws(
        ' ',
        r.title,
        r.slug,
        r.summary,
        r.category,
        r.cuisine,
        pg_catalog.array_to_string(r.tags, ' '),
        case when access_context.can_search_details then pg_catalog.concat_ws(' ', r.ingredients::text, r.instructions::text) else '' end
      ) as searchable_text
    from public.recipes r
    cross join access_context
    where r.is_published = true
      and (p_category is null or r.category = p_category)
      and (
        not p_only_saved
        or (p_saved_ids is not null and r.id = any(p_saved_ids))
      )
  ),
  matching as (
    select c.*
    from candidates c
    where not exists (
      select 1
      from pg_catalog.jsonb_array_elements(
        case when pg_catalog.jsonb_typeof(p_search_groups) = 'array'
          then p_search_groups else '[]'::jsonb end
      ) as search_group(group_terms)
      where not exists (
        select 1
        from pg_catalog.jsonb_array_elements_text(
          case when pg_catalog.jsonb_typeof(search_group.group_terms) = 'array'
            then search_group.group_terms else '[]'::jsonb end
        ) as candidate_term(term)
        where pg_catalog.btrim(candidate_term.term) <> ''
          and (
            pg_catalog.strpos(
              extensions.unaccent(pg_catalog.lower(normalize(c.searchable_text, NFKC))),
              extensions.unaccent(pg_catalog.lower(normalize(candidate_term.term, NFKC)))
            ) > 0
            or to_tsvector('simple', c.searchable_text) @@ websearch_to_tsquery('simple', candidate_term.term)
          )
      )
    )
  )
  select
    pg_catalog.to_jsonb(m) - 'searchable_text' as recipe,
    pg_catalog.count(*) over () as total_count
  from matching m
  order by m.published_at desc nulls last, m.created_at desc
  limit least(greatest(coalesce(p_limit, 24), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
$function$;
revoke all on function public.search_recipe_previews_multilingual(jsonb, text, uuid[], boolean, integer, integer) from public;
grant execute on function public.search_recipe_previews_multilingual(jsonb, text, uuid[], boolean, integer, integer) to anon, authenticated;

-- User avatars are private, constrained to the owner's folder, and size/type limited.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('customer-avatars', 'customer-avatars', false, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
set public = false, file_size_limit = 3145728, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "Customers read own profile avatars" on storage.objects;
create policy "Customers read own profile avatars"
on storage.objects for select to authenticated
using (bucket_id = 'customer-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text) and public.is_verified_customer());
drop policy if exists "Customers upload own profile avatars" on storage.objects;
create policy "Customers upload own profile avatars"
on storage.objects for insert to authenticated
with check (bucket_id = 'customer-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text) and public.is_verified_customer());
drop policy if exists "Customers update own profile avatars" on storage.objects;
create policy "Customers update own profile avatars"
on storage.objects for update to authenticated
using (bucket_id = 'customer-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text) and public.is_verified_customer())
with check (bucket_id = 'customer-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text) and public.is_verified_customer());
drop policy if exists "Customers delete own profile avatars" on storage.objects;
create policy "Customers delete own profile avatars"
on storage.objects for delete to authenticated
using (bucket_id = 'customer-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text) and public.is_verified_customer());


-- Reviews must be tied to a verified account, not an easily replaced browser key.
alter table public.recipe_reviews
  add column if not exists user_id uuid references auth.users(id) on delete cascade;
create unique index if not exists recipe_reviews_one_per_verified_user
  on public.recipe_reviews(recipe_id, user_id)
  where user_id is not null;
drop policy if exists "Anyone can read visible reviews for published recipes" on public.recipe_reviews;
drop policy if exists "Visitors can post reviews for published recipes" on public.recipe_reviews;
drop policy if exists "Verified customers read visible reviews" on public.recipe_reviews;
create policy "Verified customers read visible reviews"
on public.recipe_reviews for select to authenticated
using (
  is_visible = true
  and public.is_verified_customer()
  and exists (
    select 1 from public.recipes r
    where r.id = recipe_reviews.recipe_id and r.is_published = true
  )
);
drop policy if exists "Verified customers can post one review per recipe" on public.recipe_reviews;
create policy "Verified customers can post one review per recipe"
on public.recipe_reviews for insert to authenticated
with check (
  user_id = (select auth.uid())
  and public.is_verified_customer()
  and is_visible = true
  and char_length(btrim(display_name)) between 2 and 50
  and char_length(btrim(comment)) between 5 and 1200
  and exists (
    select 1 from public.recipes r
    where r.id = recipe_reviews.recipe_id and r.is_published = true
  )
);
revoke all on public.recipe_reviews from public, anon, authenticated;
grant select on public.recipe_reviews to authenticated;
grant insert (recipe_id, user_id, reviewer_key, display_name, rating, comment)
  on public.recipe_reviews to authenticated;
revoke all on public.recipe_review_summaries from public, anon, authenticated;
grant select on public.recipe_review_summaries to authenticated;
