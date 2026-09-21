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

  it("merges spellings that only differ by case, accents or extra spaces", () => {
    const a = makeBook({ id: "a", author: "Émile Zola" });
    const b = makeBook({ id: "b", author: "emile zola" });
    const c = makeBook({ id: "c", author: "Emile  Zola" });
    const result = groupBooksByAuthor([a, b, c]);
    expect(result).toHaveLength(1);
    expect(result[0].books).toEqual([a, b, c]);
  });

  it("displays the most frequent spelling among the merged variants", () => {
    const correct1 = makeBook({ id: "a", author: "Victor Hugo" });
    const correct2 = makeBook({ id: "b", author: "Victor Hugo" });
    const typo = makeBook({ id: "c", author: "victor hugo " });
    const result = groupBooksByAuthor([typo, correct1, correct2]);
    expect(result[0].name).toBe("Victor Hugo");
  });

  it("merges a bare surname with the same author's full name on another book (Google Books inconsistency)", () => {
    const bare = makeBook({ id: "a", author: "Dostoïevski" });
    const full = makeBook({ id: "b", author: "Fedor Dostoïevski" });
    const result = groupBooksByAuthor([bare, full]);
    expect(result).toHaveLength(1);
    expect(result[0].books.map((b) => b.id).sort()).toEqual(["a", "b"]);
  });

  it("prefers the fuller name as the displayed spelling over a bare surname, even if the bare form is more frequent", () => {
    const bare1 = makeBook({ id: "a", author: "Dostoïevski" });
    const bare2 = makeBook({ id: "b", author: "Dostoïevski" });
    const full = makeBook({ id: "c", author: "Fedor Dostoïevski" });
    const result = groupBooksByAuthor([bare1, bare2, full]);
    expect(result[0].name).toBe("Fedor Dostoïevski");
  });

  it("does not merge a book with the same author twice under the same group", () => {
    // Cas limite : un même livre listant l'auteur deux fois sous des
    // graphies différentes ne doit pas dupliquer le livre dans le compte.
    const book = makeBook({ id: "a", author: "Dostoïevski, Fedor Dostoïevski" });
    const result = groupBooksByAuthor([book]);
    expect(result).toHaveLength(1);
    expect(result[0].books).toEqual([book]);
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

  it("matches spelling variants (case, accents, extra spaces), not just exact strings", () => {
    const book = makeBook({ id: "a", author: "emile  zola" });
    expect(booksByAuthor([book], "Émile Zola")).toEqual([book]);
  });

  it("finds books credited to just the surname when queried with the full name", () => {
    const bare = makeBook({ id: "a", author: "Dostoïevski" });
    const full = makeBook({ id: "b", author: "Fedor Dostoïevski" });
    const result = booksByAuthor([bare, full], "Fedor Dostoïevski");
    expect(result.map((b) => b.id).sort()).toEqual(["a", "b"]);
  });
});
