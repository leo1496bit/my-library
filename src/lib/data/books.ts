// Accès aux données "Book" (voir CONTEXT.md) : le seul endroit qui construit
// les requêtes Supabase pour lire/écrire des livres. Sépare volontairement
// la forme pure (shapeBooksWithRelations / shapeBookDetail — testable sans
// mock réseau) de l'I/O (fetch*), pour que la logique de jointure
// livres+prêts+tags ait un seam testable au lieu d'être soudée à un
// useEffect. Les pages ne parlent plus directement à Supabase pour ces
// opérations — book-list.tsx et book-detail.tsx partagent désormais la même
// implémentation plutôt que deux copies légèrement différentes.

import { createClient } from "@/lib/supabase/client";
import { NotFoundError } from "@/lib/data/errors";
import type { Book, BookWithRelations, Loan, Tag } from "@/lib/types";

interface BookTagRow {
  book_id: string;
  tags: Tag | null;
}

/** Pure : assemble livres + prêt actif + tags. Aucun accès réseau ici. */
export function shapeBooksWithRelations(
  books: Book[],
  activeLoans: Loan[],
  bookTagRows: BookTagRow[],
): BookWithRelations[] {
  const loanByBook = new Map(activeLoans.map((l) => [l.book_id, l]));
  const tagsByBook = new Map<string, Tag[]>();
  for (const row of bookTagRows) {
    if (!row.tags) continue;
    const list = tagsByBook.get(row.book_id) ?? [];
    list.push(row.tags);
    tagsByBook.set(row.book_id, list);
  }
  return books.map((b) => ({
    ...b,
    active_loan: loanByBook.get(b.id) ?? null,
    tags: tagsByBook.get(b.id) ?? [],
  }));
}

/** Bibliothèque complète de l'utilisateur courant, la plus récente d'abord. */
export async function fetchBooksWithRelations(): Promise<BookWithRelations[]> {
  const supabase = createClient();
  const [{ data: books }, { data: loans }, { data: bookTags }] = await Promise.all([
    supabase.from("books").select("*").order("date_added", { ascending: false }),
    supabase.from("loans").select("*").is("returned_at", null),
    supabase.from("book_tags").select("book_id, tags(*)"),
  ]);
  return shapeBooksWithRelations(
    (books ?? []) as Book[],
    (loans ?? []) as Loan[],
    (bookTags ?? []) as unknown as BookTagRow[],
  );
}

export interface BookDetailData {
  book: Book;
  loans: Loan[];
  tags: Tag[];
}

/** Pure : assemble un livre + tout son historique de prêts + ses tags. */
export function shapeBookDetail(
  book: Book,
  loans: Loan[],
  tagRows: { tags: Tag | null }[],
): BookDetailData {
  return {
    book,
    loans,
    tags: tagRows.map((r) => r.tags).filter((t): t is Tag => t !== null),
  };
}

/** Un livre avec son historique de prêts complet et ses tags, ou `null` si
 * introuvable/non autorisé (RLS). */
export async function fetchBookDetail(id: string): Promise<BookDetailData | null> {
  const supabase = createClient();
  const [{ data: book, error }, { data: loans }, { data: tagRows }] = await Promise.all([
    supabase.from("books").select("*").eq("id", id).single(),
    supabase.from("loans").select("*").eq("book_id", id).order("loan_date", { ascending: false }),
    supabase.from("book_tags").select("tags(*)").eq("book_id", id),
  ]);

  if (error || !book) {
    if (error) console.error("fetchBookDetail failed", { id, error });
    return null;
  }

  return shapeBookDetail(
    book as Book,
    (loans ?? []) as Loan[],
    (tagRows ?? []) as unknown as { tags: Tag | null }[],
  );
}

/** Met à jour un ou plusieurs champs d'un livre et renvoie la ligne à jour.
 * Lève une erreur en cas d'échec — à charge de l'appelant de revenir en
 * arrière sur une éventuelle mise à jour optimiste. */
export async function updateBook(id: string, patch: Partial<Book>): Promise<Book> {
  const supabase = createClient();
  const { data, error } = await supabase.from("books").update(patch).eq("id", id).select().single();
  if (error || !data) {
    console.error("updateBook failed", { id, patch, error });
    throw new Error(error?.message || "La modification n'a pas pu être enregistrée.");
  }
  return data as Book;
}

/** Supprime un livre. Lève un `NotFoundError` si aucune ligne n'a été
 * supprimée (id invalide ou bloqué par RLS — traité comme "déjà parti",
 * pas la peine de réessayer), ou une `Error` générique pour toute autre
 * panne (réseau, RLS refusé pour une autre raison...), où réessayer a du
 * sens. Sans la vérification du nombre de lignes, Supabase renvoie un
 * succès silencieux même à zéro ligne affectée (voir l'historique du bug
 * de suppression sur cette page). */
export async function deleteBook(id: string): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase.from("books").delete().eq("id", id).select("id");
  if (error) {
    console.error("deleteBook failed", { id, error });
    throw new Error(error.message);
  }
  if (!data || data.length === 0) {
    throw new NotFoundError("Ce livre est introuvable ou a déjà été supprimé.");
  }
}
