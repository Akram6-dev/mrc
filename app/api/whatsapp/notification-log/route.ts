import { NextRequest, NextResponse } from "next/server";

const BOT_URL = process.env.MRC_BOT_URL || "http://127.0.0.1:3000";

export async function GET(req: NextRequest) {
  if (
    !["admin", "super_admin"].includes(req.headers.get("x-user-role") || "")
  ) {
    return NextResponse.json(
      { error: "Akses hanya untuk super admin" },
      { status: 403 },
    );
  }

  try {
    const response = await fetch(`${BOT_URL}/notification-log`, {
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
