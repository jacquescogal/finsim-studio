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
});
