import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ALLOWED_ORIGIN = "https://rannarmenu.github.io";

Deno.serve((req: Request) => {
  const origin = req.headers.get("origin") || "";
  const corsHeaders = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Vary": "Origin",
  });

  if (origin === ALLOWED_ORIGIN) {
    corsHeaders.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    corsHeaders.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    corsHeaders.set("Access-Control-Allow-Headers", "authorization, apikey, x-client-info, content-type");
    corsHeaders.set("Access-Control-Max-Age", "600");
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Deliberately disabled: Mira's chat is now handled by its local browser brain.
  // This endpoint must never call Gemini, OpenAI, or another model provider.
  return new Response(JSON.stringify({
    ok: false,
    code: "LOCAL_ONLY",
    message: "Mira runs in local-only mode. No AI-provider API is configured or called."
  }), { status: 410, headers: corsHeaders });
});
