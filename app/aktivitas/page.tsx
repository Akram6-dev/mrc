"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList } from "lucide-react";
import Loading from "@/components/ui/loading";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { auth } from "@/lib/auth";
import type { AuditLog } from "@/lib/audit";
import { formatDateTime } from "@/lib/utils";

const PAGE_SIZE = 20;

export default function AktivitasPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [page, setPage] = useState(1);
  const router = useRouter();

  useEffect(() => {
    if (!auth.isAuthenticated()) { router.push("/login"); return; }
    if (auth.getCurrentUser()?.role !== "super_admin") { router.push("/"); return; }
    fetch("/api/audit", { headers: auth.getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => setAuditLogs(data))
      .finally(() => setIsLoading(false));
  }, [router]);

  useEffect(() => { setPage(1); }, [search, monthFilter, yearFilter]);

  const filtered = auditLogs.filter((log) => {
    const date = new Date(log.createdAt);
    const q = search.trim().toLowerCase();
    const matchSearch = !q || [log.username, log.role, log.entity, log.description].some((v) => v?.toLowerCase().includes(q));
    const matchMonth = monthFilter === "all" || String(date.getMonth() + 1).padStart(2, "0") === monthFilter;
    const matchYear = yearFilter === "all" || String(date.getFullYear()) === yearFilter;
    return matchSearch && matchMonth && matchYear;
  });

  const years = Array.from(new Set(auditLogs.map((l) => new Date(l.createdAt).getFullYear()))).sort((a, b) => b - a);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (!auth.isAuthenticated()) return null;

  if (isLoading) return (
    <div className="min-h-screen gradient-bg">
      <div className="max-w-[90rem] mx-auto py-6 px-4"><Loading /></div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <div className="max-w-[90rem] mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fade-in duration-200">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Riwayat Aktivitas</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Catatan aktivitas admin dan super admin</p>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <ClipboardList className="w-5 h-5 text-accent-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Riwayat Aktivitas</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari username atau perubahan..."
              className="input-field md:col-span-2"
            />
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="input-field"><SelectValue placeholder="Bulan" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Bulan</SelectItem>
                {["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"].map((m, i) => (
                  <SelectItem key={i} value={String(i + 1).padStart(2, "0")}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="input-field"><SelectValue placeholder="Tahun" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tahun</SelectItem>
                {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead>Perubahan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-500">Tidak ada data yang sesuai filter</TableCell></TableRow>
              ) : paginated.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                  <TableCell className="font-medium">{log.username}</TableCell>
                  <TableCell>{log.role === "super_admin" ? "Super Admin" : "Admin"}</TableCell>
                  <TableCell>{log.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex justify-end px-4 py-4 border-t border-gray-200 dark:border-gray-700">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} aria-disabled={page === 1} />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <PaginationItem key={p}>
                      <PaginationLink isActive={page === p} onClick={() => setPage(p)}>{p}</PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext onClick={() => setPage((p) => Math.min(totalPages, p + 1))} aria-disabled={page === totalPages} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
