import { runSafetyChecks } from "@/lib/safety/checks";
import {
  lessonContentSchema,
  lessonMetadataSchema,
  type LessonContent,
  type LessonMetadata
} from "./schema";

export type ReviewChecklist = {
  sourceApproved: boolean;
  noPersonalizedAdvice: boolean;
  noProductRecommendation: boolean;
  claimsSupported: boolean;
  audienceAppropriate: boolean;
  disclaimerPresent: boolean;
  respectfulFeedback: boolean;
  publicMetadataAccurate: boolean;
  warningsAcknowledged: boolean;
};

export type PublishInput = {
  metadata: LessonMetadata;
  content: LessonContent;
  sourceText: string;
  checklist: ReviewChecklist;
};

const reviewChecklistKeys = [
  "sourceApproved",
  "noPersonalizedAdvice",
  "noProductRecommendation",
  "claimsSupported",
  "audienceAppropriate",
  "disclaimerPresent",
  "respectfulFeedback",
  "publicMetadataAccurate",
  "warningsAcknowledged"
] as const;

export function canPublishLesson(input: PublishInput) {
  const errors: string[] = [];
  const warnings: string[] = [];

  const metadata = lessonMetadataSchema.safeParse(input.metadata);
  const content = lessonContentSchema.safeParse(input.content);

  if (!metadata.success) errors.push("Lesson metadata is invalid.");
  if (!content.success) errors.push("Lesson content is invalid.");
  if (input.sourceText.trim().length < 40) {
    errors.push("Approved source material is required.");
  }

  const checklistComplete = reviewChecklistKeys.every(
    (key) => input.checklist[key] === true
  );
  if (!checklistComplete) errors.push("All review checklist items must be completed.");

  if (content.success) {
    const checks = runSafetyChecks(content.data);
    errors.push(...checks.blocking);
    warnings.push(...checks.warnings, ...checks.suggestions);
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings
  };
}
