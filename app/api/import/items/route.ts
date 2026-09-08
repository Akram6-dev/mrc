import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const items = await req.json();
    const dbPath = path.join(process.cwd(), "database", "items.json");
    await writeFile(dbPath, JSON.stringify(items, null, 2), "utf-8");
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Unknown error" }, { status: 500 });
  }
}
