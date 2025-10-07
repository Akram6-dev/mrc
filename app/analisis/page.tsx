import { readFileSync } from 'fs';
import path from 'path';
// useRouter dihapus, stat cards non-interaktif
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Users, FileText, CheckCircle } from "lucide-react";
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

// Helper untuk membaca data JSON
function getData(file: string) {
  return JSON.parse(readFileSync(path.join(process.cwd(), 'database', file), 'utf-8'));
}

function getMonthYear(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${d.getMonth() + 1}`;
}
import AnalisisCharts from "./AnalisisCharts";

export default function AnalisisPage() {
  // Stat cards non-interaktif, tidak perlu router
  const borrowers = getData('borrowers.json');
  const items = getData('items.json');
  const loans = getData('loans.json');

  // 1. 10 besar guru terbanyak minjem
  const borrowerLoanCount: Record<string, number> = {};
  loans.forEach((l: any) => {
    borrowerLoanCount[l.borrowerId] = (borrowerLoanCount[l.borrowerId] || 0) + 1;
  });
  const topBorrowers = Object.entries(borrowerLoanCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, count]) => ({
      ...borrowers.find((b: any) => b.id === id),
      count,
    }));

  // 2. 10 besar guru paling rajin mengembalikan (tepat waktu = returnDate <= dueDate)
  const borrowerReturnOnTime: Record<string, number> = {};
  const borrowerLateReturn: Record<string, number> = {};
  loans.forEach((l: any) => {
    if (l.returnDate && l.dueDate) {
      if (new Date(l.returnDate) <= new Date(l.dueDate)) {
        borrowerReturnOnTime[l.borrowerId] = (borrowerReturnOnTime[l.borrowerId] || 0) + 1;
      } else {
        borrowerLateReturn[l.borrowerId] = (borrowerLateReturn[l.borrowerId] || 0) + 1;
      }
    }
  });
  const topReturners = Object.entries(borrowerReturnOnTime)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, count]) => ({
      ...borrowers.find((b: any) => b.id === id),
      count,
    }));
  // 3. 10 besar guru paling sering terlambat mengembalikan
  const topLateReturners = Object.entries(borrowerLateReturn)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, count]) => ({
      ...borrowers.find((b: any) => b.id === id),
      count,
    }));

  // 3. 10 barang paling sering dipinjam (berdasarkan total quantity)
  const itemLoanCount: Record<string, number> = {};
  loans.forEach((l: any) => {
    if (Array.isArray(l.items)) {
      l.items.forEach((itemObj: any) => {
        // itemObj bisa berupa string (legacy) atau object {itemId, quantity}
        if (typeof itemObj === 'string') {
          itemLoanCount[itemObj] = (itemLoanCount[itemObj] || 0) + 1;
        } else if (itemObj && itemObj.itemId) {
          itemLoanCount[itemObj.itemId] = (itemLoanCount[itemObj.itemId] || 0) + (itemObj.quantity || 1);
        }
      });
    }
  });
  const topItems = Object.entries(itemLoanCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, count]) => {
      const item = items.find((i: any) => i.id === id);
      return item ? { ...item, count } : null;
    })
    .filter(Boolean);

  // 4. Statistik bulan ini, bulan lalu, total
  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  const thisYear = now.getFullYear();
  const lastMonth = thisMonth === 1 ? 12 : thisMonth - 1;
  const lastMonthYear = thisMonth === 1 ? thisYear - 1 : thisYear;

  let statThisMonth = 0, statLastMonth = 0, statTotal = loans.length;
  let returnThisMonth = 0, returnLastMonth = 0, returnTotal = 0;
  loans.forEach((l: any) => {
    const loanDate = new Date(l.loanDate);
    if (loanDate.getFullYear() === thisYear && loanDate.getMonth() + 1 === thisMonth) statThisMonth++;
    if (loanDate.getFullYear() === lastMonthYear && loanDate.getMonth() + 1 === lastMonth) statLastMonth++;
    if (l.returnDate) {
      returnTotal++;
      const returnDate = new Date(l.returnDate);
      if (returnDate.getFullYear() === thisYear && returnDate.getMonth() + 1 === thisMonth) returnThisMonth++;
      if (returnDate.getFullYear() === lastMonthYear && returnDate.getMonth() + 1 === lastMonth) returnLastMonth++;
    }
  });

  // 5. Ringkasan (stat cards, identik dashboard)
  // Hitung peminjam aktif (masih ada pinjaman status dipinjam)
  const activeBorrowers = new Set();
  loans.forEach((l: any) => {
    if (l.status === "dipinjam" && l.borrowerId) activeBorrowers.add(l.borrowerId);
  });
  const statCards = [
    {
      title: "Total Barang",
      value: items.length,
      icon: "Package",
      gradient: "from-blue-500 to-blue-600",
      iconBg: "bg-blue-600/30",
      iconColor: "text-blue-200",
      textColor: "text-blue-100",
    },
    {
      title: "Peminjam Aktif",
      value: activeBorrowers.size,
      icon: "Users",
      gradient: "from-green-500 to-green-600",
      iconBg: "bg-green-600/30",
      iconColor: "text-green-200",
      textColor: "text-green-100",
    },
    {
      title: "Total Transaksi",
      value: loans.length,
      icon: "FileText",
      gradient: "from-yellow-500 to-yellow-600",
      iconBg: "bg-yellow-600/30",
      iconColor: "text-yellow-200",
      textColor: "text-yellow-100",
    },
    {
      title: "Total Pengembalian",
      value: returnTotal,
      icon: "CheckCircle",
      gradient: "from-indigo-500 to-indigo-600",
      iconBg: "bg-indigo-600/30",
      iconColor: "text-indigo-200",
      textColor: "text-indigo-100",
    },
  ];

  // 6. Tren bulanan
  const monthlyStats: Record<string, { loan: number; returned: number }> = {};
  loans.forEach((l: any) => {
    const key = getMonthYear(l.loanDate);
    monthlyStats[key] = monthlyStats[key] || { loan: 0, returned: 0 };
    monthlyStats[key].loan++;
    if (l.returnDate) {
      const retKey = getMonthYear(l.returnDate);
      monthlyStats[retKey] = monthlyStats[retKey] || { loan: 0, returned: 0 };
      monthlyStats[retKey].returned++;
    }
  });
  const monthlyKeys = Object.keys(monthlyStats).sort();

  // --- Chart Data Processing (identik dashboard, gunakan createdAt jika ada) ---
  const weekdayNames = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
  const hourLabels = Array.from({ length: 24 }, (_, i) => i);
  const loansByHourWeekday: any[] = hourLabels.map((hour) => {
    const row: any = { hour };
    weekdayNames.forEach((wd) => (row[wd] = 0));
    return row;
  });
  loans.forEach((loan: any) => {
    const dateStr = loan.createdAt || loan.loanDate;
    if (!dateStr) return;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return;
    const hour = d.getHours();
    const dayIdx = d.getDay();
    if (dayIdx >= 1 && dayIdx <= 5) {
      const wd = weekdayNames[dayIdx - 1];
      const row = loansByHourWeekday.find((r) => r.hour === hour);
      if (row && wd) row[wd]++;
    }
  });
  // Area chart: loans per date
  const loansByDateMap = new Map<string, number>();
  loans.forEach((loan: any) => {
    const dateStr = loan.createdAt || loan.loanDate;
    if (!dateStr) return;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return;
    const dateOnly = d.toISOString().slice(0, 10);
    loansByDateMap.set(dateOnly, (loansByDateMap.get(dateOnly) || 0) + 1);
  });
  const loansByDate = Array.from(loansByDateMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, Peminjaman: count }));

  return (
    <div className="p-4 lg:p-6 max-h-screen overflow-y-auto animate-fade-in duration-200">
      <Card className="mb-6 p-0 bg-transparent border-none shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Analisis & Statistik</CardTitle>
          <CardDescription className="text-sm text-gray-600 dark:text-gray-400">Rangkuman analisis dan statistik lengkap dari seluruh data peminjaman</CardDescription>
        </CardHeader>
      </Card>
      <AnalisisCharts
        statCards={statCards}
        topBorrowers={topBorrowers}
        topReturners={topReturners}
        topLateReturners={topLateReturners}
        topItems={topItems}
        loansByHourWeekday={loansByHourWeekday}
        loansByDate={loansByDate}
        allLoans={loans}
      />
    </div>
  );
}
