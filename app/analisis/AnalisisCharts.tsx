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
import { Download, TrendingUp } from "lucide-react";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { useMemo, useState } from "react";
import itemsDB from '../../database/items.json';



export default function AnalisisCharts({
    statCards,
    topBorrowers,
    topReturners,
    topLateReturners,
    topItems,
    loansByHourWeekday,
    loansByDate,
    allLoans,
    allBorrowers,
    allItems
}: any) {
    // Only weekdays
    const weekdayNames = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

    const getLoanDate = (loan: any) => new Date(loan.createdAt || loan.borrowDate || loan.loanDate);
    const validLoanDates = (Array.isArray(allLoans) ? allLoans : [])
        .map((loan: any) => getLoanDate(loan))
        .filter((date: Date) => !isNaN(date.getTime()));
    const latestLoanDate = [...validLoanDates].sort((a: Date, b: Date) => b.getTime() - a.getTime())[0] || new Date();
    const availableYears = Array.from(new Set(validLoanDates.map((date: Date) => date.getFullYear()))).sort((a, b) => b - a);
    const [selectedYear, setSelectedYear] = useState<number | "all">("all");
    const [selectedMonth, setSelectedMonth] = useState<number | "all">("all");
    const [pieWeek, setPieWeek] = useState<number | "all">("all");
    const [averageWeek, setAverageWeek] = useState<number | "all">("all");
    const [hourlyWeek, setHourlyWeek] = useState<number | "all">("all");

    const filteredLoans = useMemo(() => (Array.isArray(allLoans) ? allLoans : []).filter((loan: any) => {
        const date = getLoanDate(loan);
        return !isNaN(date.getTime()) &&
            (selectedYear === "all" || date.getFullYear() === selectedYear) &&
            (selectedMonth === "all" || date.getMonth() === selectedMonth);
    }), [allLoans, selectedMonth, selectedYear]);

    const filterControls = (
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
    );

    const weekControls = (value: number | "all", onChange: (value: number | "all") => void) => (
        <select value={value} onChange={(event) => onChange(event.target.value === "all" ? "all" : Number(event.target.value))} className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs dark:border-gray-700 dark:bg-gray-800">
            <option value="all">Semua Minggu</option>
            {Array.from({ length: 5 }, (_, index) => <option key={index + 1} value={index + 1}>Minggu {index + 1}</option>)}
        </select>
    );

    const exportCard = async (fileName: string, rows: any[]) => {
        try {
            const XLSX = await import("xlsx");
            const exportRows = rows.map((row: any) => Object.fromEntries(
                Object.entries(row).map(([key, value]) => [
                    key,
                    value !== null && typeof value === "object" ? JSON.stringify(value) : value,
                ]),
            ));
            const worksheet = XLSX.utils.json_to_sheet(exportRows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
            const yearLabel = selectedYear === "all" ? "semua-tahun" : selectedYear;
            const monthLabel = selectedMonth === "all" ? "semua-bulan" : String(Number(selectedMonth) + 1).padStart(2, "0");
            XLSX.writeFile(workbook, `${fileName}-${yearLabel}-${monthLabel}.xlsx`);
        } catch (error) {
            console.error("Gagal mengekspor data analisis", error);
            window.alert("Data gagal diekspor. Silakan coba lagi.");
        }
    };

    const borrowerMap = useMemo(() => {
        const map: Record<string, any> = {};
        (Array.isArray(allBorrowers) ? allBorrowers : []).forEach((borrower: any) => { map[String(borrower.id)] = borrower; });
        return map;
    }, [allBorrowers]);

    const rankBorrowers = (predicate: (loan: any) => boolean = () => true) => {
        const counts: Record<string, number> = {};
        filteredLoans.filter(predicate).forEach((loan: any) => {
            if (loan.borrowerId) counts[String(loan.borrowerId)] = (counts[String(loan.borrowerId)] || 0) + 1;
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id, count]) => ({
            ...(borrowerMap[id] || {}), id, name: borrowerMap[id]?.name || id, count,
        }));
    };

    const filteredTopBorrowers = useMemo(() => rankBorrowers(), [filteredLoans, borrowerMap]);
    const filteredTopReturners = useMemo(() => rankBorrowers((loan) => !!loan.returnDate && !!loan.dueDate && new Date(loan.returnDate) <= new Date(loan.dueDate)), [filteredLoans, borrowerMap]);
    const filteredTopLateReturners = useMemo(() => rankBorrowers((loan) => !!loan.returnDate && !!loan.dueDate && new Date(loan.returnDate) > new Date(loan.dueDate)), [filteredLoans, borrowerMap]);

    const itemMap = useMemo(() => {
        const map: Record<string, any> = {};
        (Array.isArray(allItems) ? allItems : []).forEach((item: any) => {
            map[String(item.id)] = item;
            (item.items || []).forEach((serial: any) => {
                const key = serial.rfidCode || serial.sn;
                if (key) map[String(key)] = { ...item, serial: key };
            });
        });
        return map;
    }, [allItems]);

    const filteredTopItems = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredLoans.forEach((loan: any) => (loan.items || []).forEach((entry: any) => {
            const key = typeof entry === "string" ? entry : entry?.itemId || entry?.id || entry?.rfidCode || entry?.sn;
            if (key) counts[String(key)] = (counts[String(key)] || 0) + (typeof entry?.quantity === "number" ? entry.quantity : 1);
        }));
        const grouped: Record<string, any> = {};
        Object.entries(counts).forEach(([key, count]) => {
            const item = itemMap[key] || { id: key, name: key };
            const itemId = String(item.id || key);
            grouped[itemId] = { ...item, id: itemId, count: (grouped[itemId]?.count || 0) + count };
        });
        return Object.values(grouped).sort((a: any, b: any) => b.count - a.count).slice(0, 10);
    }, [filteredLoans, itemMap]);

    const filteredTopSerials = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredLoans.forEach((loan: any) => (loan.items || []).forEach((entry: any) => {
            const serial = entry?.rfidCode || entry?.sn || entry?.serial;
            if (serial) counts[String(serial)] = (counts[String(serial)] || 0) + 1;
        }));
        return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([serial, count]) => ({
            serial, sn: itemMap[serial]?.serial || serial, item: itemMap[serial], count,
        }));
    }, [filteredLoans, itemMap]);

    const filterByWeek = (loans: any[], week: number | "all") => loans.filter((loan: any) => {
        if (week === "all") return true;
        const date = getLoanDate(loan);
        const weekStart = (week - 1) * 7 + 1;
        return date.getDate() >= weekStart && date.getDate() <= (week === 5 ? 31 : week * 7);
    });
    const filteredPieLoans = useMemo(() => filterByWeek(filteredLoans, pieWeek), [filteredLoans, pieWeek]);
    const filteredAverageLoans = useMemo(() => filterByWeek(filteredLoans, averageWeek), [filteredLoans, averageWeek]);

    const hourlyMonth = useMemo(() => {
        const latest = [...validLoanDates].sort((a: Date, b: Date) => b.getTime() - a.getTime())[0] || new Date();
        return {
            year: selectedYear === "all" ? latest.getFullYear() : selectedYear,
            month: selectedMonth === "all" ? latest.getMonth() : selectedMonth,
        };
    }, [selectedMonth, selectedYear, validLoanDates]);

    const startOfCalendarWeek = (date: Date) => {
        const result = new Date(date);
        const day = result.getDay();
        result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
        result.setHours(0, 0, 0, 0);
        return result;
    };

    const addDays = (date: Date, days: number) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    };

    const filteredLoansByHourWeekday = useMemo(() => {
        const rows = Array.from({ length: 24 }, (_, hour) => {
            const row: any = { hour };
            weekdayNames.forEach((weekday) => (row[weekday] = 0));
            return row;
        });
        const monthStart = new Date(hourlyMonth.year, hourlyMonth.month, 1);
        const monthEnd = new Date(hourlyMonth.year, hourlyMonth.month + 1, 0, 23, 59, 59, 999);
        let rangeStart = monthStart;
        let rangeEnd = monthEnd;

        if (hourlyWeek !== "all") {
            rangeStart = addDays(startOfCalendarWeek(monthStart), (hourlyWeek - 1) * 7);
            rangeEnd = addDays(rangeStart, 6);
        }

        (Array.isArray(allLoans) ? allLoans : []).forEach((loan: any) => {
            const date = getLoanDate(loan);
            if (isNaN(date.getTime()) || date < rangeStart || date > rangeEnd) return;

            const day = date.getDay();
            if (day >= 1 && day <= 5) {
                rows[date.getHours()][weekdayNames[day - 1]]++;
            }
        });
        return rows;
    }, [allLoans, hourlyMonth, hourlyWeek]);

    // --- Pie Chart: Hari Paling Sering Ada Peminjaman ---
    // loansByDate: [{date, Peminjaman}]
    // loansByHourWeekday: [{hour, Senin, Selasa, ...}]
    // But we need to count by weekday from all loans
    // Pie chart: only weekdays (Senin=1, ..., Jumat=5)
    const filteredLoansByDate = useMemo(() => {
        const counts = new Map<string, number>();
        filteredPieLoans.forEach((loan: any) => {
            const date = getLoanDate(loan);
            const key = date.toISOString().slice(0, 10);
            counts.set(key, (counts.get(key) || 0) + 1);
        });
        return Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, Peminjaman: count }));
    }, [filteredPieLoans]);

    const filteredAverageLoansByDate = useMemo(() => {
        const counts = new Map<string, number>();
        filteredAverageLoans.forEach((loan: any) => {
            const date = getLoanDate(loan);
            const key = date.toISOString().slice(0, 10);
            counts.set(key, (counts.get(key) || 0) + 1);
        });
        return Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, Peminjaman: count }));
    }, [filteredAverageLoans]);

    const pieData = useMemo(() => {
        const counts = Array(5).fill(0); // 0: Senin, 1: Selasa, ...
        filteredLoansByDate.forEach((row: any) => {
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
    }, [filteredLoansByDate]);

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
        if (filteredAverageLoansByDate.length > 0) {
            minDate = new Date(filteredAverageLoansByDate[0].date);
            maxDate = new Date(filteredAverageLoansByDate[filteredAverageLoansByDate.length - 1].date);
            totalLoans = filteredAverageLoansByDate.reduce((sum, row) => sum + (row.Peminjaman || 0), 0);
        }
        if (filteredAverageLoans.length > 0) {
            filteredAverageLoans.forEach((l: any) => {
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

                if (Array.isArray(l.items)) {
                    let qty = 0;
                    l.items.forEach((itemObj: any) => {
                        try {
                            if (typeof itemObj === 'number') {
                                qty += itemObj;
                            } else if (typeof itemObj === 'string') {
                                qty += 1;
                            } else if (itemObj && typeof itemObj === 'object') {
                                if (typeof itemObj.quantity === 'number') {
                                    qty += itemObj.quantity;
                                } else if (Array.isArray(itemObj.serials)) {
                                    qty += itemObj.serials.length;
                                } else if (itemObj.count && typeof itemObj.count === 'number') {
                                    qty += itemObj.count;
                                } else {
                                    qty += 1;
                                }
                            } else {
                                qty += 1;
                            }
                        } catch (e) {
                            qty += 1;
                        }
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
    }, [filteredAverageLoansByDate, filteredAverageLoans]);

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
                        {filterControls}
                        {weekControls(pieWeek, setPieWeek)}
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
                        {filterControls}
                        {weekControls(averageWeek, setAverageWeek)}
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
                        {weekControls(hourlyWeek, setHourlyWeek)}
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="w-full h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={filteredLoansByHourWeekday} margin={{ top: 8, right: 16, left: 0, bottom: 0 }} barCategoryGap={2}>
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
                        <div className="w-full overflow-x-auto pb-2">
                            <div className="h-72" style={{ minWidth: `${Math.max(900, loansByDate.length * 64)}px` }}>
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
                                            interval={0}
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
                        <div className="flex items-center justify-between gap-2"><CardTitle className="text-base font-semibold">10 Guru Terbanyak Meminjam</CardTitle><button type="button" onClick={() => exportCard("guru-terbanyak-meminjam", filteredTopBorrowers)} className="text-gray-600 hover:text-blue-600" title="Ekspor Excel"><Download className="h-4 w-4" /></button></div>
                        <CardDescription className="text-xs">Berdasarkan jumlah transaksi peminjaman</CardDescription>
                        {filterControls}
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
                                {filteredTopBorrowers.map((b: any) => (
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
                        <div className="flex items-center justify-between gap-2"><CardTitle className="text-base font-semibold">10 Guru Paling Rajin Mengembalikan (Tepat Waktu)</CardTitle><button type="button" onClick={() => exportCard("guru-tepat-waktu", filteredTopReturners)} className="text-gray-600 hover:text-blue-600" title="Ekspor Excel"><Download className="h-4 w-4" /></button></div>
                        <CardDescription className="text-xs">Pengembalian sebelum atau sama dengan tanggal jatuh tempo</CardDescription>
                        {filterControls}
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
                                {filteredTopReturners.map((b: any) => (
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
                        <div className="flex items-center justify-between gap-2"><CardTitle className="text-base font-semibold">10 Guru Paling Sering Terlambat</CardTitle><button type="button" onClick={() => exportCard("guru-terlambat", filteredTopLateReturners)} className="text-gray-600 hover:text-blue-600" title="Ekspor Excel"><Download className="h-4 w-4" /></button></div>
                        <CardDescription className="text-xs">Pengembalian setelah tanggal jatuh tempo</CardDescription>
                        {filterControls}
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
                                {filteredTopLateReturners.map((b: any) => (
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
            {/* Top Items Leaderboard - split into two: jenis barang (left) and per-serial (right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Left: 10 jenis barang yang sering dipinjam */}
                <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl">
                    <CardHeader className="pb-1 pt-3">
                        <div className="flex items-center justify-between gap-2"><CardTitle className="text-base font-semibold">10 Jenis Barang Paling Sering Dipinjam</CardTitle><button type="button" onClick={() => exportCard("jenis-barang-terbanyak", filteredTopItems)} className="text-gray-600 hover:text-blue-600" title="Ekspor Excel"><Download className="h-4 w-4" /></button></div>
                        <CardDescription className="text-xs">Urutan berdasarkan total jumlah dipinjam terbanyak (per jenis)</CardDescription>
                        {filterControls}
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="overflow-x-auto">
                            <Table className="text-sm bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
                                <TableHeader>
                                    <TableRow className="bg-gray-50 dark:bg-gray-800">
                                        <TableHead className="px-3 py-2 text-gray-900 dark:text-gray-100 w-10 text-center">#</TableHead>
                                        <TableHead className="px-3 py-2 text-gray-900 dark:text-gray-100">Barang</TableHead>
                                        <TableHead className="px-3 py-2 text-gray-900 dark:text-gray-100">Kategori</TableHead>
                                        <TableHead className="px-3 py-2 text-gray-900 dark:text-gray-100 text-center">Total Dipinjam</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTopItems.map((i: any, idx: number) => {
                                        const Icon = ICON_OPTIONS.find(opt => opt.value === (i.icon || "laptop"))?.icon || Laptop;

                                        // Resolve item id (support new "id" and older "itemId")
                                        const itemId = i.id ?? i.itemId ?? i._id ?? i.id;

                                        // Compute total borrowed count: prefer provided count, else aggregate from allLoans
                                        let totalCount = typeof i.count === 'number' ? i.count : (typeof i.totalBorrowed === 'number' ? i.totalBorrowed : 0);
                                        if ((!totalCount || totalCount === 0) && Array.isArray(allLoans)) {
                                            try {
                                                allLoans.forEach((l: any) => {
                                                    if (!Array.isArray(l.items)) return;
                                                    l.items.forEach((it: any) => {
                                                        // item entry in loan may be string id or object with itemId
                                                        const loanItemId = typeof it === 'string' ? it : (it && (it.itemId ?? it.id ?? it.item)) ?? null;
                                                        if (loanItemId == null) return;
                                                        if (String(loanItemId) === String(itemId)) {
                                                            if (typeof it.quantity === 'number') totalCount += it.quantity;
                                                            else totalCount += 1;
                                                        }
                                                    });
                                                });
                                            } catch (e) {
                                                // ignore and keep fallback totalCount
                                            }
                                        }

                                        // Try to find image from local itemsDB when topItems doesn't include it
                                        const dbItem = Array.isArray(itemsDB) ? (itemsDB as any).find((x: any) => String(x.id) === String(itemId)) : null;
                                        const imgUrl = i.image ?? dbItem?.image ?? null;

                                        return (
                                            <TableRow key={itemId ?? idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors">
                                                <TableCell className="px-3 py-2 text-center font-bold">{idx + 1}</TableCell>
                                                <TableCell className="px-3 py-2 flex items-center gap-3">
                                                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-accent-100 dark:bg-accent-900 mr-2 overflow-hidden">
                                                        {imgUrl ? (
                                                            <img src={imgUrl} alt={i.name ?? i.title ?? 'item'} className="w-9 h-9 object-cover" />
                                                        ) : (
                                                            <Icon className="w-6 h-6 text-accent-600 dark:text-accent-400" />
                                                        )}
                                                    </span>
                                                    <span className="font-medium text-gray-900 dark:text-white truncate">{i.name ?? i.title ?? '-'}</span>
                                                </TableCell>
                                                <TableCell className="px-3 py-2">
                                                    <span className="inline-block px-2 py-0.5 text-xs rounded bg-primary/10 text-primary font-semibold truncate">{i.category ?? '-'}</span>
                                                </TableCell>
                                                <TableCell className="px-3 py-2 text-center text-xl font-extrabold text-primary">{totalCount}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Right: Top 10 per-serial */}
                <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl">
                    <CardHeader className="pb-1 pt-3">
                        <div className="flex items-center justify-between gap-2"><CardTitle className="text-base font-semibold">10 Serial Paling Sering Dipinjam</CardTitle><button type="button" onClick={() => exportCard("serial-terbanyak-dipinjam", filteredTopSerials)} className="text-gray-600 hover:text-blue-600" title="Ekspor Excel"><Download className="h-4 w-4" /></button></div>
                        <CardDescription className="text-xs">Top 10 berdasarkan serial number — menunjukkan serial individual yang paling sering dipinjam</CardDescription>
                        {filterControls}
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="overflow-x-auto">
                            <Table className="text-sm bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
                                <TableHeader>
                                    <TableRow className="bg-gray-50 dark:bg-gray-800">
                                        <TableHead className="px-3 py-2 text-gray-900 dark:text-gray-100 w-10 text-center">#</TableHead>
                                        <TableHead className="px-3 py-2 text-gray-900 dark:text-gray-100">Serial</TableHead>
                                        <TableHead className="px-3 py-2 text-gray-900 dark:text-gray-100">Barang</TableHead>
                                        <TableHead className="px-3 py-2 text-gray-900 dark:text-gray-100">Kategori</TableHead>
                                        <TableHead className="px-3 py-2 text-gray-900 dark:text-gray-100 text-center">Total Dipinjam</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {/** build topSerials from loans and itemsDB */}
                                    {(() => {
                                        // compute serial -> parent item map from itemsDB
                                        const serialToItem: Record<string, any> = {};
                                        try {
                                            if (Array.isArray((itemsDB as any))) {
                                                (itemsDB as any).forEach((it: any) => {
                                                    if (!Array.isArray(it.items)) return;
                                                    it.items.forEach((s: any) => {
                                                        // prefer rfidCode as key but capture 'sn' when present
                                                        const key = s && (s.rfidCode ?? s.sn);
                                                        if (key) {
                                                            serialToItem[String(key)] = {
                                                                name: it.name,
                                                                category: it.category,
                                                                icon: it.icon,
                                                                itemId: it.id,
                                                                image: it.image ?? null,
                                                                sn: s.sn ?? s.rfidCode ?? String(key),
                                                            };
                                                        }
                                                    });
                                                });
                                            }
                                        } catch (e) {
                                            // ignore
                                        }

                                        const serialCounts: Record<string, number> = {};
                                        if (Array.isArray(allLoans)) {
                                            allLoans.forEach((l: any) => {
                                                if (!Array.isArray(l.items)) return;
                                                l.items.forEach((it: any) => {
                                                    // prefer explicit rfidCode in loan item
                                                    const s = it && (it.rfidCode ?? it.sn ?? it.serial);
                                                    if (s) {
                                                        const key = String(s);
                                                        serialCounts[key] = (serialCounts[key] || 0) + 1;
                                                    }
                                                });
                                            });
                                        }

                                        const serialArr = Object.keys(serialCounts).map(k => ({ serial: k, sn: serialToItem[k]?.sn ?? k, count: serialCounts[k], item: serialToItem[k] || null }));
                                        serialArr.sort((a, b) => b.count - a.count);
                                        const topSerials = serialArr.slice(0, 10);

                                        return filteredTopSerials.map((s: any, idx: number) => (
                                            <TableRow key={s.serial} className="hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors">
                                                <TableCell className="px-3 py-2 text-center font-bold">{idx + 1}</TableCell>
                                                <TableCell className="px-3 py-2">{s.sn}</TableCell>
                                                <TableCell className="px-3 py-2 flex items-center gap-3">
                                                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-accent-100 dark:bg-accent-900 mr-2 overflow-hidden">
                                                        {s.item?.image ? (
                                                            <img src={s.item.image} alt={s.item.name} className="w-9 h-9 object-cover" />
                                                        ) : (
                                                            <svg className="w-6 h-6 text-accent-600 dark:text-accent-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                            </svg>
                                                        )}
                                                    </span>
                                                    <span className="font-medium text-gray-900 dark:text-white truncate">{s.item?.name ?? '-'}</span>
                                                </TableCell>
                                                <TableCell className="px-3 py-2">{s.item?.category ?? '-'}</TableCell>
                                                <TableCell className="px-3 py-2 text-center text-xl font-extrabold text-primary">{s.count}</TableCell>
                                            </TableRow>
                                        ));
                                    })()}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
