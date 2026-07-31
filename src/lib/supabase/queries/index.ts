export {
  getAnalysisByArticleId,
  getPendingAnalysisArticles,
  insertArticleAnalysis,
} from "@/lib/supabase/queries/analyses";

export {
  findExistingArticleUrls,
  getArticleBySlug,
  getHomeArticles,
  insertArticle,
  markArticleAnalyzed,
  toArticleDetailRow,
  toHomeArticleRow,
} from "@/lib/supabase/queries/articles";
export { getRecentLogs, insertLog } from "@/lib/supabase/queries/logs";
export {
  deactivateMissingSchedules,
  listOxylabsSchedules,
  listRecentScheduleRuns,
  recordScheduleRun,
  upsertOxylabsScheduleForSource,
} from "@/lib/supabase/queries/oxylabs";
export {
  getActiveSources,
  getAllSources,
  getSourceById,
} from "@/lib/supabase/queries/sources";
