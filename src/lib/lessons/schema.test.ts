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
});
