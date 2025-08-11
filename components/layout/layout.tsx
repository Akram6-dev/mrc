"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import Sidebar from "./sidebar"
import MobileNav from "./mobile-nav"

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname()

  if (pathname === "/login" || pathname === "/print" || pathname === "/stats") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {children}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <MobileNav />
      <div className="lg:pl-64">
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
