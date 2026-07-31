import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type { SourceRow } from "@/lib/supabase/types";

export async function getActiveSources(): Promise<SourceRow[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load active sources: ${error.message}`);
  }

  return data ?? [];
}

export async function getSourceById(id: string): Promise<SourceRow | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load source ${id}: ${error.message}`);
  }

  return data;
}

export async function getAllSources(): Promise<SourceRow[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load sources: ${error.message}`);
  }

  return data ?? [];
}
