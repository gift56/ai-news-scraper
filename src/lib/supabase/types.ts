export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type LogLevel = "debug" | "info" | "warn" | "error";
export type SentimentLabel = "positive" | "neutral" | "negative";
export type BiasLabel = "left" | "center" | "right" | "mixed" | "unclear";

export type SourceRow = {
  id: string;
  name: string;
  listing_url: string;
  parser_strategy: string | null;
  is_active: boolean;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ArticleRow = {
  id: string;
  source_id: string;
  original_url: string;
  canonical_url: string;
  title: string;
  image_url: string;
  published_at: string;
  raw_text: string;
  scraped_at: string;
  analyzed_at: string | null;
  created_at: string;
};

export type ArticleAnalysisRow = {
  id: string;
  article_id: string;
  summary: string;
  sentiment_score: number;
  sentiment_label: SentimentLabel;
  bias_score: number;
  bias_label: BiasLabel;
  left_percentage: number;
  center_percentage: number;
  right_percentage: number;
  confidence: number;
  framing_notes: string;
  loaded_terms: string[];
  disclaimer: string;
  model: string;
  created_at: string;
};

export type LogRow = {
  id: string;
  level: LogLevel;
  message: string;
  context: Json | null;
  created_at: string;
};

export type OxylabsScheduleRow = {
  id: string;
  source_id: string;
  oxylabs_schedule_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type OxylabsScheduleRunRow = {
  id: string;
  schedule_id: string;
  oxylabs_run_id: string | null;
  status: string;
  summary: Json | null;
  processed_at: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      sources: {
        Row: SourceRow;
        Insert: Omit<SourceRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sources"]["Insert"]>;
      };
      articles: {
        Row: ArticleRow;
        Insert: Omit<
          ArticleRow,
          "id" | "scraped_at" | "analyzed_at" | "created_at"
        > & {
          id?: string;
          scraped_at?: string;
          analyzed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["articles"]["Insert"]>;
      };
      article_analyses: {
        Row: ArticleAnalysisRow;
        Insert: Omit<ArticleAnalysisRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["article_analyses"]["Insert"]
        >;
      };
      logs: {
        Row: LogRow;
        Insert: Omit<LogRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["logs"]["Insert"]>;
      };
      oxylabs_schedules: {
        Row: OxylabsScheduleRow;
        Insert: Omit<OxylabsScheduleRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["oxylabs_schedules"]["Insert"]
        >;
      };
      oxylabs_schedule_runs: {
        Row: OxylabsScheduleRunRow;
        Insert: Omit<
          OxylabsScheduleRunRow,
          "id" | "created_at" | "processed_at"
        > & {
          id?: string;
          created_at?: string;
          processed_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["oxylabs_schedule_runs"]["Insert"]
        >;
      };
    };
  };
};

export type ArticleInsert = Database["public"]["Tables"]["articles"]["Insert"];
export type ArticleAnalysisInsert =
  Database["public"]["Tables"]["article_analyses"]["Insert"];

export type ArticleWithRelations = ArticleRow & {
  sources: SourceRow | null;
  article_analyses: ArticleAnalysisRow | ArticleAnalysisRow[] | null;
};

export type HomeArticleRow = {
  id: string;
  slug: string;
  title: string;
  imageUrl: string;
  publishedAt: string;
  sourceName: string;
  sourceId: string;
  sentimentLabel: SentimentLabel;
  biasLabel: BiasLabel;
  leftPercentage: number;
  centerPercentage: number;
  rightPercentage: number;
  confidence: number;
};

export type ArticleDetailRow = {
  id: string;
  slug: string;
  title: string;
  imageUrl: string;
  publishedAt: string;
  rawText: string;
  originalUrl: string;
  canonicalUrl: string;
  source: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
  analysis: {
    summary: string;
    sentimentLabel: SentimentLabel;
    sentimentScore: number;
    biasLabel: BiasLabel;
    biasScore: number;
    leftPercentage: number;
    centerPercentage: number;
    rightPercentage: number;
    confidence: number;
    framingNotes: string;
    loadedTerms: string[];
    disclaimer: string;
    model: string;
  };
};

export type PendingAnalysisArticle = ArticleRow & {
  sources: SourceRow | null;
};

export type ScheduleRunInsert = {
  scheduleId: string;
  oxylabsRunId?: string | null;
  status: string;
  summary?: Json | null;
  processedAt?: string | null;
};
