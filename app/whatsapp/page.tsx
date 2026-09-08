"use client"

import { useEffect, useState } from "react"
import { MessageCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function WhatsAppPage() {
  const [status, setStatus] = useState("offline")
  const [qr, setQr] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [account, setAccount] = useState<{ number?: string; name?: string | null } | null>(null)
  const [connectedAt, setConnectedAt] = useState<string | null>(null)
  const [logs, setLogs] = useState<Array<{ id: string; type: string; recipient: string; name: string; success: boolean; timestamp: string }>>([])
  const [loading, setLoading] = useState(false)

  const loadWhatsApp = async () => {
    setLoading(true)
    try {
      const statusResponse = await fetch("/api/whatsapp/status", { cache: "no-store" })
      const statusData = await statusResponse.json()
      setStatus(statusData.status || "offline")
      setError(statusData.error || null)
      setAccount(statusData.account || null)
      setConnectedAt(statusData.connectedAt || null)

      if (statusData.hasQr) {
        const qrResponse = await fetch("/api/whatsapp/qr", { cache: "no-store" })
        const qrData = await qrResponse.json()
        setQr(qrResponse.ok ? qrData.qr : null)
      } else {
        setQr(null)
      }
      const logResponse = await fetch("/api/whatsapp/notification-log", { cache: "no-store" })
      if (logResponse.ok) setLogs(await logResponse.json())
    } catch {
      setStatus("offline")
      setQr(null)
      setError("Bot WhatsApp tidak tersedia.")
      setAccount(null)
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
                  {error || (status === "connected" ? "Bot sudah terhubung." : "Jalankan bot untuk mendapatkan QR Code.")}
                </p>
              )}
            </div>
            <div className="mt-4 text-center text-sm font-medium text-gray-700 dark:text-gray-300">{statusLabel}</div>
            {account && (
              <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-800">
                <div className="font-semibold">{account.name || "WhatsApp MRC"}</div>
                <div>+{account.number}</div>
                {connectedAt && <div className="mt-1 text-xs">Terhubung: {new Date(connectedAt).toLocaleString("id-ID")}</div>}
              </div>
            )}
          </section>
          <section className="mt-6 rounded-xl border bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-3 font-semibold text-gray-900 dark:text-white">Log Notifikasi</h2>
            {logs.length === 0 ? (
              <p className="text-sm text-gray-500">Belum ada notifikasi WhatsApp.</p>
            ) : (
              <div className="space-y-2">
                {logs.slice(0, 10).map((log) => (
                  <div key={log.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <div>
                      <div className="font-medium">{log.type} - {log.name}</div>
                      <div className="text-xs text-gray-500">+{log.recipient} · {new Date(log.timestamp).toLocaleString("id-ID")}</div>
                    </div>
                    <span className={log.success ? "text-green-600" : "text-red-600"}>{log.success ? "Terkirim" : "Gagal"}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
