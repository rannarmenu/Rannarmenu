# Mira AI setup

Mira has a server-side Supabase Edge Function at `supabase/functions/mira-chat/index.ts`. It uses the OpenAI Responses API without exposing the provider key to browser code.

## Enable full AI answers

The function is deployed, but full generative answers require an OpenAI API key. In the Supabase Dashboard:

1. Open the **rannarmenu** project.
2. Go to **Edge Functions → Secrets**.
3. Add `OPENAI_API_KEY` and paste an API key created in your OpenAI Platform account.
4. Optionally add `OPENAI_MODEL` with a model enabled for that API account. If omitted, Mira uses `gpt-5.1` with medium reasoning effort for more considered answers.
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
- When the AI provider is unavailable, the browser keeps local recipe/catalogue handling available and now shows an actionable message for missing secrets, rejected keys, unavailable models, or rate/usage limits instead of silently pretending a generic fallback is an AI answer.

The chat uses an external AI/translation service when available. Visitors should not enter passwords, financial details, or other private information into the widget.

## Diagnosing API errors

A provider 429 can mean a temporary request/token rate limit or a credit, billing, spend, or usage limit. Mira now distinguishes billing/usage errors from temporary rate-limit errors when the API returns a recognizable code. Check usage and limits before retrying repeatedly:

- OpenAI API usage: https://platform.openai.com/usage
- OpenAI billing: https://platform.openai.com/settings/organization/billing/overview
- OpenAI rate-limit troubleshooting: https://help.openai.com/en/articles/5955604-troubleshooting-api-rate-limits-and-429-errors

Do not paste the API key into chat or share it in screenshots. If the key was ever exposed publicly, revoke it and create a replacement.