import { describe, expect, it } from "vitest";
import { shapeBookDetail, shapeBooksWithRelations } from "./books";
import type { Book, Loan, Tag } from "@/lib/types";

function makeBook(overrides: Partial<Book> = {}): Book {
  return {
    id: "book-1",
    user_id: "user-1",
    title: "Le Petit Prince",
    author: "Antoine de Saint-Exupéry",
    genre: "Roman",
    isbn: null,
    cover_url: null,
    publisher: null,
    published_year: null,
    language: null,
    page_count: null,
    format: "physical",
    status: "to_read",
    rating: null,
    notes: null,
    location: null,
    google_books_id: null,
    date_added: "2026-01-01T00:00:00Z",
    date_started: null,
    date_finished: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeLoan(overrides: Partial<Loan> = {}): Loan {
  return {
    id: "loan-1",
    book_id: "book-1",
    user_id: "user-1",
    borrower_name: "Alex",
    loan_date: "2026-01-01",
    expected_return_date: null,
    returned_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeTag(id: string, name: string): Tag {
  return { id, user_id: "user-1", name, created_at: "2026-01-01T00:00:00Z" };
}

describe("shapeBooksWithRelations", () => {
  it("returns books with no loan and no tags when there are none", () => {
    const books = [makeBook()];
    const result = shapeBooksWithRelations(books, [], []);
    expect(result).toEqual([{ ...books[0], active_loan: null, tags: [] }]);
  });

  it("attaches the matching active loan to its book, and only that book", () => {
    const books = [makeBook({ id: "a" }), makeBook({ id: "b" })];
    const loan = makeLoan({ id: "loan-a", book_id: "a" });
    const result = shapeBooksWithRelations(books, [loan], []);
    expect(result.find((b) => b.id === "a")?.active_loan).toEqual(loan);
    expect(result.find((b) => b.id === "b")?.active_loan).toBeNull();
  });

  it("groups multiple tags onto the same book and keeps other books untagged", () => {
    const books = [makeBook({ id: "a" }), makeBook({ id: "b" })];
    const philo = makeTag("t1", "Philosophie");
    const politique = makeTag("t2", "Politique");
    const result = shapeBooksWithRelations(
      books,
      [],
      [
        { book_id: "a", tags: philo },
        { book_id: "a", tags: politique },
      ],
    );
    expect(result.find((b) => b.id === "a")?.tags).toEqual([philo, politique]);
    expect(result.find((b) => b.id === "b")?.tags).toEqual([]);
  });

  it("ignores book_tags rows with a null tag (e.g. a dangling join)", () => {
    const books = [makeBook({ id: "a" })];
    const result = shapeBooksWithRelations(books, [], [{ book_id: "a", tags: null }]);
    expect(result[0].tags).toEqual([]);
  });

  it("returns an empty array for an empty library", () => {
    expect(shapeBooksWithRelations([], [], [])).toEqual([]);
  });
});

describe("shapeBookDetail", () => {
  it("bundles the book with its full loan history and tags", () => {
    const book = makeBook();
    const loans = [
      makeLoan({ id: "l1" }),
      makeLoan({ id: "l2", returned_at: "2026-02-01T00:00:00Z" }),
    ];
    const tag = makeTag("t1", "Histoire");

    const result = shapeBookDetail(book, loans, [{ tags: tag }]);

    expect(result.book).toBe(book);
    expect(result.loans).toEqual(loans);
    expect(result.tags).toEqual([tag]);
  });

  it("filters out null tag rows instead of keeping holes", () => {
    const book = makeBook();
    const tag = makeTag("t1", "Économie");
    const result = shapeBookDetail(book, [], [{ tags: null }, { tags: tag }]);
    expect(result.tags).toEqual([tag]);
  });

  it("returns an empty loans/tags array when there are none, not undefined", () => {
    const result = shapeBookDetail(makeBook(), [], []);
    expect(result.loans).toEqual([]);
    expect(result.tags).toEqual([]);
  });
});
