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
import { Package, AlertTriangle, Clock, CheckCircle } from "lucide-react"
import Loading from "@/components/ui/loading"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { auth } from "@/lib/auth"
import api from "@/lib/api"
import type { DashboardStats, LoanWithDetails } from "@/lib/types"
import { formatDate, isOverdue } from "@/lib/utils"

export default function DashboardPage() {
    const [progress, setProgress] = useState(0)
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [recentLoans, setRecentLoans] = useState<LoanWithDetails[]>([])
    const [allLoans, setAllLoans] = useState<LoanWithDetails[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")
    const router = useRouter()

    const [activeBorrowers, setActiveBorrowers] = useState(0)

    useEffect(() => {
        if (!auth.isAuthenticated()) {
            router.push("/login")
            return
        }

        loadDashboardData()
    }, [router])

    // Progress bar and auto-refresh logic
    useEffect(() => {
        let timer: NodeJS.Timeout | null = null;
        let start = Date.now();

        // Async fetch function
        const fetchRecentLoans = async () => {
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
                setRecentLoans(sortedLoans.slice(0, 5));
                setAllLoans(sortedLoans);
            } catch (err) {
                setError("Gagal memuat data peminjaman terbaru");
            }
        };

        // Progress bar and refresh logic in one interval
        const tick = () => {
            const elapsed = Date.now() - start;
            const percent = Math.min((elapsed / 30000) * 100, 100);
            setProgress(percent);
            if (percent >= 100) {
                fetchRecentLoans();
                start = Date.now();
                setProgress(0);
            }
        };

        // Initial fetch
        fetchRecentLoans();
        timer = setInterval(tick, 100);

        return () => {
            if (timer) clearInterval(timer);
        };
    }, []);

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
                // Ambil borrower lengkap dari borrowerId
                const borrower = loan.borrowerId ? borrowerMap[loan.borrowerId?.toString()] ?? {} : {}

                // Ambil itemDetails lengkap dari loan.items
                let itemDetails: any[] = []
                if (Array.isArray(loan.items)) {
                    itemDetails = loan.items.map((item: any) => {
                        const base = itemMap[item.itemId?.toString()] ?? {}
                        return {
                            ...base,
                            quantity: item.quantity ?? 1,
                            serialNumber: item.serialNumber,
                        }
                    })
                }

                return {
                    ...loan,
                    borrower,
                    itemDetails,
                }
            })

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

    return (
        <div className="flex flex-col min-h-screen bg-gray-900">
            {/* Native animated progress bar */}
            <div className="w-full sticky top-0 z-30">
                <div
                    className="w-full h-1 bg-gray-200 dark:bg-gray-800 relative overflow-hidden"
                    style={{ borderRadius: 0 }}
                >
                    <div
                        className="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-200"
                        style={{
                            width: `${progress}%`,
                            borderRadius: 0,
                            transitionProperty: "width",
                        }}
                    />
                </div>
            </div>
            <div className="flex justify-center items-start flex-1 py-10">
                <div className="w-full max-w-5xl" style={{ maxWidth: '70rem' }}>
                    <Table className="text-sm bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
                        <TableHeader>
                            <TableRow className="bg-gray-50 dark:bg-gray-800">
                                <TableHead className="px-3 py-2 text-gray-900 dark:text-gray-100">Peminjam</TableHead>
                                <TableHead className="px-3 py-2 text-gray-900 dark:text-gray-100">Barang</TableHead>
                                <TableHead className="px-3 py-2 text-gray-900 dark:text-gray-100">Jatuh Tempo</TableHead>
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
                                            <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-full flex items-center justify-center">
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
                                    <TableCell className="px-3 py-3 font-medium">
                                        <div className={isOverdue(loan.dueDate) && loan.status === "dipinjam" ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-gray-100"}>
                                            {formatDate(loan.dueDate)}
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
            </div>
        </div>
    )
}