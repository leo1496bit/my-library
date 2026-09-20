import { describe, expect, it } from "vitest";
import { isDuplicate, mapCsvRow, normalizeKey, type ImportedBookRow } from "@/lib/csv";

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
