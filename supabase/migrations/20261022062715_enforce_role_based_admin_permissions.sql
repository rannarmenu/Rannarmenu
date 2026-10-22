-- Editors may create/update recipe content; only owners/admins may delete or bulk import.
drop policy if exists "Admins can create recipes" on public.recipes;
create policy "Trusted members can create recipes"
on public.recipes for insert to authenticated
with check (
  exists (
    select 1 from public.admin_users a
    where a.user_id = (select auth.uid())
      and a.role in ('owner', 'admin', 'editor')
  )
);

drop policy if exists "Admins can update recipes" on public.recipes;
create policy "Trusted members can update recipes"
on public.recipes for update to authenticated
using (
  exists (
    select 1 from public.admin_users a
    where a.user_id = (select auth.uid())
      and a.role in ('owner', 'admin', 'editor')
  )
)
with check (
  exists (
    select 1 from public.admin_users a
    where a.user_id = (select auth.uid())
      and a.role in ('owner', 'admin', 'editor')
  )
);

drop policy if exists "Admins can delete recipes" on public.recipes;
create policy "Owners and admins can delete recipes"
on public.recipes for delete to authenticated
using (
  exists (
    select 1 from public.admin_users a
    where a.user_id = (select auth.uid())
      and a.role in ('owner', 'admin')
  )
);

drop policy if exists "Admins can create recipe import batches" on public.recipe_import_batches;
create policy "Owners and admins can create recipe import batches"
on public.recipe_import_batches for insert to authenticated
with check (
  exists (
    select 1 from public.admin_users a
    where a.user_id = (select auth.uid())
      and a.role in ('owner', 'admin')
  )
);

drop policy if exists "Admins can update recipe import batches" on public.recipe_import_batches;
create policy "Owners and admins can update recipe import batches"
on public.recipe_import_batches for update to authenticated
using (
  exists (
    select 1 from public.admin_users a
    where a.user_id = (select auth.uid())
      and a.role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1 from public.admin_users a
    where a.user_id = (select auth.uid())
      and a.role in ('owner', 'admin')
  )
);
