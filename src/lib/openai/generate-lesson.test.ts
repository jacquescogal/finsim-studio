import { describe, expect, it } from "vitest";
import { sampleLessonContent } from "@/lib/lessons/sample";
import { buildLessonPrompt, parseGeneratedLesson } from "./generate-lesson";

describe("lesson generation helpers", () => {
  it("builds a prompt with source-grounding rules", () => {
    const prompt = buildLessonPrompt({
      topic: "Avoiding scams",
      targetAudience: "older_adult",
      language: "en",
      difficulty: "introductory",
      durationMinutes: 20,
      sourceTitle: "Approved guide",
      sourceText: "High return with no risk is a warning sign."
    });

    expect(prompt).toContain("Use only the provided source text");
    expect(prompt).toContain("Do not provide personalized financial advice");
    expect(prompt).toContain("older_adult");
  });

  it("parses schema-valid generated content", () => {
    expect(parseGeneratedLesson(sampleLessonContent)).toEqual(sampleLessonContent);
  });

  it("rejects invalid generated content", () => {
    expect(() => parseGeneratedLesson({ title: "Incomplete" })).toThrow();
  });
});
