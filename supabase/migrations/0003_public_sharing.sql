-- Partage public en lecture seule d'une bibliothèque, façon page auteur
-- IMDb : accessible sans compte, filtrable, jamais modifiable par un
-- visiteur. Un visiteur connecté à son propre compte peut en revanche
-- « suggérer » un livre consulté vers sa propre bibliothèque (insertion
-- classique via addBookAction, déjà scopée à auth.uid()).

-- ── profiles ─────────────────────────────────────────────────────────────
-- Une ligne par utilisateur, créée à la demande (à l'activation du
-- partage), jamais par un trigger sur auth.users.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  sharing_enabled boolean not null default false,
  share_slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_share_slug_idx on public.profiles (share_slug) where share_slug is not null;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- Un profil n'est lisible publiquement que si son propriétaire a
-- explicitement activé le partage — jamais par défaut.
drop policy if exists "profiles_select_public_shared" on public.profiles;
create policy "profiles_select_public_shared" on public.profiles
  for select using (sharing_enabled = true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ── Lecture publique de books / tags / book_tags ────────────────────────
-- Politiques additives (permissives) : elles s'ajoutent aux policies
-- « *_select_own » existantes sans les remplacer — un visiteur ne peut
-- lire que les lignes d'un propriétaire ayant sharing_enabled = true, et
-- ne gagne jamais de droit d'écriture (aucune policy insert/update/delete
-- n'est ajoutée ici).

drop policy if exists "books_select_public_shared" on public.books;
create policy "books_select_public_shared" on public.books
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = books.user_id and p.sharing_enabled = true
    )
  );

drop policy if exists "tags_select_public_shared" on public.tags;
create policy "tags_select_public_shared" on public.tags
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = tags.user_id and p.sharing_enabled = true
    )
  );

drop policy if exists "book_tags_select_public_shared" on public.book_tags;
create policy "book_tags_select_public_shared" on public.book_tags
  for select using (
    exists (
      select 1 from public.books b
      join public.profiles p on p.id = b.user_id
      where b.id = book_tags.book_id and p.sharing_enabled = true
    )
  );

-- ── Vue publique de books ────────────────────────────────────────────────
-- RLS est ligne par ligne, pas colonne par colonne : un visiteur avec la
-- clé publique pourrait techniquement demander toutes les colonnes de
-- `books` en appelant l'API REST directement. Cette vue liste explicitement
-- les colonnes sans risque à exposer et omet notes/location (vie privée).
-- security_invoker fait respecter les policies RLS de `books` avec le rôle
-- de l'appelant (donc toujours restreint aux profils partagés).

drop view if exists public.shared_library_books;
create view public.shared_library_books
with (security_invoker = true) as
select
  b.id,
  b.user_id,
  b.title,
  b.author,
  b.genre,
  b.isbn,
  b.cover_url,
  b.publisher,
  b.published_year,
  b.language,
  b.page_count,
  b.format,
  b.status,
  b.rating,
  b.google_books_id,
  b.date_added
from public.books b;

grant select on public.shared_library_books to anon, authenticated;
