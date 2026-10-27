// Client pour l'API Open Library — source de secours quand Google Books
// est indisponible. Google Books connaît des épisodes où il rejette une bonne
// partie des appels (503 "backendFailed") en rafales de plus d'une seconde,
// que les nouvelles tentatives ne suffisent pas à absorber. Open Library est
// gratuit, sans clé, et renvoie des résultats au même format que
// `GoogleBookResult` pour que l'UI n'ait pas à distinguer les deux sources.
//
// N'est appelé que côté serveur (route handlers), comme google-books.ts.

import type { GoogleBookResult } from "@/lib/google-books";

const OPEN_LIBRARY_SEARCH = "https://openlibrary.org/search.json";
const OPEN_LIBRARY_COVERS = "https://covers.openlibrary.org/b/id";

// Champs demandés explicitement : sans `fields`, l'API renvoie des documents
// bien plus lourds (toutes les éditions, tous les sujets...).
const FIELDS =
  "key,title,subtitle,author_name,first_publish_year,isbn,number_of_pages_median,cover_i";

// Open Library est lent : de 2 à 9 s mesurées le 2026-10-27. Acceptable
// pour une source de secours (mieux vaut attendre quelques secondes que de
// n'avoir aucun résultat) ; au-delà de 10 s, on renonce et l'utilisateur
// peut réessayer ou passer à l'ajout manuel.
const TIMEOUT_MS = 10_000;

export interface OpenLibraryDoc {
  key: string;
  title?: string;
  subtitle?: string;
  author_name?: string[];
  first_publish_year?: number;
  isbn?: string[];
  number_of_pages_median?: number;
  cover_i?: number;
}

// Un document Open Library regroupe toutes les éditions d'une œuvre, avec
// leurs ISBN mélangés. La bibliothèque étant en français, on préfère un
// ISBN-13 d'édition française (préfixe 978-2), puis n'importe quel ISBN-13,
// puis le premier ISBN venu.
export function pickIsbn(isbns: string[] | undefined): string | null {
  if (!isbns?.length) return null;
  return (
    isbns.find((i) => /^9782\d{9}$/.test(i)) ?? isbns.find((i) => /^\d{13}$/.test(i)) ?? isbns[0]
  );
}

export function mapOpenLibraryDoc(doc: OpenLibraryDoc): GoogleBookResult | null {
  if (!doc.title) return null;
  const isbn = pickIsbn(doc.isbn);

  return {
    // Préfixé pour ne jamais entrer en collision avec un identifiant Google
    // Books (sert de clé de liste et de dédoublonnage). N'est jamais stocké
    // dans `google_books_id` — voir `googleBooksIdOf`.
    googleBooksId: `ol:${doc.key}`,
    source: "openlibrary",
    title: doc.subtitle ? `${doc.title} : ${doc.subtitle}` : doc.title,
    author: doc.author_name?.join(", ") ?? null,
    // Les sujets Open Library sont trop bruités pour servir de genre (et de
    // base aux suggestions de tags) ; laissé vide plutôt que faux.
    genre: null,
    isbn,
    coverUrl: doc.cover_i ? `${OPEN_LIBRARY_COVERS}/${doc.cover_i}-M.jpg` : null,
    // L'éditeur varie d'une édition à l'autre et ne correspondrait pas
    // forcément à l'ISBN retenu ; laissé vide plutôt que faux.
    publisher: null,
    publishedYear: doc.first_publish_year ?? null,
    // Seule langue déductible sans ambiguïté : celle d'un ISBN français.
    language: isbn?.startsWith("9782") ? "fr" : null,
    pageCount: doc.number_of_pages_median ?? null,
    description: null,
  };
}

async function fetchDocs(params: URLSearchParams): Promise<GoogleBookResult[]> {
  params.set("fields", FIELDS);

  const res = await fetch(`${OPEN_LIBRARY_SEARCH}?${params.toString()}`, {
    // Open Library demande d'identifier l'application appelante.
    headers: { "User-Agent": "my-library (https://my-library-psi-one.vercel.app)" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    next: { revalidate: 60 * 60 },
  });

  if (!res.ok) {
    throw new Error(`Open Library a répondu ${res.status}`);
  }

  const data = (await res.json()) as { docs?: OpenLibraryDoc[] };
  return (data.docs ?? []).map(mapOpenLibraryDoc).filter((b): b is GoogleBookResult => b !== null);
}

export async function searchOpenLibraryByTitle(
  query: string,
  maxResults = 10,
): Promise<GoogleBookResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  return fetchDocs(
    new URLSearchParams({
      title: trimmed,
      limit: String(maxResults),
      // Affiche de préférence les titres des éditions françaises.
      lang: "fr",
    }),
  );
}

export async function searchOpenLibraryByIsbn(
  isbn: string,
  maxResults = 5,
): Promise<GoogleBookResult[]> {
  const normalized = isbn.replace(/[\s-]/g, "");
  if (!normalized) return [];

  return fetchDocs(new URLSearchParams({ isbn: normalized, limit: String(maxResults) }));
}
