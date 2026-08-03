import "server-only";

import { z } from "zod";

export const analysisSchema = z
  .object({
    summary: z
      .string()
      .min(1)
      .describe("A neutral, factual summary of the article in 2-4 sentences"),
    sentimentScore: z
      .number()
      .min(-1)
      .max(1)
      .describe("Sentiment score from -1 (negative) to 1 (positive)"),
    sentimentLabel: z
      .enum(["positive", "neutral", "negative"])
      .describe("Sentiment label matching the sentiment score"),
    leftPercentage: z
      .number()
      .min(0)
      .max(100)
      .describe("Percentage of left-leaning framing (0-100)"),
    centerPercentage: z
      .number()
      .min(0)
      .max(100)
      .describe("Percentage of center framing (0-100)"),
    rightPercentage: z
      .number()
      .min(0)
      .max(100)
      .describe("Percentage of right-leaning framing (0-100)"),
    politicalFramingLabel: z
      .enum(["left", "center", "right", "mixed", "unclear"])
      .describe(
        "AI-estimated political framing label matching the strongest percentage",
      ),
    confidence: z
      .number()
      .min(0)
      .max(1)
      .describe("Confidence score from 0 (low) to 1 (high)"),
    framingNotes: z
      .string()
      .min(1)
      .describe(
        "Notes on how the article is framed, including tone and emphasis",
      ),
    loadedTerms: z
      .array(z.string())
      .describe(
        "List of emotionally charged or biased terms found in the article",
      ),
    disclaimer: z
      .string()
      .min(1)
      .describe(
        "A disclaimer stating this is an AI-estimated analysis, not objective truth",
      ),
  })
  .refine(
    (data) =>
      data.leftPercentage + data.centerPercentage + data.rightPercentage ===
      100,
    {
      message:
        "leftPercentage + centerPercentage + rightPercentage must equal 100",
    },
  );

export type AnalysisOutput = z.infer<typeof analysisSchema>;

export type AnalysisResult = AnalysisOutput & {
  model: string;
};
