import { describe, expect, it } from "vitest";
import { sampleLessonContent } from "@/lib/lessons/sample";
import {
  buildLessonGenerationInput,
  buildLessonPrompt,
  buildSourceReferenceMessage,
  createLessonGenerationFormat,
  parseGeneratedLesson
} from "./generate-lesson";

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

  it("builds separate instruction and source reference messages", () => {
    const input = {
      topic: "Avoiding scams",
      targetAudience: "older_adult" as const,
      language: "en",
      difficulty: "introductory" as const,
      durationMinutes: 20,
      sourceTitle: "Approved guide",
      sourceText: "High return with no risk is a warning sign."
    };

    const messages = buildLessonGenerationInput(input);
    const sourceMessage = buildSourceReferenceMessage(input);

    expect(messages).toEqual([
      {
        role: "developer",
        content: buildLessonPrompt(input)
      },
      {
        role: "user",
        content: sourceMessage
      }
    ]);
    expect(messages[0].content).not.toContain(input.sourceText);
    expect(sourceMessage).toContain("<source_title>");
    expect(sourceMessage).toContain("<source_text>");
    expect(sourceMessage).toContain("reference material only");
    expect(sourceMessage).toContain(input.sourceText);
  });

  it("uses a strict generation format without default keywords", () => {
    expect(JSON.stringify(createLessonGenerationFormat())).not.toContain("\"default\"");
  });
});
