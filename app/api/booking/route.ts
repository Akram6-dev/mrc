
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const BOOKINGS_PATH = path.join(process.cwd(), "database", "bookings.json");
const NOTIFICATIONS_PATH = path.join(process.cwd(), "database", "notifications.json");
const BORROWERS_PATH = path.join(process.cwd(), "database", "borrowers.json");

export async function GET() {
  try {
    const data = await fs.readFile(BOOKINGS_PATH, "utf-8");
    const bookings = JSON.parse(data);
    return NextResponse.json(bookings);
  } catch (err) {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await fs.readFile(BOOKINGS_PATH, "utf-8");
    const bookings = JSON.parse(data);
    const newBooking = { ...body, id: Date.now().toString(), createdAt: new Date().toISOString() };
    bookings.push(newBooking);
    await fs.writeFile(BOOKINGS_PATH, JSON.stringify(bookings, null, 2));
    // Also add a realtime notification so clients can pick it up
    try {
      // read borrowers to get borrower name
      const borrowersRaw = await fs.readFile(BORROWERS_PATH, "utf-8").catch(() => "[]");
      const borrowers = JSON.parse(borrowersRaw || "[]");
      const borrower = borrowers.find((b: any) => String(b.id) === String(newBooking.borrowerId));
      const borrowerName = borrower?.name ?? newBooking.borrowerName ?? `ID ${newBooking.borrowerId}`;

      const notifRaw = await fs.readFile(NOTIFICATIONS_PATH, "utf-8").catch(() => "[]");
      const notifs = JSON.parse(notifRaw || "[]");
      const itemsLabel = newBooking.items ? (Array.isArray(newBooking.items) ? `${newBooking.items.length} item` : '') : '';
      const message = `Booking baru: ${borrowerName} - ${itemsLabel}`.trim();
      notifs.unshift({ id: Date.now(), message, type: 'booking', read: false, timestamp: new Date().toISOString() });
      await fs.writeFile(NOTIFICATIONS_PATH, JSON.stringify(notifs, null, 2));
    } catch (e) {
      // ignore notification failure
      console.error('Failed to write notification', e);
    }
    return NextResponse.json(newBooking, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Gagal menyimpan booking" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await fs.readFile(BOOKINGS_PATH, "utf-8");
    const bookings = JSON.parse(data);
    const idx = bookings.findIndex((b: any) => b.id === body.id);
    if (idx === -1) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 });
    }
    bookings[idx] = { ...bookings[idx], ...body, updatedAt: new Date().toISOString() };
    await fs.writeFile(BOOKINGS_PATH, JSON.stringify(bookings, null, 2));
    return NextResponse.json(bookings[idx], { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Gagal update booking" }, { status: 500 });
  }
}