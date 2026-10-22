-- Allow anonymous readers to view visible reviews and aggregate ratings for published recipes.
-- Keep all anonymous write access revoked.
drop policy if exists "Public can read visible reviews for published recipes" on public.recipe_reviews;
create policy "Public can read visible reviews for published recipes"
  on public.recipe_reviews
  for select
  to anon
  using (
    is_visible = true
    and exists (
      select 1
      from public.recipes r
      where r.id = recipe_reviews.recipe_id
        and r.is_published = true
    )
  );

grant select (id, recipe_id, display_name, rating, comment, is_visible, created_at)
  on table public.recipe_reviews to anon;
grant select on table public.recipe_review_summaries to anon;
