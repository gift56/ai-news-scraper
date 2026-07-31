import { createBrowserClient } from "@supabase/ssr";
import { getPublicSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";

export function createSupabaseBrowserClient() {
  const { url, anonKey } = getPublicSupabaseEnv();

  return createBrowserClient<Database>(url, anonKey);
}
