-- Prevent duplicate recipe names even if casing or repeated whitespace differs.
-- Variants remain allowed when their titles clearly name the cooking style.
CREATE UNIQUE INDEX IF NOT EXISTS recipes_title_normalized_unique_idx
ON public.recipes (
  lower(regexp_replace(trim(title), '\s+', ' ', 'g'))
);
COMMENT ON INDEX public.recipes_title_normalized_unique_idx IS
'Prevents exact duplicate recipe titles despite case or extra whitespace. Distinct cooking styles must use distinct descriptive titles.';
