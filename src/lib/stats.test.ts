import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  countByFormat,
  countByStatus,
  estimatedPagesRead,
  finishedPerMonth,
  finishedThisYear,
  topAuthors,
  topGenres,
} from "@/lib/stats";
import type { Book } from "@/lib/types";

let idCounter = 0;

function makeBook(overrides: Partial<Book> = {}): Book {
  idCounter += 1;
  return {
    id: `book-${idCounter}`,
    user_id: "user-1",
    title: `Book ${idCounter}`,
    author: null,
    genre: null,
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
    date_added: "2024-01-01",
    date_started: null,
    date_finished: null,
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("countByStatus", () => {
  it("returns zero counts for every status on empty input", () => {
    const result = countByStatus([]);
    expect(result).toEqual([
      { key: "to_buy", label: "À acheter", count: 0 },
      { key: "to_read", label: "À lire", count: 0 },
      { key: "reading", label: "En cours", count: 0 },
      { key: "finished", label: "Terminé", count: 0 },
      { key: "abandoned", label: "Abandonné", count: 0 },
    ]);
  });

  it("counts books per status and preserves BOOK_STATUSES order", () => {
    const books = [
      makeBook({ status: "finished" }),
      makeBook({ status: "finished" }),
      makeBook({ status: "reading" }),
      makeBook({ status: "to_buy" }),
    ];
    const result = countByStatus(books);
    expect(result.map((e) => e.count)).toEqual([1, 0, 1, 2, 0]);
    expect(result.map((e) => e.key)).toEqual([
      "to_buy",
      "to_read",
      "reading",
      "finished",
      "abandoned",
    ]);
  });
});

describe("countByFormat", () => {
  it("returns zero counts for every format on empty input", () => {
    const result = countByFormat([]);
    expect(result).toEqual([
      { key: "physical", label: "Papier", count: 0 },
      { key: "digital", label: "Numérique", count: 0 },
      { key: "audio", label: "Audio", count: 0 },
    ]);
  });

  it("counts books per format", () => {
    const books = [
      makeBook({ format: "digital" }),
      makeBook({ format: "audio" }),
      makeBook({ format: "audio" }),
      makeBook({ format: "physical" }),
    ];
    const result = countByFormat(books);
    expect(result.map((e) => e.count)).toEqual([1, 1, 2]);
  });
});

describe("topAuthors", () => {
  it("returns an empty array on empty input", () => {
    expect(topAuthors([])).toEqual([]);
  });

  it("skips books with null, undefined, or blank author", () => {
    const books = [
      makeBook({ author: null }),
      makeBook({ author: undefined }),
      makeBook({ author: "   " }),
    ];
    expect(topAuthors(books)).toEqual([]);
  });

  it("only counts the first author when the field lists multiple, comma-separated", () => {
    const books = [
      makeBook({ author: "Victor Hugo, Some Editor" }),
      makeBook({ author: "Victor Hugo" }),
    ];
    const result = topAuthors(books);
    expect(result).toEqual([{ key: "Victor Hugo", label: "Victor Hugo", count: 2 }]);
  });

  it("trims whitespace around author names", () => {
    const books = [makeBook({ author: "  Albert Camus  " }), makeBook({ author: "Albert Camus" })];
    expect(topAuthors(books)).toEqual([{ key: "Albert Camus", label: "Albert Camus", count: 2 }]);
  });

  it("sorts by descending count and respects the limit", () => {
    const books = [
      makeBook({ author: "A" }),
      makeBook({ author: "A" }),
      makeBook({ author: "A" }),
      makeBook({ author: "B" }),
      makeBook({ author: "B" }),
      makeBook({ author: "C" }),
    ];
    const result = topAuthors(books, 2);
    expect(result).toEqual([
      { key: "A", label: "A", count: 3 },
      { key: "B", label: "B", count: 2 },
    ]);
  });

  it("defaults to a limit of 6", () => {
    const books = Array.from({ length: 8 }, (_, i) => makeBook({ author: `Author ${i}` }));
    expect(topAuthors(books)).toHaveLength(6);
  });
});

describe("topGenres", () => {
  it("does not split genre on commas (unlike author)", () => {
    const books = [makeBook({ genre: "Science-Fiction, Fantasy" })];
    const result = topGenres(books);
    expect(result).toEqual([
      { key: "Science-Fiction, Fantasy", label: "Science-Fiction, Fantasy", count: 1 },
    ]);
  });

  it("skips null/blank genres and trims whitespace", () => {
    const books = [
      makeBook({ genre: null }),
      makeBook({ genre: "  " }),
      makeBook({ genre: "  Polar  " }),
      makeBook({ genre: "Polar" }),
    ];
    expect(topGenres(books)).toEqual([{ key: "Polar", label: "Polar", count: 2 }]);
  });
});

describe("finishedPerMonth", () => {
  beforeEach(() => {
    // Fix "now" to March 15, 2024 (local time) so month bucketing is deterministic.
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 2, 15));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("buckets books into the correct month regardless of day-of-month, ignoring out-of-range months", () => {
    const books = [
      makeBook({ date_finished: "2024-01-31" }),
      makeBook({ date_finished: "2024-02-15" }),
      makeBook({ date_finished: "2024-02-16" }),
      // Outside the 3-month window (Jan-Mar 2024) given "now" fixed above.
      makeBook({ date_finished: "2023-12-15" }),
    ];

    const result = finishedPerMonth(books, 3);
    expect(result).toHaveLength(3);
    expect(result.map((b) => b.key)).toEqual(["2024-0", "2024-1", "2024-2"]);
    expect(result.map((b) => b.count)).toEqual([1, 2, 0]);
  });

  it("ignores books without a date_finished", () => {
    const books = [makeBook({ date_finished: null }), makeBook({ status: "finished" })];
    const result = finishedPerMonth(books, 1);
    expect(result[0].count).toBe(0);
  });

  it("defaults to a 12-month window", () => {
    expect(finishedPerMonth([])).toHaveLength(12);
  });
});

describe("estimatedPagesRead", () => {
  it("returns 0 for empty input", () => {
    expect(estimatedPagesRead([])).toBe(0);
  });

  it("only sums page_count for finished books", () => {
    const books = [
      makeBook({ status: "finished", page_count: 300 }),
      makeBook({ status: "reading", page_count: 500 }),
      makeBook({ status: "finished", page_count: 200 }),
    ];
    expect(estimatedPagesRead(books)).toBe(500);
  });

  it("treats null/undefined page_count as 0", () => {
    const books = [
      makeBook({ status: "finished", page_count: null }),
      makeBook({ status: "finished", page_count: undefined }),
      makeBook({ status: "finished", page_count: 150 }),
    ];
    expect(estimatedPagesRead(books)).toBe(150);
  });
});

describe("finishedThisYear", () => {
  it("returns 0 for empty input", () => {
    expect(finishedThisYear([], 2024)).toBe(0);
  });

  it("counts only books finished in the given year", () => {
    const books = [
      makeBook({ date_finished: "2024-06-15" }),
      makeBook({ date_finished: "2023-06-15" }),
      makeBook({ date_finished: "2024-11-30" }),
      makeBook({ date_finished: null }),
    ];
    expect(finishedThisYear(books, 2024)).toBe(2);
    expect(finishedThisYear(books, 2023)).toBe(1);
    expect(finishedThisYear(books, 2022)).toBe(0);
  });
});
