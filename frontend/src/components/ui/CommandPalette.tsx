"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BarChart3, Target, BookOpen, MessageSquare, Upload, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import type { TabId } from "@/types";

interface Command {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  action: () => void;
  group: string;
  available: boolean;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { dataset, setDataset, setActiveTab, clearChat } = useStore();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 60);
      setQuery("");
      setSelected(0);
    }
  }, [open]);

  const navTab = (id: TabId) => () => { setActiveTab(id); setOpen(false); };

  const commands: Command[] = [
    { id: "explore", label: "Go to Explore", description: "Exploratory data analysis", icon: BarChart3, group: "Navigate", action: navTab("explore"), available: !!dataset },
    { id: "predict", label: "Go to Predict", description: "Machine learning & forecasting", icon: Target, group: "Navigate", action: navTab("predict"), available: !!dataset },
    { id: "story", label: "Go to Story", description: "Generate editorial reports", icon: BookOpen, group: "Navigate", action: navTab("story"), available: !!dataset },
    { id: "chat", label: "Go to Chat", description: "AI data assistant", icon: MessageSquare, group: "Navigate", action: navTab("chat"), available: !!dataset },
    { id: "upload", label: "Upload New Dataset", description: "Replace the current dataset", icon: Upload, group: "Actions", action: () => { setDataset(null); setOpen(false); }, available: true },
    { id: "clear-chat", label: "Clear Chat History", description: "Reset the conversation", icon: Trash2, group: "Actions", action: () => { clearChat(); setOpen(false); }, available: !!dataset },
  ];

  const filtered = commands.filter(
    (c) =>
      c.available &&
      (c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.description.toLowerCase().includes(query.toLowerCase()))
  );

  useEffect(() => setSelected(0), [query]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === "Enter") { e.preventDefault(); filtered[selected]?.action(); }
  }

  const groups = ["Navigate", "Actions"];

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[2000] flex items-start justify-center pt-[12vh] px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

            <motion.div
              className="relative w-full max-w-xl bg-[#171f33] rounded-2xl border border-outline-variant/20 shadow-[0_32px_80px_rgba(0,0,0,0.7)] overflow-hidden"
              initial={{ opacity: 0, y: -24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.96 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-outline-variant/10">
                <Search size={17} className="text-on-surface-variant flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search commands..."
                  className="flex-1 bg-transparent text-on-surface placeholder-on-surface-variant/50 outline-none text-sm font-medium"
                />
                <kbd className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant text-[10px] font-mono">ESC</kbd>
              </div>

              <div className="max-h-80 overflow-y-auto py-2">
                {filtered.length === 0 ? (
                  <p className="text-center text-on-surface-variant text-sm py-10">No commands found</p>
                ) : (
                  groups.map((group) => {
                    const groupCmds = filtered.filter((c) => c.group === group);
                    if (!groupCmds.length) return null;
                    return (
                      <div key={group}>
                        <p className="label-technical text-on-surface-variant px-4 pt-3 pb-1">{group}</p>
                        {groupCmds.map((cmd, i) => {
                          const Icon = cmd.icon;
                          const globalIdx = filtered.indexOf(cmd);
                          return (
                            <button
                              key={cmd.id}
                              onClick={cmd.action}
                              onMouseEnter={() => setSelected(globalIdx)}
                              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                                selected === globalIdx ? "bg-surface-container-high" : "hover:bg-surface-container-high/50"
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                                selected === globalIdx ? "bg-primary/20" : "bg-surface-container-highest"
                              }`}>
                                <Icon size={15} className="text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-on-surface">{cmd.label}</p>
                                <p className="text-xs text-on-surface-variant">{cmd.description}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-outline-variant/10 px-4 py-2.5 flex items-center gap-4">
                {[["↑↓", "navigate"], ["↵", "select"]].map(([key, label]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant text-[10px] font-mono">{key}</kbd>
                    <span className="text-[10px] text-on-surface-variant">{label}</span>
                  </div>
                ))}
                <div className="ml-auto text-[10px] text-on-surface-variant flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-surface-container-highest font-mono">⌘K</kbd>
                  <span>toggle</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
