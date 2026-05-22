import { NextResponse } from "next/server";
import { z } from "zod";
import { getOpenAIEnv } from "@/lib/env";
import { createDraftLesson } from "@/lib/lessons/repository";
import { difficultySchema, targetAudienceSchema } from "@/lib/lessons/schema";
import { generateLesson } from "@/lib/openai/generate-lesson";

const generateLessonRequestSchema = z.object({
  topic: z.string().trim().min(1).max(120),
  targetAudience: targetAudienceSchema,
  language: z.string().trim().min(2).max(20),
  difficulty: difficultySchema,
  durationMinutes: z.number().int().min(5).max(180),
  sourceTitle: z.string().trim().min(1).max(200),
  sourceText: z.string().trim().min(1).max(20000)
});

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Failed to generate lesson.";
}

export async function POST(request: Request) {
  try {
    const input = generateLessonRequestSchema.parse(await request.json());
    const content = await generateLesson(input);
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
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}
