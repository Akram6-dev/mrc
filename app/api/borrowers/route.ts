import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { Borrower } from "@/lib/types";
import { getActor, writeAuditLog } from "@/lib/audit";

const DB_PATH = path.join(process.cwd(), "database", "borrowers.json");

async function readBorrowers(): Promise<Borrower[]> {
  try {
    const data = await fs.readFile(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeBorrowers(borrowers: Borrower[]) {
  await fs.writeFile(DB_PATH, JSON.stringify(borrowers, null, 2), "utf-8");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const idParams = searchParams.getAll("id");
  const borrowers = await readBorrowers();
  const includeDeleted = searchParams.get("includeDeleted") === "true";
  const visibleBorrowers = includeDeleted
    ? borrowers
    : borrowers.filter((borrower) => !borrower.deletedAt);
  if (idParams.length === 0) {
    return NextResponse.json(visibleBorrowers);
  }
  // idParams bisa array atau satuan, filter borrowers
  const idSet = new Set(idParams);
  const filtered = visibleBorrowers.filter((b) => idSet.has(b.id));
  return NextResponse.json(filtered);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const borrowers = await readBorrowers();
  const newBorrower: Borrower = {
    ...body,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  borrowers.push(newBorrower);
  await writeBorrowers(borrowers);
  return NextResponse.json(newBorrower);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const borrowers = await readBorrowers();
  const idx = borrowers.findIndex((b) => b.id === body.id);
  if (idx === -1)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  borrowers[idx] = {
    ...borrowers[idx],
    ...body,
    updatedAt: new Date().toISOString(),
  };
  await writeBorrowers(borrowers);
  if (typeof body.isFrozen === "boolean") {
    const actor = getActor(req);
    await writeAuditLog({
      ...actor,
      action: "update",
      entity: "peminjam",
      description: `${body.isFrozen ? "Menonaktifkan" : "Mengaktifkan kembali"} akun peminjam ${borrowers[idx].name}`,
    });
  }
  return NextResponse.json(borrowers[idx]);
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const borrowers = await readBorrowers();
  const index = borrowers.findIndex(
    (borrower) => borrower.id === body.id && !borrower.deletedAt,
  );
  if (index === -1)
    return NextResponse.json({ success: false }, { status: 404 });
  const actor = getActor(req);
  borrowers[index] = {
    ...borrowers[index],
    deletedAt: new Date().toISOString(),
    deletedBy: actor.username,
    updatedAt: new Date().toISOString(),
  };
  await writeBorrowers(borrowers);
  await writeAuditLog({
    ...actor,
    action: "delete",
    entity: "peminjam",
    description: `Menghapus peminjam ${body.id}`,
  });
  return NextResponse.json({ success: true });
}
