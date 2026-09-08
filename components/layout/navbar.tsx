"use client"

import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Home, Package, Users, FileText, RotateCcw, Settings, Menu, X, LogOut, Sun, Moon, Bell } from "lucide-react"
import { auth } from "@/lib/auth"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Peminjaman", href: "/peminjaman", icon: FileText },
  { name: "Pengembalian", href: "/pengembalian", icon: RotateCcw },
  { name: "Barang", href: "/barang", icon: Package },
  { name: "Peminjam", href: "/peminjam", icon: Users },
  { name: "Pengaturan", href: "/pengaturan", icon: Settings },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const user = auth.getCurrentUser()

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDark(true)
      document.documentElement.classList.add("dark")
    }
  }, [])

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

  return (
    <nav className="glass-effect sticky top-0 z-40 border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-accent-600 to-accent-700 bg-clip-text text-transparent">
                  MRC
                </h1>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:ml-8 md:flex md:space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 relative group",
                      isActive
                        ? "bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-medium"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700/50",
                    )}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-accent-400 to-accent-500 rounded-xl opacity-20 animate-pulse" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700/50 transition-all duration-200"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button className="p-2.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700/50 transition-all duration-200 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>

            <div className="hidden md:flex md:items-center md:space-x-4">
              <div className="flex items-center space-x-3 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">{user?.name?.charAt(0) || "A"}</span>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-300 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-all duration-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Keluar
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700/50 transition-all duration-200"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden animate-slide-up">
          <div className="px-4 pt-2 pb-3 space-y-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-700/50">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-3 rounded-xl text-base font-medium transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-medium"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700/50",
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
              <div className="flex items-center px-4 py-3 space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-semibold">{user?.name?.charAt(0) || "A"}</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 rounded-xl text-base font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-all duration-200"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
