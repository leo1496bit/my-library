import {
  BOOK_FORMATS,
  BOOK_STATUSES,
  FORMAT_LABELS,
  STATUS_LABELS,
  type BookFormat,
  type BookStatus,
} from "@/lib/types";

// Sous-ensemble structurel utilisé par ces calculs — satisfait aussi bien
// par `Book` (bibliothèque privée) que par `SharedBook` (partage public),
// sans dépendre de champs privés (notes, location…).
export interface StatsSourceBook {
  status: BookStatus;
  format: BookFormat;
  author: string | null;
  genre: string | null;
  page_count: number | null;
  date_finished: string | null;
}

export interface CountEntry {
  key: string;
  label: string;
  count: number;
}

export function countByStatus(books: StatsSourceBook[]): CountEntry[] {
  return BOOK_STATUSES.map((status) => ({
    key: status,
    label: STATUS_LABELS[status],
    count: books.filter((b) => b.status === status).length,
  }));
}

export function countByFormat(books: StatsSourceBook[]): CountEntry[] {
  return BOOK_FORMATS.map((format) => ({
    key: format,
    label: FORMAT_LABELS[format],
    count: books.filter((b) => b.format === format).length,
  }));
}

function topBy(books: StatsSourceBook[], field: "author" | "genre", limit: number): CountEntry[] {
  const counts = new Map<string, number>();
  for (const book of books) {
    const raw = book[field];
    if (!raw) continue;
    const value = field === "author" ? raw.split(",")[0].trim() : raw.trim();
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ key: label, label, count }));
}

export function topAuthors(books: StatsSourceBook[], limit = 6): CountEntry[] {
  return topBy(books, "author", limit);
}

export function topGenres(books: StatsSourceBook[], limit = 6): CountEntry[] {
  return topBy(books, "genre", limit);
}

export interface MonthlyCount {
  key: string; // yyyy-mm
  date: Date;
  count: number;
}

/** Livres terminés par mois sur les `months` derniers mois (mois courant inclus). */
export function finishedPerMonth(books: StatsSourceBook[], months = 12): MonthlyCount[] {
  const now = new Date();
  const buckets: MonthlyCount[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: `${date.getFullYear()}-${date.getMonth()}`, date, count: 0 });
  }
  const index = new Map(buckets.map((b) => [b.key, b]));

  for (const book of books) {
    if (!book.date_finished) continue;
    const d = new Date(book.date_finished);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = index.get(key);
    if (bucket) bucket.count += 1;
  }

  return buckets;
}

export function estimatedPagesRead(books: StatsSourceBook[]): number {
  return books
    .filter((b) => b.status === "finished")
    .reduce((sum, b) => sum + (b.page_count ?? 0), 0);
}

export function finishedThisYear(books: StatsSourceBook[], year: number): number {
  return books.filter((b) => b.date_finished && new Date(b.date_finished).getFullYear() === year)
    .length;
}
