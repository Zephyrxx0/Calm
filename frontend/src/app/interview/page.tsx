"use client";

import { useEffect, useState } from "react";
import ChatInterface from "@/components/chat/ChatInterface";
import { DoodleLeaf, DoodleSun } from "@/components/OrganicDoodles";

function Grain() {
  return <div className="grain" aria-hidden="true" />;
}

export default function InterviewPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [initialMessage, setInitialMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function startSession() {
      try {
        const response = await fetch("/api/interview/start", {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("Failed to start interview session");
        }

        const data = await response.json();
        setSessionId(data.session_id);
        setInitialMessage(data.initial_message || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    startSession();
  }, []);

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center bg-background relative overflow-hidden h-screen">
        <Grain />
        <DoodleSun className="absolute top-1/4 right-1/4 w-32 h-32 text-accent/10 animate-pulse" />
        <p className="text-sm text-muted font-sans relative z-10">Preparing your space...</p>
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

  if (!sessionId) {
    return null;
  }

  return (
    <main className="flex flex-1 flex-col min-h-screen bg-background relative overflow-hidden">
      <Grain />
      {/* Decorative Doodles */}
      <DoodleLeaf className="absolute -top-10 -left-10 w-64 h-64 text-accent/5 rotate-[15deg] pointer-events-none" />
      <DoodleSun className="absolute bottom-10 -right-20 w-80 h-80 text-accent/5 pointer-events-none" />

      {/* Header */}
      <header className="border-b border-border/50 px-6 py-5 relative z-10 bg-background/50 backdrop-blur-md">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <a href="/" className="text-lg font-serif text-foreground hover:text-accent transition-colors">Calm</a>
          <p className="text-[10px] font-medium text-muted uppercase tracking-[0.2em]">
            The Interview
          </p>
        </div>
      </header>

      {/* Chat Interface */}
      <div className="flex-1 flex flex-col relative z-10 h-[calc(100vh-69px)]">
        <ChatInterface sessionId={sessionId} initialMessage={initialMessage} />
      </div>
    </main>
  );
}
