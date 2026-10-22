import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Compatibility endpoint for older Rannar Menu clients.
// Mira's answers are rule-based and local-first; this function never calls an
// external generative model and never reads an OPENAI_API_KEY.
const BASE_ALLOWED_ORIGINS = new Set([
  "https://rannarmenu.github.io",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);
const MAX_BODY_BYTES = 16_000;
const MAX_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 1_400;
const MAX_TOTAL_CHARS = 8_000;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 12;
const rates = new Map<string, { count: number; resetAt: number }>();

type ChatMessage = { role: "user" | "assistant"; content: string };
type MiraAction = "chat" | "recipe_search" | "ask_clarification" | "website_help" | "cooking_help";

function jsonResponse(body: Record<string, unknown>, status: number, origin: string | null, allowOrigin = false) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Vary": "Origin",
  });
  if (allowOrigin && origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "authorization, apikey, x-client-info, content-type");
    headers.set("Access-Control-Max-Age", "600");
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function allowedOrigins(): Set<string> {
  const values = new Set(BASE_ALLOWED_ORIGINS);
  for (const origin of (Deno.env.get("MIRA_ALLOWED_ORIGINS") || "").split(",").map((x) => x.trim()).filter(Boolean)) {
    values.add(origin);
  }
  return values;
}

function validClientKey(req: Request): boolean {
  const known = new Set<string>();
  for (const name of ["SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ANON_KEY"]) {
    const value = Deno.env.get(name);
    if (value) known.add(value);
  }
  const raw = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        for (const value of Object.values(parsed)) if (typeof value === "string" && value) known.add(value);
      }
    } catch { /* Ignore malformed optional key map. */ }
  }
  const apiKey = req.headers.get("apikey") || "";
  const bearer = (req.headers.get("authorization") || "").replace(/^Bearer\\s+/i, "");
  return Boolean(known.size && ((apiKey && known.has(apiKey)) || (bearer && known.has(bearer))));
}

