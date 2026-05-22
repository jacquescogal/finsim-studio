import { z } from "zod";

const openAIEnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).default("gpt-5.4-mini")
});

const publicSupabaseEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1)
});

const supabaseServiceEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1)
});

export function getOpenAIEnv() {
  return openAIEnvSchema.parse(process.env);
}

export function getPublicSupabaseEnv() {
  return publicSupabaseEnvSchema.parse(process.env);
}

export function getSupabaseServiceEnv() {
  return supabaseServiceEnvSchema.parse(process.env);
}

export function getServerEnv() {
  return {
    ...getOpenAIEnv(),
    ...getPublicSupabaseEnv(),
    SUPABASE_SERVICE_ROLE_KEY: getSupabaseServiceEnv().SUPABASE_SERVICE_ROLE_KEY
  };
}
