import { NextResponse } from "next/server";
import { z } from "zod";
import {
  updateLessonContent,
  updateReviewChecklist
} from "@/lib/lessons/repository";
import { lessonContentSchema } from "@/lib/lessons/schema";

const checklistSchema = z
  .object({
    sourceApproved: z.boolean().optional(),
    noPersonalizedAdvice: z.boolean().optional(),
    noProductRecommendation: z.boolean().optional(),
    claimsSupported: z.boolean().optional(),
    audienceAppropriate: z.boolean().optional(),
    disclaimerPresent: z.boolean().optional(),
    respectfulFeedback: z.boolean().optional(),
    publicMetadataAccurate: z.boolean().optional(),
    warningsAcknowledged: z.boolean().optional()
  })
  .strict();

const updateLessonRequestSchema = z
  .object({
    content: lessonContentSchema.optional(),
    checklist: checklistSchema.optional()
  })
  .strict()
  .refine((value) => value.content !== undefined || value.checklist !== undefined, {
    message: "No lesson updates provided."
  });

const checklistColumnMap = {
  sourceApproved: "source_approved",
  noPersonalizedAdvice: "no_personalized_advice",
  noProductRecommendation: "no_product_recommendation",
  claimsSupported: "claims_supported",
  audienceAppropriate: "audience_appropriate",
  disclaimerPresent: "disclaimer_present",
  respectfulFeedback: "respectful_feedback",
  publicMetadataAccurate: "public_metadata_accurate",
  warningsAcknowledged: "warnings_acknowledged"
} as const;

function errorMessage(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? "Invalid lesson update request.";
  }

  return error instanceof Error ? error.message : "Invalid lesson update request.";
}

function mapChecklistColumns(checklist: z.infer<typeof checklistSchema>) {
  const values: Record<string, boolean> = {};

  Object.entries(checklistColumnMap).forEach(([key, column]) => {
    const value = checklist[key as keyof typeof checklistColumnMap];

    if (value !== undefined) {
      values[column] = value;
    }
  });

  return values;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = updateLessonRequestSchema.parse(await request.json());

    if (body.content) {
      await updateLessonContent(id, body.content);
    }

    if (body.checklist) {
      const checklistValues = mapChecklistColumns(body.checklist);

      if (Object.keys(checklistValues).length === 0) {
        throw new Error("No checklist updates provided.");
      }

      await updateReviewChecklist(id, checklistValues);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 400 });
  }
}
