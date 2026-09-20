import { describe, expect, it } from "vitest";
import { suggestTagsForBook } from "@/lib/tag-suggestions";
import type { Tag } from "@/lib/types";

let idCounter = 0;

function makeTag(name: string): Tag {
  idCounter += 1;
  return { id: `tag-${idCounter}`, user_id: "user-1", name, created_at: "2024-01-01T00:00:00Z" };
}

describe("suggestTagsForBook", () => {
  it("returns nothing when the book has no genre or description", () => {
    const tags = [makeTag("Philosophie")];
    expect(suggestTagsForBook({ genre: null, description: null }, tags)).toEqual([]);
  });

  it("returns nothing when the user has no tags", () => {
    expect(suggestTagsForBook({ genre: "Philosophy", description: null }, [])).toEqual([]);
  });

  it("matches a tag whose name appears directly in the genre or description", () => {
    const politique = makeTag("Politique");
    const histoire = makeTag("Histoire");
    const result = suggestTagsForBook(
      { genre: "Essai politique", description: "Un livre sur l'histoire contemporaine." },
      [politique, histoire, makeTag("Cuisine")],
    );
    expect(result).toEqual([politique, histoire]);
  });

  it("is accent- and case-insensitive", () => {
    const economie = makeTag("Économie");
    const result = suggestTagsForBook({ genre: "ECONOMIE politique", description: null }, [
      economie,
    ]);
    expect(result).toEqual([economie]);
  });

  it("bridges common English Google Books categories to French tag names", () => {
    const philosophie = makeTag("Philosophie");
    const religion = makeTag("Religion");
    const result = suggestTagsForBook(
      { genre: "Philosophy", description: "A study of religious thought." },
      [philosophie, religion, makeTag("Dystopie")],
    );
    expect(result).toEqual([philosophie, religion]);
  });

  it("does not suggest unrelated tags", () => {
    const result = suggestTagsForBook({ genre: "Fiction", description: "A love story." }, [
      makeTag("Philosophie"),
      makeTag("Economie"),
    ]);
    expect(result).toEqual([]);
  });
});
