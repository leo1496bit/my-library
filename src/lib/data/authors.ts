// Regroupement des livres par auteur (voir CONTEXT.md — le champ `author`
// d'un Book est une chaîne éventuellement multi-auteurs, jointe par ", " au
// moment du Quick Add, voir src/lib/google-books.ts). Fonctions pures,
// aucun accès réseau : la donnée vient de fetchBooksWithRelations
// (src/lib/data/books.ts), déjà chargée par l'appelant.

import type { BookWithRelations } from "@/lib/types";

export interface AuthorEntry {
  name: string;
  books: BookWithRelations[];
}

function splitAuthors(author: string | null): string[] {
  if (!author) return [];
  return author
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

/** Un livre à plusieurs auteurs apparaît sous chacun d'eux. Tri alphabétique
 * (locale fr) sur le nom d'auteur. */
export function groupBooksByAuthor(books: BookWithRelations[]): AuthorEntry[] {
  const byName = new Map<string, BookWithRelations[]>();
  for (const book of books) {
    for (const name of splitAuthors(book.author)) {
      const list = byName.get(name) ?? [];
      list.push(book);
      byName.set(name, list);
    }
  }
  return [...byName.entries()]
    .map(([name, books]) => ({ name, books }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

/** Livres d'un auteur donné (correspondance exacte sur un des noms
 * découpés), les plus récemment ajoutés d'abord. */
export function booksByAuthor(books: BookWithRelations[], authorName: string): BookWithRelations[] {
  return books
    .filter((b) => splitAuthors(b.author).includes(authorName))
    .sort((a, b) => b.date_added.localeCompare(a.date_added));
}
