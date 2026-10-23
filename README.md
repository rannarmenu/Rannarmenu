# Rannar Menu

A responsive Bengali recipe catalogue built with React, Vite, Supabase Auth/Postgres, and an administrator workspace.

## Features

- Bengali recipe catalogue with category filters and full-text search.
- Server-side pagination (24 recipes per page).
- Recipe details, ingredients and ordered cooking steps. Dish-matched photos are shown only when their source, creator and reuse license are recorded; otherwise the site displays a photo-unavailable placeholder.
- Interactive 3D cooking challenge at `public/rannar-cooking-game.html`, featuring a Three.js kitchen, touch/mouse camera orbit, ingredient picking, cooking stages, timer, scoring and local best-score storage.
- Supabase-backed published recipes.
- Customer sign-up/sign-in with email verification, Google OAuth entry point, phone SMS OTP entry point, password reset, and persistent profile records.
- Recipe ingredients and cooking instructions are protected by database policies and require a verified account; public catalogue/search only returns preview-safe recipe fields.
- Customer profile supports name and private profile photo; saved recipes sync to the signed-in account.
- Public review submission is restricted to verified accounts, with one review per account per recipe.
- Admin sign-up remains closed; content management is restricted to explicitly allow-listed owner/admin/editor accounts.
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

- `public.recipes`: recipe content, ingredients, steps and source/photo attribution. Anonymous access is restricted to column-level preview fields.
- `public.recipe_previews`: public allow-list for recipe catalogue/search results.
- `public.customer_profiles` and `public.user_saved_recipes`: owner-scoped customer information and saved-recipe IDs.
- `public.admin_users`: trusted accounts permitted to manage content.
- `public.recipe_import_batches`: import audit and error reports.

Anonymous visitors can read only safe preview fields. Verified customers can read published recipe details. Trusted owners/admins/editors may manage recipe content; only owners/admins may delete recipes or run bulk imports. Admin access requires an account explicitly listed in `public.admin_users`; public customers cannot self-assign admin privileges.

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

## Installable web app (PWA)

The site includes a Progressive Web App setup:

- `public/manifest.webmanifest` supplies the app name, launch URL, standalone display and current Rannar Menu SVG brand icon.
- `public/sw.js` caches the same-origin app shell and static assets for repeat visits and an offline fallback. Live Supabase recipe data and remote photos still require an internet connection.
- The app-install popup appears 10 seconds after a public page is opened. It is visible for up to 10 seconds, can be closed with ×, and a manual dismissal snoozes the popup for 7 days.
- Browsers that expose `beforeinstallprompt` can open their native installation confirmation from the popup. On iOS Safari and other browsers without that event, the popup shows the browser's manual “Add to Home Screen” / “Install app” steps.
- Service-worker registration is scoped to Vite's `BASE_URL`, so root deployments and the configured GitHub Pages subpath can both work.

Installation behavior depends on the browser, HTTPS hosting, manifest handling and its PWA support. Verify the production URL on Android Chrome and iOS Safari after deployment.

## Deploy to Vercel

Connect `rannarmenu/Rannarmenu` and configure these environment variables for Production, Preview and Development:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

`vercel.json` provides the `/admin` SPA route. A production build must pass before treating the site as ready.

## Mira Gemini assistant

Mira uses Gemini through a server-side Supabase Edge Function, with multi-turn conversation context, Bangla/Banglish understanding, general assistance, cooking troubleshooting, and validated actions for real recipe catalogue lookups. The Gemini API key stays in Supabase Edge Function Secrets and is not shipped to visitors. A tested local rule-based cooking brain and catalogue search remain as fallbacks when Gemini is unavailable. See [Mira Gemini setup](./docs/mira-gemini-setup.md) for secret names, model configuration, limits and verification steps.

## Current limitations

- Google login requires a Google OAuth client ID/secret in Supabase Auth; phone OTP requires an SMS provider and rate-limit/CAPTCHA configuration. The UI shows explicit provider errors until these external credentials are configured.
- Check the Supabase Auth Site URL and Redirect URL allow-list for the deployed GitHub Pages URL, and keep Email Confirmations enabled. Supabase Security Advisor currently flags leaked-password protection as disabled.
- A read-only audit of the live database on **22 October 2026** found 63 recipes in total, all 63 currently published. All 63 rows had `image_search_status = 'matched'` and complete image URL, source page, creator/credit, and license metadata. This verifies stored attribution fields, not a manual visual review of every image. The target of 10,000 recipes is **not yet met**.
- Reaching 10,000 requires authorized sources and editorial review. The importer blocks repeated normalized titles/slugs; distinct cooking styles should have clearly distinct descriptive titles. It is a pipeline, not a recipe source.
- Recipe photos are searched against Wikimedia Commons when an admin saves or imports recipes. The dashboard backfills records marked `pending`; entries marked `not_found` are not retried on every dashboard load. Only photos with a source URL, creator/credit, and reusable license are shown; otherwise the interface uses a placeholder rather than substituting a different dish.
- Browser import accepts up to 10,000 records per file and 25 MB. The importer searches up to the first 100 missing photos in a batch immediately and leaves additional records pending for dashboard backfill.
- Customer saved recipes are stored by account. Guest-only selections, before sign-in, remain in that browser.
- GitHub Actions runs `npm test` and `npm run build`. A dedicated automated cross-browser/end-to-end visual test suite is not configured yet.


## 3D Cooking Simulator Android App

The Cooking Simulator is **Android-app-only**. The public website route `/rannar-cooking-game.html` is a download landing page; it does not run the game in a browser. The standalone Android source lives in [`android-cooking-game/`](./android-cooking-game/).

Gameplay includes a real-time 3D kitchen, touch camera controls, ingredient selection and pickup, cutting-board actions, stove/pot/spoon interactions, cooking steam and flame effects, plating, a countdown timer and local best-score storage. The first playable build includes egg curry, chicken curry and vegetable khichuri recipes.

The app bundles the game HTML as a local Android asset and serves it through AndroidX WebViewAssetLoader; gameplay itself stays inside the app. Three.js `0.147.0` and OrbitControls are loaded from jsDelivr, so an internet connection is required for the 3D engine. Android WebView hardware acceleration and WebGL support are required.

GitHub Actions builds the standalone APK from `android-cooking-game/` and publishes the `Rannar-Menu-Cooking-Game.apk` release asset after a successful build. This repository change does **not** publish the game to Google Play automatically; a Play Store release still needs a signed release build, store listing and Google Play Console submission.

## Android app (APK)

An Android WebView app project is maintained in [`android-app/`](./android-app/). GitHub Actions builds a test APK when Android project files change. Open **Actions → Build Rannar Menu Android APK**, then download the `Rannar-Menu-Android-APK` artifact from a successful run. This debug APK is for direct testing, not a Play Store release.
