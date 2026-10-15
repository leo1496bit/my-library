import { describe, expect, it } from "vitest";
import { booksInSeries, groupBooksBySeries } from "./series";
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
    series_name: null,
    series_index: null,
    active_loan: null,
    tags: [],
    ...overrides,
  };
}

describe("groupBooksBySeries", () => {
  it("groups a single book under its series", () => {
    const book = makeBook({ id: "a", series_name: "Fondation" });
    expect(groupBooksBySeries([book])).toEqual([{ name: "Fondation", books: [book] }]);
  });

  it("groups several books with the same series name together", () => {
    const b1 = makeBook({ id: "a", series_name: "Harry Potter" });
    const b2 = makeBook({ id: "b", series_name: "Harry Potter" });
    const result = groupBooksBySeries([b1, b2]);
    expect(result).toHaveLength(1);
    expect(result[0].books.map((b) => b.id).sort()).toEqual(["a", "b"]);
  });

  it("ignores books with no series_name", () => {
    const withSeries = makeBook({ id: "a", series_name: "Fondation" });
    const withoutSeries = makeBook({ id: "b", series_name: null });
    const result = groupBooksBySeries([withSeries, withoutSeries]);
    expect(result).toEqual([{ name: "Fondation", books: [withSeries] }]);
  });

  it("ignores a blank series_name", () => {
    const book = makeBook({ id: "a", series_name: "   " });
    expect(groupBooksBySeries([book])).toEqual([]);
  });

  it("sorts series names alphabetically (fr locale)", () => {
    const b1 = makeBook({ id: "a", series_name: "Zorro" });
    const b2 = makeBook({ id: "b", series_name: "Émilie" });
    const result = groupBooksBySeries([b1, b2]);
    expect(result.map((e) => e.name)).toEqual(["Émilie", "Zorro"]);
  });

  it("returns an empty array for an empty library", () => {
    expect(groupBooksBySeries([])).toEqual([]);
  });

  it("treats differently-spelled series names as distinct (no fuzzy merge, unlike authors)", () => {
    const b1 = makeBook({ id: "a", series_name: "Harry Potter" });
    const b2 = makeBook({ id: "b", series_name: "harry potter" });
    const result = groupBooksBySeries([b1, b2]);
    expect(result).toHaveLength(2);
  });
});

describe("booksInSeries", () => {
  it("returns only books that belong to the given series", () => {
    const a = makeBook({ id: "a", series_name: "Fondation" });
    const b = makeBook({ id: "b", series_name: "Dune" });
    expect(booksInSeries([a, b], "Fondation")).toEqual([a]);
  });

  it("orders results by series_index, ascending", () => {
    const tome2 = makeBook({ id: "b", series_name: "X", series_index: 2 });
    const tome1 = makeBook({ id: "a", series_name: "X", series_index: 1 });
    const tome3 = makeBook({ id: "c", series_name: "X", series_index: 3 });
    expect(booksInSeries([tome2, tome1, tome3], "X")).toEqual([tome1, tome2, tome3]);
  });

  it("puts books with an unknown series_index at the end, in a stable order", () => {
    const unknown1 = makeBook({ id: "a", series_name: "X", series_index: null });
    const tome1 = makeBook({ id: "b", series_name: "X", series_index: 1 });
    const unknown2 = makeBook({ id: "c", series_name: "X", series_index: null });
    const result = booksInSeries([unknown1, tome1, unknown2], "X");
    expect(result).toEqual([tome1, unknown1, unknown2]);
  });

  it("returns an empty array when no book matches the series", () => {
    const book = makeBook({ id: "a", series_name: "Fondation" });
    expect(booksInSeries([book], "Dune")).toEqual([]);
  });

  it("does not fuzzy-match series names (exact match only)", () => {
    const book = makeBook({ id: "a", series_name: "Harry Potter" });
    expect(booksInSeries([book], "harry potter")).toEqual([]);
  });
});
