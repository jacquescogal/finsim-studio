import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getStudioLesson,
  publishLesson
} from "@/lib/lessons/repository";
import { canPublishLesson } from "@/lib/lessons/publish";
import { createSlug } from "@/lib/lessons/slug";

const publishRequestSchema = z.object({
  visibility: z.enum(["public", "unlisted"])
});

function errorMessage(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? "Invalid publish request.";
  }

  return error instanceof Error ? error.message : "Invalid publish request.";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { visibility } = publishRequestSchema.parse(await request.json());
    const lesson = await getStudioLesson(id);

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found." }, { status: 400 });
    }

    const sourceText = lesson.sourceMaterials[0]?.sourceText ?? "";
    const validation = canPublishLesson({
      metadata: {
        ...lesson.metadata,
        status: "published",
        visibility,
        publicSlug: lesson.metadata.publicSlug ?? createSlug(lesson.metadata.title)
      },
      content: lesson.content,
      sourceText,
      checklist: lesson.reviewChecklist
    });

    if (!validation.ok) {
      return NextResponse.json(
        { errors: validation.errors, warnings: validation.warnings },
        { status: 400 }
      );
    }

    const slug = await publishLesson(id, visibility);

    return NextResponse.json({ slug, warnings: validation.warnings });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 400 });
  }
}
