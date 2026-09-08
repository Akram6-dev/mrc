// API route for notifications CRUD
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "database", "notifications.json");

function readNotifications() {
  if (!fs.existsSync(dbPath)) return [];
  return JSON.parse(fs.readFileSync(dbPath, "utf-8"));
}
function writeNotifications(data: any) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

export async function GET() {
  const notifications = readNotifications();
  return NextResponse.json(notifications);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const notifications = readNotifications();
  notifications.unshift({
    ...body,
    id: Date.now(),
    read: false,
    timestamp: new Date().toISOString(),
  });
  writeNotifications(notifications);
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const { id } = await req.json();
  const notifications = readNotifications();
  const idx = notifications.findIndex((n: any) => n.id === id);
  if (idx !== -1) notifications[idx].read = true;
  writeNotifications(notifications);
  return NextResponse.json({ success: true });
}
