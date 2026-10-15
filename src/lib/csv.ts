import Papa from "papaparse";
import { FORMAT_LABELS, STATUS_LABELS } from "@/lib/types";
import type { BookFormat, BookStatus, BookWithRelations } from "@/lib/types";

export const IMPORT_FIELDS = [
  { key: "title", label: "Titre", required: true },
  { key: "author", label: "Auteur", required: false },
  { key: "genre", label: "Genre", required: false },
  { key: "isbn", label: "ISBN", required: false },
  { key: "publisher", label: "Éditeur", required: false },
  { key: "published_year", label: "Année", required: false },
  { key: "language", label: "Langue", required: false },
  { key: "page_count", label: "Pages", required: false },
  { key: "location", label: "Emplacement", required: false },
  { key: "notes", label: "Notes", required: false },
  { key: "cover_url", label: "URL de couverture", required: false },
] as const;

export type ImportFieldKey = (typeof IMPORT_FIELDS)[number]["key"];

export type ColumnMapping = Partial<Record<ImportFieldKey, string>>;

export interface ImportedBookRow {
  title: string;
  author: string | null;
  genre: string | null;
  isbn: string | null;
  publisher: string | null;
  published_year: number | null;
  language: string | null;
  page_count: number | null;
  location: string | null;
  notes: string | null;
  cover_url: string | null;
  format: BookFormat;
  status: BookStatus;
}

export function mapCsvRow(
  raw: Record<string, string>,
  mapping: ColumnMapping,
  defaults: { status: BookStatus; format: BookFormat },
): ImportedBookRow | null {
  const get = (key: ImportFieldKey): string => {
    const column = mapping[key];
    if (!column) return "";
    return (raw[column] ?? "").trim();
  };

  const title = get("title");
  if (!title) return null;

  const yearRaw = get("published_year");
  const pagesRaw = get("page_count");

  return {
    title,
    author: get("author") || null,
    genre: get("genre") || null,
    isbn: get("isbn") || null,
    publisher: get("publisher") || null,
    published_year: yearRaw ? Number(yearRaw.replace(/[^\d]/g, "")) || null : null,
    language: get("language") || null,
    page_count: pagesRaw ? Number(pagesRaw.replace(/[^\d]/g, "")) || null : null,
    location: get("location") || null,
    notes: get("notes") || null,
    cover_url: get("cover_url") || null,
    format: defaults.format,
    status: defaults.status,
  };
}

export function normalizeKey(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function isDuplicate(
  row: ImportedBookRow,
  existing: { isbnSet: Set<string>; titleAuthorSet: Set<string> },
): boolean {
  if (row.isbn && existing.isbnSet.has(normalizeKey(row.isbn))) return true;
  const key = `${normalizeKey(row.title)}::${normalizeKey(row.author)}`;
  return existing.titleAuthorSet.has(key);
}

// ── Export ────────────────────────────────────────────────────────────────
// Symétrique de IMPORT_FIELDS, mais couvre tous les champs d'un livre : cet
// export est strictement privé (l'utilisateur télécharge ses propres
// données), contrairement à la bibliothèque partagée publique qui masque
// notes/emplacement/prêts (voir CONTEXT.md).

export const EXPORT_FIELDS = [
  { key: "title", label: "Titre" },
  { key: "author", label: "Auteur" },
  { key: "genre", label: "Genre" },
  { key: "isbn", label: "ISBN" },
  { key: "publisher", label: "Éditeur" },
  { key: "published_year", label: "Année" },
  { key: "language", label: "Langue" },
  { key: "page_count", label: "Pages" },
  { key: "format", label: "Format" },
  { key: "status", label: "Statut" },
  { key: "rating", label: "Note" },
  { key: "notes", label: "Notes" },
  { key: "location", label: "Emplacement" },
  { key: "date_added", label: "Date d'ajout" },
  { key: "date_started", label: "Date de début" },
  { key: "date_finished", label: "Date de fin" },
  { key: "tags", label: "Tags" },
] as const;

/** Tronque un timestamp ISO ("2026-01-01T00:00:00Z") à sa partie date
 * ("2026-01-01"), sans toucher à une valeur déjà au format date. */
function dateOnly(value: string): string {
  return value.slice(0, 10);
}

/** Pure : transforme un livre (+ ses relations) en une ligne de colonnes
 * françaises, prête pour `Papa.unparse`. Aucun accès réseau ni DOM ici. */
export function bookToExportRow(book: BookWithRelations): Record<string, string> {
  return {
    Titre: book.title,
    Auteur: book.author ?? "",
    Genre: book.genre ?? "",
    ISBN: book.isbn ?? "",
    Éditeur: book.publisher ?? "",
    Année: book.published_year != null ? String(book.published_year) : "",
    Langue: book.language ?? "",
    Pages: book.page_count != null ? String(book.page_count) : "",
    Format: FORMAT_LABELS[book.format],
    Statut: STATUS_LABELS[book.status],
    Note: book.rating != null ? String(book.rating) : "",
    Notes: book.notes ?? "",
    Emplacement: book.location ?? "",
    "Date d'ajout": book.date_added ? dateOnly(book.date_added) : "",
    "Date de début": book.date_started ?? "",
    "Date de fin": book.date_finished ?? "",
    Tags: (book.tags ?? []).map((t) => t.name).join(", "),
  };
}

/** Pure : sérialise toute la bibliothèque en CSV (en-têtes français,
 * séparateur `,`). L'appelant se charge du téléchargement (Blob/URL côté
 * client — voir user-menu.tsx), ce module ne fait aucune I/O. */
export function booksToCsv(books: BookWithRelations[]): string {
  return Papa.unparse({
    fields: EXPORT_FIELDS.map((f) => f.label),
    data: books.map(bookToExportRow),
  });
}
