# Rannar Menu

A responsive Bengali recipe website starter built with React, Vite, and Lucide icons.

## Current features
- Responsive homepage and recipe cards
- Bengali recipe search across titles, categories, descriptions, and ingredients
- Category filtering
- Recipe detail view with ingredients and steps
- Save/unsave recipes in in-memory UI state
- Mobile navigation
- Basic SEO metadata

## Run locally
Requires Node.js 20+.

```bash
npm install
npm run dev
```

## Important current limitations
- Recipes are starter sample content in `src/main.jsx`; this is not yet a connected database.
- Saved recipes currently reset when the page reloads.
- Recipe images are remote Unsplash URLs and need licensing/availability review before production.
- Admin authentication, database persistence, recipe import pipeline, automated tests, and deployment are not implemented yet.
- The 10,000-recipe goal requires an audited, licensed data source and import validation; no 10,000-item claim is made by this starter.

## Planned production architecture
- Frontend: React / Vite or Next.js
- Database/auth: Supabase PostgreSQL + Auth (admin-only write access)
- Importer: validated CSV/JSON/API pipeline with deduplication, provenance, retries, and import reports
- Hosting: Vercel or another suitable host
