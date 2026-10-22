# Mira local brain

Mira now uses a purpose-built local rule engine instead of the ChatGPT/OpenAI API. **No OpenAI API key, paid LLM account, or generative-AI secret is required.**

## What Mira can do without an AI provider

- Understand common Bengali and Banglish recipe requests using intent and spelling rules.
- Diagnose common kitchen problems such as thin curry, excess salt or spice, burnt food, undercooked chicken, and sticky rice.
- Answer practical kitchen questions about standard measuring units, basic cooking times, and safe food handling.
- Provide built-in starter guides for egg curry, masoor dal, chicken curry, and khichuri when the published catalogue does not have a match.
- Search only Rannar Menu's real published recipe catalogue before offering a catalogue recipe. Mira does not invent a database match.
- Give honest, specific follow-up prompts when a request is not covered by its local knowledge rules.

## Architecture

- src/lib/miraBrain.js contains the local cooking knowledge rules and starter guides.
- src/lib/miraLanguage.js classifies common Bengali/Banglish intents and troubleshooting phrases.
- src/MiraChat.jsx runs the local brain in the browser. It does not invoke a generative AI endpoint or use a third-party machine-translation service for chat answers.
- Recipe-card search still requires the configured Supabase database and an internet connection. The AI brain itself does not require an external model.
- supabase/functions/mira-chat/index.ts is a backward-compatible rule-based endpoint for older clients. It no longer calls an external model or reads OPENAI_API_KEY. The current chat UI does not depend on this function.

## Important limitation

This is a specialized, deterministic cooking assistant, not a new foundation language model. It can work independently of ChatGPT, but it cannot answer every open-ended question with ChatGPT-level breadth. Add and test explicit rules or reviewed cooking guides to expand its capabilities. It should not pretend to know an answer when a matching rule is absent.

## Security and deployment

- Do not add OPENAI_API_KEY to Supabase or browser environment variables for Mira; it is no longer used.
- The compatibility Edge Function keeps origin checks, publishable-key checks, request limits, and rate limiting. Redeploy it through the normal Supabase deployment workflow if you want the remote function source to match this repository for older clients.
- The website uses Supabase only for recipe data and other existing site features. Recipe search still depends on the database being available.

## Test

Run the existing test suite and production build:

```
npm test
npm run build
```
