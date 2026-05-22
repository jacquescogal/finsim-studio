import { describe, expect, it } from "vitest";
import { sampleLessonContent, sampleLessonMetadata } from "./sample";
import { canPublishLesson } from "./publish";

const completeChecklist = {
  sourceApproved: true,
  noPersonalizedAdvice: true,
  noProductRecommendation: true,
  claimsSupported: true,
  audienceAppropriate: true,
  disclaimerPresent: true,
  respectfulFeedback: true,
  publicMetadataAccurate: true,
  warningsAcknowledged: true
};

describe("canPublishLesson", () => {
  it("allows valid reviewed lessons", () => {
    const result = canPublishLesson({
      metadata: {
        ...sampleLessonMetadata,
        status: "published",
        visibility: "public",
        publicSlug: "checking-before-acting"
      },
      content: sampleLessonContent,
      sourceText: "Approved source text with enough detail to support the lesson.",
      checklist: completeChecklist
    });

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("blocks lessons without source text", () => {
    const result = canPublishLesson({
      metadata: sampleLessonMetadata,
      content: sampleLessonContent,
      sourceText: "",
      checklist: completeChecklist
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("Approved source material is required.");
  });

  it("blocks incomplete checklist items", () => {
    const result = canPublishLesson({
      metadata: sampleLessonMetadata,
      content: sampleLessonContent,
      sourceText: "Approved source text with enough detail to support the lesson.",
      checklist: { ...completeChecklist, noProductRecommendation: false }
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("All review checklist items must be completed.");
  });

  it("blocks missing checklist items at runtime", () => {
    const partialChecklist = {
      sourceApproved: true,
      noPersonalizedAdvice: true,
      noProductRecommendation: true
    };

    const result = canPublishLesson({
      metadata: sampleLessonMetadata,
      content: sampleLessonContent,
      sourceText: "Approved source text with enough detail to support the lesson.",
      checklist: partialChecklist as never
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("All review checklist items must be completed.");
  });
});
