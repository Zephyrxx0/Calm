"use client";

import { useEffect, useState } from "react";
import ChatInterface from "@/components/chat/ChatInterface";

export default function InterviewPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
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
      <main className="flex flex-1 items-center justify-center">
        <p className="font-mono text-sm tracking-wide uppercase text-muted-foreground">
          Preparing your interview...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="font-mono text-sm text-destructive">{error}</p>
      </main>
    );
  }

  if (!sessionId) {
    return null;
  }

  return (
    <main className="flex flex-1 flex-col">
      {/* Header */}
      <header className="border-b-2 border-ink px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <p className="font-mono text-xs tracking-widest uppercase text-muted-foreground">
            The Interview
          </p>
        </div>
      </header>

      {/* Chat Interface */}
      <ChatInterface sessionId={sessionId} />
    </main>
  );
}
