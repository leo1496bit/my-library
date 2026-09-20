-- Corrige deux fuites trouvées en revue de code sur feature/public-sharing :
--
-- 1) profiles_select_public_shared (0003) autorisait la lecture de TOUT
--    profil avec sharing_enabled = true, sans filtre par share_slug. Un
--    visiteur anonyme pouvait donc énumérer /rest/v1/profiles?select=
--    display_name,share_slug&sharing_enabled=eq.true et obtenir la liste
--    complète des liens partagés de l'application — alors que le design
--    voulu est un lien "non listé" (voir le commentaire de generateSlug()
--    dans sharing-settings.tsx), découvrable uniquement par quelqu'un qui
--    le possède déjà, jamais par énumération.
--
--    Correctif : `profiles` redevient strictement privée (comme `books` en
--    0004), avec une fonction SECURITY DEFINER dédiée qui ne renvoie
--    qu'UN SEUL profil correspondant à un slug connu à l'avance.
--
-- 2) get_shared_book(p_book_id) (0006) ne vérifiait que le partage du
--    propriétaire réel du livre, pas que ce livre appartient bien au
--    profil résolu depuis le slug de l'URL visitée. N'importe quel livre
--    d'un utilisateur B partagé était donc accessible via l'URL d'un
--    utilisateur A partagé (/u/A/books/<id-de-B>), du moment que B avait
--    aussi le partage activé.
--
--    Correctif : ajoute p_owner_id, obligatoire, et vérifie
--    b.user_id = p_owner_id en plus de b.id = p_book_id.

drop policy if exists "profiles_select_public_shared" on public.profiles;

create or replace function public.get_public_profile_by_slug(p_slug text)
returns table (
  id uuid,
  display_name text,
  sharing_enabled boolean,
  share_slug text
)
security definer
set search_path = ''
language sql
stable
as $$
  select p.id, p.display_name, p.sharing_enabled, p.share_slug
  from public.profiles p
  where p.share_slug = p_slug and p.sharing_enabled = true;
$$;

grant execute on function public.get_public_profile_by_slug(text) to anon, authenticated;

drop function if exists public.get_shared_book(uuid);

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
    and b.user_id = p_owner_id
    and exists (
      select 1 from public.profiles p
      where p.id = b.user_id and p.sharing_enabled = true
    );
$$;

grant execute on function public.get_shared_book(uuid, uuid) to anon, authenticated;
