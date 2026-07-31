import {
  unauthorizedAdminResponse,
  verifyAdminSecret,
} from "@/lib/admin/verify-admin-secret";
import { getRecentLogs } from "@/lib/supabase/queries/logs";
import type { LogLevel } from "@/lib/supabase/types";

const LOG_LEVELS = new Set<LogLevel>(["debug", "info", "warn", "error"]);

function parseLimit(value: string | null): number {
  const parsed = Number.parseInt(value ?? "50", 10);

  if (Number.isNaN(parsed) || parsed < 1) {
    return 50;
  }

  return Math.min(parsed, 200);
}

export async function GET(request: Request) {
  if (!verifyAdminSecret(request)) {
    return unauthorizedAdminResponse();
  }

  const { searchParams } = new URL(request.url);
  const limit = parseLimit(searchParams.get("limit"));
  const levelParam = searchParams.get("level");
  const level =
    levelParam && LOG_LEVELS.has(levelParam as LogLevel)
      ? (levelParam as LogLevel)
      : undefined;

  try {
    const logs = await getRecentLogs({ limit, level });

    return Response.json({
      logs,
      count: logs.length,
      limit,
      level: level ?? null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load logs";

    return Response.json({ error: message }, { status: 500 });
  }
}
