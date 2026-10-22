-- Restore only safe preview columns to anonymous readers after the table-level revoke.
revoke select on public.recipes from anon;
grant select (
  id, slug, title, summary, category, cuisine,
  prep_minutes, cook_minutes, servings, difficulty,
  image_url, tags, source_name, source_url, source_license,
  source_attribution, created_at, published_at,
  image_source_url, image_credit, image_license, is_published
) on public.recipes to anon;
