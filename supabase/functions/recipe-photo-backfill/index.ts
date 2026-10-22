
import { createClient } from "npm:@supabase/supabase-js@2.55.0";
import { findRecipePhoto, hasCompleteRecipePhoto } from "./recipeImages.js";

const JOB_TOKEN = "rm-photo-job-8f62ca3dbe7e4dabb8c1765fa21d4e19";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  || (() => {
    try { return JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}").default; }
    catch { return ""; }
  })();
const client = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});
async function mapLimit<T, U>(items: T[], limit: number, fn: (item: T) => Promise<U>): Promise<U[]> {
  const output = new Array<U>(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      output[index] = await fn(items[index]);
    }
  }));
  return output;
}
Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "POST required" }, 405);
  if ((req.headers.get("x-photo-backfill-token") || "") !== JOB_TOKEN) return json({ error: "Unauthorized" }, 401);
  let limit = 10;
  try { const body = await req.json(); if (Number.isInteger(body?.limit)) limit = Math.max(1, Math.min(15, body.limit)); } catch {}
  const { data, error } = await client.from("recipes")
    .select("id,title,slug,category,ingredients,image_url,image_source_url,image_credit,image_license,image_search_status,image_search_attempted_at,is_published,published_at")
    .eq("source_name", "Rannar Menu সম্পাদকীয় সংগ্রহ")
    .eq("image_search_status", "pending")
    .order("title", { ascending: true }).limit(limit);
  if (error) return json({ error: "Could not load pending recipes", detail: error.message }, 500);
  const output = await mapLimit(data || [], 3, async (recipe) => {
    const attemptedAt = new Date().toISOString();
    try {
      const photo = hasCompleteRecipePhoto(recipe)
        ? { image_url: recipe.image_url, image_source_url: recipe.image_source_url, image_credit: recipe.image_credit, image_license: recipe.image_license, image_search_status: "matched", image_search_attempted_at: attemptedAt }
        : await findRecipePhoto(recipe, { timeoutMs: 6500 });
      const matched = !!(photo?.image_url && photo?.image_source_url && photo?.image_credit && photo?.image_license);
      const patch = matched
        ? { image_url: photo.image_url, image_source_url: photo.image_source_url, image_credit: photo.image_credit, image_license: photo.image_license, image_search_status: "matched", image_search_attempted_at: photo.image_search_attempted_at || attemptedAt, is_published: true, published_at: recipe.published_at || attemptedAt }
        : { image_url: null, image_source_url: null, image_credit: null, image_license: null, image_search_status: "not_found", image_search_attempted_at: attemptedAt, is_published: true, published_at: recipe.published_at || attemptedAt };
      const { error: updateError } = await client.from("recipes").update(patch).eq("id", recipe.id);
      if (updateError) return { title: recipe.title, slug: recipe.slug, status: "error", error: updateError.message };
      return { title: recipe.title, slug: recipe.slug, status: matched ? "matched" : "not_found", ...(matched ? { image_source_url: photo.image_source_url, image_license: photo.image_license } : {}) };
    } catch (e) {
      return { title: recipe.title, slug: recipe.slug, status: "pending", error: String(e?.message || e) };
    }
  });
  const { count: remaining, error: countError } = await client.from("recipes").select("id", { count: "exact", head: true })
    .eq("source_name", "Rannar Menu সম্পাদকীয় সংগ্রহ").eq("image_search_status", "pending");
  return json({ processed: output.length, matched: output.filter(x => x.status === "matched").length, not_found: output.filter(x => x.status === "not_found").length, errors: output.filter(x => x.status === "error" || x.status === "pending").length, remaining: countError ? null : remaining, results: output });
});
