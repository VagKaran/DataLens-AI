"use client";

import { useState, useRef, useCallback } from "react";
import { useStore } from "@/lib/store";
import { generateStory } from "@/lib/api";
import {
  Settings2,
  CheckCircle,
  Lightbulb,
  BookOpen,
  BarChart3,
  FileText,
  X,
  Sparkles,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const REPORT_TYPES = [
  { id: "quarterly", label: "Quarterly Business Review", icon: CheckCircle },
  { id: "anomaly", label: "Anomaly & Risk Assessment", icon: BarChart3 },
  { id: "growth", label: "Growth & Trend Analysis", icon: BarChart3 },
];

const VIZ_OPTIONS = [
  "Bento Grid",
  "Heatmaps",
  "Scatter Plots",
  "Time Series",
];

export default function StoryTab() {
  const {
    dataset,
    storyReport,
    setStoryReport,
    storyLoading,
    setStoryLoading,
  } = useStore();
  const [reportType, setReportType] = useState("quarterly");
  const [selectedViz, setSelectedViz] = useState<string[]>([
    "Bento Grid",
    "Heatmaps",
  ]);

  async function handleGenerate() {
    setStoryLoading(true);
    try {
      const report = await generateStory({
        report_type: reportType,
        visualizations: selectedViz,
      });
      setStoryReport(report);
    } catch (e) {
      console.error(e);
    } finally {
      setStoryLoading(false);
    }
  }

  function toggleViz(v: string) {
    setSelectedViz((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  }

  const reportRef = useRef<HTMLElement>(null);

  const handleDownloadPDF = useCallback(async () => {
    if (!reportRef.current) return;
    try {
      // Dynamic import to avoid SSR issues
      const html2pdf = (await import("html2pdf.js")).default;
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `DataLens_Report_${storyReport?.reference_id || "report"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#1a1a2e",
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };
      await html2pdf().set(opt).from(reportRef.current).save();
    } catch (err) {
      console.error("PDF generation failed:", err);
      // Fallback: use browser print
      window.print();
    }
  }, [storyReport]);

  if (!dataset) return null;
  const report = storyReport;

  return (
    <div className="p-8 min-h-screen">
      {/* Header Banner */}
      <header className="relative mb-12 overflow-hidden rounded-2xl bg-gradient-to-r from-surface-container-low to-surface-container-high p-12 border border-outline-variant/10">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl font-extrabold tracking-tighter text-on-surface mb-4">
            Data Story Generator
          </h1>
          <p className="text-on-surface-variant text-lg leading-relaxed">
            Transform raw telemetry into editorial narratives. Our AI engine
            parses billions of rows to find the &ldquo;why&rdquo; behind your
            metrics.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8">
        {/* Configuration Panel */}
        <section className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-surface-container p-6 rounded-2xl shadow-sm border border-outline-variant/5">
            <h3 className="font-bold text-on-surface mb-6 flex items-center gap-2">
              <Settings2 size={18} className="text-primary" />
              Configuration Panel
            </h3>
            <div className="space-y-6">
              {/* Report Type */}
              <div className="space-y-2">
                <label className="label-technical text-on-surface-variant block">
                  Report Type
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {REPORT_TYPES.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setReportType(id)}
                      className={`flex items-center justify-between p-3 rounded-xl text-sm transition-colors ${
                        reportType === id
                          ? "bg-surface-container-highest border border-primary/20 text-on-surface"
                          : "bg-surface-container-low border border-outline-variant/10 text-on-surface-variant hover:bg-surface-container-high"
                      }`}
                    >
                      <span>{label}</span>
                      <Icon
                        size={16}
                        className={
                          reportType === id ? "text-primary" : "text-outline"
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Visualizations */}
              <div className="space-y-2">
                <label className="label-technical text-on-surface-variant block">
                  Visualizations
                </label>
                <div className="flex flex-wrap gap-2">
                  {VIZ_OPTIONS.map((v) => (
                    <button
                      key={v}
                      onClick={() => toggleViz(v)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 transition-colors ${
                        selectedViz.includes(v)
                          ? "bg-primary text-on-primary"
                          : "bg-surface-container-highest text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      {v}
                      {selectedViz.includes(v) ? (
                        <X size={10} />
                      ) : (
                        <span>+</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={storyLoading}
                className="w-full mt-4 py-4 px-6 gradient-primary text-on-primary-container font-extrabold rounded-xl shadow-lg shadow-primary/10 flex items-center justify-center gap-3 active:scale-[0.97] transition-all disabled:opacity-50"
              >
                <Sparkles size={18} />
                {storyLoading
                  ? "Generating Report..."
                  : "Generate Data Story Report"}
              </button>
            </div>
          </div>

          {/* AI Insight */}
          <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10">
            <div className="flex items-center gap-3 text-tertiary mb-3">
              <Lightbulb size={18} />
              <span className="label-technical">AI Insight</span>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed italic">
              &ldquo;Your dataset contains{" "}
              {dataset.rows.toLocaleString()} records across{" "}
              {dataset.columns} variables. I will prioritize key metrics in this
              generation.&rdquo;
            </p>
          </div>
        </section>

        {/* Report Output */}
        <section className="col-span-12 lg:col-span-8">
          {report ? (
            <article ref={reportRef} className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/5 shadow-2xl">
              {/* Report Header */}
              <div className="p-12 border-b border-outline-variant/10">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight text-on-surface">
                      {report.title}
                    </h2>
                    <p className="text-on-surface-variant">
                      Generated on {report.generated_at} &bull; Reference ID:{" "}
                      {report.reference_id}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-tertiary/10 text-tertiary rounded-full label-technical">
                    Confidential
                  </span>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-3 gap-6">
                  {report.kpis.map((kpi) => (
                    <div
                      key={kpi.label}
                      className={`p-4 bg-surface-container rounded-xl border-l-4 ${
                        kpi.trend === "up"
                          ? "border-primary"
                          : "border-error"
                      }`}
                    >
                      <div className="label-technical text-on-surface-variant mb-1">
                        {kpi.label}
                      </div>
                      <div className="text-2xl font-bold text-on-surface">
                        {kpi.value}
                      </div>
                      <div
                        className={`text-[10px] font-medium ${
                          kpi.trend === "up"
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {kpi.change}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Report Body */}
              <div className="p-12 space-y-12">
                {/* Core Findings */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                    <BookOpen size={20} />
                    Core Findings
                  </h3>
                  <ul className="space-y-4">
                    {report.findings.map((f, i) => (
                      <li
                        key={i}
                        className="flex gap-4 p-4 rounded-xl bg-surface-container-high/50"
                      >
                        <span className="text-primary font-bold text-lg">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <p className="text-on-surface/90 leading-relaxed">
                          {f}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Quality Metrics */}
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">
                      Quality Metrics
                    </h4>
                    <div className="space-y-4">
                      {report.quality_metrics.map((m) => (
                        <div key={m.name}>
                          <div className="flex justify-between text-xs mb-1">
                            <span>{m.name}</span>
                            <span className="text-primary">
                              {m.score.toFixed(1)}%
                            </span>
                          </div>
                          <div className="context-bar">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${m.score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-6 bg-surface-container-highest rounded-2xl">
                    <h4 className="text-sm font-bold text-on-surface mb-2">
                      Editor&apos;s Summary
                    </h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {report.editors_summary}
                    </p>
                  </div>
                </div>

                {/* Download */}
                <div className="pt-12 border-t border-outline-variant/10 flex justify-center">
                  <button
                    onClick={handleDownloadPDF}
                    className="px-8 py-3 bg-surface-container border border-outline-variant/20 rounded-xl text-on-surface font-bold text-sm flex items-center gap-3 hover:bg-surface-container-highest transition-all active:scale-[0.98]"
                  >
                    <FileText size={18} />
                    Download Report as PDF
                  </button>
                </div>
              </div>
            </article>
          ) : (
            <div className="bg-surface-container-low rounded-2xl border border-outline-variant/5 p-16 text-center">
              <Sparkles
                size={48}
                className="text-primary/30 mx-auto mb-4"
              />
              <h3 className="text-xl font-bold text-on-surface mb-2">
                No Report Generated Yet
              </h3>
              <p className="text-on-surface-variant">
                Configure your report settings and click Generate to create an
                AI-powered data story.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
