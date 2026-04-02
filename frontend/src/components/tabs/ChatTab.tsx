"use client";

import { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import { chatQuery, getChatSuggestions, getOllamaStatus, type OllamaModelStatus } from "@/lib/api";
import { MODEL_CONFIGS, type ModelId, type ChatMessage } from "@/types";
import {
  Send,
  Paperclip,
  Mic,
  Bot,
  User,
  Cloud,
  Zap,
  Code,
  MemoryStick,
  Search,
  ChevronDown,
  AlertTriangle,
  Copy,
  Check,
  Download,
  ArrowRight,
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
    clearChat,
    chatDatasetId,
    setChatDatasetId,
  } = useStore();

  const [input, setInput] = useState("");
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [ollamaStatus, setOllamaStatus] = useState<Record<string, OllamaModelStatus>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const modelPickerRef = useRef<HTMLDivElement>(null);

  function autoResizeTextarea(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  const modelConfig = MODEL_CONFIGS.find((m) => m.id === selectedModel)!;
  const contextUsedPct = (totalTokensUsed / modelConfig.contextWindow) * 100;

  // Detect dataset change using persisted chatDatasetId in the global store.
  // This survives ChatTab unmount/remount (e.g. when the user uploads a new dataset
  // from the landing page, which temporarily unmounts the dashboard).
  useEffect(() => {
    if (!dataset) return;
    const currentId = `${dataset.filename}::${dataset.rows}`;
    if (chatDatasetId !== currentId) {
      // New dataset loaded — reset chat session and fetch fresh suggestions
      clearChat();
      setSuggestedQuestions([]);
      setChatDatasetId(currentId);
      getChatSuggestions()
        .then((res) => setSuggestedQuestions(res.suggestions))
        .catch(console.error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset?.filename, dataset?.rows]);

  // Auto-scroll
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

  // Poll Ollama status every 10s to track model availability
  useEffect(() => {
    function fetchStatus() {
      getOllamaStatus()
        .then((res) => setOllamaStatus(res.models))
        .catch(() => setOllamaStatus({}));
    }
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  async function handleSend(text?: string) {
    const msg = text || input.trim();
    if (!msg || chatLoading) return;
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";

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
        followups: res.followups,
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

  function exportChat() {
    const lines = chatMessages.map((msg) => {
      const role = msg.role === "user" ? "You" : "DataLens AI";
      let text = `[${msg.timestamp}] ${role}:\n${msg.content}`;
      if (msg.sql) text += `\n\nSQL Query:\n${msg.sql}`;
      if (msg.data && msg.data.length > 0)
        text += `\n\nResult: ${msg.data.length} row(s) returned`;
      return text;
    });
    const header = `DataLens AI — Chat Export\nDataset: ${dataset?.filename || "Unknown"} (${dataset?.rows.toLocaleString()} rows, ${dataset?.columns} columns)\nDate: ${new Date().toLocaleDateString()}\n${"═".repeat(50)}\n\n`;
    const content = header + lines.join("\n\n" + "─".repeat(50) + "\n\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `datalens_chat_${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (!dataset) return null;

  // Find index of last assistant message (for inline follow-ups)
  const lastAiIdx = chatMessages.reduce(
    (acc, msg, i) => (msg.role === "assistant" ? i : acc),
    -1
  );

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0 max-w-5xl mx-auto w-full px-6 pt-8 pb-2">
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

          <div className="flex items-center gap-3">
            {/* Export button */}
            {chatMessages.length > 0 && (
              <button
                onClick={exportChat}
                title="Export conversation"
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/20 hover:border-primary/30 text-on-surface-variant hover:text-primary transition-all text-xs font-semibold"
              >
                <Download size={14} />
                Export
              </button>
            )}

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
                    const isLocal = m.provider === "local";
                    const status = ollamaStatus[m.id];
                    const isReady = !isLocal || status?.ready;
                    const isDownloading = isLocal && status !== undefined && !status.ready;
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
                            {isLocal && status && ` · ${status.model}`}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`label-technical px-2 py-0.5 rounded-full ${
                              m.provider === "cloud"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-green-500/20 text-green-400"
                            }`}
                          >
                            {m.provider}
                          </span>
                          {isLocal && (
                            <span className={`label-technical px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              isReady
                                ? "bg-emerald-500/20 text-emerald-400"
                                : isDownloading
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-surface-container-highest text-on-surface-variant"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                isReady ? "bg-emerald-400" : isDownloading ? "bg-yellow-400 animate-pulse" : "bg-outline"
                              }`} />
                              {isReady ? "Ready" : isDownloading ? "Downloading..." : "Not loaded"}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
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

      {/* Scrollable Messages Area */}
      <div className="flex-1 min-h-0 relative max-w-5xl mx-auto w-full">
        <div
          ref={messagesContainerRef}
          className="absolute inset-0 overflow-y-auto px-6 py-4 space-y-8"
        >
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

          {chatMessages.map((msg, msgIdx) => (
            <div key={msg.id}>
              {msg.role === "assistant" ? (
                <div className="flex gap-4 items-start max-w-[85%]">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center">
                    <Bot size={14} className="text-primary" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="bubble-ai">
                      <p className="leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>
                      {msg.sql && (
                        <div className="mt-3 p-3 bg-surface-container-lowest rounded-lg group/sql relative">
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="label-technical text-primary">
                              SQL Query
                            </p>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(msg.sql!);
                                setCopiedId(msg.id);
                                setTimeout(() => setCopiedId(null), 2000);
                              }}
                              className="opacity-0 group-hover/sql:opacity-100 transition-opacity p-1 rounded-md hover:bg-surface-container-high flex items-center gap-1"
                              title="Copy SQL"
                            >
                              {copiedId === msg.id ? (
                                <Check size={11} className="text-primary" />
                              ) : (
                                <Copy
                                  size={11}
                                  className="text-on-surface-variant"
                                />
                              )}
                            </button>
                          </div>
                          <code className="text-xs text-on-surface-variant font-mono whitespace-pre-wrap break-all">
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

                    {/* Inline follow-up suggestions — only after last AI message */}
                    {msgIdx === lastAiIdx &&
                      msg.followups &&
                      msg.followups.length > 0 &&
                      !chatLoading && (
                        <div className="mt-1">
                          <p className="label-technical text-on-surface-variant mb-2 ml-1">
                            Follow-up questions
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {msg.followups.map((q) => (
                              <button
                                key={q}
                                onClick={() => handleSend(q)}
                                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/40 transition-all active:scale-95"
                              >
                                <ArrowRight size={10} />
                                {q}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

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
                  <span className="text-xs">
                    Analyzing with {modelConfig.name}...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-32 flex-shrink-0" />
        </div>
      </div>

      {/* Fixed Input Area */}
      <div className="flex-shrink-0 max-w-5xl mx-auto w-full px-6 pb-4 pt-2">
        {/* Dataset-specific suggested questions (contextual chips) */}
        {suggestedQuestions.length > 0 && chatMessages.length < 6 && (
          <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide pb-0.5">
            {suggestedQuestions.slice(0, 4).map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="flex-shrink-0 whitespace-nowrap bg-surface-container-highest/40 hover:bg-surface-container-highest text-on-surface text-xs font-medium py-1.5 px-3 rounded-full border border-outline-variant/10 hover:border-outline-variant/25 transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Search size={10} className="text-primary" />
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
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                autoResizeTextarea(e.target);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask DataLens anything about your dataset... (Shift+Enter for new line)"
              className="flex-1 bg-transparent border-none focus:ring-0 text-on-surface placeholder-on-surface-variant/40 py-4 text-sm font-medium outline-none resize-none leading-relaxed"
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
