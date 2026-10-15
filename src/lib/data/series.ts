// Regroupement des livres par série/saga (voir CONTEXT.md et
// supabase/migrations/0008_add_series_fields.sql — `series_name` est une
// simple colonne texte sur `books`, comme `genre`/`author`, pas une entité
// séparée). Fonctions pures, aucun accès réseau : la donnée vient de
// fetchBooksWithRelations (src/lib/data/books.ts), déjà chargée par
// l'appelant.
//
// Contrairement à authors.ts, pas de fusion de graphies ici : une série est
// identifiée par le nom exact tel que saisi (pas de normalisation accents/
// casse), pour rester simple — un utilisateur qui tape deux fois des noms
// différents a juste deux séries distinctes.

import type { BookWithRelations } from "@/lib/types";

export interface SeriesEntry {
  name: string;
  books: BookWithRelations[];
}

/** Un livre sans `series_name` n'appartient à aucune série et est ignoré.
 * Tri alphabétique (locale fr) sur le nom de la série. */
export function groupBooksBySeries(books: BookWithRelations[]): SeriesEntry[] {
  const bySeriesName = new Map<string, BookWithRelations[]>();

  for (const book of books) {
    const name = book.series_name?.trim();
    if (!name) continue;
    const list = bySeriesName.get(name) ?? [];
    list.push(book);
    bySeriesName.set(name, list);
  }

  return [...bySeriesName.entries()]
    .map(([name, seriesBooks]) => ({ name, books: seriesBooks }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

/** Livres d'une série donnée, triés par `series_index` (numéro de tome) —
 * c'est tout l'intérêt de la vue Séries par rapport à la vue Auteurs : voir
 * l'ordre de lecture. Les livres sans `series_index` connu vont à la fin,
 * dans un ordre stable (celui de `books` en entrée) plutôt que d'être
 * mélangés entre eux par le tri. */
export function booksInSeries(books: BookWithRelations[], seriesName: string): BookWithRelations[] {
  const entry = groupBooksBySeries(books).find((e) => e.name === seriesName);
  if (!entry) return [];

  return entry.books
    .map((book, index) => ({ book, index }))
    .sort((a, b) => {
      const aIndex = a.book.series_index;
      const bIndex = b.book.series_index;
      if (aIndex == null && bIndex == null) return a.index - b.index;
      if (aIndex == null) return 1;
      if (bIndex == null) return -1;
      if (aIndex !== bIndex) return aIndex - bIndex;
      return a.index - b.index;
    })
    .map(({ book }) => book);
}
