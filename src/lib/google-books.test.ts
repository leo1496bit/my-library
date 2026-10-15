import { describe, expect, it } from "vitest";
import { extractIsbn, extractYear, looksLikeIsbn, upgradeCoverUrl } from "@/lib/google-books";

describe("extractIsbn", () => {
  it("returns null for undefined or empty identifiers", () => {
    expect(extractIsbn(undefined)).toBeNull();
    expect(extractIsbn([])).toBeNull();
  });

  it("prefers ISBN_13 over ISBN_10 when both are present", () => {
    const result = extractIsbn([
      { type: "ISBN_10", identifier: "0441013597" },
      { type: "ISBN_13", identifier: "9780441013593" },
    ]);
    expect(result).toBe("9780441013593");
  });

  it("falls back to ISBN_10 when no ISBN_13 is present", () => {
    const result = extractIsbn([{ type: "ISBN_10", identifier: "0441013597" }]);
    expect(result).toBe("0441013597");
  });

  it("returns null when identifiers contain neither ISBN_10 nor ISBN_13", () => {
    const result = extractIsbn([{ type: "OTHER", identifier: "123" }]);
    expect(result).toBeNull();
  });
});

describe("extractYear", () => {
  it("returns null for undefined input", () => {
    expect(extractYear(undefined)).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(extractYear("")).toBeNull();
  });

  it("extracts the year from a full ISO date", () => {
    expect(extractYear("1965-08-01")).toBe(1965);
  });

  it("extracts the year from a year-month string", () => {
    expect(extractYear("1965-08")).toBe(1965);
  });

  it("extracts the year from a year-only string", () => {
    expect(extractYear("1965")).toBe(1965);
  });

  it("returns null when the string does not start with a 4-digit year", () => {
    expect(extractYear("unknown")).toBeNull();
    expect(extractYear("65")).toBeNull();
  });
});

describe("upgradeCoverUrl", () => {
  it("returns null for undefined input", () => {
    expect(upgradeCoverUrl(undefined)).toBeNull();
  });

  it("upgrades http to https", () => {
    const result = upgradeCoverUrl("http://books.google.com/books/content?id=abc&zoom=1");
    expect(result).toBe("https://books.google.com/books/content?id=abc&zoom=2");
  });

  it("upgrades zoom=1 to zoom=2", () => {
    const result = upgradeCoverUrl("https://books.google.com/books/content?id=abc&zoom=1");
    expect(result).toBe("https://books.google.com/books/content?id=abc&zoom=2");
  });

  it("leaves an already-https URL without zoom=1 unchanged apart from the protocol", () => {
    const result = upgradeCoverUrl("https://books.google.com/books/content?id=abc&zoom=3");
    expect(result).toBe("https://books.google.com/books/content?id=abc&zoom=3");
  });
});

describe("looksLikeIsbn", () => {
  it("recognizes a bare ISBN-13", () => {
    expect(looksLikeIsbn("9782070368228")).toBe(true);
  });

  it("recognizes an ISBN-13 with hyphens", () => {
    expect(looksLikeIsbn("978-2-07-036822-8")).toBe(true);
  });

  it("recognizes an ISBN-13 with spaces", () => {
    expect(looksLikeIsbn("978 2 07 036822 8")).toBe(true);
  });

  it("recognizes a bare ISBN-10", () => {
    expect(looksLikeIsbn("2070368228")).toBe(true);
  });

  it("recognizes an ISBN-10 with hyphens", () => {
    expect(looksLikeIsbn("2-07-036822-8")).toBe(true);
  });

  it("recognizes an ISBN-10 ending in an X check digit", () => {
    expect(looksLikeIsbn("044101359X")).toBe(true);
  });

  it("rejects a book title", () => {
    expect(looksLikeIsbn("Le Petit Prince")).toBe(false);
  });

  it("rejects a short numeric query", () => {
    expect(looksLikeIsbn("12345")).toBe(false);
  });

  it("rejects a numeric query of the wrong length", () => {
    expect(looksLikeIsbn("123456789012")).toBe(false);
  });

  it("rejects an empty or whitespace-only query", () => {
    expect(looksLikeIsbn("")).toBe(false);
    expect(looksLikeIsbn("   ")).toBe(false);
  });

  it("rejects digits mixed with non-ISBN letters", () => {
    expect(looksLikeIsbn("isbn 9782070368228")).toBe(false);
  });
});
