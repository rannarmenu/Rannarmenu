# Mira AI setup

Mira's primary generative assistant runs on the Gemini API through the Supabase Edge Function `mira-chat`. See [Mira Gemini setup](./mira-gemini-setup.md) for the complete architecture, model, security controls, and troubleshooting.

Mira falls back to its local cooking knowledge rules and real recipe catalogue when the provider is unavailable. It no longer uses the ChatGPT/OpenAI API.

Important: store `GEMINI_API_KEY` in Supabase Edge Function Secrets. Never add it to GitHub, browser environment variables, the Android app, or messages. The user interface invokes the Supabase Edge Function; it never calls Google with a browser-visible key.

