alter table public.recipes drop column search_document;
alter table public.recipes add column search_document tsvector generated always as (
  setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(summary, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(category, '')), 'C') ||
  setweight(to_tsvector('simple', coalesce(ingredients::text, '')), 'D')
) stored;
create index recipes_search_document_idx on public.recipes using gin (search_document);
