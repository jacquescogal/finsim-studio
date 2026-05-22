import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { sampleLessonContent, sampleLessonMetadata } from "@/lib/lessons/sample";
import ScenarioPlayPage from "./page";

const repositoryMocks = vi.hoisted(() => ({
  getPublishedLessonBySlug: vi.fn()
}));

const navigationMocks = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  })
}));

vi.mock("@/lib/lessons/repository", () => ({
  getPublishedLessonBySlug: repositoryMocks.getPublishedLessonBySlug
}));

vi.mock("next/navigation", () => ({
  notFound: navigationMocks.notFound
}));

describe("ScenarioPlayPage", () => {
  it("renders the learner player for a direct unlisted slug", async () => {
    repositoryMocks.getPublishedLessonBySlug.mockResolvedValueOnce({
      id: "00000000-0000-4000-8000-000000000001",
      metadata: {
        ...sampleLessonMetadata,
        status: "published",
        visibility: "unlisted",
        publicSlug: "private-group-scenario"
      },
      content: sampleLessonContent,
      generationModel: null,
      generationWarnings: [],
      createdAt: "2026-05-20T00:00:00.000Z",
      updatedAt: "2026-05-21T00:00:00.000Z",
      publishedAt: "2026-05-22T00:00:00.000Z"
    });

    render(await ScenarioPlayPage({ params: Promise.resolve({ slug: "private-group-scenario" }) }));

    expect(repositoryMocks.getPublishedLessonBySlug).toHaveBeenCalledWith("private-group-scenario");
    expect(screen.getByRole("heading", { name: "A message arrives" })).toBeVisible();
  });

  it("returns Next notFound for missing slugs", async () => {
    repositoryMocks.getPublishedLessonBySlug.mockResolvedValueOnce(null);

    await expect(ScenarioPlayPage({ params: Promise.resolve({ slug: "missing" }) })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(navigationMocks.notFound).toHaveBeenCalled();
  });
});
