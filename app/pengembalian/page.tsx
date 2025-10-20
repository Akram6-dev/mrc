"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { RotateCcw, Search, AlertTriangle, Clock, CheckCircle, User, Package, Filter, Laptop, Cable, Projector, Mouse, Tablet, Printer, Monitor, Keyboard, Speaker, HdmiPort, Plug, Presentation, MicVocal, X } from "lucide-react"

// Icon options for items, idiomatik seperti barang
const ICON_OPTIONS = [
  { value: "laptop", icon: Laptop },
  { value: "cable", icon: Cable },
  { value: "projector", icon: Projector },
  { value: "hdmi", icon: HdmiPort },
  { value: "plug", icon: Plug },
  { value: "mouse", icon: Mouse },
  { value: "tablet", icon: Tablet },
  { value: "printer", icon: Printer },
  { value: "monitor", icon: Monitor },
  { value: "keyboard", icon: Keyboard },
  { value: "speaker", icon: Speaker },
  { value: "presentation", icon: Presentation },
  { value: "mic", icon: MicVocal },
  { value: "other", icon: Package },
];
import Loading from "@/components/ui/loading"
import { toast } from "sonner"
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { auth } from "@/lib/auth"
import api from "@/lib/api"
import type { LoanWithDetails, Item, ItemSerial } from "@/lib/types"
import { formatDate, formatDateTime, isOverdue, getDaysUntilDue, getColorFromName } from "@/lib/utils"

