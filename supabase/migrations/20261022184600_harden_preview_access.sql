-- Harden preview access using column grants and an invoker view.
-- Keep recipe instructions unavailable to anonymous callers at both the API and RLS layers.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_verified_customer()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select
    exists (
      select 1 from auth.users u
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
revoke all on function private.is_verified_customer() from public, anon;
grant execute on function private.is_verified_customer() to authenticated;
revoke all on function public.is_verified_customer() from public, anon, authenticated;

-- Caller-context execution means the REST API cannot inherit this view owner's rights.
create or replace view public.recipe_previews
with (security_barrier = true, security_invoker = true)
as
select
  r.id, r.slug, r.title, r.summary, r.category, r.cuisine,
  r.prep_minutes, r.cook_minutes, r.servings, r.difficulty,
  r.image_url, r.tags, r.source_name, r.source_url, r.source_license,
  r.source_attribution, r.created_at, r.published_at,
  r.image_source_url, r.image_credit, r.image_license
from public.recipes r
where r.is_published = true;
revoke all on public.recipe_previews from public, anon, authenticated;
grant select on public.recipe_previews to anon, authenticated;

-- Anonymous API clients get column-level access only to preview fields; row-level
-- security further restricts them to published records. SELECT * on recipes fails.
drop policy if exists "Public can read published recipe previews" on public.recipes;
create policy "Public can read published recipe previews"
on public.recipes for select to anon
using (is_published = true);
revoke select on public.recipes from anon;
grant select (
  id, slug, title, summary, category, cuisine,
  prep_minutes, cook_minutes, servings, difficulty,
  image_url, tags, source_name, source_url, source_license,
  source_attribution, created_at, published_at,
  image_source_url, image_credit, image_license, is_published
) on public.recipes to anon;

-- Public multilingual search only indexes fields intentionally visible in a preview.
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
security invoker
set search_path = ''
as $function$
  with candidates as (
    select
      r.*,
      pg_catalog.concat_ws(' ', r.title, r.slug, r.summary, r.category, r.cuisine,
        pg_catalog.array_to_string(r.tags, ' ')) as searchable_text
    from public.recipe_previews r
    where (p_category is null or r.category = p_category)
      and (not p_only_saved or (p_saved_ids is not null and r.id = any(p_saved_ids)))
  ),
  matching as (
    select c.* from candidates c
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
            or pg_catalog.to_tsvector('simple', c.searchable_text)
              @@ pg_catalog.websearch_to_tsquery('simple', candidate_term.term)
          )
      )
    )
  )
  select pg_catalog.to_jsonb(m) - 'searchable_text', pg_catalog.count(*) over ()
  from matching m
  order by m.published_at desc nulls last, m.created_at desc
  limit least(greatest(coalesce(p_limit, 24), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
$function$;
revoke all on function public.search_recipe_previews_multilingual(jsonb, text, uuid[], boolean, integer, integer) from public;
grant execute on function public.search_recipe_previews_multilingual(jsonb, text, uuid[], boolean, integer, integer) to anon, authenticated;

-- Verified customers retain ingredient/step-based search, but this invoker function
-- returns only preview fields. RLS on recipes still enforces verified access.
create or replace function public.search_verified_recipe_previews_multilingual(
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
security invoker
set search_path = ''
as $function$
  with candidates as (
    select
      r.id, r.slug, r.title, r.summary, r.category, r.cuisine,
      r.prep_minutes, r.cook_minutes, r.servings, r.difficulty,
      r.image_url, r.tags, r.source_name, r.source_url, r.source_license,
      r.source_attribution, r.created_at, r.published_at,
      r.image_source_url, r.image_credit, r.image_license,
      pg_catalog.concat_ws(' ', r.title, r.slug, r.summary, r.category, r.cuisine,
        pg_catalog.array_to_string(r.tags, ' '), r.ingredients::text, r.instructions::text) as searchable_text
    from public.recipes r
    where r.is_published = true
      and (p_category is null or r.category = p_category)
      and (not p_only_saved or (p_saved_ids is not null and r.id = any(p_saved_ids)))
  ),
  matching as (
    select c.* from candidates c
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
            or pg_catalog.to_tsvector('simple', c.searchable_text)
              @@ pg_catalog.websearch_to_tsquery('simple', candidate_term.term)
          )
      )
    )
  )
  select pg_catalog.to_jsonb(m) - 'searchable_text', pg_catalog.count(*) over ()
  from matching m
  order by m.published_at desc nulls last, m.created_at desc
  limit least(greatest(coalesce(p_limit, 24), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
$function$;
revoke all on function public.search_verified_recipe_previews_multilingual(jsonb, text, uuid[], boolean, integer, integer) from public, anon;
grant execute on function public.search_verified_recipe_previews_multilingual(jsonb, text, uuid[], boolean, integer, integer) to authenticated;

-- RLS helper functions used inside policies live outside PostgREST's public API schema.
drop policy if exists "Customers create their own verified profile" on public.customer_profiles;
create policy "Customers create their own verified profile"
on public.customer_profiles for insert to authenticated
with check (user_id = (select auth.uid()) and private.is_verified_customer());
drop policy if exists "Customers read their own verified profile" on public.customer_profiles;
create policy "Customers read their own verified profile"
on public.customer_profiles for select to authenticated
using (user_id = (select auth.uid()) and private.is_verified_customer());
drop policy if exists "Customers update their own verified profile" on public.customer_profiles;
create policy "Customers update their own verified profile"
on public.customer_profiles for update to authenticated
using (user_id = (select auth.uid()) and private.is_verified_customer())
with check (user_id = (select auth.uid()) and private.is_verified_customer());

drop policy if exists "Customers read their own saved recipes" on public.user_saved_recipes;
create policy "Customers read their own saved recipes"
on public.user_saved_recipes for select to authenticated
using (user_id = (select auth.uid()) and private.is_verified_customer());
drop policy if exists "Customers save recipes for themselves" on public.user_saved_recipes;
create policy "Customers save recipes for themselves"
on public.user_saved_recipes for insert to authenticated
with check (user_id = (select auth.uid()) and private.is_verified_customer());
drop policy if exists "Customers unsave their own recipes" on public.user_saved_recipes;
create policy "Customers unsave their own saved recipes"
on public.user_saved_recipes for delete to authenticated
using (user_id = (select auth.uid()) and private.is_verified_customer());

drop policy if exists "Verified customers can read published recipe details" on public.recipes;
create policy "Verified customers can read published recipe details"
on public.recipes for select to authenticated
using (is_published = true and private.is_verified_customer());

drop policy if exists "Customers read own profile avatars" on storage.objects;
create policy "Customers read own profile avatars"
on storage.objects for select to authenticated
using (bucket_id = 'customer-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text) and private.is_verified_customer());
drop policy if exists "Customers upload own profile avatars" on storage.objects;
create policy "Customers upload own profile avatars"
on storage.objects for insert to authenticated
with check (bucket_id = 'customer-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text) and private.is_verified_customer());
drop policy if exists "Customers update own profile avatars" on storage.objects;
create policy "Customers update own profile avatars"
on storage.objects for update to authenticated
using (bucket_id = 'customer-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text) and private.is_verified_customer())
with check (bucket_id = 'customer-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text) and private.is_verified_customer());
drop policy if exists "Customers delete own profile avatars" on storage.objects;
create policy "Customers delete own profile avatars"
on storage.objects for delete to authenticated
using (bucket_id = 'customer-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text) and private.is_verified_customer());

drop policy if exists "Verified customers read visible reviews" on public.recipe_reviews;
create policy "Verified customers read visible reviews"
on public.recipe_reviews for select to authenticated
using (
  is_visible = true
  and private.is_verified_customer()
  and exists (select 1 from public.recipes r where r.id = recipe_reviews.recipe_id and r.is_published = true)
);
drop policy if exists "Verified customers can post one review per recipe" on public.recipe_reviews;
create policy "Verified customers can post one review per recipe"
on public.recipe_reviews for insert to authenticated
with check (
  user_id = (select auth.uid())
  and private.is_verified_customer()
  and is_visible = true
  and char_length(btrim(display_name)) between 2 and 50
  and char_length(btrim(comment)) between 5 and 1200
  and exists (select 1 from public.recipes r where r.id = recipe_reviews.recipe_id and r.is_published = true)
);

-- Anonymous users cannot query full review records or unverified private data.
revoke all on public.recipe_reviews from public, anon;
revoke all on public.recipe_review_summaries from public, anon;
