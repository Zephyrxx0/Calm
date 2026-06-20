import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.DAILY_API_URL || "http://localhost:8001";

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("Authorization") || "";
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id") || "";

    const res = await fetch(
      `${BACKEND_URL}/snapshot?session_id=${encodeURIComponent(sessionId)}`,
      {
        method: "POST",
        headers: { Authorization: auth },
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to backend" },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get("Authorization") || "";
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id") || "";
    const snapshotId = searchParams.get("snapshot_id") || "";

    let targetUrl: string;
    if (snapshotId) {
      targetUrl = `${BACKEND_URL}/snapshot/${encodeURIComponent(snapshotId)}`;
    } else if (sessionId) {
      targetUrl = `${BACKEND_URL}/snapshot?session_id=${encodeURIComponent(sessionId)}`;
    } else {
      return NextResponse.json({ error: "Missing query param" }, { status: 400 });
    }

    const res = await fetch(targetUrl, { headers: { Authorization: auth } });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to backend" },
      { status: 502 }
    );
  }
}
