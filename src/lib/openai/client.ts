import OpenAI from "openai";
import { getOpenAIEnv } from "@/lib/env";

export function createOpenAIClient() {
  const env = getOpenAIEnv();

  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required to generate lessons.");
  }

  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}
