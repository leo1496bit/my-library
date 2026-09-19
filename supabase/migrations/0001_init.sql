-- Bibliothèque personnelle — schéma initial
-- Tables : books, loans, tags, book_tags, reading_goals
-- Isolation stricte par utilisateur via Row Level Security (RLS).

create extension if not exists "pgcrypto";

-- ── Types énumérés ──────────────────────────────────────────────────────

do $$ begin
  create type book_status as enum ('to_buy', 'to_read', 'reading', 'finished', 'abandoned');
exception when duplicate_object then null; end $$;

do $$ begin
  create type book_format as enum ('physical', 'digital', 'audio');
exception when duplicate_object then null; end $$;

-- ── Fonction utilitaire : updated_at automatique ────────────────────────

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ── books ────────────────────────────────────────────────────────────────

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  author text,
  genre text,
  isbn text,
  cover_url text,
  publisher text,
  published_year integer,
  language text,
  page_count integer check (page_count is null or page_count >= 0),
  format book_format not null default 'physical',
  status book_status not null default 'to_read',
  rating smallint check (rating is null or (rating between 1 and 5)),
  notes text,
  location text,
  google_books_id text,
  date_added timestamptz not null default now(),
  date_started date,
  date_finished date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists books_user_id_idx on public.books (user_id);
create index if not exists books_user_status_idx on public.books (user_id, status);
create index if not exists books_user_isbn_idx on public.books (user_id, isbn);
create index if not exists books_user_author_idx on public.books (user_id, author);

drop trigger if exists set_books_updated_at on public.books;
create trigger set_books_updated_at
  before update on public.books
  for each row execute function public.set_updated_at();

alter table public.books enable row level security;

drop policy if exists "books_select_own" on public.books;
create policy "books_select_own" on public.books
  for select using (auth.uid() = user_id);

drop policy if exists "books_insert_own" on public.books;
create policy "books_insert_own" on public.books
  for insert with check (auth.uid() = user_id);

drop policy if exists "books_update_own" on public.books;
create policy "books_update_own" on public.books
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "books_delete_own" on public.books;
create policy "books_delete_own" on public.books
  for delete using (auth.uid() = user_id);

-- ── loans ────────────────────────────────────────────────────────────────

create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  borrower_name text not null check (char_length(trim(borrower_name)) > 0),
  loan_date date not null default current_date,
  expected_return_date date,
  returned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists loans_user_id_idx on public.loans (user_id);
create index if not exists loans_book_id_idx on public.loans (book_id);
create index if not exists loans_user_active_idx on public.loans (user_id, returned_at);

drop trigger if exists set_loans_updated_at on public.loans;
create trigger set_loans_updated_at
  before update on public.loans
  for each row execute function public.set_updated_at();

alter table public.loans enable row level security;

drop policy if exists "loans_select_own" on public.loans;
create policy "loans_select_own" on public.loans
  for select using (auth.uid() = user_id);

drop policy if exists "loans_insert_own" on public.loans;
create policy "loans_insert_own" on public.loans
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.books b where b.id = book_id and b.user_id = auth.uid())
  );

drop policy if exists "loans_update_own" on public.loans;
create policy "loans_update_own" on public.loans
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "loans_delete_own" on public.loans;
create policy "loans_delete_own" on public.loans
  for delete using (auth.uid() = user_id);

-- ── tags ─────────────────────────────────────────────────────────────────

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists tags_user_id_idx on public.tags (user_id);

alter table public.tags enable row level security;

drop policy if exists "tags_select_own" on public.tags;
create policy "tags_select_own" on public.tags
  for select using (auth.uid() = user_id);

drop policy if exists "tags_insert_own" on public.tags;
create policy "tags_insert_own" on public.tags
  for insert with check (auth.uid() = user_id);

drop policy if exists "tags_update_own" on public.tags;
create policy "tags_update_own" on public.tags
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "tags_delete_own" on public.tags;
create policy "tags_delete_own" on public.tags
  for delete using (auth.uid() = user_id);

-- ── book_tags (association many-to-many) ────────────────────────────────

create table if not exists public.book_tags (
  book_id uuid not null references public.books(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (book_id, tag_id)
);

create index if not exists book_tags_tag_id_idx on public.book_tags (tag_id);

alter table public.book_tags enable row level security;

drop policy if exists "book_tags_select_own" on public.book_tags;
create policy "book_tags_select_own" on public.book_tags
  for select using (
    exists (select 1 from public.books b where b.id = book_id and b.user_id = auth.uid())
  );

drop policy if exists "book_tags_insert_own" on public.book_tags;
create policy "book_tags_insert_own" on public.book_tags
  for insert with check (
    exists (select 1 from public.books b where b.id = book_id and b.user_id = auth.uid())
    and exists (select 1 from public.tags t where t.id = tag_id and t.user_id = auth.uid())
  );

drop policy if exists "book_tags_delete_own" on public.book_tags;
create policy "book_tags_delete_own" on public.book_tags
  for delete using (
    exists (select 1 from public.books b where b.id = book_id and b.user_id = auth.uid())
  );

-- ── reading_goals ────────────────────────────────────────────────────────

create table if not exists public.reading_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  year integer not null,
  target_books integer not null check (target_books > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, year)
);

drop trigger if exists set_reading_goals_updated_at on public.reading_goals;
create trigger set_reading_goals_updated_at
  before update on public.reading_goals
  for each row execute function public.set_updated_at();

alter table public.reading_goals enable row level security;

drop policy if exists "reading_goals_select_own" on public.reading_goals;
create policy "reading_goals_select_own" on public.reading_goals
  for select using (auth.uid() = user_id);

drop policy if exists "reading_goals_insert_own" on public.reading_goals;
create policy "reading_goals_insert_own" on public.reading_goals
  for insert with check (auth.uid() = user_id);

drop policy if exists "reading_goals_update_own" on public.reading_goals;
create policy "reading_goals_update_own" on public.reading_goals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "reading_goals_delete_own" on public.reading_goals;
create policy "reading_goals_delete_own" on public.reading_goals
  for delete using (auth.uid() = user_id);

-- ── Transitions de statut : renseigner date_started / date_finished ─────
-- Filet de sécurité côté base : si le client oublie de renseigner ces
-- dates lors d'un changement de statut, la base les déduit.

create or replace function public.handle_book_status_change()
returns trigger as $$
begin
  if new.status = 'reading' and old.status is distinct from 'reading' and new.date_started is null then
    new.date_started := current_date;
  end if;
  if new.status = 'finished' and old.status is distinct from 'finished' and new.date_finished is null then
    new.date_finished := current_date;
    if new.date_started is null then
      new.date_started := current_date;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists handle_books_status_change on public.books;
create trigger handle_books_status_change
  before update of status on public.books
  for each row execute function public.handle_book_status_change();
