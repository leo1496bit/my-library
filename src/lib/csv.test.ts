import { describe, expect, it } from "vitest";
import {
  bookToExportRow,
  booksToCsv,
  isDuplicate,
  mapCsvRow,
  normalizeKey,
  type ImportedBookRow,
} from "@/lib/csv";
import type { BookWithRelations } from "@/lib/types";

describe("normalizeKey", () => {
  it("trims and lowercases", () => {
    expect(normalizeKey("  Victor HUGO  ")).toBe("victor hugo");
  });

  it("returns an empty string for null/undefined", () => {
    expect(normalizeKey(null)).toBe("");
    expect(normalizeKey(undefined)).toBe("");
  });
});

describe("mapCsvRow", () => {
  const defaults = { status: "to_read" as const, format: "physical" as const };

  it("returns null when the title column is missing from the mapping", () => {
    const result = mapCsvRow({ Title: "Dune" }, {}, defaults);
    expect(result).toBeNull();
  });

  it("returns null when the mapped title column is empty", () => {
    const result = mapCsvRow({ Title: "   " }, { title: "Title" }, defaults);
    expect(result).toBeNull();
  });

  it("returns null when the mapped column does not exist in the row", () => {
    const result = mapCsvRow({ Title: "Dune" }, { title: "DoesNotExist" }, defaults);
    expect(result).toBeNull();
  });

  it("maps all provided columns and applies defaults for unmapped optional fields", () => {
    const result = mapCsvRow(
      { Title: " Dune ", Author: " Frank Herbert " },
      { title: "Title", author: "Author" },
      defaults,
    );
    expect(result).toEqual<ImportedBookRow>({
      title: "Dune",
      author: "Frank Herbert",
      genre: null,
      isbn: null,
      publisher: null,
      published_year: null,
      language: null,
      page_count: null,
      location: null,
      notes: null,
      cover_url: null,
      format: "physical",
      status: "to_read",
    });
  });

  it("coerces published_year, stripping non-digit junk characters", () => {
    const result = mapCsvRow(
      { Title: "Dune", Year: "c. 1965!" },
      { title: "Title", published_year: "Year" },
      defaults,
    );
    expect(result?.published_year).toBe(1965);
  });

  it("coerces page_count, stripping non-digit junk characters", () => {
    const result = mapCsvRow(
      { Title: "Dune", Pages: "412 pp." },
      { title: "Title", page_count: "Pages" },
      defaults,
    );
    expect(result?.page_count).toBe(412);
  });

  it("sets published_year/page_count to null when the value has no digits at all", () => {
    const result = mapCsvRow(
      { Title: "Dune", Year: "unknown", Pages: "n/a" },
      { title: "Title", published_year: "Year", page_count: "Pages" },
      defaults,
    );
    expect(result?.published_year).toBeNull();
    expect(result?.page_count).toBeNull();
  });

  it("sets published_year/page_count to null when the mapped column is blank", () => {
    const result = mapCsvRow(
      { Title: "Dune", Year: "", Pages: "" },
      { title: "Title", published_year: "Year", page_count: "Pages" },
      defaults,
    );
    expect(result?.published_year).toBeNull();
    expect(result?.page_count).toBeNull();
  });

  it("uses the provided defaults for status and format", () => {
    const result = mapCsvRow(
      { Title: "Dune" },
      { title: "Title" },
      { status: "finished", format: "audio" },
    );
    expect(result?.status).toBe("finished");
    expect(result?.format).toBe("audio");
  });
});

describe("isDuplicate", () => {
  function row(overrides: Partial<ImportedBookRow> = {}): ImportedBookRow {
    return {
      title: "Dune",
      author: "Frank Herbert",
      genre: null,
      isbn: null,
      publisher: null,
      published_year: null,
      language: null,
      page_count: null,
      location: null,
      notes: null,
      cover_url: null,
      format: "physical",
      status: "to_read",
      ...overrides,
    };
  }

  it("is not a duplicate against an empty index", () => {
    const existing = { isbnSet: new Set<string>(), titleAuthorSet: new Set<string>() };
    expect(isDuplicate(row(), existing)).toBe(false);
  });

  it("matches on normalized ISBN", () => {
    const existing = {
      isbnSet: new Set(["9780441013593"]),
      titleAuthorSet: new Set<string>(),
    };
    expect(isDuplicate(row({ isbn: " 9780441013593 " }), existing)).toBe(true);
  });

  it("does not match on ISBN when the row has no ISBN", () => {
    const existing = {
      isbnSet: new Set(["9780441013593"]),
      titleAuthorSet: new Set<string>(),
    };
    expect(isDuplicate(row({ isbn: null }), existing)).toBe(false);
  });

  it("matches on normalized title+author when ISBN doesn't match", () => {
    const existing = {
      isbnSet: new Set<string>(),
      titleAuthorSet: new Set(["dune::frank herbert"]),
    };
    expect(isDuplicate(row({ title: " Dune ", author: " Frank Herbert " }), existing)).toBe(true);
  });

  it("is case-insensitive for the title+author match", () => {
    const existing = {
      isbnSet: new Set<string>(),
      titleAuthorSet: new Set(["dune::frank herbert"]),
    };
    expect(isDuplicate(row({ title: "DUNE", author: "FRANK HERBERT" }), existing)).toBe(true);
  });

  it("treats a null author consistently with an empty string author for the key", () => {
    const existing = {
      isbnSet: new Set<string>(),
      titleAuthorSet: new Set(["dune::"]),
    };
    expect(isDuplicate(row({ title: "Dune", author: null }), existing)).toBe(true);
  });

  it("returns false when neither ISBN nor title+author match", () => {
    const existing = {
      isbnSet: new Set(["9999999999999"]),
      titleAuthorSet: new Set(["someothertitle::someotherauthor"]),
    };
    expect(isDuplicate(row(), existing)).toBe(false);
  });
});

