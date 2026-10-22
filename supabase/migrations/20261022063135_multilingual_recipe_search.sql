-- Multilingual and cross-script recipe search.
-- Exact text remains searchable in any script stored in recipe content. Curated
-- aliases supplied by the client bridge common dish names and transliterations.
create extension if not exists unaccent with schema extensions;

create or replace function public.search_published_recipes_multilingual(
  p_search_groups jsonb default '[]'::jsonb,
  p_category text default null,
  p_saved_ids uuid[] default null,
  p_only_saved boolean default false,
  p_limit integer default 24,
  p_offset integer default 0
)
returns table (recipe jsonb, total_count bigint)
language sql
stable
security invoker
set search_path = ''
as $function$
  with candidates as (
    select
      r.*,
      pg_catalog.concat_ws(
        ' ',
        r.title,
        r.slug,
        r.summary,
        r.category,
        r.cuisine,
        r.ingredients::text,
        r.instructions::text,
        pg_catalog.array_to_string(r.tags, ' ')
      ) as searchable_text
    from public.recipes as r
    where r.is_published = true
      and (p_category is null or r.category = p_category)
      and (
        not p_only_saved
        or (p_saved_ids is not null and r.id = any(p_saved_ids))
      )
  ),
  matching as (
    select c.*
    from candidates as c
    where not exists (
      select 1
      from pg_catalog.jsonb_array_elements(
        case
          when pg_catalog.jsonb_typeof(p_search_groups) = 'array'
            then p_search_groups
          else '[]'::jsonb
        end
      ) as search_group(group_terms)
      where not exists (
        select 1
        from pg_catalog.jsonb_array_elements_text(
          case
            when pg_catalog.jsonb_typeof(search_group.group_terms) = 'array'
              then search_group.group_terms
            else '[]'::jsonb
          end
        ) as candidate_term(term)
        where pg_catalog.btrim(candidate_term.term) <> ''
          and (
            pg_catalog.strpos(
              extensions.unaccent(pg_catalog.lower(normalize(c.searchable_text, NFKC))),
              extensions.unaccent(pg_catalog.lower(normalize(candidate_term.term, NFKC)))
            ) > 0
            or c.search_document @@ pg_catalog.websearch_to_tsquery('simple', candidate_term.term)
          )
      )
    )
  )
  select
    pg_catalog.to_jsonb(m) - 'searchable_text' as recipe,
    pg_catalog.count(*) over () as total_count
  from matching as m
  order by m.published_at desc nulls last, m.created_at desc
  limit least(greatest(coalesce(p_limit, 24), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
$function$;

revoke all on function public.search_published_recipes_multilingual(jsonb, text, uuid[], boolean, integer, integer) from public, anon, authenticated;
grant execute on function public.search_published_recipes_multilingual(jsonb, text, uuid[], boolean, integer, integer) to anon, authenticated;
