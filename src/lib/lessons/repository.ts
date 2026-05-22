import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import {
  lessonContentSchema,
  lessonMetadataSchema,
  type Difficulty,
  type LessonContent,
  type LessonMetadata,
  type TargetAudience
} from "./schema";
import { nextAvailableSlug } from "./slug";

type LessonRow = {
  id: string;
  title: string;
  summary: string;
  topic: string;
  category: string;
  tags: string[];
  language: string;
  difficulty: Difficulty;
  target_audience: TargetAudience;
  status: LessonMetadata["status"];
  visibility: LessonMetadata["visibility"];
  public_slug: string | null;
  disclaimer: string;
  publisher_display_name: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

type LessonContentRow = {
  lesson_id: string;
  content: unknown;
  generation_model: string | null;
  generation_warnings: string[];
  created_at: string;
  updated_at: string;
};

type SourceMaterialRow = {
  id: string;
  lesson_id: string;
  title: string;
  source_text: string;
  approved: boolean;
  created_at: string;
};

type ReviewChecklistRow = {
  lesson_id: string;
  source_approved: boolean;
  no_personalized_advice: boolean;
  no_product_recommendation: boolean;
  claims_supported: boolean;
  audience_appropriate: boolean;
  disclaimer_present: boolean;
  respectful_feedback: boolean;
  public_metadata_accurate: boolean;
  warnings_acknowledged: boolean;
  reviewed_at: string | null;
};

const reviewChecklistUpdateSchema = z
  .object({
    source_approved: z.boolean().optional(),
    no_personalized_advice: z.boolean().optional(),
    no_product_recommendation: z.boolean().optional(),
    claims_supported: z.boolean().optional(),
    audience_appropriate: z.boolean().optional(),
    disclaimer_present: z.boolean().optional(),
    respectful_feedback: z.boolean().optional(),
    public_metadata_accurate: z.boolean().optional(),
    warnings_acknowledged: z.boolean().optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "At least one checklist value is required.");

type SourceMaterialInput = {
  title: string;
  sourceText: string;
  approved?: boolean;
};

type SupabaseServiceClient = ReturnType<typeof createServiceClient>;

const sourceMaterialInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  sourceText: z.string().trim().min(1).max(20000),
  approved: z.boolean().optional()
});

export type CreateLessonInput = {
  title: string;
  summary: string;
  topic: string;
  category: string;
  tags?: string[];
  language?: string;
  difficulty: Difficulty;
  targetAudience: TargetAudience;
  disclaimer: string;
  publisherDisplayName?: string;
  content: LessonContent;
  sourceMaterials: SourceMaterialInput[];
  generationModel?: string | null;
  generationWarnings?: string[];
};

export type LessonRecord = {
  id: string;
  metadata: LessonMetadata;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

export type LessonContentRecord = LessonRecord & {
  content: LessonContent;
  generationModel: string | null;
  generationWarnings: string[];
};

export type StudioLesson = LessonContentRecord & {
  sourceMaterials: Array<{
    id: string;
    title: string;
    sourceText: string;
    approved: boolean;
    createdAt: string;
  }>;
  reviewChecklist: {
    sourceApproved: boolean;
    noPersonalizedAdvice: boolean;
    noProductRecommendation: boolean;
    claimsSupported: boolean;
    audienceAppropriate: boolean;
    disclaimerPresent: boolean;
    respectfulFeedback: boolean;
    publicMetadataAccurate: boolean;
    warningsAcknowledged: boolean;
    reviewedAt: string | null;
  } | null;
};

function assertSupabaseSuccess(error: { message: string } | null, action: string): asserts error is null {
  if (error) {
    throw new Error(`${action}: ${error.message}`);
  }
}

function assertSupabaseData<T>(data: T | null, action: string): asserts data is T {
  if (!data) {
    throw new Error(`${action}: no data returned`);
  }
}

function assertUpdatedRow<T>(data: T | null, message: string): asserts data is T {
  if (!data) {
    throw new Error(message);
  }
}

async function deleteCreatedLessonAfterFailure(
  supabase: SupabaseServiceClient,
  lessonId: string,
  cause: unknown
): Promise<never> {
  const { error } = await supabase.from("lessons").delete().eq("id", lessonId);

  if (error) {
    throw new Error(`Failed to create draft lesson and cleanup failed: ${error.message}`, { cause });
  }

  throw cause;
}

function mapLessonRow(row: LessonRow): LessonRecord {
  const metadata = lessonMetadataSchema.parse({
    title: row.title,
    summary: row.summary,
    topic: row.topic,
    category: row.category,
    tags: row.tags,
    language: row.language,
    difficulty: row.difficulty,
    targetAudience: row.target_audience,
    status: row.status,
    visibility: row.visibility,
    publicSlug: row.public_slug,
    disclaimer: row.disclaimer,
    publisherDisplayName: row.publisher_display_name
  });

  return {
    id: row.id,
    metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at
  };
}

function mapLessonContent(row: LessonRow, contentRow: LessonContentRow): LessonContentRecord {
  return {
    ...mapLessonRow(row),
    content: lessonContentSchema.parse(contentRow.content),
    generationModel: contentRow.generation_model,
    generationWarnings: contentRow.generation_warnings
  };
}

function mapStudioLesson(
  row: LessonRow,
  contentRow: LessonContentRow,
  sourceRows: SourceMaterialRow[],
  reviewRow: ReviewChecklistRow | null
): StudioLesson {
  return {
    ...mapLessonContent(row, contentRow),
    sourceMaterials: sourceRows.map((sourceRow) => ({
      id: sourceRow.id,
      title: sourceRow.title,
      sourceText: sourceRow.source_text,
      approved: sourceRow.approved,
      createdAt: sourceRow.created_at
    })),
    reviewChecklist: reviewRow
      ? {
          sourceApproved: reviewRow.source_approved,
          noPersonalizedAdvice: reviewRow.no_personalized_advice,
          noProductRecommendation: reviewRow.no_product_recommendation,
          claimsSupported: reviewRow.claims_supported,
          audienceAppropriate: reviewRow.audience_appropriate,
          disclaimerPresent: reviewRow.disclaimer_present,
          respectfulFeedback: reviewRow.respectful_feedback,
          publicMetadataAccurate: reviewRow.public_metadata_accurate,
          warningsAcknowledged: reviewRow.warnings_acknowledged,
          reviewedAt: reviewRow.reviewed_at
        }
      : null
  };
}

export async function listPublicLessons() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("status", "published")
    .eq("visibility", "public")
    .order("published_at", { ascending: false });

  assertSupabaseSuccess(error, "Failed to list public lessons");

  return (data as LessonRow[]).map(mapLessonRow);
}

