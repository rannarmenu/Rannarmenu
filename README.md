# Rannar Menu

A responsive Bengali recipe catalogue built with React, Vite, Supabase Auth/Postgres, and an administrator workspace.

## Features

- Bengali recipe catalogue with category filters and full-text search.
- Server-side pagination (24 recipes per page).
- Recipe details, ingredients and ordered cooking steps. Dish-matched photos are shown only when their source, creator and reuse license are recorded; otherwise the site displays a photo-unavailable placeholder.
- Supabase-backed published recipes.
- Admin sign-in with Supabase Auth; public sign-up is not provided.
- Role-scoped recipe management: owners/admins can delete and bulk import; editors can create and edit recipes.
- Browser CSV/JSON import, validation, duplicate-slug handling, 100-row batches and import history.
- Database migrations with Row Level Security (RLS), least-privilege grants and explicit admin allow-list.

## Run locally

Requires Node.js 20.19+.

```bash
npm install
cp .env.example .env
# Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev
```

Only the publishable key belongs in browser variables. **Never** put `SUPABASE_SECRET_KEY`, `service_role`, passwords, or other secrets in `VITE_*` variables or GitHub.

## Database setup

The migration files in `supabase/migrations/` mirror the migrations applied to the connected Supabase project. They create:

- `public.recipes`: recipe content, ingredients, steps, recipe-source attribution, and photo source/credit/license metadata.
- `public.admin_users`: trusted accounts permitted to manage content.
- `public.recipe_import_batches`: import audit and error reports.

RLS allows public visitors to read published recipes. Trusted owners/admins/editors may create or edit recipes; only owners/admins may delete recipes or run bulk imports. Access requires a signed-in account explicitly listed in `public.admin_users`. The app deliberately has no self-service admin signup/role escalation.

### Provision the first admin

1. In Supabase Dashboard → Authentication → Users, create the trusted user.
2. Copy its UUID and run this in SQL Editor:

```sql
insert into public.admin_users (user_id, role)
values ('YOUR-AUTH-USER-UUID', 'owner')
on conflict (user_id) do nothing;
```

Then visit `/admin` and sign in. Never give admin access to an untrusted account.

## CSV / JSON import

Use `data/recipe-import-template.csv`, `data/recipe-import-template.json`, or download `/recipe-import-template.csv` from the site. The required fields are `title`, `ingredients`, and `instructions`. Lists can be JSON arrays, newline-separated text, semicolon-separated text, or (for steps) pipe-separated text.

Add `source_url`, `source_license`, and `source_attribution` when importing content from other sources. Start with drafts and review rights, accuracy, dietary claims, and image rights before publishing.

The browser importer accepts up to 10,000 records per file and 25 MB. The trusted local CLI accepts CSV/JSON up to 50 MB and 10,000 records per run:

```bash
# Add to a local ignored .env file, never commit:
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SECRET_KEY=sb_secret_... # server-only
npm run import:recipes -- data/recipes.csv --source "My licensed collection"
# After review only, optionally add --publish or --update-existing
```

The CLI secret can bypass RLS, so run it only on a trusted machine. It is not needed for the browser importer.

## Deploy to Vercel

Connect `rannarmenu/Rannarmenu` and configure these environment variables for Production, Preview and Development:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

`vercel.json` provides the `/admin` SPA route. A production build must pass before treating the site as ready.

## Current limitations

- A read-only audit of the live database on **22 October 2026** found 63 recipes in total, all 63 currently published. All 63 rows had `image_search_status = 'matched'` and complete image URL, source page, creator/credit, and license metadata. This verifies stored attribution fields, not a manual visual review of every image. The target of 10,000 recipes is **not yet met**.
- Reaching 10,000 requires authorized sources and editorial review. The importer blocks repeated normalized titles/slugs; distinct cooking styles should have clearly distinct descriptive titles. It is a pipeline, not a recipe source.
- Recipe photos are searched against Wikimedia Commons when an admin saves or imports recipes. The dashboard backfills records marked `pending`; entries marked `not_found` are not retried on every dashboard load. Only photos with a source URL, creator/credit, and reusable license are shown; otherwise the interface uses a placeholder rather than substituting a different dish.
- Browser import accepts up to 10,000 records per file and 25 MB. The importer searches up to the first 100 missing photos in a batch immediately and leaves additional records pending for dashboard backfill.
- Favorites remain in this browser and are not synced to accounts.
- GitHub Actions runs `npm test` and `npm run build`. A dedicated automated cross-browser/end-to-end visual test suite is not configured yet.
