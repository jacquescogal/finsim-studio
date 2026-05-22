import { describe, expect, it } from "vitest";
import { createSlug, nextAvailableSlug } from "./slug";

describe("slug helpers", () => {
  it("normalizes titles into URL-safe slugs", () => {
    expect(createSlug("Avoiding Investment Scams!")).toBe("avoiding-investment-scams");
  });

  it("uses scenario when the title has no usable characters", () => {
    expect(createSlug("!!!")).toBe("scenario");
  });

  it("finds the next available slug", async () => {
    const existing = new Set(["budget-basics", "budget-basics-2"]);
    const slug = await nextAvailableSlug("Budget Basics", async (candidate) => existing.has(candidate));
    expect(slug).toBe("budget-basics-3");
  });
});
