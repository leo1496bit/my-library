import { describe, expect, it } from "vitest";
import { isOverdue } from "@/lib/loans";

const TODAY = new Date(2024, 5, 15); // 15 juin 2024

describe("isOverdue", () => {
  it("returns false when expected_return_date is null", () => {
    expect(isOverdue({ expected_return_date: null, returned_at: null }, TODAY)).toBe(false);
  });

  it("returns false when the loan has already been returned, even if the date passed", () => {
    expect(
      isOverdue({ expected_return_date: "2024-06-01", returned_at: "2024-06-02T10:00:00Z" }, TODAY),
    ).toBe(false);
  });

  it("returns true when expected_return_date is before today and the loan is not returned", () => {
    expect(isOverdue({ expected_return_date: "2024-06-01", returned_at: null }, TODAY)).toBe(true);
  });

  it("returns false when expected_return_date is today (not yet overdue)", () => {
    expect(isOverdue({ expected_return_date: "2024-06-15", returned_at: null }, TODAY)).toBe(false);
  });

  it("returns false when expected_return_date is in the future", () => {
    expect(isOverdue({ expected_return_date: "2024-06-30", returned_at: null }, TODAY)).toBe(false);
  });

  it("defaults the `today` parameter to the current date", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const past = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
    expect(isOverdue({ expected_return_date: past, returned_at: null })).toBe(true);
  });
});
