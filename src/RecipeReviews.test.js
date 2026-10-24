import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const reviewSourcePromise = readFile(new URL('./RecipeReviews.jsx', import.meta.url), 'utf8');
const policyMigrationPromise = readFile(
  new URL('../supabase/migrations/20261024105017_disable_public_review_submissions_enable_public_read.sql', import.meta.url),
  'utf8'
);

test('public recipe reviews remain read-only in the UI', async () => {
  const source = await reviewSourcePromise;
  assert.doesNotMatch(source, /<form\b[^>]*review-form/);
  assert.doesNotMatch(source, /from\(['"]recipe_reviews['"]\)\.insert/);
  assert.match(source, /এই সংস্করণে নতুন রিভিউ জমা দেওয়া বন্ধ রাখা হয়েছে।/);
});

test('review database migration blocks client inserts without removing public reads', async () => {
  const sql = await policyMigrationPromise;
  assert.match(sql, /drop policy if exists "Verified customers can post one review per recipe"/i);
  assert.match(sql, /drop policy if exists "Visitors can post reviews for published recipes"/i);
  assert.match(sql, /revoke insert on table public\.recipe_reviews from anon, authenticated/i);
  assert.match(sql, /grant select on table public\.recipe_review_summaries to anon/i);
  assert.match(sql, /grant select \(id, recipe_id, display_name, rating, comment, created_at, is_visible\)/i);
});
