-- Corrige une fuite de vie privée dans le partage public (0003) :
-- la policy RLS ajoutée sur `books` s'appliquait à la table entière, donc
-- n'importe qui pouvait interroger /rest/v1/books directement avec la clé
-- publique et lire notes/location pour un profil partagé, en contournant
-- la vue `shared_library_books` censée les masquer. RLS est ligne par
-- ligne, pas colonne par colonne : une policy sur la table ne peut pas
-- cacher une colonne.
--
-- Correctif : la table `books` redevient strictement privée (aucune
-- policy publique dessus). Seule la vue, définie avec le rôle du
-- propriétaire (security_invoker = false, le défaut) et son propre filtre
-- de partage, sert de point d'accès public — elle contourne le RLS de
-- `books` en interne pour appliquer SA PROPRE restriction (ligne + colonne)
-- au lieu de dépendre d'une policy sur la table source.

drop policy if exists "books_select_public_shared" on public.books;

drop view if exists public.shared_library_books;
create view public.shared_library_books as
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
from public.books b
where exists (
  select 1 from public.profiles p
  where p.id = b.user_id and p.sharing_enabled = true
);

grant select on public.shared_library_books to anon, authenticated;
