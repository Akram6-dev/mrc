"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Package, Clock, Calendar, BarChart2 } from "lucide-react"
import api from "@/lib/api"
import type { Item, Loan, LoanItem } from "@/lib/types"
import { formatDate, formatDateTime, getColorFromName } from "@/lib/utils"
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import Loading from "@/components/ui/loading"
import { DatePickerField } from "@/app/peminjaman/DatePickerField"
import { toast } from "sonner"

// Recharts
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts"
import { CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination"

export default function ItemDetailPage() {
    const router = useRouter()
    const [serialQuery, setSerialQuery] = useState("")
    const [searching, setSearching] = useState(false)
    const [item, setItem] = useState<Item | null>(null)
    const [serialInfo, setSerialInfo] = useState<any | null>(null)
    const [loans, setLoans] = useState<Loan[]>([])
    const [filteredLoans, setFilteredLoans] = useState<Loan[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [fromDate, setFromDate] = useState<Date | undefined>(undefined)
    const [toDate, setToDate] = useState<Date | undefined>(undefined)
    const [borrowerMap, setBorrowerMap] = useState<Record<string, string>>({})

    // set default date range on mount: last 60 days -> today
    useEffect(() => {
        const now = new Date()
        const prev = new Date()
        prev.setDate(prev.getDate() - 60)
        setFromDate(prev)
        setToDate(now)
    }, [])

    async function handleSearch(e?: React.FormEvent) {
        if (e) e.preventDefault()
        const q = String(serialQuery || "").trim()
        if (!q) return toast.error("Masukkan serial number terlebih dahulu", { className: 'toast-error' })
        setSearching(true)
        setIsLoading(true)
        try {
            const [items, loans, borrowers] = await Promise.all([api.getItems(), api.getLoans(), api.getBorrowers()])
            const bmap = Object.fromEntries((borrowers || []).map((b: any) => [String(b.id), b.name]))
            setBorrowerMap(bmap)
            // find serial in items
            let foundItem: Item | null = null
            let foundSerial: any = null
            for (const it of items) {
                // check item-level legacy sn/serialNumber first (prefer sn)
                if ((it as any).sn !== undefined && String((it as any).sn).trim() === q) {
                    foundItem = it
                    foundSerial = { sn: (it as any).sn }
                    break
                }
                if ((it as any).serialNumber !== undefined && String((it as any).serialNumber).trim() === q) {
                    foundItem = it
                    foundSerial = { serialNumber: (it as any).serialNumber }
                    break
                }
                if (Array.isArray(it.items)) {
                    const s = it.items.find((x: any) => {
                        if (x.sn !== undefined && String(x.sn).trim() === q) return true
                        if (x.serialNumber !== undefined && String(x.serialNumber).trim() === q) return true
                        return false
                    })
                    if (s) {
                        foundItem = it
                        foundSerial = s
                        break
                    }
                }
            }
            if (!foundItem) {
                toast.error("Serial tidak ditemukan di data barang", { className: 'toast-error' })
                setItem(null)
                setSerialInfo(null)
                setLoans([])
                setFilteredLoans([])
                return
            }
            setItem(foundItem)
            setSerialInfo(foundSerial)

            // build history: loans where loan.items includes this serial
            const itemHasPerSerial = Array.isArray(foundItem.items) && foundItem.items.length > 0
            const history = (loans || []).filter((ln) => {
                if (!Array.isArray(ln.items)) return false
                return ln.items.some((li: any) => {
                    // direct serial match (prefer sn, then serialNumber) - exact trimmed
                    if (li.sn !== undefined && String(li.sn).trim() === q) return true
                    if (li.serialNumber !== undefined && String(li.serialNumber).trim() === q) return true

                    // legacy inline item object: allow if it contains matching serial or matches item id
                    if (li.item) {
                        if (li.item.sn !== undefined && String(li.item.sn).trim() === q) return true
                        if (li.item.serialNumber !== undefined && String(li.item.serialNumber).trim() === q) return true
                        if (!itemHasPerSerial && String(li.item.id) === String(foundItem.id)) return true
                    }

                    // itemId references (string or object): only consider when the item has NO per-serial entries
                    if (!itemHasPerSerial && li.itemId) {
                        if (String(li.itemId) === String(foundItem.id)) return true
                        if (li.itemId.id && String(li.itemId.id) === String(foundItem.id)) return true
                    }

                    return false
                })
            })
            // sort by borrowDate desc
            history.sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime())
            setLoans(history)
            // filteredLoans will be derived by the date filter effect; set initial filter now
            // apply current from/to if present
            if (!fromDate && !toDate) {
                setFilteredLoans(history)
            } else {
                const from = fromDate ? new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()).getTime() : -Infinity
                const to = toDate ? new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59, 999).getTime() : Infinity
                setFilteredLoans(history.filter((ln) => {
                    const t = new Date(ln.borrowDate).getTime()
                    return t >= from && t <= to
                }))
            }
        } catch (err) {
            console.error(err)
            toast.error("Gagal memuat data")
        } finally {
            setSearching(false)
            setIsLoading(false)
        }
    }

    useEffect(() => {
        // apply date filter without mutating the Date objects stored in state
        if (!loans || loans.length === 0) {
            setFilteredLoans([])
            return
        }
        if (!fromDate && !toDate) {
            setFilteredLoans(loans)
            return
        }
        const from = fromDate ? new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()).getTime() : -Infinity
        const to = toDate ? new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59, 999).getTime() : Infinity
        setFilteredLoans(loans.filter((ln) => {
            const t = new Date(ln.borrowDate).getTime()
            return t >= from && t <= to
        }))
    }, [fromDate, toDate, loans])

    // metrics: total times borrowed, total duration (days) accumulated, per-loan durations
    const metrics = useMemo(() => {
        if (!filteredLoans) return { count: 0, totalDays: 0, perLoan: [] as any[] }
        const perLoan = filteredLoans.map((ln) => {
            const borrow = new Date(ln.borrowDate)
            const ret = ln.returnDate ? new Date(ln.returnDate) : new Date()
            const days = Math.max(1, Math.ceil((ret.getTime() - borrow.getTime()) / (1000 * 60 * 60 * 24)))
            return { id: ln.id, borrowerId: ln.borrowerId, borrowDate: ln.borrowDate, returnDate: ln.returnDate, days }
        })
        const totalDays = perLoan.reduce((s, p) => s + p.days, 0)
        return { count: perLoan.length, totalDays, perLoan }
    }, [filteredLoans])

    // loans per date for AreaChart
    const loansByDate = useMemo(() => {
        const map = new Map<string, number>()
        for (const ln of filteredLoans) {
            const d = new Date(ln.borrowDate)
            if (isNaN(d.getTime())) continue
            const dateOnly = d.toISOString().slice(0, 10)
            map.set(dateOnly, (map.get(dateOnly) || 0) + 1)
        }
        return Array.from(map.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, count]) => ({ date, Peminjaman: count }))
    }, [filteredLoans])

    const serialDisplay = (() => {
        if (!item) return '-'
        const s = serialInfo?.sn ?? serialInfo?.serialNumber
        if (s) return s
        const legacySn = (item as any).sn ?? (item as any).serialNumber
        if (legacySn) return legacySn
        if (Array.isArray(item.items) && item.items.length) {
            return item.items.map((it: any) => it.sn ?? it.serialNumber ?? '').filter(Boolean).join(', ')
        }
        return '-'
    })()

    // Pagination for history table
    const [page, setPage] = useState(1)
    const [perPage, setPerPage] = useState(10)
    const totalPages = Math.max(1, Math.ceil((filteredLoans || []).length / perPage))
    useEffect(() => {
        if (page > totalPages) setPage(1)
    }, [totalPages])
    const pagedLoans = useMemo(() => {
        const start = (page - 1) * perPage
        return (filteredLoans || []).slice(start, start + perPage)
    }, [filteredLoans, page, perPage])

    if (!api) return null

    return (
        <div className="min-h-screen gradient-bg">
            <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center gap-4">
                    <h1 className="text-2xl font-bold">Detail Barang (Serial)</h1>
                    <div className="flex-1" />
                    <div className="w-120">
                        <form onSubmit={handleSearch} className="flex items-center gap-2">
                            <Input
                                placeholder="Masukkan serial number"
                                value={serialQuery}
                                onChange={(e) => setSerialQuery(e.target.value)}
                                className="input-field"
                            />
                            <Button type="submit" className="btn-outline">
                                <Search className="w-4 h-4 mr-2" /> Cari
                            </Button>
                        </form>
                    </div>
                </div>

                {isLoading ? (
                    <Loading />
                ) : item ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            {/* Item summary */}
                            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl h-full flex flex-row md:flex-col items-center md:items-stretch">
                                <CardHeader className="flex flex-row items-center gap-3 w-1/2 md:w-full justify-start md:pb-4">
                                    <div className="w-12 h-12 rounded-lg bg-accent-100 dark:bg-accent-900 flex items-center justify-center overflow-hidden flex-shrink-0 min-w-0">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                                        ) : (
                                            <Package className="w-5 h-5 text-accent-600" />
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <CardTitle className="text-sm font-medium truncate">Barang</CardTitle>
                                        <CardDescription className="text-xs text-muted-foreground truncate">{item.category || '-'}</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="w-1/2 md:w-full flex items-center md:items-start justify-center py-0 md:pb-2">
                                    <div className="w-full text-right">
                                        <div className="text-lg font-semibold">{item.name}</div>
                                        <div className="text-xs text-muted-foreground mt-1">Serial: {serialDisplay}</div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Total times borrowed */}
                            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl h-full flex flex-row md:flex-col items-center md:items-stretch">
                                <CardHeader className="flex flex-row items-center gap-3 w-1/2 md:w-full justify-start md:pb-4">
                                    <div className="w-12 h-12 rounded-lg bg-sky-100 dark:bg-sky-900 flex items-center justify-center overflow-hidden flex-shrink-0 min-w-0">
                                        <BarChart2 className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                                    </div>
                                    <div className="text-left min-w-0">
                                        <CardTitle className="text-sm font-medium">Total Peminjaman</CardTitle>
                                        <CardDescription className="text-xs text-muted-foreground">Jumlah kali serial ini dipinjam</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="w-1/2 md:w-full flex items-center md:items-start justify-center py-0 md:pb-4">
                                    <div className="w-full text-right">
                                        <div className="text-2xl font-bold">{metrics.count}</div>
                                        <div className="text-xs text-muted-foreground mt-1">Rata-rata durasi: {metrics.count ? Math.round(metrics.totalDays / metrics.count) : 0} hari</div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Total accumulated days */}
                            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl h-full flex flex-row md:flex-col items-center md:items-stretch">
                                <CardHeader className="flex flex-row items-center gap-3 w-1/2 md:w-full justify-start md:pb-4">
                                    <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center overflow-hidden flex-shrink-0 min-w-0">
                                        <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div className="text-left min-w-0">
                                        <CardTitle className="text-sm font-medium">Total Durasi</CardTitle>
                                        <CardDescription className="text-xs text-muted-foreground">Akumulasi hari peminjaman</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="w-1/2 md:w-full flex items-center md:items-start justify-center py-0 md:pb-4">
                                    <div className="w-full text-right">
                                        <div className="text-2xl font-bold">{metrics.totalDays}</div>
                                        <div className="text-xs text-muted-foreground mt-1">Status saat ini: {serialInfo ? (serialInfo.status === 1 ? 'Tersedia' : serialInfo.status === 2 ? 'Dibooking' : 'Dipinjam') : '-'}</div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Last borrowed */}
                            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl h-full flex flex-row md:flex-col items-center md:items-stretch">
                                <CardHeader className="flex flex-row items-center gap-3 w-1/2 md:w-full justify-start md:pb-4">
                                    <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center overflow-hidden flex-shrink-0 min-w-0">
                                        <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <CardTitle className="text-sm font-medium">Terakhir Dipinjam</CardTitle>
                                        <CardDescription className="text-xs text-muted-foreground">Informasi peminjaman terakhir</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="w-1/2 md:w-full flex items-center md:items-start justify-center py-0 md:pb-4">
                                    <div className="w-full text-right">
                                        {filteredLoans && filteredLoans.length > 0 ? (
                                            <>
                                                <div className="text-sm font-semibold">{formatDateTime(filteredLoans[0].borrowDate)}</div>
                                                <div className="text-xs text-muted-foreground mt-1 truncate">Oleh: {borrowerMap[String(filteredLoans[0].borrowerId)] || filteredLoans[0].borrowerId}</div>
                                            </>
                                        ) : (
                                            <div className="text-sm text-muted-foreground">-</div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Filters for date range */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <Card className="col-span-1 md:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Dari</Label>
                                        <DatePickerField value={fromDate} onChange={setFromDate} placeholder="Mulai" />
                                    </div>
                                    <div>
                                        <Label>Sampai</Label>
                                        <DatePickerField value={toDate} onChange={setToDate} placeholder="Sampai" />
                                    </div>
                                </div>
                            </Card>
                            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-4 flex items-center justify-center">
                                <div className="grid grid-cols-2 gap-2 w-full">
                                    <Button onClick={() => {
                                        const now = new Date()
                                        const prev = new Date()
                                        prev.setDate(prev.getDate() - 30)
                                        setFromDate(prev)
                                        setToDate(now)
                                    }} className="btn-outline w-full">1 bulan terakhir</Button>
                                    <Button onClick={() => {
                                        const now = new Date()
                                        const prev = new Date()
                                        prev.setDate(prev.getDate() - 60)
                                        setFromDate(prev)
                                        setToDate(now)
                                    }} className="btn-outline w-full">60 hari terakhir</Button>
                                </div>
                            </Card>
                        </div>

                        {/* Line Chart: Jumlah Peminjaman per Tanggal (AreaChart style) */}
                        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl" style={{ fontFamily: 'inherit' }}>
                            <CardHeader className="pb-1 pt-3">
                                <CardTitle className="text-base font-semibold">Jumlah Peminjaman per Tanggal</CardTitle>
                                <CardDescription className="text-xs">Setiap peminjaman dihitung 1</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="w-full h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={loansByDate} margin={{ left: 12, right: 12 }}>
                                            <defs>
                                                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.4} />
                                                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                                            <XAxis
                                                dataKey="date"
                                                tickLine={false}
                                                axisLine={false}
                                                tickMargin={8}
                                                tickFormatter={(value) => value.slice(5)}
                                                className="text-gray-500 dark:text-gray-400"
                                                tick={{
                                                    fontFamily: 'inherit',
                                                    fontSize: 12,
                                                    fill: 'currentColor',
                                                }}
                                            />
                                            <YAxis
                                                allowDecimals={false}
                                                className="text-gray-500 dark:text-gray-400"
                                                tick={{
                                                    fontFamily: 'inherit',
                                                    fontSize: 12,
                                                    fill: 'currentColor',
                                                }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                cursor={false}
                                                content={({ active, payload, label }: any) => {
                                                    if (!active || !payload || !payload.length) return null;
                                                    return (
                                                        <div className="rounded-lg bg-white dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 px-3 py-2 text-xs shadow-lg">
                                                            <div className="font-semibold text-blue-600 dark:text-blue-400">{label}</div>
                                                            <div className="mt-1">Jumlah: <span className="font-bold">{payload[0].value}</span></div>
                                                        </div>
                                                    );
                                                }}
                                            />
                                            <Area
                                                dataKey="Peminjaman"
                                                type="natural"
                                                fill="url(#blueGradient)"
                                                fillOpacity={1}
                                                stroke="#2563eb"
                                                strokeWidth={2}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <div className="flex w-full items-start gap-2 text-sm">
                                    <div className="grid gap-2">
                                        <div className="flex items-center gap-2 leading-none font-medium">
                                            {(() => {
                                                if (loansByDate.length < 2) return null;
                                                const last = loansByDate[loansByDate.length - 1];
                                                const prev = loansByDate[loansByDate.length - 2];
                                                const lastCount = typeof last.Peminjaman === "number" ? last.Peminjaman : 0;
                                                const prevCount = typeof prev.Peminjaman === "number" ? prev.Peminjaman : 0;
                                                const percent = prevCount === 0 ? 100 : ((lastCount - prevCount) / prevCount) * 100;
                                                const naik = percent >= 0;
                                                return (
                                                    <>
                                                        {naik ? "Naik" : "Turun"} {Math.abs(percent).toFixed(1)}% dibanding kemarin
                                                        <svg className={`h-4 w-4 ${naik ? "text-green-500" : "text-red-500"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                            <path d={naik ? "M21 7l-6 6-4-4-8 8" : "M3 7l6 6 4-4 8 8"} />
                                                        </svg>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                        <div className="text-muted-foreground flex items-center gap-2 leading-none">
                                            {loansByDate.length > 1 ? (
                                                <>
                                                    Kemarin ({loansByDate[loansByDate.length - 2].Peminjaman})
                                                    {loansByDate[loansByDate.length - 1].Peminjaman > loansByDate[loansByDate.length - 2].Peminjaman
                                                        ? " < "
                                                        : loansByDate[loansByDate.length - 1].Peminjaman < loansByDate[loansByDate.length - 2].Peminjaman
                                                            ? " > "
                                                            : " = "}
                                                    ({loansByDate[loansByDate.length - 1].Peminjaman}) Hari ini
                                                </>
                                            ) : ""}
                                        </div>
                                    </div>
                                </div>
                            </CardFooter>
                        </Card>

                        {/* History table */}
                        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl mt-6">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Riwayat Peminjaman</CardTitle>
                                <CardDescription className="text-xs">Serial: {serialQuery}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {filteredLoans.length === 0 ? (
                                    <div className="text-sm text-gray-500">Tidak ada riwayat pada rentang tanggal ini.</div>
                                ) : (
                                    <>
                                        <div className="card overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Peminjam</TableHead>
                                                        <TableHead>Tanggal Pinjam</TableHead>
                                                        <TableHead>Tanggal Kembali</TableHead>
                                                        <TableHead>Durasi</TableHead>
                                                        <TableHead>Catatan</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {pagedLoans.map((ln) => {
                                                        const borrow = new Date(ln.borrowDate)
                                                        const ret = ln.returnDate ? new Date(ln.returnDate) : undefined
                                                        const durationMs = (ret ? ret.getTime() : Date.now()) - borrow.getTime()
                                                        const totalMinutes = Math.max(1, Math.ceil(durationMs / (1000 * 60)))
                                                        const hours = Math.floor(totalMinutes / 60)
                                                        const minutes = totalMinutes % 60
                                                        const duration = `${hours} jam ${minutes} menit`
                                                        const idx = filteredLoans.indexOf(ln)
                                                        return (
                                                            <TableRow
                                                                key={ln.id}
                                                                className={idx % 2 === 1 ? "bg-gray-50 dark:bg-gray-800/40" : ""}>
                                                                <TableCell className="font-medium">
                                                                    <div className="flex items-center gap-2">
                                                                        <div
                                                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${getColorFromName(
                                                                                borrowerMap[String(ln.borrowerId)] || ln.borrowerId
                                                                            )}`}
                                                                        >
                                                                            {(() => {
                                                                                const n = String(borrowerMap[String(ln.borrowerId)] || ln.borrowerId).trim();
                                                                                return n.slice(0, 1).toUpperCase();
                                                                            })()}
                                                                        </div>
                                                                        <div>{borrowerMap[String(ln.borrowerId)] || ln.borrowerId}</div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>{formatDateTime(ln.borrowDate)}</TableCell>
                                                                <TableCell>{ln.returnDate ? formatDateTime(ln.returnDate) : '-'}</TableCell>
                                                                <TableCell>{duration}</TableCell>
                                                                <TableCell>{ln.notes || '-'}</TableCell>
                                                            </TableRow>
                                                        )
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        {/* Pagination controls */}
                                        <div className="mt-3 flex items-center justify-between">
                                            <div className="text-sm text-muted-foreground">Menampilkan {Math.min((page - 1) * perPage + 1, filteredLoans.length)} - {Math.min(page * perPage, filteredLoans.length)} dari {filteredLoans.length} riwayat</div>
                                            <div>
                                                <Pagination>
                                                    <PaginationContent>
                                                        <PaginationItem>
                                                            <PaginationPrevious onClick={() => setPage(Math.max(1, page - 1))} />
                                                        </PaginationItem>
                                                        {/* simple numeric pages: show up to 5 pages centered */}
                                                        {(() => {
                                                            const pages = [] as number[]
                                                            const start = Math.max(1, page - 2)
                                                            const end = Math.min(totalPages, page + 2)
                                                            for (let i = start; i <= end; i++) pages.push(i)
                                                            if (start > 1) {
                                                                pages.unshift(1)
                                                                if (start > 2) pages.splice(1, 0, -1) // ellipsis marker
                                                            }
                                                            if (end < totalPages) {
                                                                pages.push(-1)
                                                                pages.push(totalPages)
                                                            }
                                                            return pages.map((p, idx) => p === -1 ? (
                                                                <PaginationItem key={`e-${idx}`}><PaginationEllipsis /></PaginationItem>
                                                            ) : (
                                                                <PaginationItem key={p}><PaginationLink isActive={page === p} onClick={() => setPage(p)}>{p}</PaginationLink></PaginationItem>
                                                            ))
                                                        })()}
                                                        <PaginationItem>
                                                            <PaginationNext onClick={() => setPage(Math.min(totalPages, page + 1))} />
                                                        </PaginationItem>
                                                    </PaginationContent>
                                                </Pagination>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <div className="card p-6 text-center">
                        <div className="text-sm text-gray-500">Masukkan serial number untuk melihat detail</div>
                    </div>
                )}
            </div>
        </div>
    )
}
