-- Permet d'exclure certains livres du partage public via un tag "Privé",
-- plutôt que le tout-ou-rien actuel (profiles.sharing_enabled). Un livre
-- portant ce tag (nom exact, sensible à la casse comme toute valeur de
-- `tags.name`) ne doit apparaître dans AUCUNE réponse publique — ni la
-- liste (get_shared_books), ni la fiche détail (get_shared_book), ni les
-- statistiques publiques (/u/[slug]/stats, qui se calculent côté client à
-- partir de get_shared_books : l'exclure ici suffit à les protéger aussi),
-- ni ses tags eux-mêmes (book_is_publicly_shared, qui gate la policy RLS
-- "book_tags_select_public_shared" lue en direct par public-book-detail.tsx
-- et public-library.tsx).
--
-- Implémentation : un filtre NOT EXISTS sur book_tags/tags ajouté à chaque
-- fonction SECURITY DEFINER existante qui décide de la visibilité publique
-- d'un livre. Pas de nouvelle colonne, pas de nouvelle policy RLS directe
-- sur books/profiles — même pattern que 0005/0006/0007 (colonnes
-- explicites, search_path = '', stable).

-- 1) get_shared_books : liste des livres d'une bibliothèque partagée.
--    Signature inchangée -> create or replace suffit (pas de drop requis).

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
    )
    and not exists (
      select 1 from public.book_tags bt
      join public.tags t on t.id = bt.tag_id
      where bt.book_id = b.id and t.name = 'Privé'
    );
$$;

-- 2) get_shared_book : fiche d'un seul livre, pour la page de détail
--    publique. Même filtre. Signature inchangée depuis 0007.

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
    )
    and not exists (
      select 1 from public.book_tags bt
      join public.tags t on t.id = bt.tag_id
      where bt.book_id = b.id and t.name = 'Privé'
    );
$$;

-- 3) book_is_publicly_shared : gate la policy RLS "book_tags_select_public_shared"
--    (0006), elle-même lue directement (sans passer par une fonction) par
--    public-book-detail.tsx et public-library.tsx pour récupérer les tags
--    d'un livre partagé. Sans ce correctif, les tags d'un livre "Privé"
--    (y compris la ligne book_tags portant le tag "Privé" lui-même)
--    resteraient lisibles via une requête REST directe sur /rest/v1/book_tags,
--    même si le livre a disparu de get_shared_books — une fuite dans le
--    même esprit que celle corrigée en 0004/0007 (le filtrage doit vivre au
--    niveau base de données consulté, pas seulement dans la réponse qu'on
--    choisit d'afficher côté client).

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
  ) and not exists (
    select 1 from public.book_tags bt
    join public.tags t on t.id = bt.tag_id
    where bt.book_id = p_book_id and t.name = 'Privé'
  );
$$;