export async function listStudioLessons() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .in("status", ["draft", "review", "published"])
    .order("updated_at", { ascending: false });

  assertSupabaseSuccess(error, "Failed to list studio lessons");

  return (data as LessonRow[]).map(mapLessonRow);
}

export async function getPublishedLessonBySlug(slug: string) {
  const supabase = createServiceClient();
  const { data, error: lessonError } = await supabase
    .from("lessons")
    .select("*")
    .eq("public_slug", slug)
    .eq("status", "published")
    .in("visibility", ["public", "unlisted"])
    .maybeSingle();

  assertSupabaseSuccess(lessonError, "Failed to fetch published lesson");

  const lesson = data as LessonRow | null;

  if (!lesson) {
    return null;
  }

  const { data: contentData, error: contentError } = await supabase
    .from("lesson_content")
    .select("*")
    .eq("lesson_id", lesson.id)
    .single();

  assertSupabaseSuccess(contentError, "Failed to fetch lesson content");

  const content = contentData as LessonContentRow | null;
  assertSupabaseData(content, "Failed to fetch lesson content");

  return mapLessonContent(lesson, content);
}

export async function getStudioLesson(id: string) {
  const supabase = createServiceClient();
  const { data, error: lessonError } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  assertSupabaseSuccess(lessonError, "Failed to fetch studio lesson");

  const lesson = data as LessonRow | null;

  if (!lesson) {
    return null;
  }

  const { data: contentData, error: contentError } = await supabase
    .from("lesson_content")
    .select("*")
    .eq("lesson_id", lesson.id)
    .single();

  assertSupabaseSuccess(contentError, "Failed to fetch studio lesson content");
  const content = contentData as LessonContentRow | null;
  assertSupabaseData(content, "Failed to fetch studio lesson content");

  const { data: sourceMaterialData, error: sourceError } = await supabase
    .from("source_materials")
    .select("*")
    .eq("lesson_id", lesson.id)
    .order("created_at", { ascending: true });

  assertSupabaseSuccess(sourceError, "Failed to fetch source materials");

  const { data: reviewChecklistData, error: reviewError } = await supabase
    .from("review_checklists")
    .select("*")
    .eq("lesson_id", lesson.id)
    .maybeSingle();

  assertSupabaseSuccess(reviewError, "Failed to fetch review checklist");

  const sourceMaterials = sourceMaterialData as SourceMaterialRow[];
  const reviewChecklist = reviewChecklistData as ReviewChecklistRow | null;

  return mapStudioLesson(lesson, content, sourceMaterials, reviewChecklist);
}

