import { z } from "zod";

export const INVALID_REQUEST_ERROR_CODE = "invalid_request";
export const GENERATION_ERROR_CODE = "generation_failed";
export const SAVE_ERROR_CODE = "save_failed";

export type GenerateLessonErrorCode =
  | typeof INVALID_REQUEST_ERROR_CODE
  | typeof GENERATION_ERROR_CODE
  | typeof SAVE_ERROR_CODE;

type ErrorIssue = {
  path: string;
  message: string;
};

type ErrorResponseBody = {
  code: GenerateLessonErrorCode;
  error: string;
  issues?: ErrorIssue[];
};

export type GenerateLessonErrorResponse = {
  status: 400;
  body: ErrorResponseBody;
};

function mapZodIssues(error: z.ZodError): ErrorIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message
  }));
}

export function mapGenerateLessonError(
  error: unknown,
  code: GenerateLessonErrorCode = GENERATION_ERROR_CODE
): GenerateLessonErrorResponse {
  if (error instanceof z.ZodError || code === INVALID_REQUEST_ERROR_CODE) {
    return {
      status: 400,
      body: {
        code: INVALID_REQUEST_ERROR_CODE,
        error: "Check the lesson setup fields.",
        ...(error instanceof z.ZodError ? { issues: mapZodIssues(error) } : {})
      }
    };
  }

  if (code === SAVE_ERROR_CODE) {
    return {
      status: 400,
      body: {
        code: SAVE_ERROR_CODE,
        error: "The generated lesson could not be saved. Try again later."
      }
    };
  }

  return {
    status: 400,
    body: {
      code: GENERATION_ERROR_CODE,
      error: "Lesson generation is unavailable. Try again later."
    }
  };
}
