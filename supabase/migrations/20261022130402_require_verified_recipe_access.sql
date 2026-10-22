-- Require verified customer identity for published recipe details.
-- Keep full access to all recipes for trusted owner/admin/editor accounts.
-- Previously, the broad authenticated SELECT policy allowed any signed-in
-- account to read published recipe rows before verifying email or phone.

drop policy if exists "Verified customers can read published recipe details"
  on public.recipes;

drop policy if exists "Authenticated users can read published recipes and admins can r"
  on public.recipes;

create policy "Verified customers and trusted members can read recipes"
on public.recipes
for select
to authenticated
using (
  (is_published = true and private.is_verified_customer())
  or exists (
    select 1
    from public.admin_users as a
    where a.user_id = (select auth.uid())
  )
);

-- Anonymous users receive only the explicitly granted preview columns.
-- This redundant policy is unnecessary; keep the preview-specific policy.
drop policy if exists "Public can read published recipes"
  on public.recipes;
