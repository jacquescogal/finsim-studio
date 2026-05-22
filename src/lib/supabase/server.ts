import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceEnv } from "@/lib/env";

export function createServiceClient() {
  const env = getSupabaseServiceEnv();

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });
}
