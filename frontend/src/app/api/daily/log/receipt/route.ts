import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.DAILY_API_URL || "http://localhost:8001";

// Multipart/form-data must be forwarded as-is (not re-encoded)
export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("Authorization") || "";
    const contentType = request.headers.get("Content-Type") || "";

    // Forward the raw form-data body directly — do NOT call request.json()
    const res = await fetch(`${BACKEND}/api/daily/log/receipt`, {
      method: "POST",
      headers: {
        Authorization: auth,
        // Only forward content-type if it's multipart (includes boundary)
        ...(contentType.includes("multipart") ? { "Content-Type": contentType } : {}),
      },
      body: await request.arrayBuffer(),
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
