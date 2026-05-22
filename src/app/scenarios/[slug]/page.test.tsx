import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleLessonContent, sampleLessonMetadata } from "@/lib/lessons/sample";
import ScenarioPage from "./page";

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

function publishedLesson() {
  return {
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
  };
}

describe("ScenarioPage", () => {
  beforeEach(() => {
    repositoryMocks.getPublishedLessonBySlug.mockReset();
    navigationMocks.notFound.mockClear();
  });

  it("renders an unlisted published lesson by direct slug", async () => {
    repositoryMocks.getPublishedLessonBySlug.mockResolvedValueOnce(publishedLesson());

    render(await ScenarioPage({ params: Promise.resolve({ slug: "private-group-scenario" }) }));

    expect(repositoryMocks.getPublishedLessonBySlug).toHaveBeenCalledWith("private-group-scenario");
    expect(screen.getByRole("heading", { name: "Checking Before Acting" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Start scenario" })).toHaveAttribute(
      "href",
      "/scenarios/private-group-scenario/play"
    );
  });

  it("returns Next notFound for missing slugs", async () => {
    repositoryMocks.getPublishedLessonBySlug.mockResolvedValueOnce(null);

    await expect(ScenarioPage({ params: Promise.resolve({ slug: "missing" }) })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(navigationMocks.notFound).toHaveBeenCalled();
  });

  it("does not mask repository failures as not found", async () => {
    repositoryMocks.getPublishedLessonBySlug.mockRejectedValueOnce(new Error("database unavailable"));

    await expect(ScenarioPage({ params: Promise.resolve({ slug: "checking-before-acting" }) })).rejects.toThrow("database unavailable");
    expect(navigationMocks.notFound).not.toHaveBeenCalled();
  });
});
