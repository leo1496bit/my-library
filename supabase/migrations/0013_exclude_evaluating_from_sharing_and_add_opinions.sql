-- Suite de 0012 : cette migration est un fichier/déploiement séparé, donc
-- 'evaluating' (ajoutée à l'enum book_status dans 0012) peut y être utilisée
-- sans déclencher "unsafe use of new value".

-- 1) Exclusion du partage public : un livre "Sur la liste" (evaluating) est
--    une réflexion privée avant achat, jamais destinée à /u/[slug] — même
--    logique que le tag "Privé" (0009_private_tag_sharing_exclusion.sql) ou
--    les citations (0010_add_quotes.sql, qui n'apparaissent dans aucune
--    fonction publique). On repart de la version de get_shared_books /
--    get_shared_book définie en 0009 (qui inclut déjà series_name/
--    series_index de 0008 ET le filtre NOT EXISTS du tag "Privé"), en y
--    ajoutant un filtre sur le statut. Signatures inchangées -> create or
--    replace suffit (pas de drop requis).

create or replace function public.get_shared_books(owner_id uuid)
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
    and b.status <> 'evaluating'
    and exists (
      select 1 from public.profiles p
      where p.id = b.user_id and p.sharing_enabled = true
    )
    and not exists (
      select 1 from public.book_tags bt
      join public.tags t on t.id = bt.tag_id
      where bt.book_id = b.id and t.name = 'Privé'
    );
$$;

create or replace function public.get_shared_book(p_book_id uuid, p_owner_id uuid)
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
    and b.status <> 'evaluating'
    and exists (
      select 1 from public.profiles p
      where p.id = b.user_id and p.sharing_enabled = true
    )
    and not exists (
      select 1 from public.book_tags bt
      join public.tags t on t.id = bt.tag_id
      where bt.book_id = b.id and t.name = 'Privé'
    );
$$;

-- 2) book_opinions : avis sur un livre en réflexion avant achat ("Marie",
--    "Critique Babelio"... ou rien — `source` est facultatif), modelée
--    exactement sur `quotes` (0010_add_quotes.sql) : relation un-à-plusieurs
--    book -> opinions, vie privée identique (jamais exposée sur /u/[slug]),
--    donc aucune policy publique — seules les policies "own" ci-dessous.

create table if not exists public.book_opinions (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  source text,
  opinion_text text not null check (char_length(trim(opinion_text)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists book_opinions_book_id_idx on public.book_opinions (book_id);
create index if not exists book_opinions_user_id_idx on public.book_opinions (user_id);

alter table public.book_opinions enable row level security;

drop policy if exists "book_opinions_select_own" on public.book_opinions;
create policy "book_opinions_select_own" on public.book_opinions
  for select using (auth.uid() = user_id);

drop policy if exists "book_opinions_insert_own" on public.book_opinions;
create policy "book_opinions_insert_own" on public.book_opinions
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.books b where b.id = book_id and b.user_id = auth.uid())
  );

drop policy if exists "book_opinions_update_own" on public.book_opinions;
create policy "book_opinions_update_own" on public.book_opinions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "book_opinions_delete_own" on public.book_opinions;
create policy "book_opinions_delete_own" on public.book_opinions
  for delete using (auth.uid() = user_id);
