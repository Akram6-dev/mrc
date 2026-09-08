"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Laptop, Cable, Projector, Mouse, Tablet, Printer, Monitor, Keyboard, Speaker, HdmiPort, Plug, Presentation, MicVocal } from "lucide-react"

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
import { Package, Users, FileText, AlertTriangle, Clock, CheckCircle } from "lucide-react"
import Loading from "@/components/ui/loading"
import Alert from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { auth } from "@/lib/auth"
import api from "@/lib/api"
import type { DashboardStats, LoanWithDetails, ItemSerialDetail } from "@/lib/types"
import { formatDate, isOverdue, getColorFromName } from "@/lib/utils"
import { ChartContainer } from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts"

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentLoans, setRecentLoans] = useState<LoanWithDetails[]>([])
  const [allLoans, setAllLoans] = useState<LoanWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()

  const [activeBorrowers, setActiveBorrowers] = useState(0)
  const [selectedYear, setSelectedYear] = useState<number | "all">("all")
  const [selectedMonth, setSelectedMonth] = useState<number | "all">("all")
  const [hourlyWeek, setHourlyWeek] = useState<number | "all">("all")

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push("/login")
      return
    }

    loadDashboardData()
  }, [router])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      // Fetch dashboard stats, loans, items, borrowers (like riwayat)
      const [statsData, loansData, items, borrowers] = await Promise.all([
        api.getDashboardStats(),
        api.getLoans(),
        api.getItems(),
        api.getBorrowers(),
      ])

      setStats(statsData)

      // Index borrowers and items by id for fast lookup
      const borrowerMap = Object.fromEntries(
        (borrowers || []).map((b) => [b.id?.toString(), b])
      )
      const itemMap = Object.fromEntries(
        (items || []).map((item) => [item.id?.toString(), item])
      )

      // Gabungkan semua data ke satu array
      const mapped: LoanWithDetails[] = (loansData || []).map((loan: any) => {
              const borrower = loan.borrowerId ? borrowerMap[loan.borrowerId?.toString()] ?? {} : {};
      
              let itemDetails: ItemSerialDetail[] = [];
              if (Array.isArray(loan.items)) {
                itemDetails = loan.items.map((loanItem: any) => {
                  let foundBase: any = undefined;
                  let foundSerial: any = undefined;
                  for (const itemUnknown of Object.values(itemMap)) {
                    const item = itemUnknown as any;
                    if (item.items && Array.isArray(item.items)) {
                      const serial = item.items.find((s: any) => s.rfidCode === loanItem.rfidCode);
                      if (serial) {
                        foundBase = item;
                        foundSerial = serial;
                        break;
                      }
                    }
                  }
                  if (!foundBase || !foundSerial) return undefined;
                  // Make sure all required fields for ItemSerialDetail are present
                  return {
                    id: foundBase.id,
                    name: foundBase.name,
                    icon: foundBase.icon,
                    rfidCode: foundSerial.rfidCode,
                    status: foundSerial.loanId !== loan.id ? 1 : foundSerial.status,
                    loanId: foundSerial.loanId ?? "",
                    condition: foundSerial.condition,
                    note: loanItem.note,
                    quantity: 1,
                  } satisfies ItemSerialDetail;
                }).filter(Boolean) as ItemSerialDetail[];
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

      // Calculate active borrowers
      const unique = new Set<string>()
      mapped.forEach((loan) => {
        if (loan.status === "dipinjam" && loan.borrower?.id) {
          unique.add(loan.borrower.id.toString())
        }
      })
      setActiveBorrowers(unique.size)

      // Sort by createdAt descending (newest first)
      const sortedLoans = [...mapped].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setRecentLoans(sortedLoans.slice(0, 5))
      setAllLoans(sortedLoans)
    } catch (err) {
      setError("Gagal memuat data dashboard")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!auth.isAuthenticated()) {
    return null
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <Loading />
      </div>
    )
  }

  const statCards = [
    {
      title: "Total Barang",
      value: stats?.totalItems || 0,
      icon: Package,
      gradient: "from-blue-500 to-blue-600",
      iconBg: "bg-blue-600/30",
      iconColor: "text-blue-200",
      textColor: "text-blue-100",
      href: "/barang",
    },
    {
      title: "Peminjam Aktif",
      value: activeBorrowers, // gunakan hasil hitung manual, bukan dari stats
      icon: Users,
      gradient: "from-green-500 to-green-600",
      iconBg: "bg-green-600/30",
      iconColor: "text-green-200",
      textColor: "text-green-100",
      href: "/pengembalian",
    },
    {
      title: "Sedang Dipinjam",
      value: stats?.activeLoan || 0,
      icon: Clock,
      gradient: "from-yellow-500 to-yellow-600",
      iconBg: "bg-yellow-600/30",
      iconColor: "text-yellow-200",
      textColor: "text-yellow-100",
      href: "/pengembalian",
    },
    {
      title: "Terlambat",
      value: stats?.overdueLoan || 0,
      icon: AlertTriangle,
      gradient: "from-red-500 to-red-600",
      iconBg: "bg-red-600/30",
      iconColor: "text-red-200",
      textColor: "text-red-100",
      href: "/pengembalian",
    },
  ]

  // --- Chart Data Processing ---
  const getLoanDate = (loan: LoanWithDetails) => new Date(loan.createdAt || loan.borrowDate)
  const validLoanDates = allLoans.map(getLoanDate).filter((date) => !Number.isNaN(date.getTime()))
  const availableYears = Array.from(new Set(validLoanDates.map((date) => date.getFullYear()))).sort((a, b) => b - a)
  const filteredChartLoans = allLoans.filter((loan) => {
    const date = getLoanDate(loan)
    return !Number.isNaN(date.getTime()) &&
      (selectedYear === "all" || date.getFullYear() === selectedYear) &&
      (selectedMonth === "all" || date.getMonth() === selectedMonth)
  })

  // 1. Bar chart: loans per hour per weekday
  const weekdayNames = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"]
  const hourLabels = Array.from({ length: 24 }, (_, i) => i)
  // Build: [{ hour: 0, Senin: 2, Selasa: 1, ... }, ...]
  const loansByHourWeekday: any[] = hourLabels.map((hour) => {
    const row: any = { hour }
    weekdayNames.forEach((wd) => (row[wd] = 0))
    return row
  })
  const latestChartDate = validLoanDates.sort((a, b) => b.getTime() - a.getTime())[0] || new Date()
  const chartYear = selectedYear === "all" ? latestChartDate.getFullYear() : selectedYear
  const chartMonth = selectedMonth === "all" ? latestChartDate.getMonth() : selectedMonth
  const monthStart = new Date(chartYear, chartMonth, 1)
  const monthEnd = new Date(chartYear, chartMonth + 1, 0, 23, 59, 59, 999)
  let hourRangeStart = monthStart
  let hourRangeEnd = monthEnd
  if (hourlyWeek !== "all") {
    hourRangeStart = new Date(monthStart)
    const day = hourRangeStart.getDay()
    hourRangeStart.setDate(hourRangeStart.getDate() - (day === 0 ? 6 : day - 1) + (hourlyWeek - 1) * 7)
    hourRangeStart.setHours(0, 0, 0, 0)
    hourRangeEnd = new Date(hourRangeStart)
    hourRangeEnd.setDate(hourRangeEnd.getDate() + 6)
    hourRangeEnd.setHours(23, 59, 59, 999)
  }
  allLoans.forEach((loan) => {
    const d = getLoanDate(loan)
    if (d < hourRangeStart || d > hourRangeEnd) return
    const hour = d.getHours()
    const dayIdx = d.getDay()
    // getDay: 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
    if (dayIdx >= 1 && dayIdx <= 5) {
      const wd = weekdayNames[dayIdx - 1]
      const row = loansByHourWeekday.find((r) => r.hour === hour)
      if (row && wd) row[wd]++
    }
  })

  // 2. Line chart: loans per date
  // Build: [{ date: '2025-08-01', count: 3 }, ...]
  const loansByDateMap = new Map<string, number>()
  filteredChartLoans.forEach((loan) => {
    const d = getLoanDate(loan)
    const dateStr = d.toISOString().slice(0, 10)
    loansByDateMap.set(dateStr, (loansByDateMap.get(dateStr) || 0) + 1)
  })
  const loansByDate = Array.from(loansByDateMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, Peminjaman: count }))

  return (
    <div className="p-4 lg:p-6 max-h-screen overflow-y-auto animate-fade-in duration-200">
      <Card className="mb-6 p-0 bg-transparent border-none shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</CardTitle>
          <CardDescription className="text-sm text-gray-600 dark:text-gray-400">Ringkasan aktivitas peminjaman barang sekolah</CardDescription>
        </CardHeader>
        {error && (
          <CardContent className="p-0 pt-2"><Alert type="error">{error}</Alert></CardContent>
        )}
      </Card>

      {/* Stats Cards - 2 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <button
              key={stat.title}
              type="button"
              onClick={() => router.push(stat.href)}
              className={`group bg-gradient-to-r ${stat.gradient} text-white border-0 shadow-md rounded-lg focus:outline-none transition-transform hover:scale-[1.01]`}
              style={{ cursor: 'pointer' }}
            >
              <CardContent className="flex items-center justify-between py-5">
                <div className="text-left">
                  <div className={`${stat.textColor} text-xs font-medium`}>{stat.title}</div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                </div>
                <div className={`rounded-full ${stat.iconBg} p-2`}>
                  <Icon className={`w-7 h-7 ${stat.iconColor}`} />
                </div>
              </CardContent>
            </button>
          )
        })}
      </div>
      {/* Recent Loans Card - styled like Pengembalian */}
      <Card className="card overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Peminjaman Terbaru</CardTitle>
            <CardDescription className="text-xs text-gray-500 dark:text-gray-400">5 data terakhir</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {recentLoans.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada data peminjaman</p>
            </div>
          ) : (
            <Table className="text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead className="px-3 py-2">Peminjam</TableHead>
                  <TableHead className="px-3 py-2">Barang</TableHead>
                  <TableHead className="px-3 py-2">Jatuh Tempo</TableHead>
                  <TableHead className="px-3 py-2">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLoans.map((loan) => (
                  <TableRow
                    key={loan.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${isOverdue(loan.dueDate) && loan.status === "dipinjam"
                      ? "bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-800/20"
                      : ""
                      } cursor-pointer`}
                  >
                    <TableCell className="px-3 py-3">
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getColorFromName(loan.borrower?.name)}`}>
                          <span className="text-white text-base font-semibold">
                            {loan.borrower?.name?.charAt(0) || "U"}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{loan.borrower?.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <div className="flex flex-col gap-1">
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
                    <TableCell className="px-3 py-3 font-medium">
                      <div className={isOverdue(loan.dueDate) && loan.status === "dipinjam" ? "text-red-600 dark:text-red-400" : ""}>
                        {formatDate(loan.dueDate)}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      {loan.status === "dikembalikan" ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Dikembalikan
                        </span>
                      ) : isOverdue(loan.dueDate) ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Terlambat
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                          <Clock className="w-4 h-4 mr-1" />
                          Dipinjam
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {/* Statistik Peminjaman Charts - bawah list, 2 kolom */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl transition-all duration-200" style={{ fontFamily: 'inherit' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Distribusi Jam Peminjaman per Hari</CardTitle>
            <CardDescription className="text-xs">Jumlah peminjaman pada setiap jam, dipisah per hari</CardDescription>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value === "all" ? "all" : Number(event.target.value))} className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs dark:border-gray-700 dark:bg-gray-800">
                <option value="all">Semua Bulan</option>
                {Array.from({ length: 12 }, (_, month) => <option key={month} value={month}>{new Date(2000, month, 1).toLocaleString("id-ID", { month: "long" })}</option>)}
              </select>
              <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value === "all" ? "all" : Number(event.target.value))} className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs dark:border-gray-700 dark:bg-gray-800">
                <option value="all">Semua Tahun</option>
                {availableYears.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
              <select value={hourlyWeek} onChange={(event) => setHourlyWeek(event.target.value === "all" ? "all" : Number(event.target.value))} className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs dark:border-gray-700 dark:bg-gray-800">
                <option value="all">Semua Minggu</option>
                {Array.from({ length: 5 }, (_, index) => <option key={index + 1} value={index + 1}>Minggu {index + 1}</option>)}
              </select>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={loansByHourWeekday} margin={{ top: 8, right: 16, left: 0, bottom: 0 }} barCategoryGap={2}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis
                    dataKey="hour"
                    tickFormatter={(h) => `${h}:00`}
                    className="text-gray-500 dark:text-gray-400"
                    tick={{ fontFamily: 'inherit', fontSize: 12, fill: 'currentColor' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    className="text-gray-500 dark:text-gray-400"
                    tick={{ fontFamily: 'inherit', fontSize: 12, fill: 'currentColor' }}
                  />
                  <Tooltip
                    wrapperClassName="z-50"
                    contentStyle={{ borderRadius: 12, border: '1px solid', fontFamily: 'inherit', fontSize: 13, boxShadow: '0 2px 8px #0001', padding: 10 }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      return (
                        <div className="rounded-lg bg-white dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 px-3 py-2 text-xs shadow-lg">
                          <div className="font-semibold text-blue-600 dark:text-blue-400">{label}:00</div>
                          {payload.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 mt-1">
                              <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                              <span>{item.name}: <span className="font-bold">{item.value}</span></span>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Legend wrapperStyle={{ fontFamily: 'inherit', fontSize: 13, paddingBottom: 0 }} iconType="circle" />
                  {weekdayNames.map((wd, i) => (
                    <Bar
                      key={wd}
                      dataKey={wd}
                      stackId="a"
                      fill={[
                        "#2563eb", // Senin - blue
                        "#22c55e", // Selasa - green
                        "#eab308", // Rabu - yellow
                        "#f97316", // Kamis - orange
                        "#ef4444", // Jumat - red
                      ][i] || "#64748b"}
                      radius={i === weekdayNames.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        {/* Line Chart: Jumlah Peminjaman per Tanggal */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl transition-all duration-200" style={{ fontFamily: 'inherit' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Jumlah Peminjaman per Tanggal</CardTitle>
            <CardDescription className="text-xs">Setiap peminjaman dihitung 1</CardDescription>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value === "all" ? "all" : Number(event.target.value))} className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs dark:border-gray-700 dark:bg-gray-800">
                <option value="all">Semua Bulan</option>
                {Array.from({ length: 12 }, (_, month) => <option key={month} value={month}>{new Date(2000, month, 1).toLocaleString("id-ID", { month: "long" })}</option>)}
              </select>
              <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value === "all" ? "all" : Number(event.target.value))} className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs dark:border-gray-700 dark:bg-gray-800">
                <option value="all">Semua Tahun</option>
                {availableYears.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
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
                  {/* Custom Tooltip */}
                  <Tooltip
                    cursor={false}
                    content={({ active, payload, label }) => {
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
                  {/* Hitung tren peminjaman per hari */}
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
      </div>
    </div>
  )
}
