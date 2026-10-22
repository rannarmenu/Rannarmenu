-- Store image source, creator/credit, and license so unverified photos are not shown as if they match a recipe.
alter table public.recipes
  add column if not exists image_source_url text,
  add column if not exists image_credit text,
  add column if not exists image_license text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'recipes_image_source_url_https_check'
      and conrelid = 'public.recipes'::regclass
  ) then
    alter table public.recipes
      add constraint recipes_image_source_url_https_check
      check (image_source_url is null or image_source_url = '' or image_source_url ~ '^https://');
  end if;
end $;

comment on column public.recipes.image_source_url is 'Source page for the displayed food photograph.';
comment on column public.recipes.image_credit is 'Required attribution for the displayed food photograph.';
comment on column public.recipes.image_license is 'Reuse license for the displayed food photograph.';
