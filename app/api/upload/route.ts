import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    // @ts-ignore
    const arrayBuffer = await file.arrayBuffer();
    // @ts-ignore
    const fileName = file.name || `${Date.now()}.png`;
    const buffer = Buffer.from(arrayBuffer);
    const uploadDir = path.join(process.cwd(), "public", "assets", "img");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);
    return NextResponse.json({ success: true, path: `/assets/img/${fileName}` });
  } catch (err) {
    return NextResponse.json({ error: "Upload failed", detail: String(err) }, { status: 500 });
  }
}
