"use client";

import { useEffect, useState } from "react";
import ChatInterface from "@/components/chat/ChatInterface";
import { DoodleLeaf, DoodleSun } from "@/components/OrganicDoodles";
import { useAuth } from "@/contexts/AuthContext";
import { AuthButton } from "@/components/auth/AuthButton";

function Grain() {
  return <div className="grain" aria-hidden="true" />;
}

export default function InterviewPage() {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [initialMessage, setInitialMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function startSession() {
      try {
        const response = await fetch("/agent/start", {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("Failed to start interview session");
        }

        const data = await response.json();
        setSessionId(data.session_id);
        setUserId(data.user_id);
        sessionStorage.setItem("userId", data.user_id);

        // Fetch the greeting message so the bot speaks first
        const greetRes = await fetch("/agent/message", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": data.session_id,
            "x-user-id": data.user_id,
          },
          body: JSON.stringify({
            messages: [{ role: "user", parts: [{ type: "text", text: "hi" }] }],
          }),
        });

        if (greetRes.ok && greetRes.body) {
          const reader = greetRes.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let visibleText = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const ev = JSON.parse(line.slice(6));
                  if (!ev.content?.parts) continue;
                  const isFinal = !!ev.finishReason;
                  for (const p of ev.content.parts) {
                    if (!p.thought && p.text) {
                      visibleText = isFinal ? p.text : visibleText + p.text;
                    }
                  }
                } catch {
                  /* skip */
                }
              }
            }
          }
          setInitialMessage(visibleText || null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    startSession();
  }, [user]);

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center bg-background relative overflow-hidden h-screen">
        <Grain />
        <DoodleSun className="absolute top-1/4 right-1/4 w-32 h-32 text-accent/10 animate-pulse" />
        <p className="text-sm text-muted font-sans relative z-10">
          Preparing your space...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex flex-1 items-center justify-center bg-background h-screen">
        <p className="text-sm text-destructive font-sans">{error}</p>
      </main>
    );
  }

  if (!sessionId || !userId) {
    return null;
  }

  return (
    <main className="flex flex-col h-screen h-[100dvh] bg-background relative overflow-hidden">
      <Grain />
      <DoodleLeaf className="absolute -top-10 -left-10 w-64 h-64 text-accent/5 rotate-[15deg] pointer-events-none" />
      <DoodleSun className="absolute bottom-10 -right-20 w-80 h-80 text-accent/5 pointer-events-none" />

      <header className="flex-none border-b border-border/50 px-6 py-5 relative z-50 bg-background/50 backdrop-blur-md">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <a
            href="/"
            className="text-lg font-serif text-foreground hover:text-accent transition-colors"
          >
            Calm
          </a>
          <p className="text-[10px] font-medium text-muted uppercase tracking-[0.2em]">
            The Interview
          </p>
          <div className="flex items-center gap-4">
            {sessionId && (
              <a
                href={`/ledger/${sessionId}`}
                className="text-xs font-sans text-muted hover:text-foreground transition-colors"
              >
                Refine in Ledger →
              </a>
            )}
            <AuthButton />
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col relative z-10 min-h-0 overflow-hidden">
        <ChatInterface
          sessionId={sessionId}
          userId={userId}
          initialMessage={initialMessage}
        />
      </div>
    </main>
  );
}
