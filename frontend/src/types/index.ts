// ─── Dataset ───
export interface DatasetInfo {
  filename: string;
  rows: number;
  columns: number;
  numeric_columns: string[];
  categorical_columns: string[];
  column_types: Record<string, string>;
  missing_pct: number;
  preview: Record<string, unknown>[];
}

// ─── EDA ───
export interface EDAStats {
  total_records: number;
  variables: number;
  numeric_variables: number;
  completeness: number;
  descriptive: Record<string, Record<string, number>>;
  correlations: Record<string, Record<string, number>>;
  missing_values: Record<string, number>;
  ai_summary: string;
  key_insight: string;
}

export interface VariableAnalysis {
  name: string;
  mean: number;
  std: number;
  min: number;
  max: number;
  skewness: number;
  histogram_data: { bin: string; count: number }[];
  trend_data: { index: number; value: number }[];
}

// ─── Prediction ───
export interface PredictionResult {
  target_variable: string;
  models: ModelBenchmark[];
  best_model: string;
  best_score: number;
  forecast: { index: number; historical: number | null; predicted: number | null }[];
  ai_interpretation: string;
}

export interface ModelBenchmark {
  name: string;
  accuracy: number;
  precision: number;
  f1_score: number;
  r2: number;
  mae: number;
  rmse: number;
  status: "optimal" | "tested";
}

// ─── Story ───
export interface StoryReport {
  title: string;
  generated_at: string;
  reference_id: string;
  kpis: { label: string; value: string; change: string; trend: "up" | "down" }[];
  findings: string[];
  executive_summary: string;
  quality_metrics: { name: string; score: number }[];
  editors_summary: string;
  visualizations: string[]; // base64 images
}

// ─── Chat ───
export type ModelId = "gpt-3.5" | "llama-3.1" | "mistral" | "qwen-2.5";

export interface ModelConfig {
  id: ModelId;
  name: string;
  provider: "cloud" | "local";
  contextWindow: number;
  icon: string;
}

export const MODEL_CONFIGS: ModelConfig[] = [
  { id: "gpt-3.5", name: "GPT-3.5 Turbo", provider: "cloud", contextWindow: 16385, icon: "cloud" },
  { id: "llama-3.1", name: "LLaMA 3.1", provider: "local", contextWindow: 131072, icon: "memory" },
  { id: "mistral", name: "Mistral", provider: "local", contextWindow: 32768, icon: "bolt" },
  { id: "qwen-2.5", name: "Qwen 2.5", provider: "local", contextWindow: 32768, icon: "code" },
];

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sql?: string;
  data?: Record<string, unknown>[];
  visualization?: string; // base64
  tokens_used?: number;
}

// ─── App State ───
export type TabId = "explore" | "predict" | "story" | "chat";
