"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

interface ChatInterfaceProps {
  sessionId: string;
  initialMessage?: string | null;
}

export default function ChatInterface({ sessionId, initialMessage }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/interview/message",
      headers: {
        "x-session-id": sessionId,
      },
    }),
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status === "streaming" || status === "submitted") return;
    sendMessage({ text: input });
    setInput("");
  };

  const handleQuickAnswer = (answer: string) => {
    if (status === "streaming" || status === "submitted") return;
    sendMessage({ text: answer });
  };

  // Quick answer options for quantitative questions
  const quickAnswers = [
    { label: "0-5", value: "0-5" },
    { label: "5-20", value: "5-20" },
    { label: "20+", value: "20+" },
    { label: "Skip", value: "skip" },
  ];

  return (
    <div className="flex flex-1 flex-col max-w-2xl mx-auto w-full">
      {/* Scrollable message list */}
      <div
        role="log"
        aria-label="Chat messages"
        className="flex-1 overflow-y-auto px-6 py-8 space-y-4"
      >
        {messages.length === 0 && initialMessage && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-surface text-foreground shadow-sm">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {initialMessage}
              </div>
            </div>
          </div>
        )}
        {messages.length === 0 && !initialMessage && (
          <div className="text-center text-muted py-12">
            <p className="text-sm">Your conversation will appear here.</p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === "user"
                  ? "bg-accent text-white"
                  : "bg-surface text-foreground shadow-sm"
              }`}
            >
              {message.parts.map((part, i) => {
                if (part.type === "text") {
                  return (
                    <div key={`${message.id}-${i}`} className="whitespace-pre-wrap text-sm leading-relaxed">
                      {part.text}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-background px-6 py-4">
        <form onSubmit={handleSubmit} className="flex gap-3 mb-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your answer..."
            disabled={status === "streaming" || status === "submitted"}
            className="flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50 transition-colors"
          />
          <button
            type="submit"
            disabled={status === "streaming" || status === "submitted" || !input.trim()}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>

        {/* Quick-answer buttons */}
        <div className="flex gap-2 flex-wrap">
          {quickAnswers.map((qa) => (
            <button
              key={qa.value}
              onClick={() => handleQuickAnswer(qa.value)}
              disabled={status === "streaming" || status === "submitted"}
              className="rounded-lg border border-border bg-surface px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary hover:border-border disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {qa.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
