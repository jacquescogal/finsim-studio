import type { LessonContent } from "@/lib/lessons/schema";

const advicePatterns = [
  /\byou should invest\b/i,
  /\binvest all\b/i,
  /\bbuy this\b/i,
  /\bguaranteed profit\b/i,
  /\bspecific provider\b/i,
  /\bi recommend (?:buying|investing|moving|putting)\b/i,
  /\byou should buy\b/i,
  /\bmove your savings into\b/i,
  /\bput your savings into\b/i
];

export type SafetyCheckResult = {
  blocking: string[];
  warnings: string[];
  suggestions: string[];
};

function visibleLessonText(content: LessonContent) {
  return [
    content.title,
    content.summary,
    content.sourceSummary,
    content.disclaimer,
    ...content.learningObjectives,
    ...content.characters,
    ...content.reflectionPrompts,
    ...content.safetyWarnings,
    ...content.knowledgeChecks.flatMap((check) => [
      check.question,
      check.correctOption,
      check.feedback,
      ...check.options
    ]),
    ...content.scenes.flatMap((scene) => [
      scene.title,
      scene.body,
      scene.visualPrompt ?? "",
      ...scene.sourceRefs,
      ...scene.choices.flatMap((choice) => [choice.label, choice.feedback])
    ])
  ].join("\n");
}

export function runSafetyChecks(content: LessonContent): SafetyCheckResult {
  const text = visibleLessonText(content);

  const blocking = advicePatterns.some((pattern) => pattern.test(text))
    ? ["Advice-like language appears in the lesson."]
    : [];

  const warnings = content.scenes.some((scene) => scene.sourceRefs.length === 0)
    ? ["One or more scenes have no source references."]
    : [];

  const suggestions = content.scenes.some((scene) => scene.body.length > 700)
    ? ["One or more scenes may be too long for the learner player."]
    : [];

  return { blocking, warnings, suggestions };
}
