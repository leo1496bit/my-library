-- Carnet de citations : une citation appartient à un seul livre (relation
-- un-à-plusieurs book -> quotes), contrairement à series_name/series_index
-- (0008) qui restent de simples colonnes sur `books` — ici il faut pouvoir
-- en avoir plusieurs par livre, donc une table dédiée plutôt qu'un champ.
--
-- Vie privée : une citation est un contenu personnel comme les Notes ou
-- l'Emplacement (voir CONTEXT.md, section Sharing) — jamais exposée sur la
-- bibliothèque partagée. Volontairement AUCUNE mention de `quotes` dans
-- get_shared_books/get_shared_book/book_is_publicly_shared : leur absence
-- est le comportement correct, pas un oubli. Pas de policy RLS publique non
-- plus (contrairement à book_tags, qui a une policy "..._select_public_shared"
-- pour la bibliothèque partagée) — seules les policies "own" ci-dessous.

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  quote_text text not null check (char_length(trim(quote_text)) > 0),
  page_number integer check (page_number is null or page_number >= 0),
  created_at timestamptz not null default now()
);

create index if not exists quotes_book_id_idx on public.quotes (book_id);
create index if not exists quotes_user_id_idx on public.quotes (user_id);

alter table public.quotes enable row level security;

drop policy if exists "quotes_select_own" on public.quotes;
create policy "quotes_select_own" on public.quotes
  for select using (auth.uid() = user_id);

drop policy if exists "quotes_insert_own" on public.quotes;
create policy "quotes_insert_own" on public.quotes
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.books b where b.id = book_id and b.user_id = auth.uid())
  );

drop policy if exists "quotes_update_own" on public.quotes;
create policy "quotes_update_own" on public.quotes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "quotes_delete_own" on public.quotes;
create policy "quotes_delete_own" on public.quotes
  for delete using (auth.uid() = user_id);
