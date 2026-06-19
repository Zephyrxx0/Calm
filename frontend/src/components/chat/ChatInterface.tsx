"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  thought: string;
}

interface EndChatData {
  total_tonnes: number;
  breakdown: Record<string, number>;
  mode: string;
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
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [endChatData, setEndChatData] = useState<EndChatData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Typing animation refs
  const pendingBufferRef = useRef("");
  const currentAiIdRef = useRef<string | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!streaming) {
      inputRef.current?.focus();
    }
  }, [streaming]);

  // Smooth typing animation — drains pendingBufferRef char-by-char into display
  useEffect(() => {
    if (!streaming) {
      if (pendingBufferRef.current) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== currentAiIdRef.current) return m;
            return { ...m, text: m.text + pendingBufferRef.current };
          })
        );
        pendingBufferRef.current = "";
      }
      return;
    }

    let active = true;

    const drip = () => {
      if (!active) return;
      const len = Math.min(4, pendingBufferRef.current.length);
      if (len > 0) {
        const chunk = pendingBufferRef.current.slice(0, len);
        pendingBufferRef.current = pendingBufferRef.current.slice(len);
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== currentAiIdRef.current) return m;
            return { ...m, text: m.text + chunk };
          })
        );
      }
      rafRef.current = requestAnimationFrame(drip);
    };

    rafRef.current = requestAnimationFrame(drip);

    return () => {
      active = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [streaming]);

  const sendToAI = async (text: string) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text,
      thought: "",
    };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);

    const aiMsgId = crypto.randomUUID();
    currentAiIdRef.current = aiMsgId;
    pendingBufferRef.current = "";

    const aiMsg: Message = {
      id: aiMsgId,
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
                  if (t.startsWith("[CALM_END_CHAT]")) {
                    try {
                      const jsonStr = t.slice("[CALM_END_CHAT]".length);
                      setEndChatData(JSON.parse(jsonStr));
                    } catch {
                      /* ignore parse error */
                    }
                    continue;
                  }
                  visibleText += part.text;
                }
              }

              if (visibleText || thoughtText) {
                const isFinal = !!event.finishReason;

                if (isFinal) {
                  // Final event replaces everything — set text directly
                  pendingBufferRef.current = "";
                  setMessages((prev) =>
                    prev.map((m) => {
                      if (m.id !== aiMsgId) return m;
                      return {
                        ...m,
                        text: visibleText || m.text,
                        thought: thoughtText || m.thought,
                      };
                    })
                  );
                } else {
                  // Partial event — buffer visible text for smooth animation;
                  // thought text updates immediately
                  if (thoughtText) {
                    setMessages((prev) =>
                      prev.map((m) => {
                        if (m.id !== aiMsgId) return m;
                        return { ...m, thought: m.thought + thoughtText };
                      })
                    );
                  }
                  if (visibleText) {
                    pendingBufferRef.current += visibleText;
                  }
                }
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

  const totalKg = endChatData
    ? Object.values(endChatData.breakdown).reduce((a, b) => a + b, 0)
    : 0;

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

      {/* Edition dialog */}
      {endChatData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-background rounded-2xl shadow-2xl ring-1 ring-border max-w-md w-full mx-4 p-8">
            <h2 className="text-xl font-serif text-foreground mb-2">
              Your Edition is Ready
            </h2>
            <p className="text-sm text-muted mb-6">
              Your carbon footprint has been calculated. Here&apos;s a preview.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Total footprint</span>
                <span className="font-medium text-foreground">
                  {endChatData.total_tonnes.toFixed(2)} tonnes CO₂e
                </span>
              </div>
              <div className="h-px bg-border" />
              {Object.entries(endChatData.breakdown).map(([cat, val]) => (
                <div key={cat} className="flex justify-between text-sm">
                  <span className="text-muted capitalize">{cat}</span>
                  <span className="text-foreground">
                    {val.toFixed(0)} kg ({((val / totalKg) * 100).toFixed(0)}%)
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setEndChatData(null)}
                className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm text-muted hover:bg-surface transition-colors"
              >
                Close
              </button>
              <button
                onClick={() =>
                  router.push(
                    `/edition/${sessionId}?total=${endChatData.total_tonnes}&mode=${endChatData.mode}`
                  )
                }
                className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors active:scale-[0.98]"
              >
                View Your Edition
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border bg-background py-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            ref={inputRef}
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
