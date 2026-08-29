"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  Bot,
  User,
  Terminal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { AiDisclaimer } from "@/components/ai/AiDisclaimer";
import { aiService } from "@/data/services";
import { AskMangoCycleMessage } from "@/data/contracts/ai";
import { askMangoCycleQuerySchema } from "@/lib/validators/ai";

const SUGGESTED_QUERIES = [
  "How much waste has been collected?",
  "How many batches are currently active?",
  "Show details for MW-2026-001",
  "Show details for BF-2026-001",
  "Which source supplied the most waste?",
  "Show recent laboratory tests",
];

export const AskMangoCycleChat: React.FC = () => {
  const [messages, setMessages] = useState<AskMangoCycleMessage[]>([
    {
      id: "msg-welcome",
      role: "assistant",
      content:
        "Welcome to **Ask MangoCycle**! I am a decision-support data assistant. You can ask me questions in natural language about recorded waste batches, product formulations, supplier breakdowns, and laboratory testing results.",
      timestamp: new Date().toISOString(),
      isAiGenerated: true,
      model: "gpt-4o (tool-calling query assistant)",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || isLoading) return;

    const validation = askMangoCycleQuerySchema.safeParse({ question: textToSend });
    if (!validation.success) {
      alert(validation.error.errors[0]?.message || "Invalid question");
      return;
    }

    const userMsg: AskMangoCycleMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await aiService.queryAskMangoCycle(textToSend);
      setMessages((prev) => [...prev, response]);
    } catch {
      const errorMsg: AskMangoCycleMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content:
          "An error occurred while executing data queries. Please try rephrasing your question.",
        timestamp: new Date().toISOString(),
        isAiGenerated: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleToolExpand = (msgId: string, toolIdx: number) => {
    const key = `${msgId}-${toolIdx}`;
    setExpandedTools((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4">
      <AiDisclaimer
        label="Ask MangoCycle — Tool-Calling Assistant"
        description="This assistant answers queries by executing approved read-only tool functions against operational platform data. It cannot execute arbitrary SQL, modify database records, or expose private researcher notes."
        compact
      />

      <Card className="flex flex-col h-[640px] shadow-sm">
        {/* Chat Header */}
        <CardHeader className="py-3.5 px-4 border-b border-border flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm">Ask MangoCycle Data Assistant</CardTitle>
              <CardDescription className="text-[11px]">
                Deterministic tool calling over verified repository state
              </CardDescription>
            </div>
          </div>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-surface-secondary border border-border text-text-secondary">
            Read-Only Tools
          </span>
        </CardHeader>

        {/* Message Stream */}
        <CardContent className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
          {messages.map((msg) => {
            const isUser = msg.role === "user";

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 space-y-2 ${
                    isUser
                      ? "bg-primary text-white rounded-tr-xs"
                      : "bg-surface-secondary/60 border border-border text-text-primary rounded-tl-xs"
                  }`}
                >
                  {/* Tool Call Invocation Drawer (for assistant messages) */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="space-y-1.5 pb-1">
                      {msg.toolCalls.map((tc, idx) => {
                        const key = `${msg.id}-${idx}`;
                        const isExpanded = expandedTools[key];

                        return (
                          <div
                            key={idx}
                            className="rounded-lg border border-border/80 bg-surface text-[11px] overflow-hidden"
                          >
                            <button
                              type="button"
                              onClick={() => toggleToolExpand(msg.id, idx)}
                              className="w-full px-2.5 py-1.5 flex items-center justify-between text-text-secondary hover:text-text-primary hover:bg-surface-secondary/40 transition-colors font-mono"
                            >
                              <span className="flex items-center gap-1.5 text-[10px]">
                                <Terminal className="w-3 h-3 text-purple-600" />
                                <span>Tool: {tc.toolName}</span>
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>

                            {isExpanded && (
                              <div className="p-2 border-t border-border/60 bg-background/50 space-y-1 font-mono text-[10px] text-text-secondary">
                                <p>
                                  <strong>Params:</strong>{" "}
                                  {JSON.stringify(tc.parameters)}
                                </p>
                                <p>
                                  <strong>Result:</strong>{" "}
                                  {JSON.stringify(tc.result)}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Message Content */}
                  <div className="leading-relaxed whitespace-pre-line text-xs font-normal">
                    {msg.content}
                  </div>

                  {/* Assistant Footer */}
                  {!isUser && msg.model && (
                    <div className="text-[9px] text-text-secondary/70 font-mono pt-1 flex items-center gap-2 border-t border-border/40">
                      <span>Model: {msg.model.split(" ")[0]}</span>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-2.5 items-center text-xs text-text-secondary">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="p-3 rounded-xl border border-border bg-surface-secondary/40 flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-[11px]">Executing approved tool query...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Suggested Queries Strip */}
        <div className="px-4 py-2 bg-surface-secondary/30 border-t border-border flex items-center gap-1.5 overflow-x-auto text-[10px]">
          <span className="text-text-secondary font-semibold shrink-0">
            Suggested:
          </span>
          {SUGGESTED_QUERIES.map((sq) => (
            <button
              key={sq}
              type="button"
              onClick={() => handleSend(sq)}
              disabled={isLoading}
              className="px-2 py-0.5 rounded-full border border-border bg-surface hover:bg-surface-secondary text-text-primary whitespace-nowrap transition-colors"
            >
              {sq}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 border-t border-border bg-surface flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about batches, metrics, suppliers, or lab assays..."
            disabled={isLoading}
            className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-border bg-background text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!input.trim() || isLoading}
            leftIcon={<Send className="w-3.5 h-3.5" />}
          >
            Send
          </Button>
        </form>
      </Card>
    </div>
  );
};
