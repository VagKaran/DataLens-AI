"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import { useStore } from "@/lib/store";

export function ToastManager() {
  const { toasts, removeToast } = useStore();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: { id: string; message: string; type: "success" | "error" | "info" };
  onRemove: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const config = {
    success: {
      icon: CheckCircle,
      bg: "bg-[#131b2e] border-emerald-500/30",
      text: "text-emerald-400",
      bar: "bg-emerald-500",
    },
    error: {
      icon: XCircle,
      bg: "bg-[#131b2e] border-red-500/30",
      text: "text-red-400",
      bar: "bg-red-500",
    },
    info: {
      icon: Info,
      bg: "bg-[#131b2e] border-primary/30",
      text: "text-primary",
      bar: "bg-primary",
    },
  }[toast.type];

  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`pointer-events-auto relative overflow-hidden min-w-[280px] max-w-sm rounded-xl border shadow-2xl ${config.bg}`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <Icon size={18} className={`flex-shrink-0 ${config.text}`} />
        <p className={`text-sm font-semibold flex-1 ${config.text}`}>
          {toast.message}
        </p>
        <button
          onClick={() => onRemove(toast.id)}
          className="text-on-surface-variant hover:text-on-surface transition-colors flex-shrink-0"
        >
          <X size={14} />
        </button>
      </div>
      <motion.div
        className={`absolute bottom-0 left-0 h-[2px] ${config.bar}`}
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: 3.5, ease: "linear" }}
      />
    </motion.div>
  );
}
