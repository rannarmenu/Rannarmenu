# Mira Gemini setup and operations

Mira uses Gemini through the Supabase Edge Function `mira-chat`. The API key is kept server-side and is never included in the browser bundle, GitHub source, Android app, or chat transcript.

## Production secret

In the Supabase Dashboard, open the `rannarmenu` project, then **Edge Functions → Secrets**. Add or verify:

- Name: `GEMINI_API_KEY`
- Value: your Gemini API key from Google AI Studio

The function also supports `GOOGLE_API_KEY`, but prefer `GEMINI_API_KEY` so the configuration is explicit. Never add this value to a `VITE_*` variable or commit it to GitHub. Supabase makes new function secrets available without a redeploy.

Google's current API key guidance requires restricted standard keys or authorization keys; unrestricted standard keys may be rejected. Confirm that the key is permitted to call the Gemini API for the intended Google Cloud project.

## Model selection

The Edge Function defaults to `gemini-3.8-flash`, a current stable model chosen for strong conversational quality and responsive everyday use. Set the optional server-side secret `GEMINI_MODEL` to another model that the Gemini API key can access. Do not set a browser-side model key.

## What has been implemented

- Server-side call to Google's official Gemini `models.generateContent` REST endpoint using the `x-goog-api-key` header.
- Multi-turn conversation context (up to 12 short messages) with size limits.
- System instructions for Bangla, Banglish, English, colloquial phrasing, typo tolerance, short follow-ups, general help, cooking troubleshooting, and real catalogue recipe lookup.
- Constrained JSON output with a validated action schema. Only the website code can search and open actual published recipes.
- Explicit provider error handling for missing configuration, rejected keys, quota/rate limits, unavailable models, invalid responses and connection failures.
- If the primary Gemini model returns a provider-reported temporary `503 UNAVAILABLE`, the server retries using stable `gemini-3.6-flash`. If that fallback model also returns a temporary 503, it is retried once after a short pause. Invalid-key, quota, and malformed-request failures are not retried; the client falls back to local cooking rules and catalogue search if Gemini still fails. The UI discloses the fallback.
- Request size limits, origin allow-list, publishable-key validation, short timeout, and rate limiting. Logs contain safe error categories rather than API keys or user conversation text.

## Deploy and verify

The GitHub Pages workflow builds and deploys the browser UI. The Edge Function must also be deployed to the active Supabase project; the repository source file alone does not update the live server.

A safe health check is available at `GET https://fiwqeivmieckzqglfrar.supabase.co/functions/v1/mira-chat`. It reports only the provider name, selected model and whether a key-shaped secret is configured; it never returns the key or makes a billable Gemini request. This verifies presence, not key validity. A successful chat turn is still needed to prove the key has permission/quota for the model.

- Gemini generateContent API: https://ai.google.dev/api/generate-content
- Gemini API key security: https://ai.google.dev/gemini-api/docs/api-key
- Gemini model catalogue: https://ai.google.dev/gemini-api/docs/models
- Supabase Edge Function secrets: https://supabase.com/docs/guides/functions/secrets

## Limitations

Gemini improves general-language understanding but cannot literally know everything or guarantee every answer is correct. It has no live browsing tool in this Mira configuration. Recent facts may need verification. The app uses the model to suggest intent and text; recipe cards and recipe-opening actions still come only from the real Rannar Menu database. Recipe catalogue search requires a live Supabase connection.
