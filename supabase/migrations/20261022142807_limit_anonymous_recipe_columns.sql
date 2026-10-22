-- Limit anonymous recipe reads to fields required by the public site.
-- Revoke the broad table-level grant, then grant only public recipe content + metadata.
revoke select on table public.recipes from anon;
grant select (
  id, slug, title, summary, category, cuisine,
  ingredients, instructions,
  prep_minutes, cook_minutes, servings, difficulty,
  image_url, tags, source_name, source_url, source_license, source_attribution,
  created_at, published_at, image_source_url, image_credit, image_license,
  is_published
) on table public.recipes to anon;
