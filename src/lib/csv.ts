import type { BookFormat, BookStatus } from "@/lib/types";

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
