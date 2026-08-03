import {
  unauthorizedAdminResponse,
  verifyAdminSecret,
} from "@/lib/admin/verify-admin-secret";
import { runScrapePipeline } from "@/lib/pipeline/scrape";
import { ScrapeOptions } from "@/lib/scraping/types";

export async function POST(request: Request) {
  if (!verifyAdminSecret(request)) {
    return unauthorizedAdminResponse();
  }

  const options: ScrapeOptions = {};

  try {
    const body = await request.json();
    if (body && typeof body === "object") {
      if (Array.isArray(body.sourceIds)) {
        options.sourceIds = body.sourceIds.filter(
          (id: unknown) => typeof id === "string",
        );
      }
      if (typeof body.perSourceLimit === "number" && body.perSourceLimit > 0) {
        options.perSourceLimit = Math.min(Math.floor(body.perSourceLimit), 50);
      }
    }
  } catch {
    // Body is optional; empty or invalid JSON defaults to all active sources
  }

  try {
    const result = await runScrapePipeline(options);
    return Response.json(result.summary, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to run scrape pipeline";
    return Response.json({ error: message }, { status: 500 });
  }
}
