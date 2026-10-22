-- Public recipe ratings and comments. The browser may insert only bounded,
-- visible reviews for recipes that are already published. Reviews are immutable
-- through the public Data API; RLS and grants are both required.
create table public.recipe_reviews (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  reviewer_key uuid not null,
  display_name text not null check (char_length(btrim(display_name)) between 2 and 50),
  rating smallint not null check (rating between 1 and 5),
  comment text not null check (char_length(btrim(comment)) between 5 and 1200),
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  constraint recipe_reviews_one_per_browser unique (recipe_id, reviewer_key)
);

create index recipe_reviews_recipe_created_idx
  on public.recipe_reviews (recipe_id, created_at desc);

alter table public.recipe_reviews enable row level security;
revoke all on public.recipe_reviews from public, anon, authenticated;
grant select, insert on public.recipe_reviews to anon, authenticated;

create policy "Anyone can read visible reviews for published recipes"
  on public.recipe_reviews
  for select
  to anon, authenticated
  using (
    is_visible = true
    and exists (
      select 1
      from public.recipes r
      where r.id = recipe_reviews.recipe_id
        and r.is_published = true
    )
  );

create policy "Visitors can post reviews for published recipes"
  on public.recipe_reviews
  for insert
  to anon, authenticated
  with check (
    is_visible = true
    and char_length(btrim(display_name)) between 2 and 50
    and char_length(btrim(comment)) between 5 and 1200
    and exists (
      select 1
      from public.recipes r
      where r.id = recipe_reviews.recipe_id
        and r.is_published = true
    )
  );

create view public.recipe_review_summaries
with (security_invoker = true)
as
select
  recipe_id,
  count(*)::integer as review_count,
  round(avg(rating)::numeric, 2) as average_rating,
  count(*) filter (where rating = 1)::integer as one_star,
  count(*) filter (where rating = 2)::integer as two_star,
  count(*) filter (where rating = 3)::integer as three_star,
  count(*) filter (where rating = 4)::integer as four_star,
  count(*) filter (where rating = 5)::integer as five_star
from public.recipe_reviews
where is_visible = true
group by recipe_id;

revoke all on public.recipe_review_summaries from public, anon, authenticated;
grant select on public.recipe_review_summaries to anon, authenticated;
