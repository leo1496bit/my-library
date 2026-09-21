import { describe, expect, it } from "vitest";
import { booksByAuthor, groupBooksByAuthor } from "./authors";
import type { Book, BookWithRelations } from "@/lib/types";

function makeBook(overrides: Partial<Book> = {}): BookWithRelations {
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
    active_loan: null,
    tags: [],
    ...overrides,
  };
}

describe("groupBooksByAuthor", () => {
  it("groups a single-author book under its author", () => {
    const book = makeBook({ id: "a", author: "Albert Camus" });
    expect(groupBooksByAuthor([book])).toEqual([{ name: "Albert Camus", books: [book] }]);
  });

  it("puts a multi-author book under each of its authors separately", () => {
    const book = makeBook({ id: "a", author: "Auteur Un, Auteur Deux" });
    const result = groupBooksByAuthor([book]);
    expect(result).toEqual([
      { name: "Auteur Deux", books: [book] },
      { name: "Auteur Un", books: [book] },
    ]);
  });

  it("sorts author names alphabetically (fr locale)", () => {
    const b1 = makeBook({ id: "a", author: "Zola" });
    const b2 = makeBook({ id: "b", author: "Émile Ajar" });
    const result = groupBooksByAuthor([b1, b2]);
    expect(result.map((e) => e.name)).toEqual(["Émile Ajar", "Zola"]);
  });

  it("skips books with no author", () => {
    const book = makeBook({ id: "a", author: null });
    expect(groupBooksByAuthor([book])).toEqual([]);
  });

  it("trims whitespace around individual author names", () => {
    const book = makeBook({ id: "a", author: "Auteur Un ,  Auteur Deux " });
    const result = groupBooksByAuthor([book]);
    expect(result.map((e) => e.name)).toEqual(["Auteur Deux", "Auteur Un"]);
  });

  it("returns an empty array for an empty library", () => {
    expect(groupBooksByAuthor([])).toEqual([]);
  });
});

describe("booksByAuthor", () => {
  it("returns only books that include the given author", () => {
    const a = makeBook({ id: "a", author: "Auteur Un, Auteur Deux" });
    const b = makeBook({ id: "b", author: "Auteur Trois" });
    expect(booksByAuthor([a, b], "Auteur Un")).toEqual([a]);
  });

  it("orders results by date_added, most recent first", () => {
    const older = makeBook({ id: "a", author: "X", date_added: "2026-01-01T00:00:00Z" });
    const newer = makeBook({ id: "b", author: "X", date_added: "2026-06-01T00:00:00Z" });
    expect(booksByAuthor([older, newer], "X")).toEqual([newer, older]);
  });

  it("returns an empty array when no book matches", () => {
    const book = makeBook({ id: "a", author: "Quelqu'un" });
    expect(booksByAuthor([book], "Personne")).toEqual([]);
  });
});
