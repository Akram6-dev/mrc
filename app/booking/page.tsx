"use client";
import { useEffect, useState } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { formatDate, formatDateTime, getColorFromName } from "@/lib/utils";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { CheckCircle, XCircle, Package, Clock, Laptop, Cable, Projector, HdmiPort, Plug, Mouse, Tablet, Printer, Monitor, Keyboard, Speaker, Presentation, MicVocal, X, Search, Filter, User } from "lucide-react";
import { Input } from "@/components/ui/input";

// Icon options mapping (mirip pengembalian)
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

function getItemIcon(item: any) {
    const iconObj = ICON_OPTIONS.find(opt => opt.value === item?.icon || item?.category?.toLowerCase() === opt.value);
    return iconObj ? iconObj.icon : Package;
}

export default function BookingAdminPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [borrowers, setBorrowers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
    const [showDialog, setShowDialog] = useState<"accept" | "reject" | false>(false);
    const [showDetail, setShowDetail] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [refresh, setRefresh] = useState(0);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
    // Stat cards
    const totalPending = bookings.filter((b: any) => b.status === 'pending').length;
    const totalAccepted = bookings.filter((b: any) => b.status === 'accepted').length;
    const totalRejected = bookings.filter((b: any) => b.status === 'rejected').length;

    // Filtered bookings
    const filteredBookings = (() => {
        let filtered = bookings;
        if (search && search.trim() !== "") {
            const q = search.trim().toLowerCase();
            filtered = filtered.filter((b: any) => {
                // Cari borrower dari global borrowers jika ada
                let borrower = null;
                if (b.borrowerId && Array.isArray(borrowers)) {
                    borrower = borrowers.find((br: any) => br.id === b.borrowerId);
                }
                if (!borrower && b.borrower) borrower = b.borrower;
                const name = (borrower?.name || "").toLowerCase();
                const nip = (borrower?.nip || "").toLowerCase();
                const officerId = (borrower?.officerId || "").toLowerCase();
                const itemMatch = Array.isArray(b.items) && b.items.some((it: any) => {
                    const itemDetail = items.find((itm: any) => itm.id === it.itemId) || {};
                    return (
                        (it.name || itemDetail.name || "").toLowerCase().includes(q)
                    );
                });
                return (
                    name.includes(q) ||
                    nip.includes(q) ||
                    officerId.includes(q) ||
                    itemMatch
                );
            });
        }
        if (statusFilter !== "all") {
            filtered = filtered.filter((b: any) => b.status === statusFilter);
        }
        filtered = [...filtered].sort((a, b) => {
            const aTime = new Date(a.createdAt || a.startDate).getTime();
            const bTime = new Date(b.createdAt || b.startDate).getTime();
            return sortOrder === "desc" ? bTime - aTime : aTime - bTime;
        });
        return filtered;
    })();

    useEffect(() => {
        setIsLoading(true);
        Promise.all([
            fetch("/api/booking").then((res) => res.json()),
            fetch("/api/items").then((res) => res.json()),
            fetch("/api/borrowers").then((res) => res.json()),
        ])
            .then(([booking, items, borrowers]) => {
                setBookings(booking);
                setItems(items);
                setBorrowers(borrowers);
            })
            .finally(() => setIsLoading(false));
    }, [refresh]);

    // Helper: get reserved serials for a booking item
    function getReservedSerials(itemId: string, bookingId: string, qty: number) {
        const item = items.find((i: any) => i.id === itemId);
        if (!item || !Array.isArray(item.items)) return [];
        // Ambil serial dengan status 2 dan loanId = bookingId, urutkan sesuai urutan di array
        return item.items.filter((s: any) => s.status === 2 && s.loanId === bookingId).slice(0, qty);
    }

    // Helper: get borrower name from borrowers.json using borrowerId
    function getBorrowerName(booking: any) {
        if (!booking) return '-';
        if (booking.borrowerId && Array.isArray(borrowers)) {
            const found = borrowers.find((b: any) => b.id === booking.borrowerId);
            if (found && found.name) return found.name;
        }
        return booking.borrowerId || '-';
    }

    // Action: Accept booking (ubah status jadi "accepted")
    async function handleAccept(booking: any) {
        setActionLoading(true);
        try {
            // 1. Update status booking
            await fetch(`/api/booking`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...booking, status: "accepted" }),
            });


            // 2. Update semua serial yang dibooking: status 2 -> 0, loanId tetap booking.id
            for (const it of booking.items) {
                const item = items.find((i: any) => i.id === it.itemId);
                if (!item || !Array.isArray(item.items)) continue;
                let changed = 0;
                const updatedSerials = item.items.map((serial: any) => {
                    if (changed < it.qty && serial.status === 2 && serial.loanId === booking.id) {
                        changed++;
                        return { ...serial, status: 0, loanId: booking.id };
                    }
                    return serial;
                });
                await fetch("/api/items", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...item, items: updatedSerials }),
                });
            }

            // 3. Fetch ulang items dari API agar status serial sudah update
            const itemsAfter = await fetch("/api/items").then(res => res.json());

            // 4. Buat entry baru di /loans.json (API) dengan id = booking.id
            // Format sama seperti createLoan di api.ts
            const borrower = borrowers.find((b: any) => b.id === booking.borrowerId) || {};
            const now = new Date();
            const borrowDate = booking.startDate || now.toISOString();
            const duration = booking.duration || 1;
            const dueDate = (() => {
                const d = new Date(borrowDate);
                d.setDate(d.getDate() + duration);
                return d.toISOString();
            })();
            // Ambil serial yang dipinjam (status 0, loanId = booking.id)
            let loanSerials: any[] = [];
            for (const it of booking.items) {
                const item = itemsAfter.find((i: any) => i.id === it.itemId);
                if (!item || !Array.isArray(item.items)) continue;
                const serials = item.items.filter((s: any) => s.loanId === booking.id && s.status === 0).slice(0, it.qty);
                for (const s of serials) {
                    loanSerials.push({ rfidCode: s.rfidCode, note: undefined });
                }
            }
            const loanData = {
                id: booking.id,
                borrowerId: booking.borrowerId,
                items: loanSerials,
                borrowDate,
                dueDate,
                status: "dipinjam",
                purpose: booking.purpose || "",
                notes: booking.notes || "",
                createdAt: booking.createdAt || now.toISOString(),
                updatedAt: now.toISOString(),
            };
            await fetch("/api/loans", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(loanData),
            });

            // --- POST ke API eksternal (dari peminjaman/page.tsx) ---
            try {
                // Format items: gabungkan item booking berdasarkan itemId
                const itemsBody = booking.items.map((it: any) => {
                    // Cari nama barang dari itemsAfter
                    const itemData = itemsAfter.find((i: any) => i.id === it.itemId);
                    return {
                        item_name: it.name || itemData?.name || 'Barang',
                        qty: it.qty,
                    };
                });
                // Compose body
                const postBody = {
                    id: booking.id || "",
                    number: borrower?.phone || "",
                    name: borrower?.name || "",
                    start_date: borrowDate,
                    due_date: dueDate,
                    items: itemsBody,
                    purpose: booking.purpose || "",
                    notes: booking.notes || undefined
                };
                await fetch("http://145.10.0.6:3000/pinjam", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(postBody)
                });
            } catch (err) {
                console.error("Gagal POST ke API eksternal:", err);
            }


            setShowDialog(false);
            setSelectedBooking(null);
            setRefresh(r => r + 1);
        } finally {
            setActionLoading(false);
        }
    }

    // Action: Reject booking (ubah status jadi "rejected" dan kembalikan status serial ke 1)
    async function handleReject(booking: any) {
        setActionLoading(true);
        try {
            // Kembalikan status serial ke 1 untuk semua item yang dibooking
            for (const it of booking.items) {
                const item = items.find((i: any) => i.id === it.itemId);
                if (!item || !Array.isArray(item.items)) continue;
                let updatedSerials = [...item.items];
                let changed = 0;
                for (let i = 0; i < updatedSerials.length && changed < it.qty; i++) {
                    if (updatedSerials[i].status === 2 && updatedSerials[i].loanId === booking.id) {
                        updatedSerials[i] = { ...updatedSerials[i], status: 1, loanId: null };
                        changed++;
                    }
                }
                await fetch("/api/items", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...item, items: updatedSerials }),
                });
            }
            // Update status booking
            await fetch(`/api/booking`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...booking, status: "rejected" }),
            });
            setShowDialog(false);
            setSelectedBooking(null);
            setRefresh(r => r + 1);
        } finally {
            setActionLoading(false);
        }
    }

    return (
        <div className="min-h-screen gradient-bg">
            <div className="max-w-[90rem] mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fade-in duration-200">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Permintaan Booking Barang</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">Kelola permintaan booking barang yang masuk.</p>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white border-0 shadow-md">
                        <CardContent className="flex items-center justify-between py-6">
                            <div>
                                <div className="text-yellow-100 text-sm font-medium">Pending</div>
                                <div className="text-3xl font-bold text-white">{totalPending}</div>
                            </div>
                            <div className="rounded-full bg-yellow-500/30 p-2">
                                <Clock className="w-8 h-8 text-yellow-200" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-md">
                        <CardContent className="flex items-center justify-between py-6">
                            <div>
                                <div className="text-green-100 text-sm font-medium">Diterima</div>
                                <div className="text-3xl font-bold text-white">{totalAccepted}</div>
                            </div>
                            <div className="rounded-full bg-green-600/30 p-2">
                                <CheckCircle className="w-8 h-8 text-green-200" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-md">
                        <CardContent className="flex items-center justify-between py-6">
                            <div>
                                <div className="text-red-100 text-sm font-medium">Ditolak</div>
                                <div className="text-3xl font-bold text-white">{totalRejected}</div>
                            </div>
                            <div className="rounded-full bg-red-600/30 p-2">
                                <XCircle className="w-8 h-8 text-red-200" />
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
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="accepted">Diterima</SelectItem>
                                <SelectItem value="rejected">Ditolak</SelectItem>
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


                <div className="card overflow-hidden">
                    {isLoading ? (
                        <div className="py-12 text-center text-gray-500">Memuat...</div>
                    ) : bookings.length === 0 ? (
                        <div className="py-12 text-center text-gray-400">Belum ada permintaan booking</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Peminjam</TableHead>
                                    <TableHead>Barang</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredBookings.length === 0 ? (
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
                                    filteredBookings.map((b: any) => (
                                        <TableRow
                                            key={b.id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                                            onClick={e => {
                                                if ((e.target as HTMLElement).closest('button')) return;
                                                setSelectedBooking(b);
                                                setShowDetail(true);
                                            }}
                                        >
                                            <TableCell>
                                                {(() => {
                                                    let borrower = null;
                                                    if (b.borrowerId && Array.isArray(borrowers)) {
                                                        borrower = borrowers.find((br: any) => br.id === b.borrowerId);
                                                    }
                                                    if (!borrower && b.borrower) borrower = b.borrower;
                                                    const name = borrower?.name || "-";
                                                    const nip = borrower?.nip || null;
                                                    const officerId = borrower?.officerId || null;
                                                    return (
                                                        <div className="flex items-center space-x-3">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getColorFromName(name)}`}>
                                                                <span className="text-white text-base font-semibold">
                                                                    {name.charAt(0) || "U"}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-gray-900 dark:text-white">{name}</div>
                                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                    {nip && officerId
                                                                        ? `${nip} - ${officerId}`
                                                                        : nip
                                                                            ? nip
                                                                            : officerId
                                                                                ? officerId
                                                                                : null}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-2">
                                                    {Array.isArray(b.items) && b.items.map((it: any) => {
                                                        // Cari item detail dari items[] global
                                                        const itemDetail = items.find((itm: any) => itm.id === it.itemId) || {};
                                                        const Icon = getItemIcon(itemDetail);
                                                        return (
                                                            <div key={it.itemId} className="flex items-center space-x-3">
                                                                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                                                    <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                                                </div>

                                                                <div>
                                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{it.name || itemDetail.name || '-'}</div>
                                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                        <span className="font-semibold">{it.qty}</span>x
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </TableCell>
                                            <TableCell>{formatDate(b.startDate)}</TableCell>
                                            <TableCell>
                                                {b.status === 'pending' && (
                                                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</Badge>
                                                )}
                                                {b.status === 'accepted' && (
                                                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Diterima</Badge>
                                                )}
                                                {b.status === 'rejected' && (
                                                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Ditolak</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {b.status === 'pending' ? (
                                                    <div className="flex gap-2">
                                                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white rounded-lg" onClick={e => { e.stopPropagation(); setSelectedBooking(b); setShowDialog('accept'); }}>
                                                            <CheckCircle className="w-4 h-4 mr-1" /> Terima
                                                        </Button>
                                                        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white rounded-lg" onClick={e => { e.stopPropagation(); setSelectedBooking(b); setShowDialog('reject'); }}>
                                                            <XCircle className="w-4 h-4 mr-1" /> Tolak
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">-</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {/* Detail Dialog */}
                <AlertDialog open={showDetail} onOpenChange={open => { setShowDetail(open); if (!open) setSelectedBooking(null); }}>
                    <AlertDialogContent className="rounded-xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Detail Booking</AlertDialogTitle>
                            <AlertDialogDescription>
                                {selectedBooking && (
                                    <div className="space-y-6">
                                        {/* Borrower Card */}
                                        {(() => {
                                            let borrower = null;
                                            if (selectedBooking.borrowerId && Array.isArray(borrowers)) {
                                                borrower = borrowers.find((br: any) => br.id === selectedBooking.borrowerId);
                                            }
                                            if (!borrower && selectedBooking.borrower) borrower = selectedBooking.borrower;
                                            return (
                                                <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-accent-100 to-accent-200 dark:from-accent-900/30 dark:to-accent-800/30 border border-accent-200 dark:border-accent-700 shadow-sm">
                                                    <div className={`flex-shrink-0 w-14 h-14 rounded-full ${getColorFromName(borrower?.name)} flex items-center justify-center text-white text-2xl font-bold`}>
                                                        <User className="w-8 h-8" />
                                                    </div>
                                                    <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                                                        <div>
                                                            <div className="text-md font-semibold text-gray-900 dark:text-white">
                                                                {borrower?.name || "-"}
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                NIP: {borrower?.nip || "-"}
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                ID Pegawai: {borrower?.officerId || "-"}
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                No. HP: {borrower?.phone || "-"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                        {/* Info Card */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="rounded-xl bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Clock className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                                                    <span className="font-semibold">Tanggal Permintaan</span>
                                                </div>
                                                <div className="text-sm text-gray-700 dark:text-gray-200 mb-2">
                                                    {formatDateTime(selectedBooking.createdAt)}
                                                </div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                    <span className="font-semibold">Tanggal Pinjam</span>
                                                </div>
                                                <div className="text-sm text-gray-700 dark:text-gray-200 mb-2">
                                                    {formatDateTime(selectedBooking.startDate)}
                                                </div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Clock className="w-5 h-5 text-yellow-500" />
                                                    <span className="font-semibold">Durasi</span>
                                                </div>
                                                <div className="text-sm text-gray-700 dark:text-gray-200 mb-2">
                                                    {selectedBooking.duration} hari
                                                </div>
                                            </div>
                                            <div className="rounded-xl bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 p-4 shadow-sm flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold">Status:</span>
                                                    {selectedBooking.status === 'pending' ? (
                                                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</Badge>
                                                    ) : selectedBooking.status === 'accepted' ? (
                                                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Diterima</Badge>
                                                    ) : (
                                                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Ditolak</Badge>
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="font-semibold">Keperluan:</span> {selectedBooking.purpose || "-"}
                                                </div>
                                                <div>
                                                    <span className="font-semibold">Catatan:</span> {selectedBooking.notes || "-"}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Daftar barang */}
                                        <div className="rounded-xl bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                                            <div className="font-semibold mb-2">Daftar Barang ({selectedBooking.items?.length || 0})</div>
                                            <ul className="divide-y divide-gray-100 dark:divide-gray-800 max-h-72 overflow-y-auto">
                                                {(() => {
                                                    // Kumpulkan semua serial yang dibooking (status 2, loanId = selectedBooking.id) dari setiap item
                                                    let serialList: any[] = [];
                                                    if (Array.isArray(selectedBooking.items) && selectedBooking.items.length > 0) {
                                                        selectedBooking.items.forEach((it: any) => {
                                                            const itemDetail = items.find((itm: any) => itm.id === it.itemId) || {};
                                                            const icon = itemDetail.icon || itemDetail.category || "laptop";
                                                            // Ambil serial yang status 2 (dibooking) dan loanId = selectedBooking.id
                                                            const serials = Array.isArray(itemDetail.items)
                                                                ? itemDetail.items.filter((s: any) => s.loanId === selectedBooking.id && s.status === 2)
                                                                : [];
                                                            if (serials.length > 0) {
                                                                serials.forEach((s: any) => {
                                                                    serialList.push({
                                                                        ...s,
                                                                        name: it.name || itemDetail.name || '-',
                                                                        icon,
                                                                    });
                                                                });
                                                            } else {
                                                                // Fallback: tampilkan item saja jika tidak ada serial, qty dari data booking
                                                                serialList.push({
                                                                    name: it.name || itemDetail.name || '-',
                                                                    icon,
                                                                    rfidCode: undefined,
                                                                    status: undefined,
                                                                    qty: it.qty || 1,
                                                                });
                                                            }
                                                        });
                                                    }
                                                    if (serialList.length > 0) {
                                                        return serialList.map((item, idx) => {
                                                            // Bentuk baru: serial lengkap
                                                            if (
                                                                typeof item.loanId === 'string' &&
                                                                typeof item.rfidCode === 'string' &&
                                                                typeof item.status !== 'undefined'
                                                            ) {
                                                                const Icon = ICON_OPTIONS.find(opt => opt.value === (item.icon || "laptop"))?.icon || Laptop;
                                                                return (
                                                                    <li key={item.rfidCode} className="flex items-center gap-3 py-2">
                                                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-accent-100 dark:bg-accent-900/30">
                                                                            <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                                                        </span>
                                                                        <div className="flex-1">
                                                                            <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                                                                            <div className="text-xs text-gray-500 dark:text-gray-400">{item.rfidCode}{item.note ? ` | Catatan: ${item.note}` : ""}</div>
                                                                        </div>
                                                                        {item.status === 1 && (
                                                                            <span className="ml-2 px-2 py-0.5 rounded text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Sudah dikembalikan</span>
                                                                        )}
                                                                        {item.status === 0 && item.loanId === selectedBooking.id && (
                                                                            <span className="ml-2 px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Masih dipinjam</span>
                                                                        )}
                                                                        {item.status === 2 && item.loanId === selectedBooking.id && (
                                                                            <span className="ml-2 px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Dibooking</span>
                                                                        )}
                                                                        {item.status === 0 && item.loanId !== selectedBooking.id && (
                                                                            <span className="ml-2 px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">Dipinjam orang lain</span>
                                                                        )}
                                                                    </li>
                                                                );
                                                            }
                                                            // Fallback: legacy shape
                                                            const Icon = ICON_OPTIONS.find(opt => opt.value === (item.icon || "laptop"))?.icon || Laptop;
                                                            return (
                                                                <li key={item.rfidCode || idx} className="flex items-center gap-3 py-2">
                                                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-accent-100 dark:bg-accent-900/30">
                                                                        <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                                                    </span>
                                                                    <div className="flex-1">
                                                                        <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.qty}x</div>
                                                                </li>
                                                            );
                                                        });
                                                    }
                                                    return <li className="text-gray-400 text-sm py-2">Tidak ada barang</li>;
                                                })()}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex justify-end gap-2 mt-6">
                            <AlertDialogCancel type="button" className="rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 transition-colors" onClick={() => setShowDetail(false)}>
                                Tutup
                            </AlertDialogCancel>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Accept/Reject Dialog */}
                <Dialog open={!!showDialog} onOpenChange={open => { if (!actionLoading) setShowDialog(open ? showDialog : false); }}>
                    <DialogContent className="max-w-lg rounded-xl">
                        <DialogHeader>
                            <DialogTitle>
                                {showDialog === 'accept' ? 'Terima Booking' : 'Tolak Booking'}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="text-base mb-2">
                            {showDialog === 'accept' ? (
                                <>Terima permintaan booking dari <span className="font-bold">{getBorrowerName(selectedBooking)}</span>?<br />Barang yang dibooking akan ditandai sebagai dipinjam.</>
                            ) : (
                                <>Tolak permintaan booking dari <span className="font-bold">{getBorrowerName(selectedBooking)}</span>?<br />Barang yang sudah dibooking akan dikembalikan ke stok.</>
                            )}
                        </div>
                        <DialogFooter className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setShowDialog(false)} disabled={actionLoading}>
                                Batal
                            </Button>
                            {showDialog === 'accept' ? (
                                <Button type="button" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAccept(selectedBooking)} disabled={actionLoading}>
                                    <CheckCircle className="w-4 h-4 mr-1" /> Terima
                                </Button>
                            ) : (
                                <Button type="button" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleReject(selectedBooking)} disabled={actionLoading}>
                                    <XCircle className="w-4 h-4 mr-1" /> Tolak
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
