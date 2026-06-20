import { NextRequest, NextResponse } from "next/server";

const DAILY_URL = process.env.DAILY_API_URL || "http://localhost:8001";

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get("Authorization") || "";

    const res = await fetch(`${DAILY_URL}/api/daily/streak`, {
      headers: { Authorization: auth },
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: err },
        { status: res.status }
      );
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
