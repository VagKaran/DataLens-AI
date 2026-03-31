"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Shield, Zap, Sparkles, CheckCircle, X } from "lucide-react";
import { uploadDataset } from "@/lib/api";
import { useStore } from "@/lib/store";

export default function UploadZone() {
  const { dataset, setDataset } = useStore();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      setUploading(true);
      setError(null);
      try {
        const info = await uploadDataset(file);
        setDataset(info);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [setDataset]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "text/tab-separated-values": [".tsv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    maxFiles: 1,
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-tertiary/5 blur-[100px] rounded-full pointer-events-none" />

      <main className="w-full max-w-2xl z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold tracking-tighter text-on-surface mb-2">
            DataLens AI
          </h1>
          <p className="text-on-surface-variant font-medium tracking-wide">
            Connect your intelligence
          </p>
        </div>

        {/* Success Banner */}
        {dataset && (
          <div className="mb-6">
            <div className="bg-[#131b2e] border border-emerald-500/20 px-6 py-4 rounded-xl flex items-center justify-between shadow-[0_4px_20px_rgba(16,185,129,0.05)]">
              <div className="flex items-center gap-3">
                <CheckCircle size={20} className="text-emerald-400" />
                <p className="text-emerald-400 font-medium text-sm">
                  Dataset active: {dataset.rows.toLocaleString()} rows ×{" "}
                  {dataset.columns} columns
                </p>
              </div>
              <button
                onClick={() => setDataset(null)}
                className="text-emerald-400/60 hover:text-emerald-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Upload Card */}
        <div className="bg-[#171f33] rounded-xl p-8 shadow-deep border border-outline-variant/10">
          {/* Drag & Drop Zone */}
          <div
            {...getRootProps()}
            className={`relative group cursor-pointer border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center transition-all duration-300 ${
              isDragActive
                ? "border-primary/70 bg-surface-container-highest/40"
                : "border-outline-variant/30 hover:border-primary/50 hover:bg-surface-container-highest/30"
            }`}
          >
            <input {...getInputProps()} />
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Upload
                size={32}
                className={`text-primary ${uploading ? "animate-bounce" : ""}`}
              />
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-2">
              {uploading ? "Uploading..." : "Drop your dataset here"}
            </h3>
            <p className="text-on-surface-variant text-sm text-center max-w-xs mb-8">
              Drag and drop your files or{" "}
              <span className="text-primary font-semibold">browse computer</span>
            </p>
            <div className="flex gap-3">
              {["CSV", "TSV", "XLSX"].map((fmt) => (
                <div
                  key={fmt}
                  className="px-4 py-1.5 bg-surface-container-highest rounded-full border border-outline-variant/20"
                >
                  <span className="label-technical text-on-secondary-container">
                    {fmt}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="mt-4 text-error text-sm text-center">{error}</p>
          )}

          {/* Action Section */}
          <div className="mt-8 flex flex-col gap-4">
            <button
              disabled={!dataset}
              onClick={() => {
                /* navigation handled by parent */
              }}
              className="w-full py-4 gradient-primary text-on-primary-container font-bold rounded-xl shadow-glow-primary hover:shadow-glow-lg hover:-translate-y-0.5 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Analyzing
            </button>
          </div>
        </div>

        {/* Footer Features */}
        <footer className="mt-12 grid grid-cols-3 gap-6">
          {[
            {
              icon: Shield,
              title: "Encrypted",
              desc: "End-to-end AES-256 data protection",
            },
            {
              icon: Zap,
              title: "Fast Processing",
              desc: "Neural analysis in milliseconds",
            },
            {
              icon: Sparkles,
              title: "AI Cleansing",
              desc: "Automated outlier detection",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="text-center p-4">
              <div className="text-primary-container mb-2 flex justify-center">
                <Icon size={24} />
              </div>
              <h4 className="label-technical text-on-surface mb-1">{title}</h4>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </footer>
      </main>
    </div>
  );
}
