import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

const AGENT_URL = process.env.AGENT_URL || "http://localhost:8000";

export async function POST() {
  try {
    const userId = `user-${nanoid(12)}`;

    const sessionRes = await fetch(
      `${AGENT_URL}/apps/app/users/${userId}/sessions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }
    );

    if (!sessionRes.ok) {
      const errorText = await sessionRes.text();
      return NextResponse.json(
        { error: "Failed to create session", details: errorText },
        { status: sessionRes.status }
      );
    }

    const sessionData = await sessionRes.json();

    return NextResponse.json({
      session_id: sessionData.id,
      user_id: userId,
    });
  } catch (error) {
    console.error("Start interview error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
