import { NextRequest, NextResponse } from "next/server";

const BOT_URL = process.env.MRC_BOT_URL || "http://127.0.0.1:3000";

function isSuperAdmin(req: NextRequest) {
  return ["admin", "super_admin"].includes(req.headers.get("x-user-role") || "");
}

export async function GET(req: NextRequest) {
  if (!isSuperAdmin(req)) {
    return NextResponse.json(
      { error: "Akses hanya untuk super admin" },
      { status: 403 },
    );
  }

  const jid = new URL(req.url).searchParams.get("jid");
  const endpoint = jid
    ? `${BOT_URL}/chat/messages?jid=${encodeURIComponent(jid)}`
    : `${BOT_URL}/chat/conversations`;

  try {
    const response = await fetch(endpoint, { cache: "no-store" });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: "Bot WhatsApp tidak tersedia" },
      { status: 503 },
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isSuperAdmin(req)) {
    return NextResponse.json(
      { error: "Akses hanya untuk super admin" },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const response = await fetch(`${BOT_URL}/chat/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: "Bot WhatsApp tidak tersedia" },
      { status: 503 },
    );
  }
}
