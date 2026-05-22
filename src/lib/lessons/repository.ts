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

type SourceMaterialInput = {
  title: string;
  sourceText: string;
  approved?: boolean;
};

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

export async function createDraftLesson(input: CreateLessonInput) {
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

  if (input.sourceMaterials.length > 0) {
    const { error: sourceError } = await supabase.from("source_materials").insert(
      input.sourceMaterials.map((source) => ({
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

  return getStudioLesson(lesson.id);
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
