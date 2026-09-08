import type { Item, Borrower, Loan, DashboardStats } from './types'
import { auth } from './auth'


// Items API

export async function getItems(): Promise<Item[]> {
  const res = await fetch('/api/items')
  return await res.json()
}


export async function createItem(item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<Item> {
  const res = await fetch('/api/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth.getAuthHeaders() },
    body: JSON.stringify(item),
  })
  return await res.json()
}


export async function updateItem(id: string, item: Partial<Item>): Promise<Item> {
  const res = await fetch('/api/items', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...auth.getAuthHeaders() },
    body: JSON.stringify({ id, ...item }),
  })
  return await res.json()
}


export async function deleteItem(id: string): Promise<{ success: boolean }> {
  const res = await fetch('/api/items', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...auth.getAuthHeaders() },
    body: JSON.stringify({ id }),
  })
  return await res.json()
}

// Borrowers API

export async function getBorrowers(): Promise<Borrower[]> {
  const res = await fetch('/api/borrowers')
  return await res.json()
}


export async function createBorrower(borrower: Omit<Borrower, 'id' | 'createdAt' | 'updatedAt'>): Promise<Borrower> {
  const res = await fetch('/api/borrowers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth.getAuthHeaders() },
    body: JSON.stringify(borrower),
  })
  return await res.json()
}


export async function updateBorrower(id: string, borrower: Partial<Borrower>): Promise<Borrower> {
  const res = await fetch('/api/borrowers', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...auth.getAuthHeaders() },
    body: JSON.stringify({ id, ...borrower }),
  })
  return await res.json()
}


export async function deleteBorrower(id: string): Promise<{ success: boolean }> {
  const res = await fetch('/api/borrowers', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...auth.getAuthHeaders() },
    body: JSON.stringify({ id }),
  })
  return await res.json()
}

// Loans API

export async function getLoans(): Promise<Loan[]> {
  const res = await fetch('/api/loans')
  return await res.json()
}


export async function createLoan(loan: Omit<Loan, 'id' | 'createdAt' | 'updatedAt'>): Promise<Loan> {
  const res = await fetch('/api/loans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth.getAuthHeaders() },
    body: JSON.stringify(loan),
  })
  return await res.json()
}


export async function updateLoan(id: string, loan: Partial<Loan>): Promise<Loan> {
  const res = await fetch('/api/loans', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...auth.getAuthHeaders() },
    body: JSON.stringify({ id, ...loan }),
  })
  return await res.json()
}


export async function deleteLoan(id: string): Promise<{ success: boolean }> {
  const res = await fetch('/api/loans', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...auth.getAuthHeaders() },
    body: JSON.stringify({ id }),
  })
  return await res.json()
}

// Dashboard stats helper (optional)


export async function getDashboardStats(): Promise<DashboardStats> {
  const [items, borrowers, loans] = await Promise.all([
    getItems(),
    getBorrowers(),
    getLoans(),
  ])
  const activeLoan = loans.filter((loan) => loan.status === 'dipinjam').length
  const overdueLoan = loans.filter((loan) => loan.status === 'dipinjam' && new Date(loan.dueDate) < new Date()).length
  return {
    totalItems: items.length,
    totalBorrowers: borrowers.length,
    activeLoan,
    overdueLoan,
  }
}

// ...other imports and code...


// Add this function to handle returning a loan
export async function returnLoan(loanId: string): Promise<void> {
  await fetch('/api/loans', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...auth.getAuthHeaders() },
    body: JSON.stringify({
      id: loanId,
      status: 'dikembalikan',
      returnDate: new Date().toISOString(),
    }),
  })
}

const api = {
  getItems,
  createItem,
  updateItem,
  deleteItem,
  getLoans,
  createLoan,
  updateLoan,
  deleteLoan,
  getBorrowers,
  createBorrower,
  updateBorrower,
  deleteBorrower,
  getDashboardStats,
  returnLoan,
}

export default api