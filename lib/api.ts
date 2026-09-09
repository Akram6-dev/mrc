import type { Item, Borrower, Loan, DashboardStats } from "./types";
import { auth } from "./auth";

const CACHE_TTL_MS = 15_000;
const responseCache = new Map<string, { expiresAt: number; data: unknown }>();
const pendingRequests = new Map<string, Promise<unknown>>();

async function getCached<T>(url: string): Promise<T> {
  const cached = responseCache.get(url);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T;
  }

  const pending = pendingRequests.get(url);
  if (pending) return pending as Promise<T>;

  const request = fetch(url, { cache: "no-store" })
    .then(async (res) => {
      if (!res.ok) throw new Error(`Request ${url} gagal (${res.status})`);
      const data = (await res.json()) as T;
      responseCache.set(url, { expiresAt: Date.now() + CACHE_TTL_MS, data });
      return data;
    })
    .finally(() => {
      pendingRequests.delete(url);
    });

  pendingRequests.set(url, request);
  return request;
}

function invalidateCache(...urls: string[]) {
  urls.forEach((url) => responseCache.delete(url));
}

// Items API

export async function getItems(includeDeleted = false): Promise<Item[]> {
  return getCached<Item[]>(
    includeDeleted ? "/api/items?includeDeleted=true" : "/api/items",
  );
}

export async function createItem(
  item: Omit<Item, "id" | "createdAt" | "updatedAt">,
): Promise<Item> {
  const res = await fetch("/api/items", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth.getAuthHeaders() },
    body: JSON.stringify(item),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Gagal menghapus barang");
  invalidateCache("/api/items");
  return data;
}

export async function updateItem(
  id: string,
  item: Partial<Item>,
): Promise<Item> {
  const res = await fetch("/api/items", {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...auth.getAuthHeaders() },
    body: JSON.stringify({ id, ...item }),
  });
  const data = await res.json();
  invalidateCache("/api/items");
  return data;
}

export async function deleteItem(id: string): Promise<{ success: boolean }> {
  const res = await fetch("/api/items", {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...auth.getAuthHeaders() },
    body: JSON.stringify({ id }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Gagal menghapus barang");
  invalidateCache("/api/items");
  return data;
}

// Borrowers API

export async function getBorrowers(
  includeDeleted = false,
): Promise<Borrower[]> {
  return getCached<Borrower[]>(
    includeDeleted ? "/api/borrowers?includeDeleted=true" : "/api/borrowers",
  );
}

export async function createBorrower(
  borrower: Omit<Borrower, "id" | "createdAt" | "updatedAt">,
): Promise<Borrower> {
  const res = await fetch("/api/borrowers", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth.getAuthHeaders() },
    body: JSON.stringify(borrower),
  });
  const data = await res.json();
  invalidateCache("/api/borrowers");
  return data;
}

export async function updateBorrower(
  id: string,
  borrower: Partial<Borrower>,
): Promise<Borrower> {
  const res = await fetch("/api/borrowers", {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...auth.getAuthHeaders() },
    body: JSON.stringify({ id, ...borrower }),
  });
  const data = await res.json();
  invalidateCache("/api/borrowers");
  return data;
}

export async function deleteBorrower(
  id: string,
): Promise<{ success: boolean }> {
  const res = await fetch("/api/borrowers", {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...auth.getAuthHeaders() },
    body: JSON.stringify({ id }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Gagal menghapus peminjam");
  invalidateCache("/api/borrowers");
  return data;
}

// Loans API

export async function getLoans(): Promise<Loan[]> {
  return getCached<Loan[]>("/api/loans");
}

export async function getLoanHistory(): Promise<Loan[]> {
  return getCached<Loan[]>("/api/loans/history");
}

export async function createLoan(
  loan: Omit<Loan, "id" | "createdAt" | "updatedAt">,
): Promise<Loan> {
  const res = await fetch("/api/loans", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth.getAuthHeaders() },
    body: JSON.stringify(loan),
  });
  const data = await res.json();
  invalidateCache("/api/loans");
  return data;
}

export async function updateLoan(
  id: string,
  loan: Partial<Loan>,
): Promise<Loan> {
  const res = await fetch("/api/loans", {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...auth.getAuthHeaders() },
    body: JSON.stringify({ id, ...loan }),
  });
  const data = await res.json();
  invalidateCache("/api/loans");
  return data;
}

export async function deleteLoan(id: string): Promise<{ success: boolean }> {
  const res = await fetch("/api/loans", {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...auth.getAuthHeaders() },
    body: JSON.stringify({ id }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Gagal menghapus peminjaman");
  invalidateCache("/api/loans");
  return data;
}

// Dashboard stats helper (optional)

export async function getDashboardStats(): Promise<DashboardStats> {
  const [items, borrowers, loans] = await Promise.all([
    getItems(),
    getBorrowers(),
    getLoans(),
  ]);
  const activeLoan = loans.filter((loan) => loan.status === "dipinjam").length;
  const overdueLoan = loans.filter(
    (loan) => loan.status === "dipinjam" && new Date(loan.dueDate) < new Date(),
  ).length;
  return {
    totalItems: items.length,
    totalBorrowers: borrowers.length,
    activeLoan,
    overdueLoan,
  };
}

// ...other imports and code...

// Add this function to handle returning a loan
export async function returnLoan(loanId: string): Promise<void> {
  await fetch("/api/loans", {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...auth.getAuthHeaders() },
    body: JSON.stringify({
      id: loanId,
      status: "dikembalikan",
      returnDate: new Date().toISOString(),
    }),
  });
  invalidateCache("/api/loans", "/api/items");
}

const api = {
  getItems,
  createItem,
  updateItem,
  deleteItem,
  getLoans,
  getLoanHistory,
  createLoan,
  updateLoan,
  deleteLoan,
  getBorrowers,
  createBorrower,
  updateBorrower,
  deleteBorrower,
  getDashboardStats,
  returnLoan,
};

export default api;
