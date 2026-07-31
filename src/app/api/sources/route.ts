import { getActiveSources } from "@/lib/supabase/queries/sources";

export async function GET() {
  try {
    const sources = await getActiveSources();

    return Response.json({
      sources,
      count: sources.length,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load sources";

    return Response.json({ error: message }, { status: 500 });
  }
}
