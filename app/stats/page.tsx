"use client"

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Loading from "@/components/ui/loading";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { auth } from "@/lib/auth";
import api from "@/lib/api";
import type { DashboardStats, LoanWithDetails } from "@/lib/types";
import { formatDate, isOverdue, getColorFromName } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
    Area,
    AreaChart,
} from "recharts";
import { Laptop, Cable, Projector, Mouse, Tablet, Printer, Monitor, Keyboard, Speaker, HdmiPort, Plug, Presentation, MicVocal, Package, AlertTriangle, Clock, CheckCircle } from "lucide-react";

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

export default function DashboardPage() {
    const [progress, setProgress] = useState(0);
    const [recentLoans, setRecentLoans] = useState<LoanWithDetails[]>([]); // for table (trimmed)
    const [allLoans, setAllLoans] = useState<LoanWithDetails[]>([]); // for charts (full)
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Welcome overlay state and animation
    const [overlayVisible, setOverlayVisible] = useState(true);
    const [overlayFade, setOverlayFade] = useState(true); // true: fade in, false: fade out
    const fadeDuration = 700; // ms
    const showDuration = 5000; // ms
    const hideDuration = 10000; // ms
    const overlayTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!auth.isAuthenticated()) {
            router.push("/login");
            return;
        }
        loadDashboardData();
    }, [router]);

    useEffect(() => {
        // Overlay animation loop
        function startOverlayLoop() {
            setOverlayVisible(true);
            setOverlayFade(false); // start hidden
            // Fade in after short delay to trigger transition
            overlayTimeout.current = setTimeout(() => {
                setOverlayFade(true); // fade in
                overlayTimeout.current = setTimeout(() => {
                    setOverlayFade(false); // fade out
                    overlayTimeout.current = setTimeout(() => {
                        setOverlayVisible(false);
                        overlayTimeout.current = setTimeout(() => {
                            setOverlayVisible(true);
                            setOverlayFade(false);
                            setTimeout(() => {
                                setOverlayFade(true);
                                startOverlayLoop();
                            }, 10); // fade in after mount
                        }, hideDuration);
                    }, fadeDuration);
                }, showDuration);
            }, 10); // fade in after mount
        }
        startOverlayLoop();
        return () => {
            if (overlayTimeout.current) clearTimeout(overlayTimeout.current);
        };
    }, []);

    // Progress bar and auto-refresh logic
    useEffect(() => {
        let timer: NodeJS.Timeout | null = null;
        let start = Date.now();
        const fetchLoans = async () => {
            try {
                const [loansData, items, borrowers] = await Promise.all([
                    api.getLoans(),
                    api.getItems(),
                    api.getBorrowers(),
                ]);
                const borrowerMap = Object.fromEntries((borrowers || []).map((b) => [b.id?.toString(), b]));
                const itemMap = Object.fromEntries((items || []).map((item) => [item.id?.toString(), item]));
                const mapped: LoanWithDetails[] = (loansData || []).map((loan: any) => {
                    const borrower = loan.borrowerId ? borrowerMap[loan.borrowerId?.toString()] ?? {} : {};
                    let itemDetails: any[] = [];
                    if (Array.isArray(loan.items)) {
                        itemDetails = loan.items.map((item: any) => {
                            const base = itemMap[item.itemId?.toString()] ?? {};
                            return {
                                ...base,
                                quantity: item.quantity ?? 1,
                                serialNumber: item.serialNumber,
                            };
                        });
                    }
                    return {
                        ...loan,
                        borrower,
                        itemDetails,
                    };
                });
                const sortedLoans = [...mapped].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setAllLoans(sortedLoans); // for charts
                setRecentLoans(sortedLoans.slice(0, 8)); // for table
            } catch (err) { }
        };
        const tick = () => {
            const elapsed = Date.now() - start;
            const percent = Math.min((elapsed / 30000) * 100, 100);
            setProgress(percent);
            if (percent >= 100) {
                fetchLoans();
                start = Date.now();
                setProgress(0);
            }
        };
        fetchLoans();
        timer = setInterval(tick, 100);
        return () => {
            if (timer) clearInterval(timer);
        };
    }, []);

    const loadDashboardData = async () => {
        try {
            setIsLoading(true);
            const [loansData, items, borrowers] = await Promise.all([
                api.getLoans(),
                api.getItems(),
                api.getBorrowers(),
            ]);
            const borrowerMap = Object.fromEntries((borrowers || []).map((b) => [b.id?.toString(), b]));
            const itemMap = Object.fromEntries((items || []).map((item) => [item.id?.toString(), item]));
            const mapped: LoanWithDetails[] = (loansData || []).map((loan: any) => {
                const borrower = loan.borrowerId ? borrowerMap[loan.borrowerId?.toString()] ?? {} : {};
                let itemDetails: any[] = [];
                if (Array.isArray(loan.items)) {
                    itemDetails = loan.items.map((item: any) => {
                        const base = itemMap[item.itemId?.toString()] ?? {};
                        return {
                            ...base,
                            quantity: item.quantity ?? 1,
                            serialNumber: item.serialNumber,
                        };
                    });
                }
                return {
                    ...loan,
                    borrower,
                    itemDetails,
                };
            });
            const sortedLoans = [...mapped].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setAllLoans(sortedLoans); // for charts
            setRecentLoans(sortedLoans.slice(0, 5)); // for table
        } catch (err) { } finally {
            setIsLoading(false);
        }
    };

    if (!auth.isAuthenticated()) return null;
    if (isLoading) return <div className="p-6"><Loading /></div>;

    // --- Chart Data Processing ---
    // 1. Bar chart: loans per hour per weekday (use allLoans)
    const weekdayNames = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
    const hourLabels = Array.from({ length: 24 }, (_, i) => i);
    // Build: [{ hour: 0, Senin: 2, Selasa: 1, ... }, ...]
    const loansByHourWeekday: any[] = hourLabels.map((hour) => {
        const row: any = { hour };
        weekdayNames.forEach((wd) => (row[wd] = 0));
        return row;
    });
    allLoans.forEach((loan) => {
        const d = new Date(loan.createdAt);
        const hour = d.getHours();
        const dayIdx = d.getDay();
        // getDay: 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
        if (dayIdx >= 1 && dayIdx <= 5) {
            const wd = weekdayNames[dayIdx - 1];
            const row = loansByHourWeekday.find((r) => r.hour === hour);
            if (row && wd) row[wd]++;
        }
    });

    // 2. Line chart: loans per date (use allLoans)
    // Build: [{ date: '2025-08-01', count: 3 }, ...]
    const loansByDateMap = new Map<string, number>();
    allLoans.forEach((loan) => {
        const d = new Date(loan.createdAt);
        const dateStr = d.toISOString().slice(0, 10);
        loansByDateMap.set(dateStr, (loansByDateMap.get(dateStr) || 0) + 1);
    });
    const loansByDate = Array.from(loansByDateMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, count]) => ({ date, Peminjaman: count }));

    return (
        <div className="flex flex-col min-h-screen bg-gray-900 relative">
            {/* Welcome Overlay */}
            {overlayVisible && (
                <div
                    className={`fixed inset-0 z-50 flex items-center justify-center py-12 transition-opacity duration-700 ${overlayFade ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
                    style={{ background: "rgba(20,20,20,0.85)", fontFamily: 'Inter, sans-serif', minHeight: '100vh' }}
                >
                    <span
                        className="text-5xl md:text-7xl font-black text-center drop-shadow-lg leading-[1.15] pb-4 bg-gradient-to-r from-[#5A86E4] to-[#48B9DF] bg-clip-text text-transparent bg-[length:200%_200%] animate-gradient-move"
                    >
                        Selamat Datang di <span className="italic">MRC&nbsp;</span>
                    </span>
                </div>
            )}
            <div className="flex justify-center mt-5 mb-4">
                <img src="/mrc.png" alt="Logo MRC" style={{ height: 70, objectFit: 'contain' }} />
            </div>
            <div className="flex justify-center items-start flex-1 py-10">
                {/* Responsive layout: portrait (tabel atas, 2 card bawah), landscape (2 kolom) */}
                <div
                    className="w-full max-w-5xl flex flex-col gap-8 md:grid md:grid-cols-2 md:gap-8"
                    style={{ maxWidth: '100rem' }}
                >
                    {/* Table always on top in portrait, left in landscape */}
                    <div className="order-1 md:order-1">
                        <Table className="text-sm bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
                            <TableHeader>
                                <TableRow className="bg-gray-50 dark:bg-gray-800">
                                    <TableHead className="px-3 py-2 text-gray-900 dark:text-gray-100">Peminjam</TableHead>
                                    <TableHead className="px-3 py-2 text-gray-900 dark:text-gray-100">Barang</TableHead>
                                    <TableHead className="px-3 py-2 text-gray-900 dark:text-gray-100">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentLoans.map((loan) => (
                                    <TableRow
                                        key={loan.id}
                                        className={`hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isOverdue(loan.dueDate) && loan.status === "dipinjam"
                                            ? "bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40"
                                            : "bg-white dark:bg-gray-900"
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
                                                    <div className="font-medium text-gray-900 dark:text-gray-100">{loan.borrower?.name}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-3 py-3">
                                            <div className="flex flex-col gap-1">
                                                {loan.itemDetails && loan.itemDetails.length > 0 ? (
                                                    loan.itemDetails.map((item) => (
                                                        <div key={item.id} className="flex items-center space-x-2">
                                                            <div className="w-7 h-7 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                                                {(() => {
                                                                    const Icon = ICON_OPTIONS.find(opt => opt.value === (item.icon || "laptop"))?.icon || Laptop;
                                                                    return <Icon className="w-4 h-4 text-gray-600 dark:text-gray-300" />;
                                                                })()}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-gray-900 dark:text-gray-100">{item.name}</div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                    <span className="font-semibold">{item.quantity}</span>x
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-500 dark:text-gray-400 text-xs">-</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-3 py-3">
                                            {loan.status === "dikembalikan" ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                    Dikembalikan
                                                </span>
                                            ) : isOverdue(loan.dueDate) ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                                                    <AlertTriangle className="w-4 h-4 mr-1" />
                                                    Terlambat
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
                                                    <Clock className="w-4 h-4 mr-1" />
                                                    Dipinjam
                                                </span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    {/* Statistik cards: stacked in portrait, right column in landscape */}
                    <div className="order-2 md:order-2 flex flex-col gap-8">
                        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl transition-all duration-200" style={{ fontFamily: 'inherit' }}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-semibold">Distribusi Jam Peminjaman per Hari</CardTitle>
                                <CardDescription className="text-xs">Jumlah peminjaman pada setiap jam, dipisah per hari</CardDescription>
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
                        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl transition-all duration-200" style={{ fontFamily: 'inherit' }}>
                            <CardHeader className="pb-2">
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
                                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis
                                                dataKey="date"
                                                tickLine={false}
                                                axisLine={false}
                                                tickMargin={8}
                                                tickFormatter={(value) => value.slice(5)}
                                                tick={{ fontFamily: 'inherit', fontSize: 12, fill: 'var(--tw-text-gray-500)' }}
                                            />
                                            <YAxis
                                                allowDecimals={false}
                                                tick={{ fontFamily: 'inherit', fontSize: 12, fill: 'var(--tw-text-gray-500)' }}
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
            </div>
            {/* Portrait orientation: force column layout for 1024x1440 and similar (using Tailwind's [@media (orientation:portrait)] and custom breakpoint) */}
            <style jsx global>{`
                @media (orientation: portrait) and (min-width: 768px) {
                    .max-w-5xl.md\:grid.md\:grid-cols-2 {
                        display: flex !important;
                        flex-direction: column !important;
                    }
                }
            `}</style>
        </div>
    );
}