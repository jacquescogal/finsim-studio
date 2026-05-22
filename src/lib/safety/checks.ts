import type { LessonContent } from "@/lib/lessons/schema";

const advicePatterns = [
  /\byou should invest\b/i,
  /\binvest all\b/i,
  /\bbuy this\b/i,
  /\bguaranteed profit\b/i,
  /\bspecific provider\b/i
];

export type SafetyCheckResult = {
  blocking: string[];
  warnings: string[];
  suggestions: string[];
};

export function runSafetyChecks(content: LessonContent): SafetyCheckResult {
  const text = [
    content.title,
    content.summary,
    content.disclaimer,
    ...content.scenes.flatMap((scene) => [
      scene.title,
      scene.body,
      ...scene.choices.flatMap((choice) => [choice.label, choice.feedback])
    ])
  ].join("\n");

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
