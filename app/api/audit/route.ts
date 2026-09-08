import { NextRequest, NextResponse } from "next/server";
import { readAuditLogs } from "@/lib/audit";

export async function GET(req: NextRequest) {
  if (req.headers.get("x-user-role") !== "super_admin") {
    return NextResponse.json({ error: "Akses hanya untuk super admin" }, { status: 403 });
  }
  return NextResponse.json(await readAuditLogs());
}