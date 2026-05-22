import { zodTextFormat } from "openai/helpers/zod";
import { getOpenAIEnv } from "@/lib/env";
import {
  lessonContentSchema,
  type Difficulty,
  type LessonContent,
  type TargetAudience
} from "@/lib/lessons/schema";
import { createOpenAIClient } from "./client";

export type GenerateLessonInput = {
  topic: string;
  targetAudience: TargetAudience;
  language: string;
  difficulty: Difficulty;
  durationMinutes: number;
  sourceTitle: string;
  sourceText: string;
};

export function buildLessonPrompt(input: GenerateLessonInput) {
  return [
    "You are a financial literacy lesson designer, not a financial advisor.",
    "Use only the provided source text for factual claims.",
    "Do not provide personalized financial advice.",
    "Do not recommend specific financial products, providers, or investments.",
    "Create a short branching storyboard lesson with 5 to 8 scenes and 1 to 3 choices per decision scene.",
    `Target audience: ${input.targetAudience}`,
    `Language: ${input.language}`,
    `Difficulty: ${input.difficulty}`,
    `Workshop duration: ${input.durationMinutes} minutes`,
    `Topic: ${input.topic}`,
    `Source title: ${input.sourceTitle}`,
    "Source text:",
    input.sourceText
  ].join("\n\n");
}

export function parseGeneratedLesson(value: unknown): LessonContent {
  return lessonContentSchema.parse(value);
}

export async function generateLesson(input: GenerateLessonInput) {
  const env = getOpenAIEnv();
  const client = createOpenAIClient();
  const prompt = buildLessonPrompt(input);

  const response = await client.responses.parse({
    model: env.OPENAI_MODEL,
    input: [
      {
        role: "user",
        content: prompt
      }
    ],
    text: {
      format: zodTextFormat(lessonContentSchema, "lesson_content")
    }
  });

  const parsed = response.output_parsed;

  if (!parsed) {
    throw new Error("OpenAI did not return a schema-valid lesson.");
  }

  return parseGeneratedLesson(parsed);
}
