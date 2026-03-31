"use client";

import { useStore } from "@/lib/store";
import { Database, Upload, HelpCircle, Settings } from "lucide-react";

interface SidebarProps {
  onUploadClick: () => void;
}

export default function Sidebar({ onUploadClick }: SidebarProps) {
  const { dataset } = useStore();

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-[#131b2e] flex-col p-4 space-y-6 hidden lg:flex z-40">
      {/* Dataset Info */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-3 mb-1">
          {dataset ? (
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          ) : (
            <Database size={14} className="text-[#94a3b8]" />
          )}
          <span className="label-technical text-[#3B82F6]">
            Current Dataset
          </span>
        </div>
        {dataset ? (
          <p className="text-xs text-[#94a3b8]">
            Active: {dataset.rows.toLocaleString()} rows | {dataset.columns}{" "}
            cols
          </p>
        ) : (
          <p className="text-xs text-[#94a3b8]">No data loaded</p>
        )}
      </div>

      {/* Upload Button */}
      <button
        onClick={onUploadClick}
        className="mx-4 py-2.5 px-4 rounded-xl gradient-primary text-on-primary-container font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-glow-primary transition-all active:scale-[0.98] flex items-center justify-center gap-2"
      >
        <Upload size={14} />
        Upload Dataset
      </button>

      {/* Nav Links */}
      <div className="flex-1 flex flex-col space-y-1">
        <a
          href="#"
          className="text-[#94a3b8] px-4 py-3 flex items-center gap-3 hover:bg-[#171f33] hover:text-[#dae2fd] transition-all rounded-lg text-sm tracking-wide uppercase font-semibold"
        >
          <HelpCircle size={18} />
          Help
        </a>
        <a
          href="#"
          className="text-[#94a3b8] px-4 py-3 flex items-center gap-3 hover:bg-[#171f33] hover:text-[#dae2fd] transition-all rounded-lg text-sm tracking-wide uppercase font-semibold"
        >
          <Settings size={18} />
          Settings
        </a>
      </div>
    </aside>
  );
}
