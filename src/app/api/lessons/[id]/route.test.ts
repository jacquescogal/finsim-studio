import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleLessonContent } from "@/lib/lessons/sample";
import { PATCH } from "./route";

const repositoryMocks = vi.hoisted(() => ({
  updateLessonContent: vi.fn(),
  updateReviewChecklist: vi.fn()
}));

vi.mock("@/lib/lessons/repository", () => ({
  updateLessonContent: repositoryMocks.updateLessonContent,
  updateReviewChecklist: repositoryMocks.updateReviewChecklist
}));

function patchRequest(body: unknown) {
  return new NextRequest("http://localhost/api/lessons/lesson-1", {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

describe("lesson update route", () => {
  beforeEach(() => {
    repositoryMocks.updateLessonContent.mockReset();
    repositoryMocks.updateReviewChecklist.mockReset();
  });

  it("updates validated lesson content", async () => {
    const response = await PATCH(patchRequest({ content: sampleLessonContent }), {
      params: Promise.resolve({ id: "lesson-1" })
    });

    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(response.status).toBe(200);
    expect(repositoryMocks.updateLessonContent).toHaveBeenCalledWith("lesson-1", sampleLessonContent);
    expect(repositoryMocks.updateReviewChecklist).not.toHaveBeenCalled();
  });

  it("maps checklist keys to database column names", async () => {
    const response = await PATCH(
      patchRequest({
        checklist: {
          sourceApproved: true,
          noPersonalizedAdvice: true,
          noProductRecommendation: false
        }
      }),
      { params: Promise.resolve({ id: "lesson-1" }) }
    );

    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(repositoryMocks.updateReviewChecklist).toHaveBeenCalledWith("lesson-1", {
      source_approved: true,
      no_personalized_advice: true,
      no_product_recommendation: false
    });
  });

  it("rejects requests without editable fields", async () => {
    const response = await PATCH(patchRequest({}), {
      params: Promise.resolve({ id: "lesson-1" })
    });

    await expect(response.json()).resolves.toEqual({ error: "No lesson updates provided." });
    expect(response.status).toBe(400);
    expect(repositoryMocks.updateLessonContent).not.toHaveBeenCalled();
    expect(repositoryMocks.updateReviewChecklist).not.toHaveBeenCalled();
  });

  it("rejects an empty checklist before applying content updates", async () => {
    const response = await PATCH(patchRequest({ content: sampleLessonContent, checklist: {} }), {
      params: Promise.resolve({ id: "lesson-1" })
    });

    await expect(response.json()).resolves.toEqual({ error: "No checklist updates provided." });
    expect(response.status).toBe(400);
    expect(repositoryMocks.updateLessonContent).not.toHaveBeenCalled();
    expect(repositoryMocks.updateReviewChecklist).not.toHaveBeenCalled();
  });
});
