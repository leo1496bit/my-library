import { describe, expect, it } from "vitest";
import { formatDate, formatMonthYear, formatShortDate, todayIso } from "@/lib/format";

describe("formatDate", () => {
  it("returns an em dash for null/undefined/empty input", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    expect(formatDate("")).toBe("—");
  });

  it("returns an em dash for an invalid date string", () => {
    expect(formatDate("not-a-date")).toBe("—");
  });

  it("formats a valid date in long fr-FR style", () => {
    expect(formatDate("2024-01-15")).toBe("15 janvier 2024");
  });

  it("formats a december date correctly", () => {
    expect(formatDate("2024-12-01")).toBe("1 décembre 2024");
  });
});

describe("formatShortDate", () => {
  it("returns an em dash for null/undefined/empty input", () => {
    expect(formatShortDate(null)).toBe("—");
    expect(formatShortDate(undefined)).toBe("—");
    expect(formatShortDate("")).toBe("—");
  });

  it("returns an em dash for an invalid date string", () => {
    expect(formatShortDate("not-a-date")).toBe("—");
  });

  it("formats a valid date in short fr-FR style (no year)", () => {
    expect(formatShortDate("2024-01-15")).toBe("15 janv.");
  });
});

describe("formatMonthYear", () => {
  it("returns a fixed-width 3-letter French month abbreviation", () => {
    expect(formatMonthYear(new Date(2024, 0, 1))).toBe("Jan");
    expect(formatMonthYear(new Date(2024, 1, 1))).toBe("Fév");
    expect(formatMonthYear(new Date(2024, 7, 1))).toBe("Aoû");
    expect(formatMonthYear(new Date(2024, 11, 1))).toBe("Déc");
  });

  it("is based on getMonth() regardless of the day-of-month", () => {
    expect(formatMonthYear(new Date(2024, 5, 30))).toBe("Jun");
    expect(formatMonthYear(new Date(2024, 5, 1))).toBe("Jun");
  });
});

describe("todayIso", () => {
  it("returns a YYYY-MM-DD formatted string", () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("matches the current UTC date slice of an ISO timestamp", () => {
    const expected = new Date().toISOString().slice(0, 10);
    expect(todayIso()).toBe(expected);
  });
});
