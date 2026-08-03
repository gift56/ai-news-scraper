export type AnalysisSummary = {
  status: "completed" | "failed";
  articlesPending: number;
  articlesAnalyzed: number;
  articlesSkipped: number;
  articlesFailed: number;
  batchesProcessed: number;
  totalDurationMs: number;
  failureReasons: Record<string, number>;
};

export type AnalysisOptions = {
  limit?: number;
  articleIds?: string[];
};

export type AnalysisResult = {
  summary: AnalysisSummary;
};
