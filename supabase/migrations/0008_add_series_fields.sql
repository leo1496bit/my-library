-- Suivi des séries/sagas : pas de table dédiée, `series_name` est une
-- colonne texte libre sur `books`, au même niveau que `genre`/`author` (voir
-- CONTEXT.md — ni l'un ni l'autre n'est une entité séparée). `series_index`
-- porte le numéro de tome, utile pour trier une série dans l'ordre de
-- lecture (voir src/lib/data/series.ts).

alter table public.books
  add column if not exists series_name text,
  add column if not exists series_index integer;

-- `books_select_own`/`books_update_own` (0001_init.sql) filtrent par ligne
-- (`user_id = auth.uid()`) sans liste de colonnes explicite : les nouvelles
-- colonnes sont donc déjà couvertes, aucune policy à modifier.

-- get_shared_books / get_shared_book (0006/0007) renvoient en revanche une
-- liste de colonnes explicite — il faut les refaire pour exposer
-- series_name/series_index sur la bibliothèque partagée, par cohérence avec
-- genre/author déjà exposés (ni l'un ni l'autre n'est une donnée privée
-- comme notes/location, voir 0006_public_book_details_and_stats.sql).
-- Le type de retour change (nouvelles colonnes) : DROP avant de recréer,
-- même schéma que les migrations précédentes sur ces fonctions.

drop function if exists public.get_shared_books(uuid);

create function public.get_shared_books(owner_id uuid)
returns table (
  id uuid,
  user_id uuid,
  title text,
  author text,
  genre text,
  isbn text,
  cover_url text,
  publisher text,
  published_year integer,
  language text,
  page_count integer,
  format book_format,
  status book_status,
  rating smallint,
  google_books_id text,
  date_added timestamptz,
  date_started date,
  date_finished date,
  series_name text,
  series_index integer
)
security definer
set search_path = ''
language sql
stable
as $$
  select
    b.id, b.user_id, b.title, b.author, b.genre, b.isbn, b.cover_url,
    b.publisher, b.published_year, b.language, b.page_count, b.format,
    b.status, b.rating, b.google_books_id, b.date_added,
    b.date_started, b.date_finished, b.series_name, b.series_index
  from public.books b
  where b.user_id = owner_id
    and exists (
      select 1 from public.profiles p
      where p.id = b.user_id and p.sharing_enabled = true
    );
$$;

grant execute on function public.get_shared_books(uuid) to anon, authenticated;

drop function if exists public.get_shared_book(uuid, uuid);

create function public.get_shared_book(p_book_id uuid, p_owner_id uuid)
returns table (
  id uuid,
  user_id uuid,
  title text,
  author text,
  genre text,
  isbn text,
  cover_url text,
  publisher text,
  published_year integer,
  language text,
  page_count integer,
  format book_format,
  status book_status,
  rating smallint,
  google_books_id text,
  date_added timestamptz,
  date_started date,
  date_finished date,
  series_name text,
  series_index integer
)
security definer
set search_path = ''
language sql
stable
as $$
  select
    b.id, b.user_id, b.title, b.author, b.genre, b.isbn, b.cover_url,
    b.publisher, b.published_year, b.language, b.page_count, b.format,
    b.status, b.rating, b.google_books_id, b.date_added,
    b.date_started, b.date_finished, b.series_name, b.series_index
  from public.books b
  where b.id = p_book_id
    and b.user_id = p_owner_id
    and exists (
      select 1 from public.profiles p
      where p.id = b.user_id and p.sharing_enabled = true
    );
$$;

grant execute on function public.get_shared_book(uuid, uuid) to anon, authenticated;
