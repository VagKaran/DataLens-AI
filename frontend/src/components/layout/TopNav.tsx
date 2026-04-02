"use client";

import { useStore } from "@/lib/store";
import type { TabId } from "@/types";
import { Bell, Radio, User } from "lucide-react";
import { motion } from "framer-motion";

const TABS: { id: TabId; label: string }[] = [
  { id: "explore", label: "Explore" },
  { id: "predict", label: "Predict" },
  { id: "story", label: "Story" },
  { id: "chat", label: "Chat" },
];

export default function TopNav() {
  const { activeTab, setActiveTab, dataset } = useStore();

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0b1326]/70 backdrop-blur-xl shadow-glow font-sans antialiased tracking-tight text-sm font-medium">
      <div className="flex justify-between items-center px-8 h-16 w-full">
        <div className="text-xl font-bold tracking-tighter text-[#dae2fd]">
          DataLens AI
        </div>

        {dataset && (
          <div className="hidden md:flex items-center gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-2 rounded-lg font-semibold transition-colors duration-200 active:scale-95 ${
                  activeTab === tab.id
                    ? "text-white"
                    : "text-[#94a3b8] hover:text-[#dae2fd]"
                }`}
              >
                {activeTab === tab.id && (
                  <motion.span
                    layoutId="activeTabPill"
                    className="absolute inset-0 rounded-lg bg-[#3B82F6]/20 border border-[#3B82F6]/30"
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.span
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#3B82F6] rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button className="p-2 text-primary hover:bg-[#2d3449]/50 transition-all duration-300 rounded-full active:scale-95">
            <Bell size={18} />
          </button>
          <button className="p-2 text-primary hover:bg-[#2d3449]/50 transition-all duration-300 rounded-full active:scale-95">
            <Radio size={18} />
          </button>
          <div className="h-8 w-8 rounded-full bg-surface-container-highest flex items-center justify-center border border-outline-variant/30">
            <User size={15} className="text-primary" />
          </div>
        </div>
      </div>
      <div className="bg-[#131b2e] h-[1px] w-full absolute bottom-0 opacity-20" />
    </nav>
  );
}
