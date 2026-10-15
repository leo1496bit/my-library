// Accès aux données "Quote" (carnet de citations, voir
// supabase/migrations/0010_add_quotes.sql) : le seul endroit qui construit
// les requêtes Supabase pour lire/écrire des citations. Même séparation
// I/O / reste de l'app que src/lib/data/loans.ts.
//
// Une citation est un contenu privé comme les Notes (voir CONTEXT.md,
// section Sharing) : ce module ne touche à aucune fonction/table publique,
// et il n'y a volontairement pas de fonction `fetchPublicQuotes` ou
// équivalent — les citations ne doivent jamais apparaître côté /u/[slug].

import { createClient } from "@/lib/supabase/client";
import { NotFoundError } from "@/lib/data/errors";
import type { Quote, QuoteInsert } from "@/lib/types";

export interface QuoteWithBook extends Quote {
  books: { id: string; title: string } | null;
}

/** Citations d'un livre donné, les plus récentes d'abord. */
export async function fetchQuotesForBook(bookId: string): Promise<Quote[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("book_id", bookId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("fetchQuotesForBook failed", { bookId, error });
    return [];
  }
  return (data ?? []) as Quote[];
}

/** Toutes les citations de l'utilisateur courant, toutes bibliothèques
 * confondues, avec le livre d'origine, les plus récentes d'abord — sert la
 * vue de parcours "Citations" (retrouver une citation sans se souvenir de
 * quel livre elle vient). */
export async function fetchAllQuotes(): Promise<QuoteWithBook[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("quotes")
    .select("*, books(id, title)")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("fetchAllQuotes failed", { error });
    return [];
  }
  return (data ?? []) as unknown as QuoteWithBook[];
}

/** Ajoute une citation à un livre. Lève une erreur en cas d'échec. */
export async function createQuote(quote: QuoteInsert): Promise<Quote> {
  const supabase = createClient();
  const { data, error } = await supabase.from("quotes").insert(quote).select().single();
  if (error || !data) {
    console.error("createQuote failed", { quote, error });
    throw new Error(error?.message || "Cette citation n'a pas pu être enregistrée.");
  }
  return data as Quote;
}

/** Supprime une citation. Lève un `NotFoundError` si aucune ligne n'a été
 * supprimée (id invalide ou bloqué par RLS — traité comme "déjà partie"),
 * ou une `Error` générique pour toute autre panne, même logique que
 * `deleteBook` (voir src/lib/data/books.ts). */
export async function deleteQuote(id: string): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase.from("quotes").delete().eq("id", id).select("id");
  if (error) {
    console.error("deleteQuote failed", { id, error });
    throw new Error(error.message);
  }
  if (!data || data.length === 0) {
    throw new NotFoundError("Cette citation est introuvable ou a déjà été supprimée.");
  }
}
