import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATABASE_PATH = path.join(process.cwd(), "database");
const DATA_FILES = ["items.json", "borrowers.json", "loans.json", "bookings.json", "notifications.json"];

export async function POST() {
  try {
    await Promise.all(
      DATA_FILES.map((file) => fs.writeFile(path.join(DATABASE_PATH, file), "[]", "utf-8")),
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Gagal mereset data aplikasi" },
      { status: 500 },
    );
  }
}