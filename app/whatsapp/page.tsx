"use client"

import { useEffect, useState } from "react"
import { MessageCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function WhatsAppPage() {
  const [status, setStatus] = useState("offline")
  const [qr, setQr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loadWhatsApp = async () => {
    setLoading(true)
    try {
      const statusResponse = await fetch("/api/whatsapp/status", { cache: "no-store" })
      const statusData = await statusResponse.json()
      setStatus(statusData.status || "offline")

      if (statusData.hasQr) {
        const qrResponse = await fetch("/api/whatsapp/qr", { cache: "no-store" })
        const qrData = await qrResponse.json()
        setQr(qrResponse.ok ? qrData.qr : null)
      } else {
        setQr(null)
      }
    } catch {
      setStatus("offline")
      setQr(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWhatsApp()
    const timer = window.setInterval(loadWhatsApp, 3000)
    return () => window.clearInterval(timer)
  }, [])

  const statusLabel = status === "connected" ? "Terhubung" : status === "qr" ? "Menunggu scan QR" : "Offline"
  const statusClass = status === "connected" ? "bg-green-500" : status === "qr" ? "bg-yellow-500" : "bg-gray-400"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 lg:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-7 w-7 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">WhatsApp Bot</h1>
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Hubungkan bot dan pantau chat WhatsApp MRC.</p>
          </div>
          <Button onClick={loadWhatsApp} variant="outline" disabled={loading} className="w-fit">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="max-w-md">
          <section className="rounded-xl border bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white">Koneksi</h2>
              <span className={`h-3 w-3 rounded-full ${statusClass}`} title={statusLabel} />
            </div>
            <div className="flex min-h-[250px] items-center justify-center rounded-lg border bg-white p-4">
              {qr ? (
                <img src={qr} alt="QR login WhatsApp" className="h-[220px] w-[220px]" />
              ) : (
                <p className="text-center text-sm text-gray-500">
                  {status === "connected" ? "Bot sudah terhubung." : "Jalankan bot untuk mendapatkan QR Code."}
                </p>
              )}
            </div>
            <div className="mt-4 text-center text-sm font-medium text-gray-700 dark:text-gray-300">{statusLabel}</div>
          </section>
        </div>
      </div>
    </div>
  )
}
