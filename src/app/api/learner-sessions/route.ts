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

export async function POST(request: Request) {
  const parsed = learnerSessionRequestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid learner session." },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const supabase = createServiceClient();
  const { data: lessonData, error: lessonError } = await supabase
    .from("lessons")
    .select("id")
    .eq("id", input.lessonId)
    .eq("status", "published")
    .in("visibility", ["public", "unlisted"])
    .maybeSingle();

  if (lessonError) {
    console.error("Failed to validate learner session lesson", lessonError);
    return NextResponse.json({ error: "Unable to record learner session." }, { status: 500 });
  }

  if (!lessonData) {
    return NextResponse.json({ error: "Lesson is not available for learner sessions." }, { status: 400 });
  }

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
    console.error("Failed to record learner session", error);
    return NextResponse.json({ error: "Unable to record learner session." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
