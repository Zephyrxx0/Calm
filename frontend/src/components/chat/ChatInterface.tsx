"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  thought: string;
}

interface ChatInterfaceProps {
  sessionId: string;
  userId: string;
  initialMessage?: string | null;
}

export default function ChatInterface({
  sessionId,
  userId,
  initialMessage,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendToAI = async (text: string) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text,
      thought: "",
    };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);

    const aiMsg: Message = {
      id: crypto.randomUUID(),
      role: "ai",
      text: "",
      thought: "",
    };
    setMessages((prev) => [...prev, aiMsg]);

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const response = await fetch("/api/interview/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionId,
          "x-user-id": userId,
        },
        body: JSON.stringify({
          messages: [{ role: "user", parts: [{ type: "text", text }] }],
        }),
        signal: controller.signal,
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
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6));
              const content = event.content;
              if (!content?.parts) continue;

              let visibleText = "";
              let thoughtText = "";

              for (const part of content.parts) {
                if (part.thought) {
                  thoughtText += part.text || "";
                } else if (part.text) {
                  const t = part.text.trim();
                  if (t.startsWith("{") && /"(name|commute|travel|home|diet|shopping)"/.test(t)) {
                    continue;
                  }
                  visibleText += part.text;
                }
              }

              if (visibleText || thoughtText) {
                setMessages((prev) =>
                  prev.map((m) => {
                    if (m.id !== aiMsg.id) return m;
                    const isFinal = !!event.finishReason;
                    if (isFinal) {
                      return {
                        ...m,
                        text: visibleText || m.text,
                        thought: thoughtText || m.thought,
                      };
                    }
                    return {
                      ...m,
                      text: m.text + visibleText,
                      thought: m.thought + thoughtText,
                    };
                  })
                );
              }
            } catch {
              // parse error, skip
            }
          }
        }
      }
    } catch (e: unknown) {
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
          <div key={m.id}>
            {/* Thinking dropdown — above the bubble, for AI only */}
            {m.role === "ai" && m.thought && (
              <details className="mb-1 ml-1 group">
                <summary className="text-[11px] text-muted/60 hover:text-muted cursor-pointer select-none inline-block transition-colors">
                  (thinking)
                </summary>
                <div className="mt-1 pl-3 border-l-2 border-border/60">
                  <p className="text-[11px] leading-relaxed text-muted/50 italic font-mono whitespace-pre-wrap">
                    {m.thought}
                  </p>
                </div>
              </details>
            )}

            <div
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
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-background py-4">
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
