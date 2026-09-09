import { promises as fs } from "fs";
import path from "path";
import type { Item, Loan } from "@/lib/types";

const DATABASE_PATH = path.join(process.cwd(), "database");
const LOANS_PATH = path.join(DATABASE_PATH, "loans.json");
const ITEMS_PATH = path.join(DATABASE_PATH, "items.json");
const HISTORY_PATH = path.join(DATABASE_PATH, "loan-history.json");

export function getThreeMonthCutoff(now = new Date()): Date {
  const cutoff = new Date(now);
  cutoff.setUTCHours(0, 0, 0, 0);
  cutoff.setUTCDate(1);
  cutoff.setUTCMonth(Math.max(0, cutoff.getUTCMonth() - 2));
  return cutoff;
}

export function isInRecentCalendarWindow(
  dateValue: string,
  now = new Date(),
): boolean {
  const date = new Date(dateValue);
  const cutoff = getThreeMonthCutoff(now);
  return (
    date.getUTCFullYear() === now.getUTCFullYear() &&
    date.getTime() >= cutoff.getTime()
  );
}

export function isLoanOperationallyActive(loan: Loan, items: Item[]): boolean {
  if (loan.status !== "dikembalikan") return true;

  return items.some((item) =>
    item.items?.some(
      (serial) => serial.loanId === loan.id && serial.status === 0,
    ),
  );
}

export function buildRecentLoanHistory(loans: Loan[], items: Item[]): Loan[] {
  const uniqueLoans = new Map<string, Loan>();

  for (const loan of loans) {
    if (loan.deletedAt) continue;
    if (isLoanOperationallyActive(loan, items)) continue;
    if (!isInRecentCalendarWindow(loan.borrowDate)) continue;
    uniqueLoans.set(String(loan.id), loan);
  }

  return [...uniqueLoans.values()].sort(
    (a, b) =>
      new Date(b.createdAt || b.borrowDate).getTime() -
      new Date(a.createdAt || a.borrowDate).getTime(),
  );
}

export async function readLoanHistory(): Promise<Loan[] | null> {
  try {
    return JSON.parse(await fs.readFile(HISTORY_PATH, "utf-8")) as Loan[];
  } catch {
    return null;
  }
}

export async function writeLoanHistory(history: Loan[]): Promise<void> {
  await fs.writeFile(HISTORY_PATH, JSON.stringify(history, null, 2), "utf-8");
}

export async function refreshLoanHistory(
  loans?: Loan[],
  items?: Item[],
): Promise<Loan[]> {
  const sourceLoans =
    loans ?? (JSON.parse(await fs.readFile(LOANS_PATH, "utf-8")) as Loan[]);
  const sourceItems =
    items ?? (JSON.parse(await fs.readFile(ITEMS_PATH, "utf-8")) as Item[]);
  const history = buildRecentLoanHistory(sourceLoans, sourceItems);
  await writeLoanHistory(history);
  return history;
}
