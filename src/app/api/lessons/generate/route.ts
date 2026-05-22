import { NextResponse } from "next/server";
import { z } from "zod";
import { getOpenAIEnv } from "@/lib/env";
import { createDraftLesson } from "@/lib/lessons/repository";
import { difficultySchema, targetAudienceSchema } from "@/lib/lessons/schema";
import { generateLesson } from "@/lib/openai/generate-lesson";
import { GENERATION_ERROR_CODE, INVALID_REQUEST_ERROR_CODE, SAVE_ERROR_CODE, mapGenerateLessonError, type GenerateLessonErrorCode } from "./errors";

const generateLessonRequestSchema = z.object({
  topic: z.string().trim().min(1).max(120),
  targetAudience: targetAudienceSchema,
  language: z.string().trim().min(2).max(20),
  difficulty: difficultySchema,
  durationMinutes: z.number().int().min(5).max(180),
  sourceTitle: z.string().trim().min(1).max(200),
  sourceText: z.string().trim().min(1).max(20000)
});

function jsonError(error: unknown, code: GenerateLessonErrorCode = GENERATION_ERROR_CODE) {
  const mapped = mapGenerateLessonError(error, code);

  return NextResponse.json(mapped.body, { status: mapped.status });
}

export async function POST(request: Request) {
  let input: z.infer<typeof generateLessonRequestSchema>;

  try {
    input = generateLessonRequestSchema.parse(await request.json());
  } catch (error) {
    return jsonError(error, INVALID_REQUEST_ERROR_CODE);
  }

  let content: Awaited<ReturnType<typeof generateLesson>>;

  try {
    content = await generateLesson(input);
  } catch (error) {
    return jsonError(error, GENERATION_ERROR_CODE);
  }

  try {
    const env = getOpenAIEnv();
    const lesson = await createDraftLesson({
      title: content.title,
      summary: content.summary,
      topic: input.topic,
      category: content.category,
      tags: content.tags,
      language: input.language,
      difficulty: input.difficulty,
      targetAudience: input.targetAudience,
      disclaimer: content.disclaimer,
      content,
      sourceMaterials: [
        {
          title: input.sourceTitle,
          sourceText: input.sourceText,
          approved: true
        }
      ],
      generationModel: env.OPENAI_MODEL,
      generationWarnings: content.safetyWarnings
    });

    return NextResponse.json({ lessonId: lesson.id });
  } catch (error) {
    return jsonError(error, SAVE_ERROR_CODE);
  }
}
