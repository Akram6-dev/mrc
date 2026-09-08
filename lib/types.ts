
export interface ItemSerialDetail {
  id: string;
  name: string;
  icon?: string;
  rfidCode: string;
  sn?: string;
  status: 0 | 1 | 2;
  loanId: string;
  condition?: string;
  note?: string;
  quantity: number;
}

export interface ItemSerial {
  rfidCode: string;
  sn: string;
  condition: -1 | 0 | 1;
  status: 0 | 1 | 2; // 0: tersedia, 1: dipinjam, 2: dibooking
  loanId?: string | null; // id loan yang sedang meminjam serial ini, jika ada
}

export interface Item {
  id: string;
  name: string;
  category: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  icon?: string;
  items?: ItemSerial[];
  image?: string;
}

export interface Borrower {
  id: string
  name: string
  nip: string
  officerId: string
  rfid: string
  phone: string
  gender: "L" | "P"
  createdAt: string
  updatedAt: string
  isFrozen?: boolean
}


// Now loan is per serial number, not per item+quantity
export interface LoanItem {
  rfidCode: string;
  note?: string;
}


export interface Loan {
  id: string;
  borrowerId: string;
  items: LoanItem[];
  borrowDate: string;
  returnDate?: string;
  dueDate: string;
  status: "dipinjam" | "dikembalikan" | "terlambat";
  purpose?: string;
  notes?: string;
  createdBy?: string;
  returnedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoanWithDetails extends Loan {
  borrower: Borrower
  itemDetails: (Item & { quantity: number; rfidCode?: string; sn?: string; status: 0 | 1 | 2 })[]
}

export interface DashboardStats {
  totalItems: number
  totalBorrowers: number
  activeLoan: number
  overdueLoan: number
}
