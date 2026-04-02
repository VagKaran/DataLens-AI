"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ArrowRight, X, Sparkles } from "lucide-react";

interface NextStepBannerProps {
  title: string;
  description: string;
  cta: string;
  onAction: () => void;
  color?: "blue" | "purple" | "green" | "amber";
}

const COLORS = {
  blue: {
    bg: "from-blue-500/10 to-blue-600/5",
    border: "border-blue-500/20",
    icon: "text-blue-400",
    btn: "bg-blue-500/20 hover:bg-blue-500/30 text-blue-300",
  },
  purple: {
    bg: "from-purple-500/10 to-purple-600/5",
    border: "border-purple-500/20",
    icon: "text-purple-400",
    btn: "bg-purple-500/20 hover:bg-purple-500/30 text-purple-300",
  },
  green: {
    bg: "from-green-500/10 to-green-600/5",
    border: "border-green-500/20",
    icon: "text-green-400",
    btn: "bg-green-500/20 hover:bg-green-500/30 text-green-300",
  },
  amber: {
    bg: "from-amber-500/10 to-amber-600/5",
    border: "border-amber-500/20",
    icon: "text-amber-400",
    btn: "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300",
  },
};

export default function NextStepBanner({
  title,
  description,
  cta,
  onAction,
  color = "blue",
}: NextStepBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const c = COLORS[color];

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`relative bg-gradient-to-r ${c.bg} border ${c.border} rounded-2xl p-5 mb-8 flex items-center gap-4`}
        >
          <div className={`flex-shrink-0 p-2.5 rounded-xl bg-white/5 ${c.icon}`}>
            <Sparkles size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-on-surface mb-0.5">{title}</p>
            <p className="text-xs text-on-surface-variant">{description}</p>
          </div>
          <button
            onClick={onAction}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${c.btn} active:scale-95`}
          >
            {cta}
            <ArrowRight size={13} />
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="flex-shrink-0 p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
