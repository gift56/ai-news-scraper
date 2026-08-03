import "server-only";

import { z } from "zod";
import { getOxylabsEnv } from "@/lib/oxylabs/env";

const OXYLABS_REALTIME_ENDPOINT = "https://realtime.oxylabs.io/v1/queries";
const DEFAULT_TIMEOUT_MS = 180_000;

const OxylabsResultSchema = z.object({
  content: z.string(),
  status_code: z.number(),
  url: z.string().optional(),
});

const OxylabsResponseSchema = z.object({
  results: z.array(OxylabsResultSchema).min(1),
});

const OxylabsErrorResponseSchema = z.object({
  error: z.object({
    code: z.string().optional(),
    message: z.string(),
  }),
});

export type ScrapeUrlOptions = {
  render?: boolean;
};

export class OxylabsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OxylabsError";
  }
}

export async function scrapeUrl(
  url: string,
  options: ScrapeUrlOptions = {},
): Promise<string> {
  const { username, password } = getOxylabsEnv();
  const render = options.render ?? true;

  const body = {
    source: "universal" as const,
    url,
    render: render ? "html" : false,
  };

  const auth = Buffer.from(`${username}:${password}`).toString("base64");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(OXYLABS_REALTIME_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new OxylabsError(`Oxylabs request timed out for ${url}`);
    }
    throw new OxylabsError(
      `Oxylabs request failed for ${url}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  } finally {
    clearTimeout(timeout);
  }

  const responseText = await response.text();

  if (!response.ok) {
    const parsed = OxylabsErrorResponseSchema.safeParse(
      JSON.parse(responseText),
    );

    if (parsed.success) {
      throw new OxylabsError(
        `Oxylabs error (${response.status}): ${parsed.data.error.message}`,
      );
    }

    throw new OxylabsError(
      `Oxylabs returned HTTP ${response.status} for ${url}`,
    );
  }

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(responseText);
  } catch {
    throw new OxylabsError(`Oxylabs returned invalid JSON for ${url}`);
  }

  const parsed = OxylabsResponseSchema.safeParse(parsedJson);

  if (!parsed.success) {
    throw new OxylabsError(
      `Oxylabs response did not match expected shape for ${url}`,
    );
  }

  const result = parsed.data.results[0];

  if (result.status_code !== 200) {
    throw new OxylabsError(
      `Oxylabs returned status_code ${result.status_code} for ${url}`,
    );
  }

  return result.content;
}
