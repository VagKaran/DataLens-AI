"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { runPrediction, getSuggestedTargets } from "@/lib/api";
import type { TargetSuggestion } from "@/lib/api";
import NextStepBanner from "@/components/ui/NextStepBanner";
import {
  Target,
  Search,
  CheckCircle,
  Star,
  Sparkles,
  ArrowRight,
  Brain,
  ChevronDown,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function PredictTab() {
  const {
    dataset,
    predictionResult,
    setPredictionResult,
    predictionLoading,
    setPredictionLoading,
    setActiveTab,
  } = useStore();
  const [question, setQuestion] = useState("");
  const [suggestions, setSuggestions] = useState<TargetSuggestion[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);

  useEffect(() => {
    if (!dataset) return;
    setSuggestLoading(true);
    getSuggestedTargets()
      .then((res) => setSuggestions(res.suggestions))
      .catch(console.error)
      .finally(() => setSuggestLoading(false));
  }, [dataset]);

  async function handlePredict() {
    if (!question.trim()) return;
    setPredictionLoading(true);
    try {
      const result = await runPrediction(question);
      setPredictionResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setPredictionLoading(false);
    }
  }

  if (!dataset) return null;
  const res = predictionResult;

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
        <div className="px-8 py-12 relative z-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2">
            Predictive Modeling
          </h1>
          <p className="text-on-surface-variant max-w-2xl">
            Deploy advanced neural networks and ensemble methods to forecast key
            business outcomes with precision-grade reliability.
          </p>
        </div>
      </header>

      <section className="px-8 pb-20 space-y-8">
        {/* AI-Suggested Targets */}
        {(suggestLoading || suggestions.length > 0) && (
          <div className="bg-surface-container-low rounded-xl p-6 ghost-border shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-8 w-8 bg-tertiary/20 rounded-full flex items-center justify-center text-tertiary">
                <Brain size={18} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-on-surface uppercase tracking-wider">
                  AI-Suggested Targets
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Based on your dataset structure — click to select
                </p>
              </div>
            </div>

            {suggestLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-surface-container rounded-xl p-4 animate-pulse space-y-2">
                    <div className="h-3 w-16 bg-surface-container-high rounded" />
                    <div className="h-5 w-24 bg-surface-container-high rounded" />
                    <div className="h-3 w-full bg-surface-container-high rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {suggestions.map((s, i) => {
                  const isSelected = question.toLowerCase().includes(s.column.toLowerCase());
                  const colors = [
                    { ring: "ring-blue-500/40", bg: "bg-blue-500/10", text: "text-blue-400", badge: "bg-blue-500/20 text-blue-400" },
                    { ring: "ring-purple-500/40", bg: "bg-purple-500/10", text: "text-purple-400", badge: "bg-purple-500/20 text-purple-400" },
                    { ring: "ring-amber-500/40", bg: "bg-amber-500/10", text: "text-amber-400", badge: "bg-amber-500/20 text-amber-400" },
                  ][i] ?? { ring: "ring-primary/40", bg: "bg-primary/10", text: "text-primary", badge: "bg-primary/20 text-primary" };

                  return (
                    <button
                      key={s.column}
                      onClick={() => setQuestion(`Predict ${s.column}`)}
                      className={`text-left p-4 rounded-xl border transition-all active:scale-[0.98] ${
                        isSelected
                          ? `border-transparent ring-2 ${colors.ring} ${colors.bg}`
                          : "border-outline-variant/15 hover:border-outline-variant/30 hover:bg-surface-container-high/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`label-technical px-2 py-0.5 rounded-full ${colors.badge}`}>
                          #{i + 1} Suggested
                        </span>
                        {isSelected && (
                          <CheckCircle size={14} className={colors.text} />
                        )}
                      </div>
                      <p className={`text-base font-bold mb-1.5 ${isSelected ? colors.text : "text-on-surface"}`}>
                        {s.column}
                      </p>
                      <p className="text-[11px] text-on-surface-variant leading-snug">{s.reason}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Define Target Card */}
        <div className="bg-surface-container-low rounded-xl p-6 ghost-border shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 bg-primary/20 rounded-full flex items-center justify-center text-primary">
              <Target size={18} />
            </div>
            <h2 className="text-lg font-bold text-on-surface uppercase tracking-wider">
              Define Prediction Target
            </h2>
          </div>
          <div className="max-w-3xl space-y-4">
            {/* Smart Column Picker */}
            {dataset && dataset.numeric_columns.length > 0 && (
              <div className="relative">
                <ChevronDown
                  size={16}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
                />
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) setQuestion(`Predict ${e.target.value}`);
                  }}
                  className="w-full appearance-none bg-surface-container-lowest border border-outline-variant/30 rounded-xl py-3 pl-4 pr-10 text-sm text-on-surface-variant focus:ring-2 focus:ring-primary outline-none transition-all cursor-pointer"
                >
                  <option value="">Pick a column to predict...</option>
                  {dataset.numeric_columns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-outline"
              />
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePredict()}
                placeholder="e.g. Predict Survived, Predict Revenue..."
                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl py-4 pl-12 pr-4 text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-outline"
              />
            </div>
            <button
              onClick={handlePredict}
              disabled={predictionLoading || !question.trim()}
              className="mt-2 gradient-primary text-on-primary-container px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-50 active:scale-95 transition-all"
            >
              {predictionLoading ? "Training Models..." : "Run Prediction"}
            </button>
          </div>
        </div>

        {/* Next step after prediction */}
        {predictionResult && (
          <NextStepBanner
            title="Prediction complete — generate a full report"
            description={`${predictionResult.best_model} achieved ${(predictionResult.best_score * 100).toFixed(1)}% R². Summarize your findings in a Story.`}
            cta="Generate Story"
            onAction={() => setActiveTab("story")}
            color="purple"
          />
        )}

        {predictionLoading && (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-surface-container rounded-xl p-6 space-y-4">
                  <div className="h-3 w-16 bg-surface-container-high rounded" />
                  <div className="h-8 w-32 bg-surface-container-high rounded" />
                  <div className="h-3 w-24 bg-surface-container-high rounded" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-surface-container-low rounded-xl p-6 space-y-4">
                <div className="h-4 w-48 bg-surface-container-high rounded" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-surface-container-high rounded" />
                ))}
              </div>
              <div className="bg-surface-container-high rounded-xl p-6 space-y-3">
                <div className="h-4 w-32 bg-surface-container-highest rounded" />
                <div className="h-24 bg-surface-container-highest rounded" />
              </div>
            </div>
            <div className="bg-surface-container rounded-xl p-8 h-64 flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-on-surface-variant font-medium">Training models...</p>
              </div>
            </div>
          </div>
        )}

        {res && (
          <>
            {/* Workflow Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 01 */}
              <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/5">
                <div className="flex justify-between items-start mb-4">
                  <span className="label-technical text-primary">Step 01</span>
                  <CheckCircle size={16} className="text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-on-surface mb-1">
                  Target Variable Identified
                </h3>
                <div className="text-2xl font-bold text-primary mb-4">
                  {res.target_variable}
                </div>
              </div>

              {/* Step 02 */}
              <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/5">
                <div className="flex justify-between items-start mb-4">
                  <span className="label-technical text-primary">Step 02</span>
                  <CheckCircle size={16} className="text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-on-surface mb-1">
                  Model Training Progress
                </h3>
                <div className="text-2xl font-bold text-on-surface mb-2">
                  Complete
                </div>
                <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-full" />
                </div>
                <div className="mt-2 label-technical text-on-surface-variant">
                  {res.models.length} Models trained
                </div>
              </div>

              {/* Top Performer */}
              <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/5 border-l-4 border-l-tertiary">
                <div className="flex justify-between items-start mb-4">
                  <span className="label-technical text-tertiary">
                    Top Performer
                  </span>
                  <Star size={16} className="text-tertiary" />
                </div>
                <h3 className="text-sm font-semibold text-on-surface mb-1">
                  Winner: {res.best_model}
                </h3>
                <div className="text-3xl font-extrabold text-on-surface">
                  {(res.best_score * 100).toFixed(1)}%
                </div>
                <div className="label-technical text-tertiary mt-1">
                  R² Score
                </div>
              </div>
            </div>

            {/* Benchmarks + AI Interpretation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Benchmark Table */}
              <div className="md:col-span-2 bg-surface-container-low rounded-xl p-6 border border-outline-variant/5">
                <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest mb-4">
                  Model Performance Benchmarks
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-on-surface-variant border-b border-outline-variant/10">
                        <th className="pb-3 font-semibold uppercase">
                          Algorithm
                        </th>
                        <th className="pb-3 font-semibold uppercase">R²</th>
                        <th className="pb-3 font-semibold uppercase">MAE</th>
                        <th className="pb-3 font-semibold uppercase">RMSE</th>
                        <th className="pb-3 font-semibold uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/5">
                      {res.models.map((m) => (
                        <tr
                          key={m.name}
                          className={
                            m.status === "optimal"
                              ? "text-on-surface"
                              : "text-on-surface-variant"
                          }
                        >
                          <td className="py-4 font-medium">{m.name}</td>
                          <td className="py-4">
                            {(m.r2 * 100).toFixed(1)}%
                          </td>
                          <td className="py-4">{m.mae.toFixed(2)}</td>
                          <td className="py-4">{m.rmse.toFixed(2)}</td>
                          <td className="py-4">
                            <span
                              className={`px-2 py-1 rounded label-technical ${
                                m.status === "optimal"
                                  ? "bg-primary/20 text-primary"
                                  : "bg-surface-container-highest text-on-surface-variant"
                              }`}
                            >
                              {m.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI Interpretation */}
              <div className="bg-surface-container-high rounded-xl p-6 border border-outline-variant/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={18} className="text-tertiary" />
                    <h3 className="label-technical text-on-surface">
                      AI Interpretation
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-on-surface-variant italic">
                    &ldquo;{res.ai_interpretation}&rdquo;
                  </p>
                </div>
                <button className="mt-6 text-xs text-primary font-bold flex items-center gap-1 hover:underline">
                  EXPLORE FEATURE IMPORTANCE{" "}
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Forecast Visualization */}
            <div className="bg-surface-container rounded-xl p-8 border border-outline-variant/5">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest">
                    {res.target_variable} Forecast Visualization
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Historical data vs. Predicted trajectory
                  </p>
                </div>
                <div className="flex gap-4 label-technical">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-primary" />
                    <span>Historical</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 border-t border-dashed border-error" />
                    <span className="text-error">Predicted</span>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={res.forecast}>
                  <defs>
                    <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4d8eff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4d8eff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffb4ab" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ffb4ab" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#424754" strokeOpacity={0.1} />
                  <XAxis dataKey="index" stroke="#8c909f" fontSize={10} />
                  <YAxis stroke="#8c909f" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#171f33",
                      border: "1px solid rgba(66,71,84,0.2)",
                      borderRadius: "8px",
                      color: "#dae2fd",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="historical"
                    stroke="#4d8eff"
                    strokeWidth={2.5}
                    fill="url(#histGrad)"
                    dot={false}
                    connectNulls={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="predicted"
                    stroke="#ffb4ab"
                    strokeWidth={2.5}
                    strokeDasharray="8 4"
                    fill="url(#predGrad)"
                    dot={false}
                    connectNulls={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
