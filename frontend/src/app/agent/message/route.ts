import { NextRequest } from "next/server";

const AGENT_URL = process.env.AGENT_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id");
    const userId = request.headers.get("x-user-id");

    if (!sessionId || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing session ID or user ID" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const messages = body.messages || [];
    const lastUser = messages
      .filter((m: { role: string }) => m.role === "user")
      .pop();

    const messageText =
      lastUser?.parts
        ?.filter((p: { type: string }) => p.type === "text")
        .map((p: { text: string }) => p.text)
        .join("") || "";

    const agentBody = {
      app_name: "app",
      user_id: userId,
      session_id: sessionId,
      new_message: {
        role: "user",
        parts: [{ text: messageText }],
      },
      streaming: true,
    };

    const backendResponse = await fetch(`${AGENT_URL}/run_sse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(agentBody),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      return new Response(
        JSON.stringify({ error: "Agent error", details: errorText }),
        {
          status: backendResponse.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(backendResponse.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat proxy error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