function consumeRateLimit(req: Request): boolean {
  const forwarded = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const ip = forwarded.split(",")[0].trim().slice(0, 80);
  const now = Date.now();
  const current = rates.get(ip);
  if (!current || current.resetAt <= now) {
    rates.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (current.count >= RATE_LIMIT) return false;
  current.count += 1;
  if (rates.size > 2_000) {
    for (const [key, value] of rates) if (value.resetAt <= now) rates.delete(key);
  }
  return true;
}

function validateMessages(input: unknown): ChatMessage[] | null {
  if (!Array.isArray(input) || !input.length) return null;
  const result: ChatMessage[] = [];
  let total = 0;
  for (const item of input.slice(-MAX_MESSAGES)) {
    if (!item || typeof item !== "object") return null;
    const candidate = item as Record<string, unknown>;
    if (candidate.role !== "user" && candidate.role !== "assistant") return null;
    if (typeof candidate.content !== "string") return null;
    const content = candidate.content.trim();
    if (!content || content.length > MAX_MESSAGE_CHARS) return null;
    total += content.length;
    if (total > MAX_TOTAL_CHARS) return null;
    result.push({ role: candidate.role, content });
  }
  return result[result.length - 1]?.role === "user" ? result : null;
}

function cleanQuery(text: string): string {
  return text
    .replace(/^(please\\s+)?(find|show|open|give|tell me|i want|i need|can i get|recipe for|recipe of|রেসিপি দাও|রেসিপি চাই|খুঁজে দাও|আমাকে|একটা|একটি|রান্না করতে চাই|রেসিপি|রান্না)\\s*/iu, "")
    .replace(/[!?.,।]+$/u, "")
    .trim()
    .slice(0, 240);
}

function localAnswer(input: string): { action: MiraAction; reply: string; search_query: string } {
  const text = input.toLowerCase().replace(/\\s+/g, " ").trim();

  if (/(jhol patla|too watery|watery curry|ঝোল পাতলা)/u.test(text)) {
    return { action: "cooking_help", reply: "ঝোল পাতলা হলে ঢাকনা খুলে মাঝারি আঁচে কিছুক্ষণ ফুটাও, যাতে বাড়তি পানি উবে যায়। চাইলে অল্প পেঁয়াজ-মসলা কষিয়ে মেশাও। মাংস বা মাছ অতিরিক্ত সেদ্ধ হচ্ছে কি না খেয়াল রেখো।", search_query: "" };
  }
  if (/(lobon beshi|nun beshi|too salty|লবণ বেশি|নুন বেশি)/u.test(text)) {
    return { action: "cooking_help", reply: "লবণ বেশি হলে ডিশ অনুযায়ী অল্প গরম পানি/লবণহীন ঝোল বা বাড়তি সেদ্ধ ডাল-সবজি মেশাও। অল্প অল্প করে যোগ করে স্বাদ দেখো। ঝোল পাতলা হলে শেষে ঢাকনা খুলে কিছুক্ষণ ফুটিয়ে নাও।", search_query: "" };
  }
  if (/(jhal beshi|morich beshi|too spicy|ঝাল বেশি|মরিচ বেশি)/u.test(text)) {
    return { action: "cooking_help", reply: "ঝাল বেশি হলে অল্প দই, দুধ/নারকেলের দুধ অথবা লবণহীন ঝোল/সবজি মেশাতে পারো। ডিশ অনুযায়ী একটি বেছে নিয়ে অল্প করে দাও, তারপর স্বাদ দেখো।", search_query: "" };
  }
  if (/(pure geche|puriye geche|jole geche|burnt|burned|পুড়ে গেছে|পুড়ে গেছে|জ্বলে গেছে)/u.test(text)) {
    return { action: "cooking_help", reply: "আগে চুলা বন্ধ করো। ওপরের না-পোড়া অংশটি ঘষাঘষি না করে অন্য পাত্রে তুলে নাও; তলায় লেগে থাকা পোড়া অংশ মেশাবে না। খুব বেশি পুড়ে গেলে পোড়া গন্ধ পুরোপুরি দূর নাও হতে পারে।", search_query: "" };
  }
  if (/(kacha thake|chicken kacha|kacha chicken|not cooked|undercooked|মুরগি কাঁচা|কাঁচা থাকে|সেদ্ধ হয় না|সেদ্ধ হয় না)/u.test(text)) {
    return { action: "cooking_help", reply: "ভেতরে কাঁচা থাকলে অল্প গরম পানি দিয়ে ঢেকে কম-মাঝারি আঁচে আরও রান্না করো। মুরগির মোটা অংশে ভেতরের তাপমাত্রা ৭৪°C (১৬৫°F) হওয়া সবচেয়ে নিরাপদ—শুধু বাইরের রং দেখে সিদ্ধান্ত নিও না।", search_query: "" };
  }
  if (/(biryani|khichuri|rice|chal|bhaat|ভাত|বিরিয়ানি|বিরিয়ানি|খিচুড়ি|খিচুড়ি)/u.test(text) && /(sticky|mushy|lepe|jhorjhore|ঝরঝরে|আঠালো|নরম হয়ে গেছে|নরম হয়ে গেছে)/u.test(text)) {
    return { action: "cooking_help", reply: "চাল ঝরঝরে রাখতে চালের ধরন অনুযায়ী পানি মাপো এবং বারবার নেড়ো না। ভাত ইতিমধ্যে বেশি নরম হলে আর পানি দিও না; ঢাকনা খুলে খুব কম আঁচে কিছুক্ষণ রাখো।", search_query: "" };
  }
  if (/(website|web site|site e|ওয়েবসাইট|ওয়েবসাইট|সাইট).*(help|problem|কীভাবে|কোথায়|কোথায়|সমস্যা|ব্যবহার)/u.test(text)) {
    return { action: "website_help", reply: "হোমপেজের সার্চ বারে খাবারের নাম লিখে খুঁজে দেখো। ক্যাটাগরি থেকে খাবারের ধরন বেছে নিতে পারো; রেসিপির কার্ড খুললে উপকরণ ও রান্নার ধাপ পাওয়া যাবে। কোন জায়গায় আটকে গেছ বললে নির্দিষ্টভাবে বুঝিয়ে দেব।", search_query: "" };
  }
  if (/(1 cup|এক কাপ|cup.*ml|কত ml|কত মিলি|tablespoon|tbsp)/u.test(text)) {
    return { action: "cooking_help", reply: "সাধারণ measuring cup প্রায় ২৪০ মিলিলিটার; ১ টেবিল-চামচ = ১৫ মিলিলিটার, ১ চা-চামচ = ৫ মিলিলিটার। একই রান্নায় একই মাপের কাপ/চামচ ব্যবহার করো।", search_query: "" };
  }
  if (/(who are you|your name|তুমি কে|তোমার নাম|আমি কে)/u.test(text)) {
    return { action: "chat", reply: "আমি Mira*—Rannar Menu-র নিজস্ব রান্নাঘর-সহকারী। রেসিপি খোঁজা, রান্নার সমস্যা, মাপ ও সময় বুঝিয়ে দিতে সাহায্য করি।", search_query: "" };
  }
  if (/(what can you do|how can you help|তুমি কী করতে পার|কি সাহায্য|কী সাহায্য|কি কি পারো)/u.test(text)) {
    return { action: "chat", reply: "আমি রেসিপি খুঁজতে, রান্নার সাধারণ সমস্যা সমাধান করতে, উপকরণের মাপ/সময় বুঝিয়ে দিতে এবং সাইট ব্যবহার শেখাতে পারি। নতুন তথ্য বা জটিল বিষয় সম্পর্কে আমার স্থানীয় জ্ঞান সীমিত হতে পারে।", search_query: "" };
  }
  if (/(^|\\s)(hi|hello|hey|সালাম|আসসালামু আলাইকুম|হাই|হ্যালো)(\\s|$)/u.test(text)) {
    return { action: "chat", reply: "আসসালামু আলাইকুম! 🌼 আমি Mira*—আজ কী রান্না বা রেসিপি নিয়ে সাহায্য লাগবে?", search_query: "" };
  }

  const wantsRecipe = /(recipe|রেসিপি|ranna|রান্না|খুঁজে দাও|খুঁজে দেখ|find me|show me|open the recipe|খাবার বানাতে চাই)/u.test(text);
  if (wantsRecipe) {
    const query = cleanQuery(input);
    if (query) return { action: "recipe_search", reply: "তোমার বলা খাবারটি Rannar Menu-র প্রকাশিত রেসিপিতে খুঁজে দেখছি। 🍲", search_query: query };
    return { action: "ask_clarification", reply: "কোন খাবারের রেসিপি চাই? নামটা লিখে দাও।", search_query: "" };
  }

  return {
    action: "chat",
    reply: "আমি Mira*—Rannar Menu-র নিজস্ব রান্নাঘর-সহকারী। 🌼 রান্নার সমস্যা, মাপ, সময়, পরিচিত রেসিপি আর ওয়েবসাইট ব্যবহারে সাহায্য করি। প্রশ্নটা একটু নির্দিষ্ট করে বলো; কোনো বিষয়ে নিশ্চিত না হলে সেটা স্পষ্ট করে বলব।",
    search_query: "",
  };
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const originIsAllowed = Boolean(origin && allowedOrigins().has(origin));

  if (req.method === "OPTIONS") {
    if (!originIsAllowed) return jsonResponse({ ok: false, code: "ORIGIN_NOT_ALLOWED" }, 403, origin);
    return jsonResponse({ ok: true }, 200, origin, true);
  }
  if (req.method !== "POST") return jsonResponse({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405, origin, originIsAllowed);
  if (!originIsAllowed) return jsonResponse({ ok: false, code: "ORIGIN_NOT_ALLOWED" }, 403, origin);
  if (!validClientKey(req)) return jsonResponse({ ok: false, code: "INVALID_CLIENT" }, 401, origin, true);
  if (!consumeRateLimit(req)) return jsonResponse({ ok: false, code: "RATE_LIMITED" }, 429, origin, true);

  const contentLength = Number(req.headers.get("content-length") || "0");
  if (contentLength > MAX_BODY_BYTES) return jsonResponse({ ok: false, code: "REQUEST_TOO_LARGE" }, 413, origin, true);

  let body: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) return jsonResponse({ ok: false, code: "REQUEST_TOO_LARGE" }, 413, origin, true);
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return jsonResponse({ ok: false, code: "INVALID_REQUEST" }, 400, origin, true);
    body = parsed as Record<string, unknown>;
  } catch {
    return jsonResponse({ ok: false, code: "INVALID_JSON" }, 400, origin, true);
  }

  const messages = validateMessages(body.messages);
  if (!messages) return jsonResponse({ ok: false, code: "INVALID_MESSAGES" }, 400, origin, true);
  const current = messages[messages.length - 1].content.slice(0, 1_400);
  return jsonResponse({ ok: true, configured: true, ...localAnswer(current) }, 200, origin, true);
});
