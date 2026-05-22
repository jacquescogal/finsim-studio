import { describe, expect, it } from "vitest";
import { z } from "zod";
import { GENERATION_ERROR_CODE, SAVE_ERROR_CODE, mapGenerateLessonError } from "./errors";

describe("generate lesson route error mapping", () => {
  it("maps validation errors to stable invalid request responses", () => {
    const error = new z.ZodError([
      {
        code: z.ZodIssueCode.too_small,
        minimum: 1,
        type: "string",
        inclusive: true,
        exact: false,
        message: "String must contain at least 1 character(s)",
        path: ["topic"]
      }
    ]);

    expect(mapGenerateLessonError(error)).toEqual({
      status: 400,
      body: {
        code: "invalid_request",
        error: "Check the lesson setup fields.",
        issues: [
          {
            path: "topic",
            message: "String must contain at least 1 character(s)"
          }
        ]
      }
    });
  });

  it("maps generation and save failures without exposing internals", () => {
    expect(mapGenerateLessonError(new Error("OPENAI_API_KEY is required to generate lessons."))).toEqual({
      status: 400,
      body: {
        code: "generation_failed",
        error: "Lesson generation is unavailable. Try again later."
      }
    });

    expect(mapGenerateLessonError(new Error("duplicate key value violates constraint"), SAVE_ERROR_CODE)).toEqual({
      status: 400,
      body: {
        code: "save_failed",
        error: "The generated lesson could not be saved. Try again later."
      }
    });

    expect(mapGenerateLessonError(new Error("provider timeout"), GENERATION_ERROR_CODE).body.error).toBe(
      "Lesson generation is unavailable. Try again later."
    );
  });
});
