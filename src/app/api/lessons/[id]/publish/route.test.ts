import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleLessonContent, sampleLessonMetadata } from "@/lib/lessons/sample";
import type { StudioLesson } from "@/lib/lessons/repository";
import { POST } from "./route";

const repositoryMocks = vi.hoisted(() => ({
  getStudioLesson: vi.fn(),
  publishLesson: vi.fn()
}));

vi.mock("@/lib/lessons/repository", () => ({
  getStudioLesson: repositoryMocks.getStudioLesson,
  publishLesson: repositoryMocks.publishLesson
}));

const completeChecklist = {
  sourceApproved: true,
  noPersonalizedAdvice: true,
  noProductRecommendation: true,
  claimsSupported: true,
  audienceAppropriate: true,
  disclaimerPresent: true,
  respectfulFeedback: true,
  publicMetadataAccurate: true,
  warningsAcknowledged: true,
  reviewedAt: "2026-05-22T00:00:00.000Z"
};

function publishRequest(body: unknown) {
  return new NextRequest("http://localhost/api/lessons/lesson-1/publish", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

function studioLesson(overrides: Partial<StudioLesson> = {}): StudioLesson {
  return {
    id: "lesson-1",
    metadata: sampleLessonMetadata,
    content: sampleLessonContent,
    generationModel: null,
    generationWarnings: [],
    sourceMaterials: [
      {
        id: "source-1",
        title: "Source",
        sourceText: "Approved source text with enough detail to support the lesson.",
        approved: true,
        createdAt: "2026-05-22T00:00:00.000Z"
      }
    ],
    reviewChecklist: completeChecklist,
    createdAt: "2026-05-22T00:00:00.000Z",
    updatedAt: "2026-05-22T00:00:00.000Z",
    publishedAt: null,
    ...overrides
  };
}

describe("lesson publish route", () => {
  beforeEach(() => {
    repositoryMocks.getStudioLesson.mockReset();
    repositoryMocks.publishLesson.mockReset();
  });

  it("publishes valid reviewed lessons with a candidate slug", async () => {
    repositoryMocks.getStudioLesson.mockResolvedValue(studioLesson());
    repositoryMocks.publishLesson.mockResolvedValue("checking-before-acting");

    const response = await POST(publishRequest({ visibility: "public" }), {
      params: Promise.resolve({ id: "lesson-1" })
    });

    await expect(response.json()).resolves.toEqual({
      slug: "checking-before-acting",
      warnings: []
    });
    expect(response.status).toBe(200);
    expect(repositoryMocks.publishLesson).toHaveBeenCalledWith("lesson-1", "public");
  });

  it("returns publish gate errors before updating the lesson", async () => {
    repositoryMocks.getStudioLesson.mockResolvedValue(
      studioLesson({
        reviewChecklist: {
          ...completeChecklist,
          warningsAcknowledged: false
        }
      })
    );

    const response = await POST(publishRequest({ visibility: "unlisted" }), {
      params: Promise.resolve({ id: "lesson-1" })
    });

    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.errors).toContain("All review checklist items must be completed.");
    expect(repositoryMocks.publishLesson).not.toHaveBeenCalled();
  });
});
