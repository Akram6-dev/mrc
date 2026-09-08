"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Home, Package, Users, FileText, RotateCcw, History, Settings, Menu, X, LogOut, Sun, Moon, Bell, Info, ChartColumn, NotebookPen, AlertTriangle } from "lucide-react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { auth } from "@/lib/auth"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Peminjaman", href: "/peminjaman", icon: FileText },
  { name: "Pengembalian", href: "/pengembalian", icon: RotateCcw },
  { name: "Booking", href: "/booking", icon: NotebookPen },
  { name: "Riwayat", href: "/riwayat", icon: History },
  { name: "Analisis", href: "/analisis", icon: ChartColumn },
  { name: "Barang", href: "/barang", icon: Package },
  { name: "Peminjam", href: "/peminjam", icon: Users },
  { name: "Pengaturan", href: "/pengaturan", icon: Settings },
]

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [loadingNotif, setLoadingNotif] = useState(false)
  const [notifUnread, setNotifUnread] = useState(0)
  const router = useRouter()
  const pathname = usePathname()
  const user = auth.getCurrentUser()
  const visibleNavigation = user?.role === "admin"
    ? navigation.filter((item) => ["/", "/peminjaman", "/pengembalian", "/riwayat"].includes(item.href))
    : navigation

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDark(true)
      document.documentElement.classList.add("dark")
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    setLoadingNotif(true)
    try {
      const res = await fetch("/api/notifications")
      const data = await res.json()
      setNotifications(data)
      setNotifUnread(data.filter((n: any) => !n.read).length)
    } catch {
      setNotifications([])
    }
    setLoadingNotif(false)
  }

  const handleLogout = () => {
    auth.logout()
    router.push("/login")
  }

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)

    if (newTheme) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }

  const handleOpenNotif = async () => {
    setShowNotif(true)
    // Mark all as read
    for (const notif of notifications.filter((n) => !n.read)) {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notif.id })
      })
    }
    fetchNotifications()
  }

  return (
    <div className="lg:hidden">
      {/* Mobile header */}
      <div className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center space-x-3">
          <img
            src="/mrc.png"
            alt="MRC"
            className="h-14 w-full object-contain p-4"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
                aria-label="Notifikasi"
                onClick={handleOpenNotif}
              >
                <Bell className="w-5 h-5" />
                {notifUnread > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent side="bottom" align="end" className="w-64 p-0">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white flex items-center justify-between">
                <span>Notifikasi</span>
                <button onClick={fetchNotifications} className="text-xs text-accent-600">Refresh</button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {loadingNotif ? (
                  <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400 text-sm">Memuat...</div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400 text-sm">Tidak ada notifikasi</div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className={`flex items-start gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800 ${notif.read ? "opacity-60" : ""}`}>
                      {(() => {
                        const iconMap: Record<string, any> = {
                          booking: NotebookPen,
                          return: RotateCcw,
                          overdue: AlertTriangle,
                          info: Info,
                        };
                        const colorMap: Record<string, string> = {
                          booking: notif.read ? "text-gray-400" : "text-accent-600",
                          return: notif.read ? "text-gray-400" : "text-green-600",
                          overdue: notif.read ? "text-gray-400" : "text-red-600",
                          info: notif.read ? "text-gray-400" : "text-accent-600",
                        };
                        const Icon = iconMap[notif.type] || Info;
                        const colorClass = colorMap[notif.type] || (notif.read ? "text-gray-400" : "text-accent-600");
                        return <Icon className={`w-5 h-5 mt-1 ${colorClass}`} />;
                      })()}
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{notif.message}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(notif.timestamp).toLocaleString()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="fixed top-0 right-0 w-64 h-full bg-white dark:bg-gray-900 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="p-4 space-y-2">
              {visibleNavigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-md"
                        : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800",
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon
                      className={cn("mr-3 h-5 w-5", isActive ? "text-white" : "text-gray-500 dark:text-gray-400")}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">{user?.name?.charAt(0) || "A"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.role === "admin" ? "Admin" : "Super Admin"}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
