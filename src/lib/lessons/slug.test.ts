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

  it("does not leave a trailing separator after truncating long titles", () => {
    const slug = createSlug("a".repeat(119) + " b");

    expect(slug).toHaveLength(119);
    expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  it("trims trailing separators introduced by truncation", () => {
    const slug = createSlug("abc ".repeat(31));

    expect(slug).toHaveLength(119);
    expect(slug.endsWith("-")).toBe(false);
    expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });
});
