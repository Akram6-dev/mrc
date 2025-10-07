"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import {
    Laptop,
    Cable,
    Projector,
    Mouse,
    Tablet,
    Printer,
    Monitor,
    Keyboard,
    Speaker,
    HdmiPort,
    Plug,
    Presentation,
    MicVocal,
    Package,
} from "lucide-react";
// Icon options mapping, same as barang/page.tsx
const ICON_OPTIONS = [
    { label: "Laptop", value: "laptop", icon: Laptop },
    { label: "Cable", value: "cable", icon: Cable },
    { label: "Projector", value: "projector", icon: Projector },
    { label: "HDMI", value: "hdmi", icon: HdmiPort },
    { label: "Plug", value: "plug", icon: Plug },
    { label: "Mouse", value: "mouse", icon: Mouse },
    { label: "Tablet", value: "tablet", icon: Tablet },
    { label: "Printer", value: "printer", icon: Printer },
    { label: "Monitor", value: "monitor", icon: Monitor },
    { label: "Keyboard", value: "keyboard", icon: Keyboard },
    { label: "Speaker", value: "speaker", icon: Speaker },
    { label: "Presentation", value: "presentation", icon: Presentation },
    { label: "Mic", value: "mic", icon: MicVocal },
    { label: "Lainnya", value: "other", icon: Package },
];

import { PieChart, Pie, Cell, LabelList } from "recharts";
import { TrendingUp } from "lucide-react";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { useMemo } from "react";



