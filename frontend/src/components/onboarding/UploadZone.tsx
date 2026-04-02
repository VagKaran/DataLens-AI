"use client";

import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Shield, Zap, Sparkles, FileText, ArrowRight, X, Database, BarChart3, Flower2, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { uploadDataset, listSamples, loadSample } from "@/lib/api";
import type { SampleMeta } from "@/lib/api";
import { useStore } from "@/lib/store";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const SAMPLE_ICONS: Record<string, React.ElementType> = {
  titanic: BarChart3,
  iris: Flower2,
  sales: ShoppingCart,
};

const SAMPLE_COLORS: Record<string, { card: string; tag: string; icon: string }> = {
  titanic: {
    card: "border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/5",
    tag: "bg-blue-500/15 text-blue-400",
    icon: "bg-blue-500/15 text-blue-400",
  },
  iris: {
    card: "border-green-500/20 hover:border-green-500/40 hover:bg-green-500/5",
    tag: "bg-green-500/15 text-green-400",
    icon: "bg-green-500/15 text-green-400",
  },
  sales: {
    card: "border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/5",
    tag: "bg-purple-500/15 text-purple-400",
    icon: "bg-purple-500/15 text-purple-400",
  },
};

export default function UploadZone() {
  const { setDataset, addToast } = useStore();
  const [uploading, setUploading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [samples, setSamples] = useState<SampleMeta[]>([]);

  useEffect(() => {
    listSamples().then(setSamples).catch(console.error);
  }, []);

  const onDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    setError(null);
    setPendingFile(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "text/tab-separated-values": [".tsv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    maxFiles: 1,
    noClick: false,
  });

  async function handleAnalyze() {
    if (!pendingFile || uploading) return;
    setUploading(true);
    setError(null);
    try {
      const info = await uploadDataset(pendingFile);
      addToast({ type: "success", message: `${pendingFile.name} loaded successfully` });
      setDataset(info);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      setError(msg);
      addToast({ type: "error", message: msg });
    } finally {
      setUploading(false);
    }
  }

  async function handleLoadSample(id: string) {
    if (loadingId) return;
    setLoadingId(id);
    try {
      const info = await loadSample(id);
      const sample = samples.find((s) => s.id === id);
      addToast({ type: "success", message: `${sample?.name ?? id} loaded — let's explore!` });
      setDataset(info);
    } catch (e) {
      addToast({ type: "error", message: "Failed to load sample dataset" });
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none animate-aurora-1" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-tertiary/5 blur-[100px] rounded-full pointer-events-none animate-aurora-2" />
      <div className="absolute top-[20%] left-[8%] w-[320px] h-[320px] bg-[#4F46E5]/8 blur-[100px] rounded-full pointer-events-none animate-aurora-3" />
      <div className="absolute bottom-[20%] right-[12%] w-[280px] h-[280px] bg-[#818CF8]/6 blur-[90px] rounded-full pointer-events-none animate-aurora-4" />
      <div className="absolute top-[55%] left-[55%] w-[200px] h-[200px] bg-[#3B82F6]/7 blur-[80px] rounded-full pointer-events-none animate-aurora-2" />

      <main className="w-full max-w-2xl z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl font-extrabold tracking-tighter text-on-surface mb-2">
            DataLens AI
          </h1>
          <p className="text-on-surface-variant font-medium tracking-wide">
            Connect your intelligence
          </p>
        </motion.div>

        {/* Upload Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-[#171f33] rounded-xl p-8 shadow-deep border border-outline-variant/10"
        >
          {/* Drag & Drop Zone */}
          <div
            {...getRootProps()}
            className={`relative group cursor-pointer border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all duration-300 ${
              isDragActive
                ? "border-primary bg-primary/5 scale-[1.01]"
                : pendingFile
                ? "border-primary/40 bg-primary/5"
                : "border-outline-variant/30 hover:border-primary/50 hover:bg-surface-container-highest/30"
            }`}
          >
            <input {...getInputProps()} />

            <motion.div
              animate={isDragActive ? { scale: 1.15 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-5"
            >
              <Upload
                size={32}
                className={`${isDragActive ? "text-primary" : "text-primary/70"} transition-colors`}
              />
            </motion.div>

            <AnimatePresence mode="wait">
              {pendingFile ? (
                <motion.div
                  key="file-selected"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="text-center"
                >
                  <div className="flex items-center gap-2 justify-center mb-2">
                    <FileText size={18} className="text-primary" />
                    <span className="text-on-surface font-bold text-base">
                      {pendingFile.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingFile(null);
                        setError(null);
                      }}
                      className="text-on-surface-variant hover:text-error transition-colors ml-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <p className="text-on-surface-variant text-sm">
                    {formatBytes(pendingFile.size)} &bull;{" "}
                    <span className="text-primary font-semibold">Ready to analyze</span>
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="no-file"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="text-center"
                >
                  <h3 className="text-xl font-bold text-on-surface mb-2">
                    {isDragActive ? "Drop it here!" : "Drop your dataset here"}
                  </h3>
                  <p className="text-on-surface-variant text-sm max-w-xs mb-6">
                    Drag and drop your files or{" "}
                    <span className="text-primary font-semibold">browse computer</span>
                  </p>
                  <div className="flex gap-3 justify-center">
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-error text-sm text-center"
            >
              {error}
            </motion.p>
          )}

          {/* Action Button */}
          <div className="mt-6">
            <motion.button
              onClick={handleAnalyze}
              disabled={!pendingFile || uploading}
              whileHover={pendingFile && !uploading ? { y: -2 } : {}}
              whileTap={pendingFile && !uploading ? { scale: 0.98 } : {}}
              className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-300 ${
                pendingFile && !uploading
                  ? "bg-gradient-to-r from-[#3B82F6] to-[#818CF8] text-white shadow-[0_0_24px_rgba(59,130,246,0.4)] hover:shadow-[0_0_36px_rgba(59,130,246,0.5)]"
                  : "bg-surface-container-highest text-on-surface-variant cursor-not-allowed opacity-50"
              }`}
            >
              {uploading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  Start Analyzing
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Sample Datasets */}
        {samples.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-outline-variant/15" />
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                <Database size={12} />
                Or try a sample dataset
              </span>
              <div className="flex-1 h-px bg-outline-variant/15" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {samples.map((sample, i) => {
                const Icon = SAMPLE_ICONS[sample.id] ?? BarChart3;
                const colors = SAMPLE_COLORS[sample.id] ?? SAMPLE_COLORS.sales;
                const isLoading = loadingId === sample.id;

                return (
                  <motion.button
                    key={sample.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.25 + i * 0.06 }}
                    onClick={() => handleLoadSample(sample.id)}
                    disabled={!!loadingId}
                    className={`relative text-left p-4 rounded-xl border bg-[#171f33] transition-all duration-200 active:scale-[0.98] disabled:opacity-60 ${colors.card}`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colors.icon}`}>
                      {isLoading ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <Icon size={18} />
                      )}
                    </div>
                    <p className="text-sm font-bold text-on-surface mb-1 leading-tight">{sample.name}</p>
                    <p className="text-[10px] text-on-surface-variant mb-2.5 leading-snug">{sample.description}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {sample.tags.map((tag) => (
                        <span key={tag} className={`label-technical px-2 py-0.5 rounded-full ${colors.tag}`}>
                          {tag}
                        </span>
                      ))}
                      <span className="label-technical text-on-surface-variant ml-auto">
                        {sample.rows.toLocaleString()} rows
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Footer Features */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10 grid grid-cols-3 gap-6"
        >
          {[
            { icon: Shield, title: "Encrypted", desc: "End-to-end AES-256 data protection" },
            { icon: Zap, title: "Fast Processing", desc: "Neural analysis in milliseconds" },
            { icon: Sparkles, title: "AI Cleansing", desc: "Automated outlier detection" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="text-center p-4">
              <div className="text-primary-container mb-2 flex justify-center">
                <Icon size={22} />
              </div>
              <h4 className="label-technical text-on-surface mb-1">{title}</h4>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">{desc}</p>
            </div>
          ))}
        </motion.footer>
      </main>
    </div>
  );
}
