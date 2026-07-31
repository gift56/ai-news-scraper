import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type { Json, LogLevel, LogRow } from "@/lib/supabase/types";

type GetRecentLogsOptions = {
  limit?: number;
  level?: LogLevel;
};

export async function insertLog(
  level: LogLevel,
  message: string,
  context?: Json,
): Promise<LogRow> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("logs")
    .insert({
      level,
      message,
      context: context ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to insert log: ${error.message}`);
  }

  return data;
}

export async function getRecentLogs({
  limit = 50,
  level,
}: GetRecentLogsOptions = {}): Promise<LogRow[]> {
  const supabase = createSupabaseServiceRoleClient();
  let query = supabase
    .from("logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (level) {
    query = query.eq("level", level);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load logs: ${error.message}`);
  }

  return data ?? [];
}
