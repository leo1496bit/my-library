// Accès aux données "Opinion" (avis d'un livre en réflexion avant achat, voir
// supabase/migrations/0013_exclude_evaluating_from_sharing_and_add_opinions.sql) :
// le seul endroit qui construit les requêtes Supabase pour lire/écrire des
// avis. Même séparation I/O / reste de l'app que src/lib/data/quotes.ts,
// dont ce module reprend l'architecture.
//
// Un avis est un contenu privé comme les Notes ou les Citations (voir
// CONTEXT.md, section Sharing) : ce module ne touche à aucune fonction/table
// publique, et il n'y a volontairement pas de fonction `fetchPublicOpinions`
// ou équivalent — les avis ne doivent jamais apparaître côté /u/[slug].

import { createClient } from "@/lib/supabase/client";
import { NotFoundError } from "@/lib/data/errors";
import type { Opinion, OpinionInsert } from "@/lib/types";

/** Avis d'un livre donné, les plus récents d'abord. */
export async function fetchOpinionsForBook(bookId: string): Promise<Opinion[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("book_opinions")
    .select("*")
    .eq("book_id", bookId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("fetchOpinionsForBook failed", { bookId, error });
    return [];
  }
  return (data ?? []) as Opinion[];
}

/** Ajoute un avis à un livre. Lève une erreur en cas d'échec. */
export async function createOpinion(opinion: OpinionInsert): Promise<Opinion> {
  const supabase = createClient();
  const { data, error } = await supabase.from("book_opinions").insert(opinion).select().single();
  if (error || !data) {
    console.error("createOpinion failed", { opinion, error });
    throw new Error(error?.message || "Cet avis n'a pas pu être enregistré.");
  }
  return data as Opinion;
}

/** Supprime un avis. Lève un `NotFoundError` si aucune ligne n'a été
 * supprimée (id invalide ou bloqué par RLS — traité comme "déjà parti"),
 * ou une `Error` générique pour toute autre panne, même logique que
 * `deleteQuote` (voir src/lib/data/quotes.ts). */
export async function deleteOpinion(id: string): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase.from("book_opinions").delete().eq("id", id).select("id");
  if (error) {
    console.error("deleteOpinion failed", { id, error });
    throw new Error(error.message);
  }
  if (!data || data.length === 0) {
    throw new NotFoundError("Cet avis est introuvable ou a déjà été supprimé.");
  }
}
