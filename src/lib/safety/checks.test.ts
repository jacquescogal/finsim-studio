import { describe, expect, it } from "vitest";
import { sampleLessonContent } from "@/lib/lessons/sample";
import { runSafetyChecks } from "./checks";

describe("runSafetyChecks", () => {
  it("flags advice-like language as blocking", () => {
    const content = {
      ...sampleLessonContent,
      scenes: [
        {
          ...sampleLessonContent.scenes[0],
          body: "You should invest all your savings in this plan."
        },
        sampleLessonContent.scenes[1]
      ]
    };

    const result = runSafetyChecks(content);

    expect(result.blocking).toContain("Advice-like language appears in the lesson.");
  });

  it("flags missing source references as warnings", () => {
    const content = {
      ...sampleLessonContent,
      scenes: sampleLessonContent.scenes.map((scene) => ({ ...scene, sourceRefs: [] }))
    };

    const result = runSafetyChecks(content);

    expect(result.warnings).toContain("One or more scenes have no source references.");
  });

  it("scans knowledge checks and reflection prompts for advice-like language", () => {
    const content = {
      ...sampleLessonContent,
      reflectionPrompts: ["Why should you buy ABC stock today?"],
      knowledgeChecks: [
        {
          ...sampleLessonContent.knowledgeChecks[0],
          feedback: "I recommend investing in Fund X."
        }
      ]
    };

    const result = runSafetyChecks(content);

    expect(result.blocking).toContain("Advice-like language appears in the lesson.");
  });

  it("flags common recommendation phrasing as blocking", () => {
    const content = {
      ...sampleLessonContent,
      sourceSummary: "Move your savings into this plan for better results."
    };

    const result = runSafetyChecks(content);

    expect(result.blocking).toContain("Advice-like language appears in the lesson.");
  });

  it("suggests shortening long scene bodies", () => {
    const content = {
      ...sampleLessonContent,
      scenes: [
        {
          ...sampleLessonContent.scenes[0],
          body: "A".repeat(701)
        },
        sampleLessonContent.scenes[1]
      ]
    };

    const result = runSafetyChecks(content);

    expect(result.suggestions).toContain("One or more scenes may be too long for the learner player.");
  });
});
