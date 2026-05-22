import { describe, expect, it } from "vitest";
import { lessonContentSchema, lessonMetadataSchema } from "./schema";
import { sampleLessonContent, sampleLessonMetadata } from "./sample";

describe("lesson schemas", () => {
  it("accepts the sample lesson metadata and content", () => {
    expect(lessonMetadataSchema.parse(sampleLessonMetadata)).toEqual(sampleLessonMetadata);
    expect(lessonContentSchema.parse(sampleLessonContent)).toEqual(sampleLessonContent);
  });

  it("rejects a scene with more than three choices", () => {
    const invalid = structuredClone(sampleLessonContent);
    invalid.scenes[0].choices = [
      ...invalid.scenes[0].choices,
      { id: "choice_extra_1", label: "Extra", feedback: "Too many.", nextSceneId: "scene_2" },
      { id: "choice_extra_2", label: "Extra again", feedback: "Still too many.", nextSceneId: "scene_2" }
    ];

    expect(() => lessonContentSchema.parse(invalid)).toThrow();
  });

  it("requires an educational disclaimer", () => {
    expect(() => lessonContentSchema.parse({ ...sampleLessonContent, disclaimer: "" })).toThrow();
  });

  it("rejects a knowledge check when correctOption is not one of the options", () => {
    const invalid = structuredClone(sampleLessonContent);
    invalid.knowledgeChecks[0].correctOption = "Send money immediately";

    expect(() => lessonContentSchema.parse(invalid)).toThrow();
  });

  it("rejects a knowledge check with duplicate options", () => {
    const invalid = structuredClone(sampleLessonContent);
    invalid.knowledgeChecks[0].options = [
      "Guaranteed high return",
      "Guaranteed high return",
      "Ask someone trusted"
    ];

    expect(() => lessonContentSchema.parse(invalid)).toThrow();
  });

  it("rejects a choice that points to a missing scene", () => {
    const invalid = structuredClone(sampleLessonContent);
    invalid.scenes[0].choices[0].nextSceneId = "scene_missing";

    expect(() => lessonContentSchema.parse(invalid)).toThrow();
  });

  it("rejects duplicate scene IDs", () => {
    const invalid = structuredClone(sampleLessonContent);
    invalid.scenes[1].id = invalid.scenes[0].id;

    expect(() => lessonContentSchema.parse(invalid)).toThrow();
  });

  it("rejects duplicate choice IDs within a lesson", () => {
    const invalid = structuredClone(sampleLessonContent);
    invalid.scenes[1].choices[0].id = invalid.scenes[0].choices[0].id;

    expect(() => lessonContentSchema.parse(invalid)).toThrow();
  });

  it("rejects an invalid public slug format", () => {
    expect(() =>
      lessonMetadataSchema.parse({ ...sampleLessonMetadata, publicSlug: "Checking Before Acting" })
    ).toThrow();
  });

  it.each(["public", "unlisted"] as const)(
    "requires a public slug for a published %s lesson",
    (visibility) => {
      expect(() =>
        lessonMetadataSchema.parse({
          ...sampleLessonMetadata,
          status: "published",
          visibility,
          publicSlug: null
        })
      ).toThrow();
    }
  );

  it("rejects an empty visual prompt when one is present", () => {
    const invalid = structuredClone(sampleLessonContent);
    invalid.scenes[0].visualPrompt = "";

    expect(() => lessonContentSchema.parse(invalid)).toThrow();
  });

  it("limits source references per scene", () => {
    const invalid = structuredClone(sampleLessonContent);
    invalid.scenes[0].sourceRefs = Array.from({ length: 13 }, (_, index) => `source:${index}`);

    expect(() => lessonContentSchema.parse(invalid)).toThrow();
  });

  it("limits safety warnings per lesson", () => {
    const invalid = structuredClone(sampleLessonContent);
    invalid.safetyWarnings = Array.from({ length: 6 }, (_, index) => `Warning ${index}`);

    expect(() => lessonContentSchema.parse(invalid)).toThrow();
  });
});
