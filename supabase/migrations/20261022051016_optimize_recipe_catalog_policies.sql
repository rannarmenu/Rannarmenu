drop policy "Published recipes are public" on public.recipes;
drop policy "Admins can read every recipe" on public.recipes;

create policy "Public can read published recipes"
on public.recipes for select to anon
using (is_published = true);

create policy "Authenticated users can read published recipes and admins can read all"
on public.recipes for select to authenticated
using (
  is_published = true
  or exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()))
);

create index if not exists recipes_created_by_idx on public.recipes(created_by);
create index if not exists recipes_updated_by_idx on public.recipes(updated_by);
create index if not exists recipe_import_batches_created_by_idx on public.recipe_import_batches(created_by);
