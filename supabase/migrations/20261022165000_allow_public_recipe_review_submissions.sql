-- Allow public visitors to submit bounded recipe reviews without creating an account.
-- Anonymous inserts cannot set user_id, visibility, or timestamps; database defaults and
-- RLS keep those fields under database control. Verified-account submissions remain supported.
drop policy if exists "Visitors can post reviews for published recipes" on public.recipe_reviews;

create policy "Visitors can post reviews for published recipes"
  on public.recipe_reviews
  for insert
  to anon, authenticated
  with check (
    user_id is null
    and reviewer_key is not null
    and is_visible = true
    and char_length(btrim(display_name)) between 2 and 50
    and rating between 1 and 5
    and char_length(btrim(comment)) between 5 and 1200
    and exists (
      select 1
      from public.recipes r
      where r.id = recipe_reviews.recipe_id
        and r.is_published = true
    )
  );

grant insert (recipe_id, reviewer_key, display_name, rating, comment)
  on table public.recipe_reviews to anon;
