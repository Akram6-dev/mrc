import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { Item, Loan } from "@/lib/types";
import {
  isInRecentCalendarWindow,
  isLoanOperationallyActive,
  refreshLoanHistory,
} from "@/lib/loan-history";

const DATABASE_PATH = path.join(process.cwd(), "database");

async function readDatabase<T>(file: string): Promise<T[]> {
  try {
    return JSON.parse(
      await fs.readFile(path.join(DATABASE_PATH, file), "utf-8"),
    ) as T[];
  } catch {
    return [];
  }
}

export async function GET() {
  const [loans, items] = await Promise.all([
    readDatabase<Loan>("loans.json"),
    readDatabase<Item>("items.json"),
  ]);
  const history = await refreshLoanHistory(loans, items);

  const activeLoans = loans.filter(
    (loan) =>
      !loan.deletedAt &&
      isLoanOperationallyActive(loan, items) &&
      isInRecentCalendarWindow(loan.borrowDate),
  );
  const activeIds = new Set(activeLoans.map((loan) => String(loan.id)));
  const combined = [
    ...activeLoans,
    ...history.filter((loan) => !activeIds.has(String(loan.id))),
  ];

  return NextResponse.json(combined);
}
