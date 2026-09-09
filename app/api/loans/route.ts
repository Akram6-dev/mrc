import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { Loan } from "@/lib/types";
import { getActor, writeAuditLog } from "@/lib/audit";
import { refreshLoanHistory } from "@/lib/loan-history";

const DB_PATH = path.join(process.cwd(), "database", "loans.json");

async function readLoans(): Promise<Loan[]> {
  try {
    const data = await fs.readFile(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeLoans(loans: Loan[]) {
  await fs.writeFile(DB_PATH, JSON.stringify(loans, null, 2), "utf-8");
}

export async function GET() {
  const loans = await readLoans();
  return NextResponse.json(loans.filter((loan) => !loan.deletedAt));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const loans = await readLoans();
  const actor = getActor(req);
  const newLoan: Loan = {
    ...body,
    id: body.id == null ? Date.now().toString() : body.id,
    createdBy: actor.username,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  loans.push(newLoan);
  await writeLoans(loans);
  await refreshLoanHistory(loans);
  await writeAuditLog({
    ...actor,
    action: "create",
    entity: "peminjaman",
    description: `Mencatat peminjaman ${newLoan.id} untuk ${newLoan.borrowerId || "peminjam"}`,
  });
  return NextResponse.json(newLoan);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const loans = await readLoans();
  const idx = loans.findIndex((l) => l.id === body.id);
  if (idx === -1)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  const actor = getActor(req);
  const isReturn = body.status === "dikembalikan" || body.returnDate;
  const returnedBy =
    isReturn && !loans[idx].returnedBy ? actor.username : loans[idx].returnedBy;
  loans[idx] = {
    ...loans[idx],
    ...body,
    ...(isReturn && !loans[idx].returnedBy ? { returnedBy } : {}),
    updatedAt: new Date().toISOString(),
  };
  await writeLoans(loans);
  await refreshLoanHistory(loans);
  await writeAuditLog({
    ...actor,
    action: "update",
    entity: isReturn ? "pengembalian" : "peminjaman",
    description: isReturn
      ? `Mencatat pengembalian peminjaman ${body.id}`
      : `Mengubah peminjaman ${body.id}`,
  });
  return NextResponse.json(loans[idx]);
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const loans = await readLoans();
  const index = loans.findIndex(
    (loan) => loan.id === body.id && !loan.deletedAt,
  );
  if (index === -1)
    return NextResponse.json({ success: false }, { status: 404 });
  const actor = getActor(req);
  loans[index] = {
    ...loans[index],
    deletedAt: new Date().toISOString(),
    deletedBy: actor.username,
    updatedAt: new Date().toISOString(),
  };
  await writeLoans(loans);
  await refreshLoanHistory(loans);
  await writeAuditLog({
    ...actor,
    action: "delete",
    entity: "peminjaman",
    description: `Menghapus peminjaman ${body.id}`,
  });
  return NextResponse.json({ success: true });
}
