"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { BarChart3, Target, BookOpen, MessageSquare } from "lucide-react";
import type { TabId } from "@/types";
import TopNav from "./TopNav";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  onUploadClick: () => void;
}

const MOBILE_TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "explore", label: "Explore", icon: BarChart3 },
  { id: "predict", label: "Predict", icon: Target },
  { id: "story", label: "Story", icon: BookOpen },
  { id: "chat", label: "Chat", icon: MessageSquare },
];

export default function DashboardLayout({
  children,
  onUploadClick,
}: DashboardLayoutProps) {
  const { activeTab, setActiveTab } = useStore();

  return (
    <div className="min-h-screen bg-surface">
      <TopNav />
      <Sidebar onUploadClick={onUploadClick} />

      <main className="lg:ml-64 pt-16 pb-20 lg:pb-0 min-h-screen bg-surface overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#131b2e]/95 backdrop-blur-xl border-t border-outline-variant/15">
        <div className="flex items-center justify-around h-16 px-2">
          {MOBILE_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all duration-200 relative ${
                activeTab === id ? "text-primary" : "text-on-surface-variant"
              }`}
            >
              {activeTab === id && (
                <motion.span
                  layoutId="mobileActiveTab"
                  className="absolute inset-0 rounded-xl bg-primary/10"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <Icon size={20} className="relative z-10" />
              <span className="text-[9px] font-bold uppercase tracking-wider relative z-10">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
