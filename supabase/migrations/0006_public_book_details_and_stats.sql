-- 1) Corrige book_tags_select_public_shared : sa condition EXISTS lisait
--    `public.books`, qui est redevenue strictement privée en 0004. Une
--    policy est du SQL normal, donc soumise au RLS des tables qu'elle
--    consulte — pour un visiteur anonyme, la sous-requête sur `books` ne
--    voyait plus aucune ligne, et la policy ne matchait donc plus jamais.
--    Passe par une fonction SECURITY DEFINER (même schéma que
--    get_shared_books) qui, elle, contourne volontairement ce RLS.

create or replace function public.book_is_publicly_shared(p_book_id uuid)
returns boolean
security definer
set search_path = ''
language sql
stable
as $$
  select exists (
    select 1 from public.books b
    join public.profiles p on p.id = b.user_id
    where b.id = p_book_id and p.sharing_enabled = true
  );
$$;

grant execute on function public.book_is_publicly_shared(uuid) to anon, authenticated;

drop policy if exists "book_tags_select_public_shared" on public.book_tags;
create policy "book_tags_select_public_shared" on public.book_tags
  for select using (public.book_is_publicly_shared(book_tags.book_id));

-- 2) get_shared_books : ajoute date_started/date_finished (nécessaires aux
--    statistiques publiques — rythme de lecture). Ni l'une ni l'autre ne
--    sont des données sensibles comme notes/location. Le type de retour
--    change (nouvelles colonnes) : il faut DROP avant de recréer.

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
  date_finished date
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
    b.date_started, b.date_finished
  from public.books b
  where b.user_id = owner_id
    and exists (
      select 1 from public.profiles p
      where p.id = b.user_id and p.sharing_enabled = true
    );
$$;

grant execute on function public.get_shared_books(uuid) to anon, authenticated;

-- 3) get_shared_book : fiche d'un seul livre, pour la page de détail
--    publique. Mêmes colonnes, mêmes restrictions.

drop function if exists public.get_shared_book(uuid);

create function public.get_shared_book(p_book_id uuid)
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
  date_finished date
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
    b.date_started, b.date_finished
  from public.books b
  where b.id = p_book_id
    and exists (
      select 1 from public.profiles p
      where p.id = b.user_id and p.sharing_enabled = true
    );
$$;

grant execute on function public.get_shared_book(uuid) to anon, authenticated;
