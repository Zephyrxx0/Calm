"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
}

interface ChatInterfaceProps {
  sessionId: string;
  initialMessage?: string | null;
}

export default function ChatInterface({ sessionId, initialMessage }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendToAI = async (text: string) => {
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);

    const aiMsg: Message = { id: crypto.randomUUID(), role: "ai", text: "" };
    setMessages((prev) => [...prev, aiMsg]);

    try {
      const response = await fetch("/api/interview/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionId,
        },
        body: JSON.stringify({
          messages: [
            { role: "user", parts: [{ type: "text", text }] },
          ],
        }),
      });

      if (!response.ok) {
        setStreaming(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setStreaming(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              const text = JSON.parse(line.slice(2));
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsg.id ? { ...m, text: m.text + text } : m
                )
              );
            } catch (e) {
              // parse error, skip
            }
          }
        }
      }
    } catch (e) {
      console.error("[Chat] API error:", e);
    } finally {
      setStreaming(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || streaming) return;
    sendToAI(input);
    setInput("");
  };

  const handleQuickAnswer = (answer: string) => {
    if (streaming) return;
    sendToAI(answer);
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

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-5 py-3.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "rounded-2xl rounded-tr-sm bg-accent text-white"
                  : "rounded-2xl rounded-tl-sm bg-surface shadow-sm ring-1 ring-border text-foreground/90"
              }`}
            >
              {m.text}
              {m.role === "ai" && !m.text && streaming && (
                <span className="inline-block w-1.5 h-4 bg-accent/50 animate-pulse rounded-full ml-1" />
              )}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-background py-4">
        <div className="flex gap-2 flex-wrap mb-3">
          {quickAnswers.map((qa) => (
            <button
              key={qa.value}
              onClick={() => handleQuickAnswer(qa.value)}
              disabled={streaming}
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
            disabled={streaming}
            className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-light focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent disabled:opacity-50 transition-shadow"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="rounded-xl bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-[0.97]"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
