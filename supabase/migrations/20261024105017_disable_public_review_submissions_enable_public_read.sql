-- Keep published ratings and comments publicly readable, but disable new submissions.
-- Only allow anonymous readers to select the fields rendered by the public reviews UI.
begin;

drop policy if exists "Verified customers can post one review per recipe" on public.recipe_reviews;
drop policy if exists "Visitors can post reviews for published recipes" on public.recipe_reviews;

revoke insert on table public.recipe_reviews from anon, authenticated;

grant select (id, recipe_id, display_name, rating, comment, created_at, is_visible)
  on table public.recipe_reviews to anon;
grant select (recipe_id, rating, is_visible)
  on table public.recipe_reviews to anon;
grant select on table public.recipe_review_summaries to anon;

-- The read policy checks that each review belongs to a published recipe.
-- Expose only the two fields needed by that policy, not recipe content.
grant select (id, is_published) on table public.recipes to anon;

commit;
