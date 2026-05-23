import { z } from "zod";

const optionalNonEmptyString = z.preprocess(
  (value) => value === "" ? undefined : value,
  z.string().min(1).optional()
);

const openAIEnvSchema = z.object({
  OPENAI_API_KEY: optionalNonEmptyString,
  OPENAI_MODEL: optionalNonEmptyString.default("gpt-5.4-mini")
});

const publicSupabaseEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optionalNonEmptyString,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalNonEmptyString
}).superRefine((env, ctx) => {
  if (!env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is required",
      path: ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"]
    });
  }
});

const supabaseServiceEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SECRET_KEY: optionalNonEmptyString,
  SUPABASE_SERVICE_ROLE_KEY: optionalNonEmptyString
}).superRefine((env, ctx) => {
  if (!env.SUPABASE_SECRET_KEY && !env.SUPABASE_SERVICE_ROLE_KEY) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY is required",
      path: ["SUPABASE_SECRET_KEY"]
    });
  }
});

export function getOpenAIEnv() {
  return openAIEnvSchema.parse(process.env);
}

export function getPublicSupabaseEnv() {
  const env = publicSupabaseEnvSchema.parse(process.env);

  return {
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_PUBLIC_KEY: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  };
}

export function getSupabaseServiceEnv() {
  const env = supabaseServiceEnvSchema.parse(process.env);

  return {
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_KEY: env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY!
  };
}

export function getServerEnv() {
  return {
    ...getOpenAIEnv(),
    ...getPublicSupabaseEnv(),
    SUPABASE_SERVICE_KEY: getSupabaseServiceEnv().SUPABASE_SERVICE_KEY
  };
}
