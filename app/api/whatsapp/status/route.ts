import { NextResponse } from "next/server";

const BOT_URL = process.env.MRC_BOT_URL || "http://127.0.0.1:3000";

export async function GET() {
  try {
    const response = await fetch(`${BOT_URL}/status`, { cache: "no-store" });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ status: "offline", hasQr: false, chats: 0 }, { status: 503 });
  }
}
