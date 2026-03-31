"use client";

import { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import { chatQuery, getChatSuggestions } from "@/lib/api";
import { MODEL_CONFIGS, type ModelId, type ChatMessage } from "@/types";
import {
  Send,
  Paperclip,
  Mic,
  Bot,
  User,
  Cloud,
  Cpu,
  Zap,
  Code,
  MemoryStick,
  Search,
  FileText,
  Lightbulb,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";

function getModelIcon(id: ModelId) {
  switch (id) {
    case "gpt-3.5":
      return Cloud;
    case "llama-3.1":
      return MemoryStick;
    case "mistral":
      return Zap;
    case "qwen-2.5":
      return Code;
  }
}

export default function ChatTab() {
  const {
    dataset,
    selectedModel,
    setSelectedModel,
    chatMessages,
    addChatMessage,
    totalTokensUsed,
    setTotalTokensUsed,
    chatLoading,
    setChatLoading,
    suggestedQuestions,
    setSuggestedQuestions,
  } = useStore();

  const [input, setInput] = useState("");
  const [showModelPicker, setShowModelPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modelPickerRef = useRef<HTMLDivElement>(null);

  const modelConfig = MODEL_CONFIGS.find((m) => m.id === selectedModel)!;
  const contextUsedPct = (totalTokensUsed / modelConfig.contextWindow) * 100;

  // Load suggestions on mount
  useEffect(() => {
    if (dataset && suggestedQuestions.length === 0) {
      getChatSuggestions()
        .then((res) => setSuggestedQuestions(res.suggestions))
        .catch(console.error);
    }
  }, [dataset, suggestedQuestions.length, setSuggestedQuestions]);

  // Auto-scroll — use scrollTop on the container instead of scrollIntoView
  // to prevent the parent page from scrolling (which hides the header)
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    }
  }, [chatMessages]);

  // Close model picker on click outside
  useEffect(() => {
    if (!showModelPicker) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        modelPickerRef.current &&
        !modelPickerRef.current.contains(e.target as Node)
      ) {
        setShowModelPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showModelPicker]);

  async function handleSend(text?: string) {
    const msg = text || input.trim();
    if (!msg || chatLoading) return;
    setInput("");

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: msg,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    addChatMessage(userMsg);
    setChatLoading(true);

    try {
      const history = chatMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const res = await chatQuery(msg, selectedModel, history);
      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: res.answer,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        sql: res.sql,
        data: res.data,
        visualization: res.visualization,
        tokens_used: res.tokens_used,
      };
      addChatMessage(aiMsg);
      setTotalTokensUsed(totalTokensUsed + (res.tokens_used || 0));
      if (res.suggestions?.length) setSuggestedQuestions(res.suggestions);
    } catch (e) {
      const errMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Error: ${e instanceof Error ? e.message : "Something went wrong"}`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      addChatMessage(errMsg);
    } finally {
      setChatLoading(false);
    }
  }

  if (!dataset) return null;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      {/* Fixed Header Area — always visible, never scrolls */}
      <div className="flex-shrink-0 max-w-5xl mx-auto w-full px-6 pt-8 pb-2">
        {/* AI Status Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-surface-container rounded-2xl shadow-sm">
              <Bot size={28} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-on-surface">
                DataLens Intelligence
              </h1>
              <p className="text-xs text-on-surface-variant flex items-center gap-1.5 uppercase tracking-widest font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                System Ready for Analysis
              </p>
            </div>
          </div>

          {/* Model Picker */}
          <div ref={modelPickerRef} className="relative z-50">
            <button
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="flex items-center gap-3 bg-surface-container-low px-4 py-2.5 rounded-xl border border-outline-variant/20 hover:border-primary/30 transition-all"
            >
              {(() => {
                const Icon = getModelIcon(selectedModel);
                return <Icon size={16} className="text-primary" />;
              })()}
              <span className="text-sm font-semibold text-on-surface">
                {modelConfig.name}
              </span>
              <span
                className={`label-technical px-2 py-0.5 rounded-full ${
                  modelConfig.provider === "cloud"
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-green-500/20 text-green-400"
                }`}
              >
                {modelConfig.provider}
              </span>
              <ChevronDown size={14} className="text-outline" />
            </button>

            {showModelPicker && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-surface-container-high rounded-xl border border-outline-variant/20 shadow-deep z-50 p-2">
                {MODEL_CONFIGS.map((m) => {
                  const Icon = getModelIcon(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedModel(m.id);
                        setShowModelPicker(false);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                        selectedModel === m.id
                          ? "bg-primary/10 text-on-surface"
                          : "text-on-surface-variant hover:bg-surface-container-highest"
                      }`}
                    >
                      <Icon size={18} className="text-primary flex-shrink-0" />
                      <div className="flex-1 text-left">
                        <div className="text-sm font-semibold">{m.name}</div>
                        <div className="text-[10px] text-on-surface-variant">
                          Context: {m.contextWindow.toLocaleString()} tokens
                        </div>
                      </div>
                      <span
                        className={`label-technical px-2 py-0.5 rounded-full ${
                          m.provider === "cloud"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-green-500/20 text-green-400"
                        }`}
                      >
                        {m.provider}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Context Window Meter */}
        <div className="mb-2 bg-surface-container-low rounded-xl p-4 border border-outline-variant/10">
          <div className="flex justify-between items-center mb-2">
            <span className="label-technical text-on-surface-variant">
              Context Window — {modelConfig.name}
            </span>
            <span className="text-xs font-semibold text-on-surface">
              {totalTokensUsed.toLocaleString()} /{" "}
              {modelConfig.contextWindow.toLocaleString()} tokens
            </span>
          </div>
          <div className="context-bar h-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                contextUsedPct > 80
                  ? "bg-error"
                  : contextUsedPct > 50
                  ? "bg-tertiary"
                  : "bg-primary"
              }`}
              style={{ width: `${Math.min(contextUsedPct, 100)}%` }}
            />
          </div>
          {contextUsedPct > 80 && (
            <div className="flex items-center gap-2 mt-2 text-error text-xs">
              <AlertTriangle size={12} />
              Context window is filling up. Consider clearing the chat.
            </div>
          )}
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-on-surface-variant">
              Remaining:{" "}
              {(modelConfig.contextWindow - totalTokensUsed).toLocaleString()}{" "}
              tokens
            </span>
            <span className="text-[10px] text-on-surface-variant">
              {contextUsedPct.toFixed(1)}% used
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable Middle — messages area, takes all remaining space */}
      <div className="flex-1 min-h-0 relative max-w-5xl mx-auto w-full">
        <div ref={messagesContainerRef} className="absolute inset-0 overflow-y-auto px-6 py-4 space-y-8">
          {chatMessages.length === 0 && (
            <div className="flex gap-4 items-start max-w-[85%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center">
                <Bot size={14} className="text-primary" />
              </div>
              <div className="space-y-2">
                <div className="bubble-ai">
                  <p className="leading-relaxed">
                    Hello! I&apos;ve connected to your dataset (
                    {dataset.rows.toLocaleString()} rows,{" "}
                    {dataset.columns} columns). Ask me anything about your data —
                    I&apos;ll query it using SQL and visualize the results.
                  </p>
                </div>
                <span className="label-technical text-on-surface-variant ml-1">
                  DataLens AI
                </span>
              </div>
            </div>
          )}

          {chatMessages.map((msg) => (
            <div key={msg.id}>
              {msg.role === "assistant" ? (
                <div className="flex gap-4 items-start max-w-[85%]">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center">
                    <Bot size={14} className="text-primary" />
                  </div>
                  <div className="space-y-2">
                    <div className="bubble-ai">
                      <p className="leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>
                      {msg.sql && (
                        <div className="mt-3 p-3 bg-surface-container-lowest rounded-lg">
                          <p className="label-technical text-primary mb-1">
                            SQL Query
                          </p>
                          <code className="text-xs text-on-surface-variant font-mono">
                            {msg.sql}
                          </code>
                        </div>
                      )}
                      {msg.data && msg.data.length > 0 && (
                        <div className="mt-3 overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="border-b border-outline-variant/10">
                                {Object.keys(msg.data[0]).map((k) => (
                                  <th
                                    key={k}
                                    className="pb-2 pr-4 label-technical text-on-surface-variant"
                                  >
                                    {k}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {msg.data.slice(0, 10).map((row, i) => (
                                <tr
                                  key={i}
                                  className="border-b border-outline-variant/5"
                                >
                                  {Object.values(row).map((v, j) => (
                                    <td key={j} className="py-2 pr-4">
                                      {String(v)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {msg.visualization && (
                        <div className="mt-3">
                          <img
                            src={`data:image/png;base64,${msg.visualization}`}
                            alt="Chart"
                            className="rounded-lg max-w-full"
                          />
                        </div>
                      )}
                    </div>
                    <span className="label-technical text-on-surface-variant ml-1">
                      DataLens AI &bull; {msg.timestamp}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex gap-4 items-start flex-row-reverse max-w-[85%] ml-auto">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <User size={14} className="text-primary" />
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="bubble-user">
                      <p className="leading-relaxed font-medium">
                        {msg.content}
                      </p>
                    </div>
                    <span className="label-technical text-on-surface-variant mr-1">
                      You &bull; {msg.timestamp}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {chatLoading && (
            <div className="flex gap-4 items-start max-w-[85%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center">
                <Bot size={14} className="text-primary animate-pulse" />
              </div>
              <div className="bubble-ai">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                  <span className="text-xs">Analyzing with {modelConfig.name}...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-32 flex-shrink-0" />
        </div>
      </div>

      {/* Fixed Input Area — always at the bottom */}
      <div className="flex-shrink-0 max-w-5xl mx-auto w-full px-6 pb-4 pt-2">
        {/* Suggested Chips */}
        {suggestedQuestions.length > 0 && chatMessages.length < 4 && (
          <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
            {suggestedQuestions.slice(0, 3).map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="whitespace-nowrap bg-surface-container-highest/50 hover:bg-surface-container-highest text-on-surface text-xs font-semibold py-2 px-4 rounded-full border border-outline-variant/10 transition-all flex items-center gap-2 active:scale-95"
              >
                <Search size={12} />
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Chat Input */}
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative flex items-center bg-surface-container-lowest border border-outline-variant/20 rounded-2xl overflow-hidden focus-within:border-primary/50 transition-all shadow-xl">
            <button className="p-4 text-on-surface-variant hover:text-primary transition-colors">
              <Paperclip size={20} />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask DataLens anything about your dataset..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-on-surface placeholder-on-surface-variant/40 py-4 text-sm font-medium outline-none"
            />
            <div className="flex items-center gap-2 pr-4">
              <button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
                <Mic size={18} />
              </button>
              <button
                onClick={() => handleSend()}
                disabled={chatLoading || !input.trim()}
                className="gradient-primary p-2.5 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
              >
                <Send size={18} className="text-on-primary-container" />
              </button>
            </div>
          </div>
        </div>
        <p className="text-center mt-2 label-technical text-on-surface-variant opacity-60">
          Powered by DataLens Neural Core v4.2
        </p>
      </div>
    </div>
  );
}