function makeExportBook(overrides: Partial<BookWithRelations> = {}): BookWithRelations {
  return {
    id: "book-1",
    user_id: "user-1",
    title: "Dune",
    author: "Frank Herbert",
    genre: "Science-fiction",
    isbn: "9780441013593",
    cover_url: null,
    publisher: "Robert Laffont",
    published_year: 1965,
    language: "fr",
    page_count: 412,
    format: "physical",
    status: "finished",
    rating: 5,
    notes: "Relu pour la troisième fois",
    location: "Étagère du salon",
    google_books_id: null,
    date_added: "2026-01-01T12:34:56Z",
    date_started: "2026-01-02",
    date_finished: "2026-01-20",
    created_at: "2026-01-01T12:34:56Z",
    updated_at: "2026-01-20T00:00:00Z",
    series_name: null,
    series_index: null,
    active_loan: null,
    tags: [],
    ...overrides,
  };
}

describe("bookToExportRow", () => {
  it("maps every field to its French column, including labels for format/status and the tag list", () => {
    const book = makeExportBook({
      tags: [
        { id: "t1", user_id: "user-1", name: "Philosophie", created_at: "2026-01-01T00:00:00Z" },
        { id: "t2", user_id: "user-1", name: "Classique", created_at: "2026-01-01T00:00:00Z" },
      ],
    });
    expect(bookToExportRow(book)).toEqual({
      Titre: "Dune",
      Auteur: "Frank Herbert",
      Genre: "Science-fiction",
      ISBN: "9780441013593",
      Éditeur: "Robert Laffont",
      Année: "1965",
      Langue: "fr",
      Pages: "412",
      Format: "Papier",
      Statut: "Terminé",
      Note: "5",
      Notes: "Relu pour la troisième fois",
      Emplacement: "Étagère du salon",
      "Date d'ajout": "2026-01-01",
      "Date de début": "2026-01-02",
      "Date de fin": "2026-01-20",
      Tags: "Philosophie, Classique",
    });
  });

  it("renders null/empty optional fields as empty strings instead of 'null'", () => {
    const book = makeExportBook({
      author: null,
      genre: null,
      isbn: null,
      publisher: null,
      published_year: null,
      language: null,
      page_count: null,
      rating: null,
      notes: null,
      location: null,
      date_started: null,
      date_finished: null,
      tags: [],
    });
    const row = bookToExportRow(book);
    expect(row.Auteur).toBe("");
    expect(row.Genre).toBe("");
    expect(row.ISBN).toBe("");
    expect(row.Éditeur).toBe("");
    expect(row.Année).toBe("");
    expect(row.Langue).toBe("");
    expect(row.Pages).toBe("");
    expect(row.Note).toBe("");
    expect(row.Notes).toBe("");
    expect(row.Emplacement).toBe("");
    expect(row["Date de début"]).toBe("");
    expect(row["Date de fin"]).toBe("");
    expect(row.Tags).toBe("");
  });

  it("defaults tags to an empty string when the relation is omitted", () => {
    const book = makeExportBook();
    delete book.tags;
    expect(bookToExportRow(book).Tags).toBe("");
  });
});

describe("booksToCsv", () => {
  it("returns only the header row for an empty library", () => {
    const csv = booksToCsv([]);
    expect(csv).toBe(
      "Titre,Auteur,Genre,ISBN,Éditeur,Année,Langue,Pages,Format,Statut,Note,Notes,Emplacement,Date d'ajout,Date de début,Date de fin,Tags\r\n",
    );
  });

  it("serializes each book as one CSV row under the French headers", () => {
    const csv = booksToCsv([makeExportBook()]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toContain("Titre,Auteur,Genre,ISBN");
    expect(lines[1]).toContain("Dune,Frank Herbert,Science-fiction,9780441013593");
  });

  it("quotes fields containing commas, such as a joined tag list", () => {
    const csv = booksToCsv([
      makeExportBook({
        tags: [
          { id: "t1", user_id: "user-1", name: "Philosophie", created_at: "2026-01-01T00:00:00Z" },
          { id: "t2", user_id: "user-1", name: "Classique", created_at: "2026-01-01T00:00:00Z" },
        ],
      }),
    ]);
    expect(csv).toContain('"Philosophie, Classique"');
  });
});
