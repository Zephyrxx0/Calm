import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.DAILY_API_URL || "http://localhost:8001";

// Generic JSON proxy to the Python backend
async function proxy(request: NextRequest, backendPath: string) {
  try {
    const auth = request.headers.get("Authorization") || "";
    const res = await fetch(`${BACKEND}${backendPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: auth,
      },
      body: await request.text(),
    });

    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }

    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Failed to connect to backend" }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  return proxy(request, "/api/daily/log/quick");
}
