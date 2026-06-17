"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

interface ChatInterfaceProps {
  sessionId: string;
}

export default function ChatInterface({ sessionId }: ChatInterfaceProps) {
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
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
      {/* Scrollable message list */}
      <div
        role="log"
        aria-label="Chat messages"
        className="flex-1 overflow-y-auto px-6 py-8 space-y-6"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 ${
                message.role === "user"
                  ? "bg-ink text-paper"
                  : "bg-muted text-ink"
              }`}
            >
              {message.parts.map((part, i) => {
                if (part.type === "text") {
                  return (
                    <div key={`${message.id}-${i}`} className="whitespace-pre-wrap">
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

      {/* Input area with hybrid controls */}
      <div className="border-t-2 border-ink px-6 py-4 bg-paper">
        <form onSubmit={handleSubmit} className="flex gap-3 mb-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your answer..."
            disabled={status === "streaming" || status === "submitted"}
            className="flex-1 px-4 py-2 border-2 border-ink bg-paper text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ink disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status === "streaming" || status === "submitted" || !input.trim()}
            className="px-6 py-2 border-2 border-ink bg-paper text-ink font-mono text-sm uppercase tracking-wide transition-colors hover:bg-ink hover:text-paper disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="px-4 py-1 border border-ink bg-paper text-ink font-mono text-xs uppercase tracking-wide transition-colors hover:bg-ink hover:text-paper disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {qa.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
