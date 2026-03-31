"use client";

import { useStore } from "@/lib/store";
import type { TabId } from "@/types";
import { Bell, Radio, User } from "lucide-react";

const TABS: { id: TabId; label: string }[] = [
  { id: "explore", label: "Explore" },
  { id: "predict", label: "Predict" },
  { id: "story", label: "Story" },
  { id: "chat", label: "Chat" },
];

export default function TopNav() {
  const { activeTab, setActiveTab, dataset } = useStore();

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0b1326]/60 backdrop-blur-xl shadow-glow font-sans antialiased tracking-tight text-sm font-medium">
      <div className="flex justify-between items-center px-8 h-16 w-full">
        <div className="text-xl font-bold tracking-tighter text-[#dae2fd]">
          DataLens AI
        </div>

        {dataset && (
          <div className="hidden md:flex items-center gap-8">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`transition-colors duration-200 active:scale-95 ${
                  activeTab === tab.id
                    ? "text-[#3B82F6] border-b-2 border-[#3B82F6] pb-1"
                    : "text-[#94a3b8] hover:text-[#dae2fd]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4">
          <button className="p-2 text-primary hover:bg-[#2d3449]/50 transition-all duration-300 rounded-full active:scale-95">
            <Bell size={20} />
          </button>
          <button className="p-2 text-primary hover:bg-[#2d3449]/50 transition-all duration-300 rounded-full active:scale-95">
            <Radio size={20} />
          </button>
          <div className="h-8 w-8 rounded-full bg-surface-container-highest flex items-center justify-center border border-outline-variant/30">
            <User size={16} className="text-primary" />
          </div>
        </div>
      </div>
      <div className="bg-[#131b2e] h-[1px] w-full absolute bottom-0 opacity-20" />
    </nav>
  );
}
