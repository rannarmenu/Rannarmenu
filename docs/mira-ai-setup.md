# Mira AI — local-only mode

Mira now runs its conversation logic in the browser using the repository's local rule-based brain:

- `src/lib/miraLanguage.js` classifies Bengali, Banglish and English intents.
- `src/lib/miraBrain.js` contains local cooking troubleshooting, measurements, food-safety guidance and starter recipes.
- `src/MiraChat.jsx` uses those local rules directly. It does not call Gemini, OpenAI, or any other model-provider endpoint.
- The Supabase Edge Function `mira-chat` has been replaced with an inert `410 LOCAL_ONLY` response and does not call an AI provider.

No AI provider API key or paid generative-model quota is needed for Mira's local answers.

## Important distinction

Searching the website's live published recipe catalogue still uses Supabase's application database API (`search_published_recipes_multilingual`). This is a catalogue/data lookup, not AI inference, and does not consume Gemini or OpenAI model quota. A live catalogue search requires an internet connection.

Mira is now a bounded rule-based assistant, not a general-purpose large language model. It answers supported questions, gives locally bundled starter recipes, and asks for clarification when it does not recognize a topic. More local rules and recipe guides can be added in source without adding an AI API.

## Clean up old secrets

If an earlier deployment left `GEMINI_API_KEY`, `GOOGLE_API_KEY`, or `GEMINI_MODEL` in Supabase Edge Function Secrets, those values are no longer used by Mira. They can be deleted in the Supabase Dashboard under **Edge Functions → Secrets**. Never copy a secret into GitHub or the browser.

## Deployment

The GitHub Pages workflow builds and deploys the site from the repository. The former `mira-chat` endpoint has also been redeployed in local-only disabled mode; its source is `supabase/functions/mira-chat/index.ts`.
