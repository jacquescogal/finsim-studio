import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";

const choiceSchema = z.object({
  sceneId: z.string().trim().min(1).max(120),
  choiceId: z.string().trim().min(1).max(120)
});

const knowledgeCheckResultSchema = z.object({
  checkId: z.string().trim().min(1).max(120),
  selectedOption: z.string().trim().min(1).max(140),
  correct: z.boolean()
});

const learnerSessionRequestSchema = z.object({
  lessonId: z.string().uuid(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
  choices: z.array(choiceSchema).max(40),
  knowledgeCheckResults: z.array(knowledgeCheckResultSchema).max(12),
  confidenceBefore: z.number().int().min(1).max(5).nullable().optional(),
  confidenceAfter: z.number().int().min(1).max(5).nullable().optional()
});

function errorMessage(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? "Invalid learner session.";
  }

  return error instanceof Error ? error.message : "Unable to record learner session.";
}

export async function POST(request: Request) {
  try {
    const input = learnerSessionRequestSchema.parse(await request.json());
    const supabase = createServiceClient();
    const { error } = await supabase.from("learner_sessions").insert({
      lesson_id: input.lessonId,
      started_at: input.startedAt,
      completed_at: input.completedAt,
      choices: input.choices,
      knowledge_check_results: input.knowledgeCheckResults,
      confidence_before: input.confidenceBefore ?? null,
      confidence_after: input.confidenceAfter ?? null
    });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 400 });
  }
}
