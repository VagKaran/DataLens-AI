"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useStore } from "@/lib/store";
import { getEdaStats, getVariableAnalysis } from "@/lib/api";
import {
  BarChart3,
  CheckCircle,
  ChevronDown,
  Brain,
  AlertTriangle,
  Filter,
  Download,
  Sparkles,
  X,
  Plus,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

export default function ExploreTab() {
  const {
    dataset,
    edaStats,
    setEdaStats,
    selectedVariable,
    setSelectedVariable,
    variableAnalysis,
    setVariableAnalysis,
  } = useStore();
  const [loading, setLoading] = useState(false);

  // Filter state
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filters, setFilters] = useState<
    { column: string; operator: string; value: string }[]
  >([]);
  const [pendingFilter, setPendingFilter] = useState({
    column: "",
    operator: "contains",
    value: "",
  });
  const filterPanelRef = useRef<HTMLDivElement>(null);

  // Close filter panel on click outside
  useEffect(() => {
    if (!showFilterPanel) return;
    function handleClick(e: MouseEvent) {
      if (filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) {
        setShowFilterPanel(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showFilterPanel]);

  useEffect(() => {
    if (dataset && !edaStats) {
      setLoading(true);
      getEdaStats()
        .then(setEdaStats)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [dataset, edaStats, setEdaStats]);

  useEffect(() => {
    if (selectedVariable) {
      getVariableAnalysis(selectedVariable)
        .then(setVariableAnalysis)
        .catch(console.error);
    }
  }, [selectedVariable, setVariableAnalysis]);

  if (!dataset) return null;

  const stats = edaStats;
  const allPreview = dataset.preview || [];
  const columns = Object.keys(allPreview[0] || {});

  // Apply filters to the full preview data
  const filteredPreview = useMemo(() => {
    if (filters.length === 0) return allPreview;
    return allPreview.filter((row) =>
      filters.every((f) => {
        const cellVal = String(row[f.column] ?? "").toLowerCase();
        const filterVal = f.value.toLowerCase();
        switch (f.operator) {
          case "contains":
            return cellVal.includes(filterVal);
          case "equals":
            return cellVal === filterVal;
          case "not_equals":
            return cellVal !== filterVal;
          case "greater_than":
            return parseFloat(cellVal) > parseFloat(filterVal);
          case "less_than":
            return parseFloat(cellVal) < parseFloat(filterVal);
          case "starts_with":
            return cellVal.startsWith(filterVal);
          case "ends_with":
            return cellVal.endsWith(filterVal);
          default:
            return true;
        }
      })
    );
  }, [allPreview, filters]);

  // Show up to 20 rows (filtered)
  const preview = filteredPreview.slice(0, 20);

  function addFilter() {
    if (!pendingFilter.column || !pendingFilter.value) return;
    setFilters((prev) => [...prev, { ...pendingFilter }]);
    setPendingFilter({ column: "", operator: "contains", value: "" });
  }

  function removeFilter(index: number) {
    setFilters((prev) => prev.filter((_, i) => i !== index));
  }

  function clearAllFilters() {
    setFilters([]);
    setShowFilterPanel(false);
  }

  return (
    <div className="p-8 min-h-screen">
      {/* Hero Banner */}
      <section className="relative w-full h-48 rounded-2xl overflow-hidden mb-8 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#3B82F6] via-[#4F46E5] to-[#818CF8] opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-center px-12">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full label-technical text-white">
              Advanced Analysis
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tighter text-white mb-2">
            Exploratory Data Analysis
          </h1>
          <p className="text-white/80 max-w-2xl font-medium tracking-tight">
            Uncover hidden patterns, detect anomalies, and test hypotheses
            through visual summaries and statistical insights for{" "}
            <span className="text-white underline underline-offset-4 decoration-white/30">
              {dataset.filename}
            </span>
          </p>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          {
            icon: BarChart3,
            label: "Total Records",
            value: stats?.total_records?.toLocaleString() ?? dataset.rows.toLocaleString(),
            change: "+12.4%",
            color: "text-primary",
            bgColor: "bg-primary/10",
          },
          {
            icon: Filter,
            label: "Variables",
            value: String(stats?.variables ?? dataset.columns),
            color: "text-secondary",
            bgColor: "bg-secondary/10",
          },
          {
            icon: BarChart3,
            label: "Numeric Variables",
            value: String(stats?.numeric_variables ?? dataset.numeric_columns.length),
            color: "text-tertiary",
            bgColor: "bg-tertiary/10",
          },
          {
            icon: CheckCircle,
            label: "Data Completeness",
            value: `${(stats?.completeness ?? dataset.missing_pct ?? 98.4).toFixed(1)}%`,
            color: "text-green-400",
            bgColor: "bg-green-400/10",
          },
        ].map(({ icon: Icon, label, value, change, color, bgColor }) => (
          <div key={label} className="metric-card flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <span className={`${color} p-2 ${bgColor} rounded-lg`}>
                <Icon size={20} />
              </span>
              {change && (
                <span className="text-xs font-bold text-primary">{change}</span>
              )}
            </div>
            <div>
              <p className="label-technical text-outline mb-1">{label}</p>
              <h3 className="text-2xl font-bold tracking-tight text-on-surface">
                {loading ? "..." : value}
              </h3>
            </div>
          </div>
        ))}
      </section>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* Dataset Preview Table */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container rounded-2xl p-1 overflow-hidden">
          <div className="p-6 border-b border-outline-variant/10">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold tracking-tight">
                  Dataset Preview
                </h2>
                {filters.length > 0 && (
                  <span className="px-2 py-0.5 bg-primary/20 text-primary rounded-full text-[10px] font-bold">
                    {filteredPreview.length} / {allPreview.length} rows
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <div className="relative" ref={filterPanelRef}>
                  <button
                    onClick={() => setShowFilterPanel(!showFilterPanel)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                      filters.length > 0
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "bg-surface-container-highest hover:bg-primary/20"
                    }`}
                  >
                    <Filter size={12} />
                    Filter
                    {filters.length > 0 && (
                      <span className="w-4 h-4 bg-primary text-on-primary-container rounded-full text-[9px] font-bold flex items-center justify-center">
                        {filters.length}
                      </span>
                    )}
                  </button>

                  {/* Filter Dropdown Panel */}
                  {showFilterPanel && (
                    <div className="absolute right-0 top-full mt-2 w-[420px] bg-surface-container-high rounded-xl border border-outline-variant/20 shadow-deep z-50 p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-on-surface">
                          Filter Data
                        </h3>
                        {filters.length > 0 && (
                          <button
                            onClick={clearAllFilters}
                            className="text-[10px] font-semibold text-error hover:text-error/80 transition-colors"
                          >
                            Clear All
                          </button>
                        )}
                      </div>

                      {/* Active Filters */}
                      {filters.length > 0 && (
                        <div className="space-y-2">
                          {filters.map((f, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 bg-surface-container rounded-lg px-3 py-2 text-xs"
                            >
                              <span className="font-semibold text-primary">
                                {f.column}
                              </span>
                              <span className="text-on-surface-variant">
                                {f.operator.replace("_", " ")}
                              </span>
                              <span className="font-medium text-on-surface">
                                &ldquo;{f.value}&rdquo;
                              </span>
                              <button
                                onClick={() => removeFilter(i)}
                                className="ml-auto text-on-surface-variant hover:text-error transition-colors"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add New Filter */}
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <select
                            value={pendingFilter.column}
                            onChange={(e) =>
                              setPendingFilter((p) => ({
                                ...p,
                                column: e.target.value,
                              }))
                            }
                            className="appearance-none bg-surface-container-lowest border border-outline-variant/20 text-on-surface text-xs font-medium py-2 px-3 rounded-lg focus:ring-1 focus:ring-primary outline-none"
                          >
                            <option value="">Column...</option>
                            {columns.map((col) => (
                              <option key={col} value={col}>
                                {col}
                              </option>
                            ))}
                          </select>

                          <select
                            value={pendingFilter.operator}
                            onChange={(e) =>
                              setPendingFilter((p) => ({
                                ...p,
                                operator: e.target.value,
                              }))
                            }
                            className="appearance-none bg-surface-container-lowest border border-outline-variant/20 text-on-surface text-xs font-medium py-2 px-3 rounded-lg focus:ring-1 focus:ring-primary outline-none"
                          >
                            <option value="contains">Contains</option>
                            <option value="equals">Equals</option>
                            <option value="not_equals">Not equals</option>
                            <option value="greater_than">Greater than</option>
                            <option value="less_than">Less than</option>
                            <option value="starts_with">Starts with</option>
                            <option value="ends_with">Ends with</option>
                          </select>

                          <input
                            type="text"
                            placeholder="Value..."
                            value={pendingFilter.value}
                            onChange={(e) =>
                              setPendingFilter((p) => ({
                                ...p,
                                value: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => e.key === "Enter" && addFilter()}
                            className="bg-surface-container-lowest border border-outline-variant/20 text-on-surface text-xs font-medium py-2 px-3 rounded-lg focus:ring-1 focus:ring-primary outline-none placeholder-on-surface-variant/40"
                          />
                        </div>

                        <button
                          onClick={addFilter}
                          disabled={!pendingFilter.column || !pendingFilter.value}
                          className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Plus size={12} />
                          Add Filter
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    const rows = filteredPreview;
                    if (!rows.length) return;
                    const cols = Object.keys(rows[0]);
                    const header = cols.join(",");
                    const body = rows
                      .map((row) =>
                        cols
                          .map((c) => {
                            const val = String(row[c] ?? "");
                            // Escape values that contain commas or quotes
                            return val.includes(",") || val.includes('"')
                              ? `"${val.replace(/"/g, '""')}"`
                              : val;
                          })
                          .join(",")
                      )
                      .join("\n");
                    const csv = header + "\n" + body;
                    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${dataset.filename.replace(/\.\w+$/, "")}_filtered.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1.5 bg-surface-container-highest rounded-lg text-xs font-semibold hover:bg-primary/20 transition-all flex items-center gap-2"
                >
                  <Download size={12} /> CSV
                </button>
              </div>
            </div>

            {/* Active filter chips (visible when panel is closed) */}
            {filters.length > 0 && !showFilterPanel && (
              <div className="flex flex-wrap gap-2 mt-3">
                {filters.map((f, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-[10px] font-semibold"
                  >
                    {f.column} {f.operator.replace("_", " ")} &ldquo;{f.value}&rdquo;
                    <button
                      onClick={() => removeFilter(i)}
                      className="hover:text-error transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50">
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-6 py-4 label-technical text-outline border-b border-outline-variant/10"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {preview.map((row, i) => (
                  <tr
                    key={i}
                    className="hover:bg-surface-container-highest/20 transition-colors"
                  >
                    {columns.map((col) => (
                      <td key={col} className="px-6 py-4 text-xs">
                        {String(row[col] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Summary Panel */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="bg-surface-container rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles size={48} />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <Brain size={20} className="text-tertiary" />
              <h2 className="text-lg font-bold tracking-tight">
                AI Executive Summary
              </h2>
            </div>
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-on-surface-variant">
                {stats?.ai_summary ||
                  "Upload a dataset and run EDA to generate an AI-powered summary of your data."}
              </p>
              {stats?.key_insight && (
                <div className="p-3 bg-surface-container-high rounded-xl border-l-4 border-tertiary">
                  <p className="label-technical text-tertiary mb-1">
                    Key Insight
                  </p>
                  <p className="text-xs text-on-surface">
                    {stats.key_insight}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Missing Values */}
          <div className="bg-surface-container rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold tracking-tight">
                Missing Values
              </h2>
              <span className="text-xs font-medium text-outline">
                Overall Quality:{" "}
                {stats?.completeness
                  ? `${stats.completeness.toFixed(0)}%`
                  : "—"}
              </span>
            </div>
            <div className="space-y-5">
              {stats?.missing_values
                ? Object.entries(stats.missing_values)
                    .slice(0, 5)
                    .map(([col, pct]) => (
                      <div key={col} className="space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-on-surface-variant">{col}</span>
                          <span
                            className={
                              pct > 5 ? "text-error" : "text-on-surface"
                            }
                          >
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                        <div className="context-bar">
                          <div
                            className={`h-full rounded-full ${
                              pct > 5 ? "bg-error" : "bg-primary"
                            }`}
                            style={{ width: `${Math.max(pct, 0.5)}%` }}
                          />
                        </div>
                      </div>
                    ))
                : Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-3 bg-surface-container-high rounded animate-pulse" />
                      <div className="h-1.5 bg-surface-container-high rounded animate-pulse" />
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </div>

      {/* Variable Deep-Dive */}
      <section className="bg-surface-container rounded-2xl p-8 mb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-on-surface">
              Variable Deep-Dive
            </h2>
            <p className="text-sm text-on-surface-variant">
              Intensive analysis of individual feature distributions.
            </p>
          </div>
          <div className="relative">
            <select
              value={selectedVariable}
              onChange={(e) => setSelectedVariable(e.target.value)}
              className="appearance-none bg-surface-container-highest border-none text-on-surface text-sm font-bold py-2.5 px-6 pr-12 rounded-xl focus:ring-2 focus:ring-primary cursor-pointer transition-all"
            >
              <option value="">Select variable</option>
              {dataset.numeric_columns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary"
            />
          </div>
        </div>

        {variableAnalysis && (
          <div className="grid grid-cols-12 gap-8">
            {/* Trend Chart */}
            <div className="col-span-12 lg:col-span-8 bg-surface-container-low rounded-2xl p-6 h-80">
              <div className="flex justify-between items-center mb-6">
                <span className="label-technical text-outline">
                  {variableAnalysis.name} Trend Over Time
                </span>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="label-technical text-on-surface-variant">
                      Actual
                    </span>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height="80%">
                <LineChart data={variableAnalysis.trend_data}>
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
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#adc6ff"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Histogram */}
            <div className="col-span-12 lg:col-span-4 bg-surface-container-low rounded-2xl p-6 h-80 flex flex-col">
              <h3 className="label-technical text-outline mb-6">
                Distribution Histogram
              </h3>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={variableAnalysis.histogram_data}>
                    <Bar dataKey="count" fill="#adc6ff" opacity={0.6} radius={[4, 4, 0, 0]} />
                    <XAxis dataKey="bin" stroke="#8c909f" fontSize={9} />
                    <YAxis stroke="#8c909f" fontSize={9} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#171f33",
                        border: "1px solid rgba(66,71,84,0.2)",
                        borderRadius: "8px",
                        color: "#dae2fd",
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 pt-4 border-t border-outline-variant/10 grid grid-cols-2 gap-4">
                <div>
                  <p className="label-technical text-outline">Skewness</p>
                  <p className="text-sm font-bold">
                    {variableAnalysis.skewness.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="label-technical text-outline">Mean Value</p>
                  <p className="text-sm font-bold">
                    {variableAnalysis.mean.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!variableAnalysis && selectedVariable === "" && (
          <div className="text-center py-16 text-on-surface-variant">
            Select a variable above to see detailed analysis
          </div>
        )}
      </section>
    </div>
  );
}
