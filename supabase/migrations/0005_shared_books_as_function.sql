-- Remplace la vue `shared_library_books` (bypass RLS via security definer
-- implicite des vues) par une fonction SECURITY DEFINER explicite : même
-- filtrage ligne + colonne, mais ne déclenche pas l'avertissement
-- "Security Definer View" du linter Supabase (0010_security_definer_view),
-- qui ne s'applique qu'aux vues. Le search_path est figé comme pour les
-- autres fonctions du projet (voir 0002_harden_function_search_path.sql).

drop view if exists public.shared_library_books;

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
  date_added timestamptz
)
security definer
set search_path = ''
language sql
stable
as $$
  select
    b.id, b.user_id, b.title, b.author, b.genre, b.isbn, b.cover_url,
    b.publisher, b.published_year, b.language, b.page_count, b.format,
    b.status, b.rating, b.google_books_id, b.date_added
  from public.books b
  where b.user_id = owner_id
    and exists (
      select 1 from public.profiles p
      where p.id = b.user_id and p.sharing_enabled = true
    );
$$;

grant execute on function public.get_shared_books(uuid) to anon, authenticated;
