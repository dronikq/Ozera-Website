-- Lake slug support
-- Creates/keeps a slug column, backfills existing rows, and keeps slug in sync
-- when the lake name changes.

alter table public.lakes
  add column if not exists slug text;

create unique index if not exists lakes_slug_unique_idx
  on public.lakes (slug)
  where slug is not null and slug <> '';

create or replace function public.generate_lake_slug(input_text text)
returns text
language plpgsql
immutable
as $$
declare
  normalized text;
begin
  normalized := lower(coalesce(input_text, ''));
  normalized := translate(
    normalized,
    'абвгґдеєжзиіїйклмнопрстуфхцчшщьюя',
    'abvggdeezziiiklmnoprstufhccssiuia'
  );
  normalized := regexp_replace(normalized, '[^a-z0-9]+', '-', 'g');
  normalized := regexp_replace(normalized, '-{2,}', '-', 'g');
  normalized := trim(both '-' from normalized);
  return coalesce(nullif(normalized, ''), 'lake');
end;
$$;

create or replace function public.update_lake_slug()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.slug is null or new.slug = '' then
      new.slug := public.generate_lake_slug(new.name);
    end if;
    return new;
  end if;

  if new.name is distinct from old.name then
    new.slug := public.generate_lake_slug(new.name);
  end if;

  return new;
end;
$$;

drop trigger if exists lakes_update_slug on public.lakes;

create trigger lakes_update_slug
before insert or update on public.lakes
for each row
execute function public.update_lake_slug();

update public.lakes
set slug = public.generate_lake_slug(name)
where slug is null or slug = '';