export default function AnalisisCharts({
    statCards,
    topBorrowers,
    topReturners,
    topLateReturners,
    topItems,
    loansByHourWeekday,
    loansByDate,
    allLoans
}: any) {
    // Only weekdays
    const weekdayNames = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

    // --- Pie Chart: Hari Paling Sering Ada Peminjaman ---
    // loansByDate: [{date, Peminjaman}]
    // loansByHourWeekday: [{hour, Senin, Selasa, ...}]
    // But we need to count by weekday from all loans
    // Pie chart: only weekdays (Senin=1, ..., Jumat=5)
    const pieData = useMemo(() => {
        const counts = Array(5).fill(0); // 0: Senin, 1: Selasa, ...
        loansByDate.forEach((row: any) => {
            const d = new Date(row.date);
            if (!isNaN(d.getTime())) {
                const day = d.getDay();
                // JS: 0=Sunday, 1=Monday, ..., 6=Saturday
                if (day >= 1 && day <= 5) {
                    counts[day - 1] += row.Peminjaman;
                }
            }
        });
        return weekdayNames.map((name, idx) => ({ name, value: counts[idx] }));
    }, [loansByDate]);

    // --- Infografis: Rata-rata Durasi Peminjaman, Rata-rata Peminjaman per Hari, dst ---
    // We need all loans (not just aggregated)
    // We'll estimate duration as (returnDate - loanDate) in days
    const avgStats = useMemo(() => {
        let totalDuration = 0, countDuration = 0;
        let totalLoans = 0;
        let minDate = null, maxDate = null;
        let totalReturned = 0;
        let durations: number[] = [];
        let onTime = 0, late = 0;
        let totalItems = 0, countItems = 0;
        if (Array.isArray(loansByDate) && loansByDate.length > 0) {
            minDate = new Date(loansByDate[0].date);
            maxDate = new Date(loansByDate[loansByDate.length - 1].date);
            totalLoans = loansByDate.reduce((sum, row) => sum + (row.Peminjaman || 0), 0);
        }
        if (Array.isArray(allLoans) && allLoans.length > 0) {
            allLoans.forEach((l: any) => {
                // Durasi
                if (l.loanDate && l.returnDate) {
                    const start = new Date(l.loanDate);
                    const end = new Date(l.returnDate);
                    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end.getTime() >= start.getTime()) {
                        const dur = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
                        totalDuration += dur;
                        durations.push(dur);
                        countDuration++;
                    }
                }
                // Pengembalian
                if (l.returnDate) {
                    totalReturned++;
                    if (l.dueDate) {
                        const due = new Date(l.dueDate);
                        const ret = new Date(l.returnDate);
                        if (!isNaN(due.getTime()) && !isNaN(ret.getTime())) {
                            if (ret.getTime() <= due.getTime()) onTime++;
                            else late++;
                        }
                    }
                }
                // Rata-rata jumlah barang per transaksi
                if (Array.isArray(l.items)) {
                    let qty = 0;
                    l.items.forEach((itemObj: any) => {
                        if (typeof itemObj === 'string') qty += 1;
                        else if (itemObj && itemObj.quantity) qty += itemObj.quantity;
                        else qty += 1;
                    });
                    totalItems += qty;
                    countItems++;
                }
            });
        }
        // Fallback: estimate avg per day
        let avgPerDay = 0;
        let days = 0;
        if (minDate && maxDate && minDate < maxDate) {
            days = Math.round((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            avgPerDay = days > 0 ? totalLoans / days : 0;
        }
        // Median, min, max durasi
        let medianDuration = 0, minDuration = 0, maxDuration = 0;
        if (durations.length > 0) {
            durations.sort((a, b) => a - b);
            minDuration = durations[0];
            maxDuration = durations[durations.length - 1];
            const mid = Math.floor(durations.length / 2);
            medianDuration = durations.length % 2 === 0 ? (durations[mid - 1] + durations[mid]) / 2 : durations[mid];
        }
        // Persentase pengembalian tepat waktu & terlambat
        const percentOnTime = totalReturned > 0 ? (onTime / totalReturned) * 100 : 0;
        const percentLate = totalReturned > 0 ? (late / totalReturned) * 100 : 0;
        // Rata-rata jumlah barang per transaksi
        const avgItemsPerLoan = countItems > 0 ? totalItems / countItems : 0;
        return {
            avgDuration: countDuration > 0 ? totalDuration / countDuration : 0,
            medianDuration,
            minDuration,
            maxDuration,
            avgPerDay,
            totalLoans,
            days,
            totalReturned,
            percentOnTime,
            percentLate,
            avgItemsPerLoan,
        };
    }, [loansByDate, allLoans]);

    // Pie chart colors
    // Match bar chart colors: Senin - blue, Selasa - green, Rabu - yellow, Kamis - orange, Jumat - red
    const PIE_COLORS = [
        "#2563eb", // Senin - blue
        "#22c55e", // Selasa - green
        "#eab308", // Rabu - yellow
        "#f97316", // Kamis - orange
        "#ef4444", // Jumat - red
    ];

    return (
        <>
            {/* Pie Chart & Infografis Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Pie Chart Hari Paling Sering Ada Peminjaman */}
                <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl flex flex-col">
                    <CardHeader className="items-center pb-1 pt-3">
                        <CardTitle className="text-base font-semibold text-center">Distribusi Hari Peminjaman</CardTitle>
                        <CardDescription className="text-xs text-center">Hari-hari dengan jumlah peminjaman terbanyak</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex items-center justify-center p-4">
                        <ChartContainer
                            className="mx-auto aspect-square max-w-[180px] md:max-w-[200px] flex items-center justify-center h-full p-0"
                            config={{}}
                        >
                            <PieChart width={330} height={330} className="mx-auto">
                                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                <Pie
                                    data={pieData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={25}
                                    outerRadius={55}
                                    labelLine={false}
                                >
                                    {pieData.map((entry: any, idx: number) => (
                                        <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                                    ))}
                                    <LabelList
                                        dataKey="value"
                                        position="center"
                                        stroke="none"
                                        fontSize={12}
                                        className="fill-background dark:fill-white font-bold"
                                        formatter={(_value: number, entry: any) => {
                                            if (!entry || typeof entry.value !== "number") return "";
                                            const total = pieData.reduce((a, b) => a + b.value, 0);
                                            if (!total) return "";
                                            return `${((entry.value / total) * 100).toFixed(0)}%`;
                                        }}
                                    />
                                </Pie>
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                    <CardFooter className="flex-col gap-1 text-sm items-center pt-2 pb-3">
                        <div className="flex items-center gap-2 leading-none font-medium">
                            Hari paling ramai: <span className="font-bold" style={{ color: PIE_COLORS[pieData.findIndex(d => d.value === Math.max(...pieData.map(d => d.value)))] }}>{pieData[pieData.findIndex(d => d.value === Math.max(...pieData.map(d => d.value)))].name}</span>
                            <TrendingUp className="h-4 w-4" />
                        </div>
                        <div className="text-muted-foreground leading-none text-center">
                            Persentase berdasarkan total transaksi peminjaman
                        </div>
                    </CardFooter>
                </Card>
                {/* Infografis Rata-rata */}
                <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl flex flex-col">
                    <CardHeader className="pb-1 pt-3">
                        <CardTitle className="text-base font-semibold text-center">Infografis Rata-rata</CardTitle>
                        <CardDescription className="text-xs text-center">Statistik rata-rata dari seluruh data peminjaman</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-3 pb-2">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3 w-full text-base">
                            <div className="flex flex-col gap-1">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Rata-rata peminjaman per hari</span>
                                <span className="text-xl font-bold text-primary">{avgStats.avgPerDay ? avgStats.avgPerDay.toFixed(2) : '-'}<span className="text-xs"> peminjaman</span></span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Total hari terdata</span>
                                <span className="text-xl font-bold text-primary">{avgStats.days || '-'}<span className="text-xs"> hari</span></span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Pengembalian Tepat Waktu</span>
                                <span className="text-xl font-bold text-primary">{avgStats.percentOnTime.toFixed(1)}%</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Pengembalian Terlambat</span>
                                <span className="text-xl font-bold text-primary">{avgStats.percentLate.toFixed(1)}%</span>
                            </div>
                            <div className="flex flex-col gap-1 col-span-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Rata-rata jumlah barang per transaksi</span>
                                <span className="text-xl font-bold text-primary">{avgStats.avgItemsPerLoan.toFixed(2)}<span className="text-xs"> barang</span></span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {statCards.map((stat: any) => {
                    // Map string icon names to Lucide icon components
                    let Icon = stat.icon;
                    if (typeof Icon === "string") {
                        const iconMap: Record<string, any> = {
                            Package: Package,
                            Users: require("lucide-react").Users,
                            FileText: require("lucide-react").FileText,
                            CheckCircle: require("lucide-react").CheckCircle,
                            AlertTriangle: require("lucide-react").AlertTriangle,
                            Clock: require("lucide-react").Clock,
                        };
                        Icon = iconMap[Icon] || Package;
                    }
                    return (
                        <div
                            key={stat.title}
                            className={`group bg-gradient-to-r ${stat.gradient} text-white border-0 shadow-md rounded-lg focus:outline-none`}
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
                        </div>
                    );
                })}
            </div>
            {/* Statistik Peminjaman Charts - bawah list, 2 kolom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 mb-4">
                <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl" style={{ fontFamily: 'inherit' }}>
                    <CardHeader className="pb-1 pt-3">
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
                                                    {payload.map((item: any, idx: number) => (
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
            {/* Top Borrowers, Returners, Late Returners */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {/* Terbanyak Pinjam */}
                <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl">
                    <CardHeader className="pb-1 pt-3">
                        <CardTitle className="text-base font-semibold">10 Guru Terbanyak Meminjam</CardTitle>
                        <CardDescription className="text-xs">Berdasarkan jumlah transaksi peminjaman</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <Table className="text-sm bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
                            <TableHeader>
                                <TableRow className="bg-gray-50 dark:bg-gray-800">
                                    <TableHead className="px-3 py-2 text-gray-900 dark:text-gray-100">Nama</TableHead>
                                    <TableHead className="px-3 py-2 text-gray-900 dark:text-gray-100">Jumlah Pinjam</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topBorrowers.map((b: any) => (
                                    <TableRow key={b.id}>
                                        <TableCell className="px-3 py-2">{b.name}</TableCell>
                                        <TableCell className="px-3 py-2 text-center font-bold">{b.count}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                {/* Tepat Waktu */}
                <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl">
                    <CardHeader className="pb-1 pt-3">
                        <CardTitle className="text-base font-semibold">10 Guru Paling Rajin Mengembalikan (Tepat Waktu)</CardTitle>
                        <CardDescription className="text-xs">Pengembalian sebelum atau sama dengan tanggal jatuh tempo</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <Table className="text-sm bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
                            <TableHeader>
                                <TableRow className="bg-gray-50 dark:bg-gray-800">
                                    <TableHead className="px-3 py-2 text-gray-900 dark:text-gray-100">Nama</TableHead>
                                    <TableHead className="px-3 py-2 text-gray-900 dark:text-gray-100">Jumlah Tepat Waktu</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topReturners.map((b: any) => (
                                    <TableRow key={b.id}>
                                        <TableCell className="px-3 py-2">{b.name}</TableCell>
                                        <TableCell className="px-3 py-2 text-center font-bold">{b.count}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                {/* Terlambat */}
                <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl">
                    <CardHeader className="pb-1 pt-3">
                        <CardTitle className="text-base font-semibold">10 Guru Paling Sering Terlambat</CardTitle>
                        <CardDescription className="text-xs">Pengembalian setelah tanggal jatuh tempo</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <Table className="text-sm bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
                            <TableHeader>
                                <TableRow className="bg-gray-50 dark:bg-gray-800">
                                    <TableHead className="px-3 py-2 text-gray-900 dark:text-gray-100">Nama</TableHead>
                                    <TableHead className="px-3 py-2 text-gray-900 dark:text-gray-100">Jumlah Terlambat</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topLateReturners.map((b: any) => (
                                    <TableRow key={b.id}>
                                        <TableCell className="px-3 py-2">{b.name}</TableCell>
                                        <TableCell className="px-3 py-2 text-center font-bold">{b.count}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            {/* Top Items Leaderboard */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl mb-4">
                <CardHeader className="pb-1 pt-3">
                    <CardTitle className="text-base font-semibold">10 Barang Paling Sering Dipinjam</CardTitle>
                    <CardDescription className="text-xs">Urutan berdasarkan total jumlah dipinjam terbanyak</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="overflow-x-auto">
                        <Table className="text-sm bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
                            <TableHeader>
                                <TableRow className="bg-gray-50 dark:bg-gray-800">
                                    <TableHead className="px-3 py-2 text-gray-900 dark:text-gray-100 w-10 text-center">#</TableHead>
                                    <TableHead className="px-3 py-2 text-gray-900 dark:text-gray-100">Barang</TableHead>
                                    <TableHead className="px-3 py-2 text-gray-900 dark:text-gray-100">Kategori</TableHead>
                                    <TableHead className="px-3 py-2 text-gray-900 dark:text-gray-100">Kondisi</TableHead>
                                    <TableHead className="px-3 py-2 text-gray-900 dark:text-gray-100 text-center">Total Dipinjam</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topItems.map((i: any, idx: number) => {
                                    const Icon = ICON_OPTIONS.find(opt => opt.value === (i.icon || "laptop"))?.icon || Laptop;
                                    return (
                                        <TableRow key={i.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors">
                                            <TableCell className="px-3 py-2 text-center font-bold">{idx + 1}</TableCell>
                                            <TableCell className="px-3 py-2 flex items-center gap-3">
                                                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-accent-100 dark:bg-accent-900 mr-2">
                                                    <Icon className="w-6 h-6 text-accent-600 dark:text-accent-400" />
                                                </span>
                                                <span className="font-medium text-gray-900 dark:text-white truncate">{i.name}</span>
                                            </TableCell>
                                            <TableCell className="px-3 py-2">
                                                <span className="inline-block px-2 py-0.5 text-xs rounded bg-primary/10 text-primary font-semibold truncate">{i.category}</span>
                                            </TableCell>
                                            <TableCell className="px-3 py-2">
                                                <span className={`badge ${i.condition === "Baik" ? "badge-success" : i.condition === "Rusak" ? "badge-warning" : "badge-danger"}`}>{i.condition}</span>
                                            </TableCell>
                                            <TableCell className="px-3 py-2 text-center text-xl font-extrabold text-primary">{i.count}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
