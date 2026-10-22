# Mira AI setup

Mira has a server-side Supabase Edge Function at `supabase/functions/mira-chat/index.ts`. It uses the OpenAI Responses API without exposing the provider key to browser code.

## Enable full AI answers

The function is deployed, but full generative answers require an OpenAI API key. In the Supabase Dashboard:

1. Open the **rannarmenu** project.
2. Go to **Edge Functions → Secrets**.
3. Add `OPENAI_API_KEY` and paste an API key created in your OpenAI Platform account.
4. Optionally add `OPENAI_MODEL` with a model enabled for that API account. If omitted, Mira uses `gpt-5-mini`.
5. Save the secrets. Supabase Edge Functions can read them at runtime.

Never commit the key, add it to GitHub, or put it in any `VITE_*` browser variable. Do not send the key through chat or issue comments.

Supabase secrets guide: https://supabase.com/docs/guides/functions/secrets
OpenAI Responses API: https://platform.openai.com/docs/api-reference/responses

OpenAI API usage may incur charges under the API account's billing terms. Review pricing and usage limits before enabling public visitor access: https://platform.openai.com/pricing/

## Optional custom website domain

The function allows the GitHub Pages origin `https://rannarmenu.github.io` and local development origins. For another production origin, add `MIRA_ALLOWED_ORIGINS` in Edge Function Secrets, with a comma-separated list of exact origins, e.g. `https://example.com,https://www.example.com`.

## What the function does

- Receives up to 12 recent chat messages, with size limits.
- Sends a structured prompt to the Responses API with `store: false`.
- Returns a validated action: ordinary chat, website help, cooking help, clarification, or recipe search.
- For recipe search, the browser searches only Rannar Menu's published database entries and opens an actual matching recipe. The model cannot invent a database result or directly open a URL.
- The browser falls back to existing multilingual intent and recipe-search logic if the provider key is not configured or the API is temporarily unavailable.

The chat uses an external AI/translation service when available. Visitors should not enter passwords, financial details, or other private information into the widget.
