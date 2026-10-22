ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS image_source_url text,
  ADD COLUMN IF NOT EXISTS image_credit text,
  ADD COLUMN IF NOT EXISTS image_license text;

ALTER TABLE public.recipes
  DROP CONSTRAINT IF EXISTS recipes_image_source_url_https_check;
ALTER TABLE public.recipes
  ADD CONSTRAINT recipes_image_source_url_https_check
  CHECK (image_source_url IS NULL OR image_source_url = '' OR image_source_url ~ '^https://');

COMMENT ON COLUMN public.recipes.image_source_url IS 'Source page for the displayed food photograph.';
COMMENT ON COLUMN public.recipes.image_credit IS 'Required attribution for the displayed food photograph.';
COMMENT ON COLUMN public.recipes.image_license IS 'Reuse license for the displayed food photograph.';
