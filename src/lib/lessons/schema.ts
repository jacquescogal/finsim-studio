import { z } from "zod";

export const targetAudienceSchema = z.enum(["youth", "adult", "older_adult", "general"]);
export const difficultySchema = z.enum(["introductory", "standard", "advanced"]);
export const visibilitySchema = z.enum(["private", "unlisted", "public"]);
export const statusSchema = z.enum(["draft", "published", "archived"]);

export const choiceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(160),
  feedback: z.string().min(1).max(500),
  nextSceneId: z.string().min(1).nullable()
});

export const sceneSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(900),
  visualPrompt: z.string().max(240).optional(),
  sourceRefs: z.array(z.string().min(1)).default([]),
  choices: z.array(choiceSchema).min(1).max(3)
});

export const knowledgeCheckSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1).max(240),
  options: z.array(z.string().min(1).max(140)).min(2).max(4),
  correctOption: z.string().min(1),
  feedback: z.string().min(1).max(400)
});

export const lessonContentSchema = z.object({
  title: z.string().min(1).max(120),
  summary: z.string().min(1).max(400),
  sourceSummary: z.string().min(1).max(700),
  learningObjectives: z.array(z.string().min(1).max(180)).min(1).max(5),
  targetAudience: targetAudienceSchema,
  readingLevel: z.string().min(1).max(80),
  category: z.string().min(1).max(80),
  tags: z.array(z.string().min(1).max(40)).max(8),
  characters: z.array(z.string().min(1).max(120)).max(5),
  scenes: z.array(sceneSchema).min(1).max(8),
  reflectionPrompts: z.array(z.string().min(1).max(220)).max(4),
  knowledgeChecks: z.array(knowledgeCheckSchema).min(1).max(4),
  disclaimer: z.string().min(20).max(500),
  safetyWarnings: z.array(z.string().min(1).max(240)).default([])
});

export const lessonMetadataSchema = z.object({
  title: z.string().min(1).max(120),
  summary: z.string().min(1).max(400),
  topic: z.string().min(1).max(120),
  category: z.string().min(1).max(80),
  tags: z.array(z.string().min(1).max(40)).max(8),
  language: z.string().min(2).max(20),
  difficulty: difficultySchema,
  targetAudience: targetAudienceSchema,
  status: statusSchema,
  visibility: visibilitySchema,
  publicSlug: z.string().min(1).max(140).nullable(),
  disclaimer: z.string().min(20).max(500),
  publisherDisplayName: z.string().min(1).max(120)
});

export type LessonContent = z.infer<typeof lessonContentSchema>;
export type LessonMetadata = z.infer<typeof lessonMetadataSchema>;
export type LessonScene = z.infer<typeof sceneSchema>;
export type LessonChoice = z.infer<typeof choiceSchema>;
export type TargetAudience = z.infer<typeof targetAudienceSchema>;
export type Difficulty = z.infer<typeof difficultySchema>;
