# Mira local-only migration

This file is retained so existing links do not become broken. The previous Gemini integration is disabled.

Mira no longer calls Gemini or another generative AI provider. The frontend uses `src/lib/miraLanguage.js` and `src/lib/miraBrain.js` for deterministic, locally bundled responses. The Supabase Edge Function `mira-chat` now returns `410 LOCAL_ONLY` and never makes a provider request.

Do not add a `GEMINI_API_KEY`, `GOOGLE_API_KEY`, OpenAI key, or other model-provider key for Mira. Previous secrets, if present, are unused and may be deleted from **Supabase Dashboard → Edge Functions → Secrets**.

The website still calls Supabase to search the live published recipe catalogue. This is normal application data access, not an AI-model request. Recipe search needs an internet connection; locally bundled Mira cooking guides do not.

## Behaviour and limitations

- Runs local intent detection and response rules for supported Bengali, Banglish and English cooking questions.
- Includes local cooking troubleshooting, measurements, food-safety guidance and starter recipes.
- Can search real published recipes when the Supabase catalogue is reachable.
- Does not offer unrestricted, ChatGPT-level open-ended generation or live web research; unknown topics should receive a clarification or an honest fallback.

The current no-provider CI workflow runs unit tests, a production build, and a static check for model-provider calls. It sends no prompt to an external AI service.
