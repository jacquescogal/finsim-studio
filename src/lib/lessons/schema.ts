import { z } from "zod";

const boundedText = (min: number, max: number) => z.string().trim().min(min).max(max);
const nonBlankString = (max: number) => boundedText(1, max);

export const targetAudienceSchema = z.enum(["youth", "adult", "older_adult", "general"]);
export const difficultySchema = z.enum(["introductory", "standard", "advanced"]);
export const visibilitySchema = z.enum(["private", "unlisted", "public"]);
export const statusSchema = z.enum(["draft", "review", "published", "archived"]);

export const choiceSchema = z.object({
  id: nonBlankString(120),
  label: nonBlankString(160),
  feedback: nonBlankString(500),
  nextSceneId: nonBlankString(120).nullable()
});

export const sceneSchema = z.object({
  id: nonBlankString(120),
  title: nonBlankString(120),
  body: nonBlankString(900),
  visualPrompt: nonBlankString(240).optional(),
  sourceRefs: z.array(nonBlankString(120)).max(12).default([]),
  choices: z.array(choiceSchema).min(1).max(3)
});

export const knowledgeCheckSchema = z.object({
  id: nonBlankString(120),
  question: nonBlankString(240),
  options: z.array(nonBlankString(140)).min(2).max(4),
  correctOption: nonBlankString(140),
  feedback: nonBlankString(400)
}).superRefine((knowledgeCheck, context) => {
  if (!knowledgeCheck.options.includes(knowledgeCheck.correctOption)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "correctOption must match one of the options",
      path: ["correctOption"]
    });
  }

  const optionSet = new Set(knowledgeCheck.options.map((option) => option.trim()));
  if (optionSet.size !== knowledgeCheck.options.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "options must be unique",
      path: ["options"]
    });
  }
});

export const lessonContentSchema = z.object({
  title: nonBlankString(120),
  summary: nonBlankString(400),
  sourceSummary: nonBlankString(700),
  learningObjectives: z.array(nonBlankString(180)).min(1).max(5),
  targetAudience: targetAudienceSchema,
  readingLevel: nonBlankString(80),
  category: nonBlankString(80),
  tags: z.array(nonBlankString(40)).max(8),
  characters: z.array(nonBlankString(120)).max(5),
  scenes: z.array(sceneSchema).min(1).max(8),
  reflectionPrompts: z.array(nonBlankString(220)).max(4),
  knowledgeChecks: z.array(knowledgeCheckSchema).min(1).max(4),
  disclaimer: boundedText(20, 500),
  safetyWarnings: z.array(nonBlankString(240)).max(5).default([])
}).superRefine((lesson, context) => {
  const sceneIds = new Set<string>();
  const choiceIds = new Set<string>();

  lesson.scenes.forEach((scene, sceneIndex) => {
    if (sceneIds.has(scene.id)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "scene IDs must be unique",
        path: ["scenes", sceneIndex, "id"]
      });
    }

    sceneIds.add(scene.id);
  });

  lesson.scenes.forEach((scene, sceneIndex) => {
    scene.choices.forEach((choice, choiceIndex) => {
      if (choiceIds.has(choice.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "choice IDs must be unique within a lesson",
          path: ["scenes", sceneIndex, "choices", choiceIndex, "id"]
        });
      }

      choiceIds.add(choice.id);

      if (choice.nextSceneId !== null && !sceneIds.has(choice.nextSceneId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "nextSceneId must reference an existing scene",
          path: ["scenes", sceneIndex, "choices", choiceIndex, "nextSceneId"]
        });
      }
    });
  });
});

export const lessonMetadataSchema = z.object({
  title: nonBlankString(120),
  summary: nonBlankString(400),
  topic: nonBlankString(120),
  category: nonBlankString(80),
  tags: z.array(nonBlankString(40)).max(8),
  language: boundedText(2, 20),
  difficulty: difficultySchema,
  targetAudience: targetAudienceSchema,
  status: statusSchema,
  visibility: visibilitySchema,
  publicSlug: z.string().min(1).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).nullable(),
  disclaimer: boundedText(20, 500),
  publisherDisplayName: nonBlankString(120)
}).superRefine((metadata, context) => {
  if (metadata.status === "published" && metadata.visibility !== "private" && metadata.publicSlug === null) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "published public or unlisted lessons must have a publicSlug",
      path: ["publicSlug"]
    });
  }
});

export type LessonContent = z.infer<typeof lessonContentSchema>;
export type LessonMetadata = z.infer<typeof lessonMetadataSchema>;
export type LessonScene = z.infer<typeof sceneSchema>;
export type LessonChoice = z.infer<typeof choiceSchema>;
export type TargetAudience = z.infer<typeof targetAudienceSchema>;
export type Difficulty = z.infer<typeof difficultySchema>;
