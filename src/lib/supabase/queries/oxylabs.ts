import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type {
  OxylabsScheduleRow,
  OxylabsScheduleRunRow,
  ScheduleRunInsert,
} from "@/lib/supabase/types";

export async function upsertOxylabsScheduleForSource(
  sourceId: string,
  oxylabsScheduleId: string,
): Promise<OxylabsScheduleRow> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("oxylabs_schedules")
    .upsert(
      {
        source_id: sourceId,
        oxylabs_schedule_id: oxylabsScheduleId,
        is_active: true,
      },
      { onConflict: "source_id" },
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to upsert Oxylabs schedule: ${error.message}`);
  }

  return data;
}

export async function listOxylabsSchedules(): Promise<OxylabsScheduleRow[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("oxylabs_schedules")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list Oxylabs schedules: ${error.message}`);
  }

  return data ?? [];
}

export async function deactivateMissingSchedules(
  knownOxylabsScheduleIds: string[],
): Promise<number> {
  const supabase = createSupabaseServiceRoleClient();
  const schedules = await listOxylabsSchedules();
  const known = new Set(knownOxylabsScheduleIds);
  const missing = schedules.filter(
    (schedule) => !known.has(schedule.oxylabs_schedule_id),
  );

  if (missing.length === 0) {
    return 0;
  }

  const { error } = await supabase
    .from("oxylabs_schedules")
    .update({ is_active: false })
    .in(
      "id",
      missing.map((schedule) => schedule.id),
    );

  if (error) {
    throw new Error(`Failed to deactivate missing schedules: ${error.message}`);
  }

  return missing.length;
}

export async function recordScheduleRun(
  input: ScheduleRunInsert,
): Promise<OxylabsScheduleRunRow> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("oxylabs_schedule_runs")
    .insert({
      schedule_id: input.scheduleId,
      oxylabs_run_id: input.oxylabsRunId ?? null,
      status: input.status,
      summary: input.summary ?? null,
      processed_at: input.processedAt ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to record schedule run: ${error.message}`);
  }

  return data;
}

export async function listRecentScheduleRuns(
  limit = 50,
): Promise<OxylabsScheduleRunRow[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("oxylabs_schedule_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to list schedule runs: ${error.message}`);
  }

  return data ?? [];
}
