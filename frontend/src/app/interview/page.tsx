"use client";

import { useEffect, useState } from "react";
import ChatInterface from "@/components/chat/ChatInterface";

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
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted">Preparing your interview...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-destructive">{error}</p>
      </main>
    );
  }

  if (!sessionId) {
    return null;
  }

  return (
    <main className="flex flex-1 flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-medium text-muted uppercase tracking-wide">
            The Interview
          </p>
        </div>
      </header>

      {/* Chat Interface */}
      <div className="flex-1 flex flex-col">
        <ChatInterface sessionId={sessionId} initialMessage={initialMessage} />
      </div>
    </main>
  );
}
