import { afterEach, describe, expect, it } from "vitest";
import { getPublicSupabaseEnv, getSupabaseServiceEnv } from "./env";

const ORIGINAL_ENV = process.env;

function withEnv(env: Record<string, string | undefined>) {
  process.env = { ...ORIGINAL_ENV };

  for (const key of [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SECRET_KEY",
    "SUPABASE_SERVICE_ROLE_KEY"
  ]) {
    delete process.env[key];
  }

  Object.assign(process.env, env);
}

describe("Supabase env", () => {
  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("uses the new publishable key for public Supabase access", () => {
    withEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "legacy-anon"
    });

    expect(getPublicSupabaseEnv()).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_PUBLIC_KEY: "sb_publishable_test"
    });
  });

  it("falls back to the legacy anon key for public Supabase access", () => {
    withEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "legacy-anon"
    });

    expect(getPublicSupabaseEnv()).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_PUBLIC_KEY: "legacy-anon"
    });
  });

  it("ignores empty legacy placeholders when new Supabase keys are present", () => {
    withEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      SUPABASE_SECRET_KEY: "sb_secret_test",
      SUPABASE_SERVICE_ROLE_KEY: ""
    });

    expect(getPublicSupabaseEnv()).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_PUBLIC_KEY: "sb_publishable_test"
    });
    expect(getSupabaseServiceEnv()).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_KEY: "sb_secret_test"
    });
  });

  it("uses either the legacy service role key or new secret key for server access", () => {
    withEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "legacy-service-role"
    });

    expect(getSupabaseServiceEnv()).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_KEY: "legacy-service-role"
    });

    withEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "legacy-service-role",
      SUPABASE_SECRET_KEY: "sb_secret_test"
    });

    expect(getSupabaseServiceEnv()).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_KEY: "sb_secret_test"
    });
  });
});
