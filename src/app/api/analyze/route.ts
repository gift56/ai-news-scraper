import {
  unauthorizedAdminResponse,
  verifyAdminSecret,
} from "@/lib/admin/verify-admin-secret";
import { runAnalysisPipeline } from "@/lib/pipeline/analyze";
import type { AnalysisOptions } from "@/lib/pipeline/types";

export async function POST(request: Request) {
  if (!verifyAdminSecret(request)) {
    return unauthorizedAdminResponse();
  }

  const options: AnalysisOptions = {};

  try {
    const body = await request.json();
    if (body && typeof body === "object") {
      if (typeof body.limit === "number" && body.limit > 0) {
        options.limit = Math.min(Math.floor(body.limit), 500);
      }
      if (Array.isArray(body.articleIds)) {
        options.articleIds = body.articleIds.filter(
          (id: unknown) => typeof id === "string",
        );
      }
    }
  } catch {
    // Body is optional; empty or invalid JSON defaults to all pending articles
  }

  try {
    const result = await runAnalysisPipeline(options);
    return Response.json(result.summary, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to run analysis pipeline";
    return Response.json({ error: message }, { status: 500 });
  }
}
