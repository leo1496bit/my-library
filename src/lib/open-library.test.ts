import { describe, expect, it } from "vitest";
import { googleBooksIdOf } from "@/lib/google-books";
import { mapOpenLibraryDoc, pickIsbn } from "@/lib/open-library";

describe("pickIsbn", () => {
  it("returns null for undefined or empty input", () => {
    expect(pickIsbn(undefined)).toBeNull();
    expect(pickIsbn([])).toBeNull();
  });

  it("prefers a French ISBN-13 (978-2) over other editions", () => {
    expect(pickIsbn(["0140301844", "9780141194806", "9782070612758"])).toBe("9782070612758");
  });

  it("falls back to any ISBN-13 when no French edition is listed", () => {
    expect(pickIsbn(["0140301844", "9780141194806"])).toBe("9780141194806");
  });

  it("falls back to the first ISBN when there is no ISBN-13", () => {
    expect(pickIsbn(["0140301844", "2070408507"])).toBe("0140301844");
  });
});

describe("mapOpenLibraryDoc", () => {
  it("returns null when the document has no title", () => {
    expect(mapOpenLibraryDoc({ key: "/works/OL1W" })).toBeNull();
  });

  it("maps a full document to the shared search result shape", () => {
    const result = mapOpenLibraryDoc({
      key: "/works/OL45804W",
      title: "Le Petit Prince",
      author_name: ["Antoine de Saint-Exupéry"],
      first_publish_year: 1943,
      isbn: ["0140301844", "9782070612758"],
      number_of_pages_median: 96,
      cover_i: 10708272,
    });

    expect(result).toEqual({
      googleBooksId: "ol:/works/OL45804W",
      source: "openlibrary",
      title: "Le Petit Prince",
      author: "Antoine de Saint-Exupéry",
      genre: null,
      isbn: "9782070612758",
      coverUrl: "https://covers.openlibrary.org/b/id/10708272-M.jpg",
      publisher: null,
      publishedYear: 1943,
      language: "fr",
      pageCount: 96,
      description: null,
    });
  });

  it("joins title and subtitle like Google Books results", () => {
    const result = mapOpenLibraryDoc({ key: "/works/OL2W", title: "Dune", subtitle: "Le messie" });
    expect(result?.title).toBe("Dune : Le messie");
  });

  it("leaves language and cover empty when they can't be inferred", () => {
    const result = mapOpenLibraryDoc({
      key: "/works/OL3W",
      title: "Dune",
      isbn: ["9780441013593"],
    });
    expect(result?.language).toBeNull();
    expect(result?.coverUrl).toBeNull();
    expect(result?.author).toBeNull();
  });
});

describe("googleBooksIdOf", () => {
  it("never stores an Open Library id as a Google Books id", () => {
    const result = mapOpenLibraryDoc({ key: "/works/OL4W", title: "Dune" });
    expect(result).not.toBeNull();
    expect(googleBooksIdOf(result!)).toBeNull();
  });

  it("keeps the id of a Google Books result", () => {
    expect(
      googleBooksIdOf({
        googleBooksId: "fRAPwGXoqVUC",
        title: "Le petit prince",
        author: null,
        genre: null,
        isbn: null,
        coverUrl: null,
        publisher: null,
        publishedYear: null,
        language: null,
        pageCount: null,
        description: null,
      }),
    ).toBe("fRAPwGXoqVUC");
  });
});
