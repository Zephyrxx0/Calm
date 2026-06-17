"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

interface ChatInterfaceProps {
  sessionId: string;
  initialMessage?: string | null;
}

export default function ChatInterface({ sessionId, initialMessage }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/interview/message",
        headers: {
          "x-session-id": sessionId,
        },
      }),
    [sessionId]
  );

  const { messages, sendMessage, status } = useChat({
    transport,
  });

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status !== "ready") return;
    sendMessage({ text: input });
    setInput("");
  };

  const handleQuickAnswer = (answer: string) => {
    if (status !== "ready") return;
    sendMessage({ text: answer });
  };

  const quickAnswers = [
    { label: "0-5", value: "0-5" },
    { label: "5-20", value: "5-20" },
    { label: "20+", value: "20+" },
    { label: "Skip", value: "skip" },
  ];

  return (
    <div className="flex flex-1 flex-col max-w-2xl mx-auto w-full px-4">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-8 space-y-4">
        {initialMessage && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-surface px-5 py-3.5 shadow-sm ring-1 ring-border">
              <p className="text-sm leading-relaxed text-foreground/90">
                {initialMessage}
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-5 py-3.5 text-sm leading-relaxed ${
                message.role === "user"
                  ? "rounded-2xl rounded-tr-sm bg-accent text-white"
                  : "rounded-2xl rounded-tl-sm bg-surface shadow-sm ring-1 ring-border text-foreground/90"
              }`}
            >
              {message.parts.map((part, i) =>
                part.type === "text" ? (
                  <span key={i}>{part.text}</span>
                ) : null
              )}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-background py-4">
        {/* Quick answers */}
        <div className="flex gap-2 flex-wrap mb-3">
          {quickAnswers.map((qa) => (
            <button
              key={qa.value}
              onClick={() => handleQuickAnswer(qa.value)}
              disabled={status !== "ready"}
              className="rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-medium text-muted hover:text-foreground hover:border-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {qa.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Reflect and reply..."
            disabled={status !== "ready"}
            className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-light focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent disabled:opacity-50 transition-shadow"
          />
          <button
            type="submit"
            disabled={status !== "ready" || !input.trim()}
            className="rounded-xl bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-[0.97]"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