export default function PengembalianPage() {
  // Untuk tracking serial yang sudah dicentang untuk dikembalikan (per loanId)
  const [returningSerials, setReturningSerials] = useState<Record<string, Set<string>>>({});
  const [loans, setLoans] = useState<LoanWithDetails[]>([])
  const [filteredLoans, setFilteredLoans] = useState<LoanWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc") // terbaru default
  const [returningLoan, setReturningLoan] = useState<LoanWithDetails | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [settings, setSettings] = useState<any>(null)
  const [detailLoan, setDetailLoan] = useState<LoanWithDetails | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isReminderOpen, setIsReminderOpen] = useState(false)

  const router = useRouter()

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push("/login")
      return
    }

    // Fetch settings
    fetch("/api/settings")
      .then((res) => res.json())
      .then((settings) => {
        setSettings(settings)
        loadLoans()
      })
      .catch(() => {
        setSettings(null)
        loadLoans()
      })
  }, [router])

  // Move filterLoans above its first usage so it is defined before useEffect
  function filterLoans() {
    let filtered = loans

    if (search && search.trim() !== "") {
      const q = search.trim().toLowerCase()
      filtered = filtered.filter((loan) => {
        const borrowerName = typeof loan.borrower?.name === "string" ? loan.borrower.name.toLowerCase() : ""
        const borrowerNIP = typeof loan.borrower?.nip === "string" ? loan.borrower.nip.toLowerCase() : ""
        const borrowerOfficerId = typeof loan.borrower?.officerId === "string" ? loan.borrower.officerId.toLowerCase() : ""
        const itemMatch = loan.itemDetails?.some((item) => typeof item.name === "string" ? item.name.toLowerCase().includes(q) : false)
        return (
          borrowerName.includes(q) ||
          itemMatch ||
          borrowerNIP.includes(q) ||
          borrowerOfficerId.includes(q)
        )
      })
    }

    if (statusFilter === "overdue") {
      filtered = filtered.filter((loan) => isOverdue(loan.dueDate))
    } else if (statusFilter === "due-soon") {
      filtered = filtered.filter((loan) => {
        const days = getDaysUntilDue(loan.dueDate)
        return days <= 3 && days >= 0
      })
    }
    // jika all, tidak filter status

    // Sort by createdAt
    filtered = [...filtered].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime()
      const bTime = new Date(b.createdAt).getTime()
      return sortOrder === "desc" ? bTime - aTime : aTime - bTime
    })

    setFilteredLoans(filtered)
  }

  useEffect(() => {
    filterLoans()
  }, [loans, search, statusFilter, sortOrder])

  // Show toast for error
  useEffect(() => {
    if (error) {
      toast.error(error, { duration: 6000, className: "toast-error" })
    }
  }, [error])

  // Show toast for success
  useEffect(() => {
    if (success) {
      toast.success(success, { duration: 6000, className: "toast-success" })
    }
  }, [success])

  const loadLoans = async () => {
    try {
      setIsLoading(true)
      // Fetch all loans, items, and borrowers (like riwayat)
      const [loansData, items, borrowers] = await Promise.all([
        api.getLoans(),
        api.getItems(),
        api.getBorrowers(),
      ])

      // Index borrowers and items by id for fast lookup
      const borrowerMap = Object.fromEntries(borrowers.map((b: any) => [b.id?.toString(), b]));
      const itemMap = Object.fromEntries(items.map((i: any) => [i.id?.toString(), i]));

      // Gabungkan semua data ke satu array
      const mapped: LoanWithDetails[] = (loansData || []).map((loan) => {
        const borrower = loan.borrowerId ? borrowerMap[loan.borrowerId?.toString()] ?? null : null;
        // itemDetails: tampilkan semua serial yang pernah dipinjam pada loan ini
        let itemDetails: (Item & ItemSerial & { note?: string; quantity: number })[] = [];
        if (Array.isArray(loan.items)) {
          itemDetails = loan.items.map((loanItem) => {
            let foundBase: Item | undefined = undefined;
            let foundSerial: ItemSerial | undefined = undefined;
            for (const item of Object.values(itemMap) as Item[]) {
              if (item.items && Array.isArray(item.items)) {
                // Cari serial apapun, baik status 0/1, loanId sama atau tidak
                const serial = item.items.find((s) => s.serialNumber === loanItem.serialNumber);
                if (serial) {
                  foundBase = item;
                  foundSerial = serial;
                  break;
                }
              }
            }
            if (!foundBase || !foundSerial) return undefined;
            // Jika loanId serial sekarang tidak sama dengan loan.id, berarti sudah dikembalikan (status 1)
            const isReturned = foundSerial.loanId !== loan.id;
            return {
              ...(foundBase as Item),
              ...(foundSerial as ItemSerial),
              note: loanItem.note,
              quantity: 1,
              status: isReturned ? 1 : foundSerial.status,
            } as Item & ItemSerial & { note?: string; quantity: number };
          }).filter(Boolean) as (Item & ItemSerial & { note?: string; quantity: number })[];
        }
        // Status loan otomatis: semua serial status 1 = dikembalikan, ada status 0 & loanId = loan.id = dipinjam
        let autoStatus: "dikembalikan" | "dipinjam" = "dikembalikan";
        if (itemDetails.some((d) => d.status === 0 && d.loanId === loan.id)) {
          autoStatus = "dipinjam";
        }
        return {
          ...loan,
          status: autoStatus,
          borrower,
          itemDetails,
        };
      });
      setLoans(mapped.filter((loan) => loan.status === "dipinjam"));
    } catch (err) {
      setError("Gagal memuat data peminjaman")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReturn = async () => {
    if (!returningLoan) return

    try {
      setError("")
      setSuccess("")

      await api.returnLoan(returningLoan.id)
      // Tidak perlu update stock manual, status serial akan diupdate otomatis oleh backend jika diperlukan
    } catch (err) {
      setError("Gagal memproses pengembalian")
      console.error(err)
    }
    setIsConfirmOpen(false)
    setReturningLoan(null)
    // Cek serial mana saja yang sudah dicentang untuk dikembalikan
    const checkedSerials = returningSerials[returningLoan.id] || new Set<string>();
    // Update status serial di items.json (API)
    const items = await api.getItems();
    // Group serial numbers by the item id so we update each item only once
    const updatesByItemId: Record<string, Set<string>> = {};
    for (const detail of returningLoan.itemDetails) {
      const sn = detail.serialNumber;
      if (sn && checkedSerials.has(sn) && detail.status !== 1) {
        const key = String(detail.id ?? "");
        if (!updatesByItemId[key]) updatesByItemId[key] = new Set<string>();
        updatesByItemId[key].add(sn);
      }
    }
    // Apply updates per item (one API call per item)
    for (const [itemId, serialSet] of Object.entries(updatesByItemId)) {
      const item = items.find((i: Item) => String(i.id) === itemId);
      if (item && item.items) {
        const updatedSerials = item.items.map((s: ItemSerial) =>
          serialSet.has(s.serialNumber) ? { ...s, status: 1 as 1, loanId: null } : s
        );
        await api.updateItem(item.id, { items: updatedSerials });
      }
    }
    // Ambil hanya serial yang benar-benar diupdate (status sebelumnya bukan 1, sekarang diubah ke 1)
    const updatedSerialsList = returningLoan.itemDetails
      .filter(
        (detail) =>
          detail.serialNumber &&
          checkedSerials.has(detail.serialNumber) &&
          detail.status !== 1
      )
      .map((it) => `"${it.name}" (${it.serialNumber})`);

    if (updatedSerialsList.length > 0) {
      setSuccess(
        `Status barang ${updatedSerialsList.join(", ")} untuk peminjam ${returningLoan.borrower?.name} berhasil diperbarui.`
      );
    } else {
      setSuccess(
        `Tidak ada barang yang perlu diperbarui untuk peminjam ${returningLoan.borrower?.name}.`
      );
    }
    // Setelah update, cek apakah SEMUA serial pada loan ini sudah status 1 (dikembalikan)
    // Jika ya, baru kirim notifikasi eksternal
    const refreshedItems = await api.getItems();
    // Ambil ulang detail serial untuk loan ini
    const allSerialsReturned = returningLoan.itemDetails.every((detail) => {
      if (!detail.serialNumber) return true;
      // Cari serial di items
      const item = refreshedItems.find((i: Item) => i.id === detail.id);
      if (!item || !item.items) return false;
      const serial = item.items.find((s: ItemSerial) => s.serialNumber === detail.serialNumber);
      // Jika loanId serial sekarang tidak sama dengan loan.id, berarti sudah dikembalikan (apapun statusnya)
      return serial && serial.loanId !== returningLoan.id ? true : (serial && serial.status === 1);
    });
    if (allSerialsReturned && settings?.messages?.returnMessage) {
      try {
        await fetch("http://145.10.0.6:3000/kembali", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ id: returningLoan.id })
        })
      } catch (err) {
        console.error("Gagal POST ke API eksternal /kembali:", err)
      }
    }
    loadLoans();
  }

  // Handler aksi kembalikan
  const handleReturnClick = (loan: LoanWithDetails) => {
    if (settings?.system?.returnConfirmation) {
      setReturningLoan(loan)
      setIsConfirmOpen(true)
    } else {
      setReturningLoan(loan)
      handleReturn()
    }
  }

  const handleSendReminder = async () => {
    if (!detailLoan) return;
    try {
      const res = await fetch("http://145.10.0.6:3000/pengingat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ id: detailLoan.id })
      });
      if (res.ok) {
        setSuccess("Pengingat berhasil dikirim ke " + (detailLoan.borrower?.name || "peminjam"));
      } else {
        setError("Gagal mengirim pengingat");
      }
    } catch (err) {
      setError("Gagal mengirim pengingat");
    }
    setIsReminderOpen(false);
  }

  const getStatusBadge = (loan: LoanWithDetails) => {
    // Use getDaysUntilDue to avoid timezone issues and for correct badge
    const daysLeft = getDaysUntilDue(loan.dueDate) - 1
    if (daysLeft === 0) {
      return (
        <span className="badge-warning">
          <Clock className="w-4 h-4 mr-1" />
          Jatuh tempo hari ini
        </span>
      )
    }
    if (daysLeft < 0) {
      return (
        <span className="badge-danger">
          <AlertTriangle className="w-4 h-4 mr-1" />
          Terlambat {Math.abs(daysLeft)} hari
        </span>
      )
    }
    if (daysLeft <= 3) {
      return (
        <span className="badge-warning">
          <Clock className="w-4 h-4 mr-1" />
          {`${daysLeft} hari lagi`}
        </span>
      )
    }
    return (
      <span className="badge-info">
        <Clock className="w-4 h-4 mr-1" />
        Dipinjam
      </span>
    )
  }

  if (!auth.isAuthenticated()) {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg">
        <div className="max-w-[90rem] mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Loading />
        </div>
      </div>
    )
  }

  const overdueCount = loans.filter((loan) => isOverdue(loan.dueDate)).length
  const dueSoonCount = loans.filter((loan) => {
    const days = getDaysUntilDue(loan.dueDate)
    return days <= 3 && days >= 0
  }).length

  return (
    <div className="min-h-screen gradient-bg">
      <div className="max-w-[90rem] mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fade-in duration-200">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pengembalian Barang</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Kelola pengembalian barang yang sedang dipinjam</p>
        </div>


        {/* Alert diganti sonner toast */}

        {/* Stats Cards - shadcn/ui Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-md">
            <CardContent className="flex items-center justify-between py-6">
              <div>
                <div className="text-blue-100 text-sm font-medium">Total Dipinjam</div>
                <div className="text-3xl font-bold text-white">{loans.length}</div>
              </div>
              <div className="rounded-full bg-blue-600/30 p-2">
                <Package className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 shadow-md">
            <CardContent className="flex items-center justify-between py-6">
              <div>
                <div className="text-yellow-100 text-sm font-medium">Jatuh Tempo Segera</div>
                <div className="text-3xl font-bold text-white">{dueSoonCount}</div>
              </div>
              <div className="rounded-full bg-yellow-600/30 p-2">
                <Clock className="w-8 h-8 text-yellow-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-md">
            <CardContent className="flex items-center justify-between py-6">
              <div>
                <div className="text-red-100 text-sm font-medium">Terlambat</div>
                <div className="text-3xl font-bold text-white">{overdueCount}</div>
              </div>
              <div className="rounded-full bg-red-600/30 p-2">
                <AlertTriangle className="w-8 h-8 text-red-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative md:col-span-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <Input
                type="text"
                placeholder="Cari peminjam atau barang..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-10 pr-10"
              />
              {search && (
                <button
                  type="button"
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 p-1 rounded-full transition-colors"
                  onClick={() => setSearch("")}
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="input-field">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="overdue">Terlambat</SelectItem>
                <SelectItem value="due-soon">Jatuh Tempo Segera</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order Filter */}
            <Select value={sortOrder} onValueChange={v => setSortOrder(v as "desc" | "asc")}>
              <SelectTrigger className="input-field">
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Terbaru</SelectItem>
                <SelectItem value="asc">Terlama</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center">
              <Button
                onClick={() => {
                  setSearch("")
                  setStatusFilter("all")
                  setSortOrder("desc")
                }}
                className="w-max flex items-center text-sm font-medium text-gray-600 border-gray-600 border dark:text-gray-400 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700/20 rounded-lg transition-colors"
                variant={"outline"}
              >
                <Filter className="w-4 h-4 mr-2" />
                Reset Filter
              </Button>
            </div>
          </div>
        </div>

        {/* Loans Table - shadcn/ui Table */}
        <div className="card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Peminjam</TableHead>
                <TableHead>Barang</TableHead>
                <TableHead>Tanggal Pinjam</TableHead>
                <TableHead>Jatuh Tempo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLoans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      {search || statusFilter
                        ? "Tidak ada data yang sesuai dengan filter"
                        : "Tidak ada barang yang sedang dipinjam"}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLoans.map((loan) => (
                  <TableRow
                    key={loan.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${isOverdue(loan.dueDate) && loan.status === "dipinjam"
                      ? "bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-800/20"
                      : ""
                      } cursor-pointer`}
                    onClick={() => {
                      setDetailLoan(loan)
                      setIsDetailOpen(true)
                    }}
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getColorFromName(loan.borrower?.name)}`}>
                          <span className="text-white text-base font-semibold">
                            {loan.borrower?.name?.charAt(0) || "U"}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{loan.borrower?.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {loan.borrower?.nip && loan.borrower?.officerId
                              ? `${loan.borrower.nip} - ${loan.borrower.officerId}`
                              : loan.borrower?.nip
                                ? loan.borrower.nip
                                : loan.borrower?.officerId
                                  ? loan.borrower.officerId
                                  : null}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        {loan.itemDetails && loan.itemDetails.length > 0 ? (
                          // Group by item name, sum quantity
                          Object.entries(
                            loan.itemDetails.reduce((acc, item) => {
                              const key = item.name || "Barang";
                              acc[key] = (acc[key] || 0) + (item.quantity || 1);
                              return acc;
                            }, {} as Record<string, number>)
                          ).map(([name, total], idx) => (
                            <div key={name + idx} className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                {(() => {
                                  // Ambil icon dari salah satu item dengan nama yang sama
                                  const found = loan.itemDetails.find(i => i.name === name);
                                  const Icon = ICON_OPTIONS.find(opt => opt.value === (found?.icon || "laptop"))?.icon || Laptop;
                                  return <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
                                })()}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  <span className="font-semibold">{total}</span>x
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{formatDate(loan.borrowDate)}</TableCell>
                    <TableCell className="font-medium">
                      <div className={isOverdue(loan.dueDate) ? "text-red-600 dark:text-red-400" : ""}>
                        {formatDate(loan.dueDate)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(loan)}</TableCell>
                    <TableCell>
                      <Button
                        onClick={e => {
                          e.stopPropagation();
                          setReturningLoan(loan);
                          setIsConfirmOpen(true);
                          // Inisialisasi serial yang sudah dikembalikan (gunakan serialNumber || sn)
                          setReturningSerials((prev) => ({
                            ...prev,
                            [loan.id]: new Set(
                              loan.itemDetails
                                .filter((d: any) => d.status === 1 && typeof d.serialNumber === 'string')
                                .map((d: any) => d.serialNumber as string)
                            ),
                          }));
                        }}
                        className="btn-success"
                      >
                        <CheckCircle className="w-6 h-6 mr-1" />
                        Tandai Pengembalian
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {/* Detail Dialog */}
              <AlertDialog open={isDetailOpen} onOpenChange={open => {
                setIsDetailOpen(open)
                if (!open) setDetailLoan(null)
              }}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Detail Peminjaman</AlertDialogTitle>
                    <AlertDialogDescription>
                      {detailLoan ? (
                        <div className="space-y-6">
                          {/* Borrower Card */}
                          <div className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-accent-100 to-accent-200 dark:from-accent-900/30 dark:to-accent-800/30 border border-accent-200 dark:border-accent-700 shadow-sm">
                            <div className={`flex-shrink-0 w-14 h-14 rounded-full ${getColorFromName(detailLoan.borrower?.name)} flex items-center justify-center text-white text-2xl font-bold`}>
                              <User className="w-8 h-8" />
                            </div>
                            <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                              <div>
                                <div className="text-md font-semibold text-gray-900 dark:text-white">{detailLoan.borrower?.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">NIP: {detailLoan.borrower?.nip}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">ID Pegawai: {detailLoan.borrower?.officerId}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">No. HP: {detailLoan.borrower?.phone}</div>
                              </div>
                            </div>
                          </div>
                          {/* Loan Info Card */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="rounded-lg bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                              <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                                <span className="font-semibold">Tanggal Pinjam</span>
                              </div>
                              <div className="text-sm text-gray-700 dark:text-gray-200 mb-2">{formatDateTime(detailLoan.borrowDate)}</div>
                              <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-5 h-5 text-yellow-500" />
                                <span className="font-semibold">Jatuh Tempo</span>
                              </div>
                              <div className="text-sm text-gray-700 dark:text-gray-200 mb-2">{formatDateTime(detailLoan.dueDate)}</div>
                              {detailLoan.returnDate && (
                                <>
                                  <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="font-semibold">Tanggal Kembali</span>
                                  </div>
                                  <div className="text-sm text-gray-700 dark:text-gray-200 mb-2">{formatDateTime(detailLoan.returnDate)}</div>
                                </>
                              )}
                            </div>
                            <div className="rounded-lg bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 p-4 shadow-sm flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">Status:</span>
                                {getStatusBadge(detailLoan)}
                              </div>
                              <div><span className="font-semibold">Keperluan:</span> {detailLoan.purpose || "-"}</div>
                              <div><span className="font-semibold">Catatan:</span> {detailLoan.notes || "-"}</div>
                            </div>
                          </div>
                          {/* Items Card */}
                          <div className="rounded-lg bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                            <div className="font-semibold mb-2">Daftar Barang ({detailLoan.itemDetails.length})</div>
                            <ul className="divide-y divide-gray-100 dark:divide-gray-800 max-h-72 overflow-y-auto">
                              {(detailLoan.itemDetails as (Item & ItemSerial & { note?: string; quantity: number })[]).map((item, idx) => (
                                <li key={item.id} className="flex items-center gap-3 py-2">
                                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-accent-100 dark:bg-accent-900/30">
                                    {(() => {
                                      const Icon = ICON_OPTIONS.find(opt => opt.value === (item.icon || "laptop"))?.icon || Laptop;
                                      return <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
                                    })()}
                                  </span>
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {item.sn || item.serialNumber || '-'}
                                      {item.note ? ` | Catatan: ${item.note}` : ""}
                                    </div>
                                  </div>
                                  {item.status === 1 && (
                                    <span className="ml-2 px-2 py-0.5 rounded text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Sudah dikembalikan</span>
                                  )}
                                  {item.status === 0 && item.loanId === detailLoan.id && (
                                    <span className="ml-2 px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Masih dipinjam</span>
                                  )}
                                  {item.status === 0 && item.loanId !== detailLoan.id && (
                                    <span className="ml-2 px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">Dipinjam orang lain</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ) : null}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    {settings?.messages?.reminderMessage && (
                      <Button
                        variant="outline"
                        className="rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 transition-colors shadow-sm"
                        onClick={() => setIsReminderOpen(true)}
                      >
                        Ingatkan
                      </Button>
                    )}
                    <AlertDialogCancel
                      onClick={() => {
                        setIsDetailOpen(false)
                        setDetailLoan(null)
                      }}
                      className="rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 transition-colors"
                    >
                      Tutup
                    </AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Reminder Confirmation Dialog */}
              <AlertDialog open={isReminderOpen} onOpenChange={open => setIsReminderOpen(open)}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Konfirmasi Pengingat</AlertDialogTitle>
                    <AlertDialogDescription>
                      Kirim pengingat pengembalian barang ke <span className="font-semibold">{detailLoan?.borrower?.name}</span>?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      className="rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 transition-colors"
                      onClick={() => setIsReminderOpen(false)}
                    >
                      Batal
                    </AlertDialogCancel>
                    <AlertDialogAction
                      autoFocus
                      className="rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 transition-colors shadow-sm"
                      onClick={handleSendReminder}
                    >
                      Kirim Pengingat
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Return Confirmation - shadcn/ui AlertDialog */}
      <AlertDialog open={isConfirmOpen} onOpenChange={(open) => {
        setIsConfirmOpen(open)
        if (!open) setReturningLoan(null)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Pengembalian</AlertDialogTitle>
            <AlertDialogDescription>
              Selesaikan <span className="font-semibold">{returningLoan?.itemDetails?.length || 0} barang</span> peminjaman dari <span className="font-semibold">{returningLoan?.borrower?.name}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          {returningLoan && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Pilih serial yang sudah dikembalikan:</span>
                <label className="flex items-center gap-2 select-none cursor-pointer">
                  <Checkbox
                    checked={(() => {
                      // Hitung serial yang bisa dipilih (status !== 1)
                      const eligible = returningLoan.itemDetails.filter(item => item.status !== 1 && typeof item.serialNumber === "string");
                      if (eligible.length === 0) return false;
                      const selected = eligible.filter(item =>
                        typeof item.serialNumber === "string" && returningSerials[returningLoan.id]?.has(item.serialNumber)
                      );
                      return selected.length === eligible.length;
                    })()}
                    ref={el => {
                      if (el && "indeterminate" in el) {
                        const eligible = returningLoan.itemDetails.filter(item => item.status !== 1 && typeof item.serialNumber === "string");
                        const selected = eligible.filter(item =>
                          typeof item.serialNumber === "string" && returningSerials[returningLoan.id]?.has(item.serialNumber)
                        );
                        (el as HTMLInputElement).indeterminate = selected.length > 0 && selected.length < eligible.length;
                      }
                    }}
                    onCheckedChange={checked => {
                      setReturningSerials(prev => {
                        const eligible = returningLoan.itemDetails.filter(item => item.status !== 1 && typeof item.serialNumber === "string");
                        const set = new Set(prev[returningLoan.id] || []);
                        if (checked) {
                          eligible.forEach(item => {
                            if (typeof item.serialNumber === "string") set.add(item.serialNumber);
                          });
                        } else {
                          eligible.forEach(item => {
                            if (typeof item.serialNumber === "string") set.delete(item.serialNumber);
                          });
                        }
                        return { ...prev, [returningLoan.id]: set };
                      });
                    }}
                    className="h-5 w-5 text-blue-600 bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-700 active:ring-2 active:ring-blue-300 dark:active:ring-blue-700 transition-all"
                    aria-label="Toggle semua serial"
                  />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-200">Pilih Semua</span>
                </label>
              </div>
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {returningLoan.itemDetails.map((item, idx) => {
                  const sn = typeof item.serialNumber === 'string' ? item.serialNumber as string : undefined;
                  return (
                    <li key={sn || idx} className="flex items-center gap-3 py-2">
                      <label className="flex items-center gap-3 w-full cursor-pointer select-none">
                        <Checkbox
                          checked={sn ? !!returningSerials[returningLoan.id]?.has(sn) : false}
                          disabled={item.status === 1}
                          onCheckedChange={checked => {
                            setReturningSerials(prev => {
                              const set = new Set(prev[returningLoan.id] || []);
                              if (sn) {
                                if (checked) set.add(sn);
                                else set.delete(sn);
                              }
                              return { ...prev, [returningLoan.id]: set };
                            });
                          }}
                          className="h-5 w-5 text-green-600 bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-700 active:ring-2 active:ring-gray-300 dark:active:ring-gray-700 transition-all"
                          aria-label={`Pilih serial ${sn ?? idx}`}
                        />
                        <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{sn || ""}</span>
                        {item.status === 1 && <span className="text-green-600 text-xs ml-2">Sudah dikembalikan</span>}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsConfirmOpen(false)
                setReturningLoan(null)
              }}
              className="rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 transition-colors"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              autoFocus
              className="rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-400 transition-colors shadow-sm"
              onClick={handleReturn}
            >
              Ya, Selesaikan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
