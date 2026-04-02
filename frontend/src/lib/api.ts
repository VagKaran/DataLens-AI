import type {
  DatasetInfo,
  EDAStats,
  VariableAnalysis,
  PredictionResult,
  StoryReport,
  ModelId,
} from "@/types";

const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

// ─── Health ───
export async function healthCheck() {
  return request<{ status: string }>("/health");
}

// ─── Upload ───
export async function uploadDataset(file: File): Promise<DatasetInfo> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

// ─── EDA ───
export async function getEdaStats(): Promise<EDAStats> {
  return request<EDAStats>("/eda/stats");
}

export async function getVariableAnalysis(
  variable: string
): Promise<VariableAnalysis> {
  return request<VariableAnalysis>(`/eda/variable/${variable}`);
}

export async function askEdaQuestion(question: string): Promise<{ answer: string }> {
  return request<{ answer: string }>("/eda/ask", {
    method: "POST",
    body: JSON.stringify({ question }),
  });
}

// ─── Predict ───
export async function runPrediction(question: string): Promise<PredictionResult> {
  return request<PredictionResult>("/predict", {
    method: "POST",
    body: JSON.stringify({ question }),
  });
}

// ─── Story ───
export async function generateStory(config: {
  report_type: string;
  visualizations: string[];
}): Promise<StoryReport> {
  return request<StoryReport>("/story/generate", {
    method: "POST",
    body: JSON.stringify(config),
  });
}

// ─── Chat ───
export async function chatQuery(
  message: string,
  model: ModelId,
  history: { role: string; content: string }[]
): Promise<{
  answer: string;
  sql?: string;
  data?: Record<string, unknown>[];
  visualization?: string;
  tokens_used: number;
  suggestions: string[];
  followups?: string[];
}> {
  return request("/chat", {
    method: "POST",
    body: JSON.stringify({ message, model, history }),
  });
}

export async function getChatSuggestions(): Promise<{ suggestions: string[] }> {
  return request<{ suggestions: string[] }>("/chat/suggestions");
}

export interface OllamaModelStatus {
  ready: boolean;
  model: string;
}

export async function getOllamaStatus(): Promise<{
  ollama_running: boolean;
  models: Record<string, OllamaModelStatus>;
}> {
  return request("/chat/ollama/status");
}

// ─── Samples ───
export interface SampleMeta {
  id: string;
  name: string;
  description: string;
  rows: number;
  columns: number;
  tags: string[];
  color: string;
}

export async function listSamples(): Promise<SampleMeta[]> {
  return request<SampleMeta[]>("/samples");
}

export async function loadSample(id: string): Promise<DatasetInfo> {
  return request<DatasetInfo>(`/samples/${id}`, { method: "POST" });
}

// ─── Predict suggestions ───
export interface TargetSuggestion {
  column: string;
  reason: string;
  score: number;
}

export async function getSuggestedTargets(): Promise<{ suggestions: TargetSuggestion[] }> {
  return request<{ suggestions: TargetSuggestion[] }>("/predict/suggest");
}
