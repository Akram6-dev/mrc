
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const BOOKINGS_PATH = path.join(process.cwd(), "database", "bookings.json");

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