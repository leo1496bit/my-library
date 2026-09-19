// Types partagés — reflètent le schéma Supabase défini dans
// supabase/migrations/0001_init.sql.

export const BOOK_STATUSES = [
  "to_buy",
  "to_read",
  "reading",
  "finished",
  "abandoned",
] as const;

export type BookStatus = (typeof BOOK_STATUSES)[number];

// Libellés et ordre d'affichage — modifiable ici sans toucher au reste du code.
export const STATUS_LABELS: Record<BookStatus, string> = {
  to_buy: "À acheter",
  to_read: "À lire",
  reading: "En cours",
  finished: "Terminé",
  abandoned: "Abandonné",
};

export const BOOK_FORMATS = ["physical", "digital", "audio"] as const;
export type BookFormat = (typeof BOOK_FORMATS)[number];

export const FORMAT_LABELS: Record<BookFormat, string> = {
  physical: "Papier",
  digital: "Numérique",
  audio: "Audio",
};

export interface Book {
  id: string;
  user_id: string;
  title: string;
  author: string | null;
  genre: string | null;
  isbn: string | null;
  cover_url: string | null;
  publisher: string | null;
  published_year: number | null;
  language: string | null;
  page_count: number | null;
  format: BookFormat;
  status: BookStatus;
  rating: number | null;
  notes: string | null;
  location: string | null;
  google_books_id: string | null;
  date_added: string;
  date_started: string | null;
  date_finished: string | null;
  created_at: string;
  updated_at: string;
}

// Statuts proposés dans le flux d'ajout rapide (chips) — sous-ensemble de
// BOOK_STATUSES, doit rester synchronisé avec le schéma de addBookAction.
export type QuickAddStatus = Extract<BookStatus, "to_buy" | "to_read" | "reading">;

export type BookInsert = Partial<Book> & { title: string };
export type BookUpdate = Partial<Omit<Book, "id" | "user_id" | "created_at">>;

export interface Loan {
  id: string;
  book_id: string;
  user_id: string;
  borrower_name: string;
  loan_date: string;
  expected_return_date: string | null;
  returned_at: string | null;
  created_at: string;
  updated_at: string;
}

export type LoanInsert = Pick<Loan, "book_id" | "borrower_name"> &
  Partial<Pick<Loan, "loan_date" | "expected_return_date">>;

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface ReadingGoal {
  id: string;
  user_id: string;
  year: number;
  target_books: number;
}

// Livre avec ses relations chargées côté client (prêt actif, tags).
export interface BookWithRelations extends Book {
  active_loan?: Loan | null;
  tags?: Tag[];
}