export async function createDraftLesson(input: CreateLessonInput): Promise<StudioLesson> {
  const supabase = createServiceClient();
  const metadata = lessonMetadataSchema.parse({
    title: input.title,
    summary: input.summary,
    topic: input.topic,
    category: input.category,
    tags: input.tags ?? [],
    language: input.language ?? "en",
    difficulty: input.difficulty,
    targetAudience: input.targetAudience,
    status: "draft",
    visibility: "private",
    publicSlug: null,
    disclaimer: input.disclaimer,
    publisherDisplayName: input.publisherDisplayName ?? "Community Financial Learning Lab"
  });
  const content = lessonContentSchema.parse(input.content);
  const sourceMaterials = z.array(sourceMaterialInputSchema).parse(input.sourceMaterials);

  const { data: lessonData, error: lessonError } = await supabase
    .from("lessons")
    .insert({
      title: metadata.title,
      summary: metadata.summary,
      topic: metadata.topic,
      category: metadata.category,
      tags: metadata.tags,
      language: metadata.language,
      difficulty: metadata.difficulty,
      target_audience: metadata.targetAudience,
      status: metadata.status,
      visibility: metadata.visibility,
      public_slug: metadata.publicSlug,
      disclaimer: metadata.disclaimer,
      publisher_display_name: metadata.publisherDisplayName
    })
    .select("*")
    .single();

  assertSupabaseSuccess(lessonError, "Failed to create draft lesson");
  const lesson = lessonData as LessonRow | null;
  assertSupabaseData(lesson, "Failed to create draft lesson");

  try {
    if (sourceMaterials.length > 0) {
      const { error: sourceError } = await supabase.from("source_materials").insert(
        sourceMaterials.map((source) => ({
          lesson_id: lesson.id,
          title: source.title,
          source_text: source.sourceText,
          approved: source.approved ?? true
        }))
      );

      assertSupabaseSuccess(sourceError, "Failed to create source materials");
    }

    const { error: contentError } = await supabase.from("lesson_content").insert({
      lesson_id: lesson.id,
      content,
      generation_model: input.generationModel ?? null,
      generation_warnings: input.generationWarnings ?? []
    });

    assertSupabaseSuccess(contentError, "Failed to create lesson content");

    const { error: reviewError } = await supabase.from("review_checklists").insert({
      lesson_id: lesson.id
    });

    assertSupabaseSuccess(reviewError, "Failed to create review checklist");

    const createdLesson = await getStudioLesson(lesson.id);

    if (!createdLesson) {
      throw new Error("Failed to fetch created draft lesson");
    }

    return createdLesson;
  } catch (error) {
    return deleteCreatedLessonAfterFailure(supabase, lesson.id, error);
  }
}

export async function publicSlugExists(candidate: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("lessons")
    .select("id")
    .eq("public_slug", candidate)
    .maybeSingle();

  assertSupabaseSuccess(error, "Failed to check public slug");

  return (data as { id: string } | null) !== null;
}

export async function allocatePublicSlug(title: string) {
  return nextAvailableSlug(title, publicSlugExists);
}

export async function updateLessonContent(lessonId: string, content: LessonContent) {
  const supabase = createServiceClient();
  const validatedContent = lessonContentSchema.parse(content);
  const updatedAt = new Date().toISOString();

  const { data: contentData, error: contentError } = await supabase
    .from("lesson_content")
    .update({
      content: validatedContent,
      updated_at: updatedAt
    })
    .eq("lesson_id", lessonId)
    .select("lesson_id")
    .maybeSingle();

  assertSupabaseSuccess(contentError, "Failed to update lesson content");
  assertUpdatedRow(contentData as { lesson_id: string } | null, "Lesson not found.");

  const { data: lessonData, error: lessonError } = await supabase
    .from("lessons")
    .update({
      title: validatedContent.title,
      summary: validatedContent.summary,
      category: validatedContent.category,
      tags: validatedContent.tags,
      target_audience: validatedContent.targetAudience,
      disclaimer: validatedContent.disclaimer,
      updated_at: updatedAt
    })
    .eq("id", lessonId)
    .select("id")
    .maybeSingle();

  assertSupabaseSuccess(lessonError, "Failed to update lesson metadata");
  assertUpdatedRow(lessonData as { id: string } | null, "Lesson not found.");
}

export async function updateReviewChecklist(lessonId: string, values: Record<string, boolean>) {
  const supabase = createServiceClient();
  const checklistValues = reviewChecklistUpdateSchema.parse(values);

  const { data, error } = await supabase
    .from("review_checklists")
    .update({
      ...checklistValues,
      reviewed_at: new Date().toISOString()
    })
    .eq("lesson_id", lessonId)
    .select("lesson_id")
    .maybeSingle();

  assertSupabaseSuccess(error, "Failed to update review checklist");
  assertUpdatedRow(data as { lesson_id: string } | null, "Review checklist not found.");
}

export async function publishLesson(lessonId: string, visibility: "public" | "unlisted") {
  const supabase = createServiceClient();
  const lesson = await getStudioLesson(lessonId);

  if (!lesson) {
    throw new Error("Lesson not found.");
  }

  const slug = lesson.metadata.publicSlug ?? (await allocatePublicSlug(lesson.metadata.title));
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("lessons")
    .update({
      status: "published",
      visibility,
      public_slug: slug,
      published_at: now,
      updated_at: now
    })
    .eq("id", lessonId)
    .select("public_slug")
    .single();

  assertSupabaseSuccess(error, "Failed to publish lesson");

  const published = data as { public_slug: string | null } | null;
  assertSupabaseData(published, "Failed to publish lesson");

  if (!published.public_slug) {
    throw new Error("Failed to publish lesson: no slug returned");
  }

  return published.public_slug;
}
