alter table public.recipes
  add column if not exists image_search_status text not null default 'pending',
  add column if not exists image_search_attempted_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'recipes_image_search_status_check'
      and conrelid = 'public.recipes'::regclass
  ) then
    alter table public.recipes
      add constraint recipes_image_search_status_check
      check (image_search_status in ('pending', 'matched', 'not_found', 'manual'));
  end if;
end $$;

update public.recipes
set image_search_status = case
  when image_url is not null and btrim(image_url) <> ''
    and image_source_url is not null and btrim(image_source_url) <> ''
    and image_credit is not null and btrim(image_credit) <> ''
    and image_license is not null and btrim(image_license) <> ''
  then 'matched'
  else 'pending'
end;

comment on column public.recipes.image_search_status is 'Status of automatic or manual recipe photo matching.';
comment on column public.recipes.image_search_attempted_at is 'Timestamp of the most recent completed automatic photo lookup.';
