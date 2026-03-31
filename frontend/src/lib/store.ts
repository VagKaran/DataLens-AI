"use client";

import { create } from "zustand";
import type {
  DatasetInfo,
  TabId,
  ModelId,
  ChatMessage,
  EDAStats,
  PredictionResult,
  StoryReport,
  VariableAnalysis,
} from "@/types";

interface AppState {
  // ─── Dataset ───
  dataset: DatasetInfo | null;
  setDataset: (d: DatasetInfo | null) => void;

  // ─── Navigation ───
  activeTab: TabId;
  setActiveTab: (t: TabId) => void;

  // ─── EDA ───
  edaStats: EDAStats | null;
  setEdaStats: (s: EDAStats | null) => void;
  selectedVariable: string;
  setSelectedVariable: (v: string) => void;
  variableAnalysis: VariableAnalysis | null;
  setVariableAnalysis: (a: VariableAnalysis | null) => void;

  // ─── Prediction ───
  predictionResult: PredictionResult | null;
  setPredictionResult: (r: PredictionResult | null) => void;
  predictionLoading: boolean;
  setPredictionLoading: (l: boolean) => void;

  // ─── Story ───
  storyReport: StoryReport | null;
  setStoryReport: (r: StoryReport | null) => void;
  storyLoading: boolean;
  setStoryLoading: (l: boolean) => void;

  // ─── Chat ───
  selectedModel: ModelId;
  setSelectedModel: (m: ModelId) => void;
  chatMessages: ChatMessage[];
  addChatMessage: (m: ChatMessage) => void;
  clearChat: () => void;
  totalTokensUsed: number;
  setTotalTokensUsed: (t: number) => void;
  chatLoading: boolean;
  setChatLoading: (l: boolean) => void;
  suggestedQuestions: string[];
  setSuggestedQuestions: (q: string[]) => void;

  // ─── Global ───
  loading: boolean;
  setLoading: (l: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  // Dataset
  dataset: null,
  setDataset: (d) => set({ dataset: d }),

  // Navigation
  activeTab: "explore",
  setActiveTab: (t) => set({ activeTab: t }),

  // EDA
  edaStats: null,
  setEdaStats: (s) => set({ edaStats: s }),
  selectedVariable: "",
  setSelectedVariable: (v) => set({ selectedVariable: v }),
  variableAnalysis: null,
  setVariableAnalysis: (a) => set({ variableAnalysis: a }),

  // Prediction
  predictionResult: null,
  setPredictionResult: (r) => set({ predictionResult: r }),
  predictionLoading: false,
  setPredictionLoading: (l) => set({ predictionLoading: l }),

  // Story
  storyReport: null,
  setStoryReport: (r) => set({ storyReport: r }),
  storyLoading: false,
  setStoryLoading: (l) => set({ storyLoading: l }),

  // Chat
  selectedModel: "gpt-3.5",
  setSelectedModel: (m) => set({ selectedModel: m }),
  chatMessages: [],
  addChatMessage: (m) =>
    set((s) => ({ chatMessages: [...s.chatMessages, m] })),
  clearChat: () => set({ chatMessages: [], totalTokensUsed: 0 }),
  totalTokensUsed: 0,
  setTotalTokensUsed: (t) => set({ totalTokensUsed: t }),
  chatLoading: false,
  setChatLoading: (l) => set({ chatLoading: l }),
  suggestedQuestions: [],
  setSuggestedQuestions: (q) => set({ suggestedQuestions: q }),

  // Global
  loading: false,
  setLoading: (l) => set({ loading: l }),
}));
