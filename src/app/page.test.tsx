import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { sampleLessonMetadata } from "@/lib/lessons/sample";
import HomePage from "./page";

const repositoryMocks = vi.hoisted(() => ({
  listPublicLessons: vi.fn()
}));

vi.mock("@/lib/lessons/repository", () => ({
  listPublicLessons: repositoryMocks.listPublicLessons
}));

describe("HomePage", () => {
  it("lists published public lessons from the repository", async () => {
    repositoryMocks.listPublicLessons.mockResolvedValueOnce([
      {
        id: "lesson-1",
        metadata: {
          ...sampleLessonMetadata,
          status: "published",
          visibility: "public",
          publicSlug: "checking-before-acting"
        },
        createdAt: "2026-05-20T00:00:00.000Z",
        updatedAt: "2026-05-21T00:00:00.000Z",
        publishedAt: "2026-05-22T00:00:00.000Z"
      }
    ]);

    render(await HomePage());

    expect(repositoryMocks.listPublicLessons).toHaveBeenCalled();
    expect(screen.getByRole("link", { name: /Checking Before Acting/ })).toHaveAttribute(
      "href",
      "/scenarios/checking-before-acting"
    );
    expect(screen.getByText("A short scenario about spotting suspicious investment messages.")).toBeVisible();
  });
});
