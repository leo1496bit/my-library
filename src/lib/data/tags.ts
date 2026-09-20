// Accès aux données "Tag" (voir CONTEXT.md). Contrairement à books/loans,
// tag-editor.tsx parle encore directement à Supabase pour l'édition sur la
// fiche livre (pattern pré-existant, non touché ici) — ce module ne couvre
// que les opérations nécessaires à l'ajout rapide : lister tous les tags de
// l'utilisateur pour l'autosuggestion, et les associer à un livre qui vient
// d'être créé.

import { createClient } from "@/lib/supabase/client";
import type { Tag } from "@/lib/types";

export async function fetchAllTags(): Promise<Tag[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("tags").select("*").order("name");
  if (error) {
    console.error("Failed to fetch tags", error);
    throw new Error("Impossible de charger les tags.");
  }
  return data ?? [];
}

// Associe des tags existants (par id) et de nouveaux tags (par nom, créés à
// la volée) à un livre. Même schéma upsert que tag-editor.tsx (onConflict
// sur les contraintes uniques existantes) pour rester idempotent.
export async function attachTags(
  bookId: string,
  tagIds: string[],
  newTagNames: string[],
): Promise<void> {
  const supabase = createClient();

  let createdIds: string[] = [];
  if (newTagNames.length > 0) {
    const { data, error } = await supabase
      .from("tags")
      .upsert(
        newTagNames.map((name) => ({ name })),
        { onConflict: "user_id,name" },
      )
      .select("id");
    if (error) {
      console.error("Failed to create tags", error);
      throw new Error("Certains tags n'ont pas pu être créés.");
    }
    createdIds = (data ?? []).map((t) => t.id);
  }

  const allIds = [...tagIds, ...createdIds];
  if (allIds.length === 0) return;

  const { error } = await supabase.from("book_tags").upsert(
    allIds.map((tag_id) => ({ book_id: bookId, tag_id })),
    { onConflict: "book_id,tag_id" },
  );
  if (error) {
    console.error("Failed to attach tags to book", error);
    throw new Error("Les tags n'ont pas pu être associés au livre.");
  }
}
