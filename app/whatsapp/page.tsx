"use client";

import { useEffect, useState, type FormEvent } from "react";
import { LogOut, MessageCircle, RefreshCw, Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";

export default function WhatsAppPage() {
  const [status, setStatus] = useState("offline");
  const [qr, setQr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<{
    number?: string;
    name?: string | null;
  } | null>(null);
  const [connectedAt, setConnectedAt] = useState<string | null>(null);
  const [logs, setLogs] = useState<
    Array<{
      id: string;
      type: string;
      recipient: string;
      name: string;
      success: boolean;
      timestamp: string;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [conversations, setConversations] = useState<
    Array<{
      jid: string;
      number: string;
      name: string;
      messageCount: number;
      lastMessage: string;
    }>
  >([]);
  const [selectedJid, setSelectedJid] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<
    Array<{ id: string; role: string; content: string }>
  >([]);
  const [messageDraft, setMessageDraft] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [conversationSearch, setConversationSearch] = useState("");

  const loadWhatsApp = async () => {
    setLoading(true);
    try {
      const headers = auth.getAuthHeaders();
      const statusResponse = await fetch("/api/whatsapp/status", {
        cache: "no-store",
        headers,
      });
      const statusData = await statusResponse.json();
      setStatus(statusData.status || "offline");
      setError(statusData.error || null);
      setAccount(statusData.account || null);
      setConnectedAt(statusData.connectedAt || null);

      if (statusData.hasQr) {
        const qrResponse = await fetch("/api/whatsapp/qr", {
          cache: "no-store",
          headers,
        });
        const qrData = await qrResponse.json();
        setQr(qrResponse.ok ? qrData.qr : null);
      } else {
        setQr(null);
      }
      const logResponse = await fetch("/api/whatsapp/notification-log", {
        cache: "no-store",
        headers,
      });
      if (logResponse.ok) setLogs(await logResponse.json());
    } catch {
      setStatus("offline");
      setQr(null);
      setError("Bot WhatsApp tidak tersedia.");
      setAccount(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm("Keluar dari akun WhatsApp bot?")) return;
    setLoggingOut(true);
    try {
      const response = await fetch("/api/whatsapp/logout", {
        method: "POST",
        headers: auth.getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Gagal keluar dari WhatsApp");
      setStatus("offline");
      setQr(null);
      setAccount(null);
      setConnectedAt(null);
      setError("Bot sudah keluar. Scan QR baru untuk menghubungkan kembali.");
    } catch (logoutError) {
      setError(
        logoutError instanceof Error
          ? logoutError.message
          : "Gagal keluar dari WhatsApp",
      );
    } finally {
      setLoggingOut(false);
    }
  };

  const loadConversations = async () => {
    try {
      const headers = auth.getAuthHeaders();
      const [chatResponse, borrowersResponse] = await Promise.all([
        fetch("/api/whatsapp/chat", { cache: "no-store", headers }),
        fetch("/api/borrowers?includeDeleted=true", {
          cache: "no-store",
          headers,
        }),
      ]);
      if (!chatResponse.ok) return;
      const data = await chatResponse.json();
      const borrowers = borrowersResponse.ok
        ? await borrowersResponse.json()
        : [];
      const normalizePhone = (value: unknown) => {
        let number = String(value || "").replace(/\D/g, "");
        if (number.startsWith("0")) number = `62${number.slice(1)}`;
        return number;
      };
      const borrowerNames = new Map<string, string>();
      borrowers.forEach((borrower: { phone?: string; name?: string }) => {
        const phone = normalizePhone(borrower.phone);
        if (phone && borrower.name) borrowerNames.set(phone, borrower.name);
      });
      const namedConversations = data.map(
        (conversation: {
          jid: string;
          number: string;
          messageCount: number;
          lastMessage: string;
        }) => ({
          ...conversation,
          name:
            borrowerNames.get(normalizePhone(conversation.number)) ||
            `+${conversation.number}`,
        }),
      );
      const knownNumbers = new Set(
        namedConversations.map((conversation: { number: string }) =>
          normalizePhone(conversation.number),
        ),
      );
      const newContacts = borrowers
        .filter(
          (borrower: { phone?: string; name?: string; deletedAt?: string }) =>
            borrower.phone && borrower.name && !borrower.deletedAt,
        )
        .map((borrower: { phone: string; name: string }) => {
          const number = normalizePhone(borrower.phone);
          return {
            jid: `${number}@s.whatsapp.net`,
            number,
            name: borrower.name,
            messageCount: 0,
            lastMessage: "Mulai chat baru",
          };
        })
        .filter(
          (conversation: { number: string }) =>
            !knownNumbers.has(normalizePhone(conversation.number)),
        );
      const allContacts = [...namedConversations, ...newContacts];
      setConversations(allContacts);
      setSelectedJid(
        (current) => current || namedConversations[0]?.jid || null,
      );
    } catch {
      setConversations([]);
    }
  };

  const loadChatMessages = async (jid: string) => {
    setChatLoading(true);
    try {
      const response = await fetch(
        `/api/whatsapp/chat?jid=${encodeURIComponent(jid)}`,
        {
          cache: "no-store",
          headers: auth.getAuthHeaders(),
        },
      );
      if (response.ok) {
        const data = await response.json();
        setChatMessages(data.messages || []);
      }
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendMessage = async (event: FormEvent) => {
    event.preventDefault();
    const message = messageDraft.trim();
    if (!selectedJid || !message || sendingMessage) return;
    setSendingMessage(true);
    try {
      const response = await fetch("/api/whatsapp/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...auth.getAuthHeaders(),
        },
        body: JSON.stringify({ jid: selectedJid, message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal mengirim pesan");
      setMessageDraft("");
      await loadChatMessages(selectedJid);
      await loadConversations();
    } catch (sendError) {
      setError(
        sendError instanceof Error ? sendError.message : "Gagal mengirim pesan",
      );
    } finally {
      setSendingMessage(false);
    }
  };

  useEffect(() => {
    loadWhatsApp();
    loadConversations();
    const timer = window.setInterval(loadWhatsApp, 3000);
    const chatTimer = window.setInterval(loadConversations, 5000);
    return () => {
      window.clearInterval(timer);
      window.clearInterval(chatTimer);
    };
  }, []);

  useEffect(() => {
    if (selectedJid) loadChatMessages(selectedJid);
  }, [selectedJid]);

  const statusLabel =
    status === "connected"
      ? "Terhubung"
      : status === "qr"
        ? "Menunggu scan QR"
        : "Offline";
  const statusClass =
    status === "connected"
      ? "bg-green-500"
      : status === "qr"
        ? "bg-yellow-500"
        : "bg-gray-400";
  const filteredConversations = conversations.filter((conversation) => {
    const query = conversationSearch.trim().toLowerCase();
    if (!query) return true;
    return [conversation.name, conversation.number, conversation.lastMessage]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 lg:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-7 w-7 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                WhatsApp Bot
              </h1>
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Hubungkan bot dan pantau chat WhatsApp MRC.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={loadWhatsApp}
              variant="outline"
              disabled={loading || loggingOut}
              className="w-fit"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              onClick={handleLogout}
              variant="destructive"
              disabled={loggingOut || status !== "connected"}
              className="w-fit"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {loggingOut ? "Memproses..." : "Keluar Bot"}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          <div>
            <section className="rounded-xl border bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Koneksi
                </h2>
                <span
                  className={`h-3 w-3 rounded-full ${statusClass}`}
                  title={statusLabel}
                />
              </div>
              <div className="flex min-h-[250px] items-center justify-center rounded-lg border bg-white p-4">
                {qr ? (
                  <img
                    src={qr}
                    alt="QR login WhatsApp"
                    className="h-[220px] w-[220px]"
                  />
                ) : (
                  <p className="text-center text-sm text-gray-500">
                    {error ||
                      (status === "connected"
                        ? "Bot sudah terhubung."
                        : "Jalankan bot untuk mendapatkan QR Code.")}
                  </p>
                )}
              </div>
              <div className="mt-4 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                {statusLabel}
              </div>
              {account && (
                <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-800">
                  <div className="font-semibold">
                    {account.name || "WhatsApp MRC"}
                  </div>
                  <div>+{account.number}</div>
                  {connectedAt && (
                    <div className="mt-1 text-xs">
                      Terhubung: {new Date(connectedAt).toLocaleString("id-ID")}
                    </div>
                  )}
                </div>
              )}
            </section>
            <section className="mt-6 rounded-xl border bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-3 font-semibold text-gray-900 dark:text-white">
                Log Notifikasi
              </h2>
              {logs.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Belum ada notifikasi WhatsApp.
                </p>
              ) : (
                <div className="space-y-2">
                  {logs.slice(0, 10).map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between rounded-lg border p-3 text-sm"
                    >
                      <div>
                        <div className="font-medium">
                          {log.type} - {log.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          +{log.recipient} ·{" "}
                          {new Date(log.timestamp).toLocaleString("id-ID")}
                        </div>
                      </div>
                      <span
                        className={
                          log.success ? "text-green-600" : "text-red-600"
                        }
                      >
                        {log.success ? "Terkirim" : "Gagal"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="flex min-h-[560px] flex-col rounded-xl border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b p-5 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Chat WhatsApp
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Pilih percakapan untuk melihat dan membalas chat.
              </p>
            </div>
            <div className="grid min-h-0 flex-1 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="border-b p-3 dark:border-gray-700 lg:border-b-0 lg:border-r">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Percakapan
                </div>
                <div className="relative mb-3">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={conversationSearch}
                    onChange={(event) =>
                      setConversationSearch(event.target.value)
                    }
                    placeholder="Cari nomor atau nama..."
                    aria-label="Cari percakapan"
                    className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none focus:border-green-500 dark:border-gray-600 dark:bg-gray-900"
                  />
                </div>
                <div className="space-y-1 lg:max-h-[450px] lg:overflow-y-auto">
                  {filteredConversations.length === 0 ? (
                    <p className="px-2 py-6 text-center text-sm text-gray-500">
                      {conversations.length === 0
                        ? "Belum ada percakapan."
                        : "Percakapan tidak ditemukan."}
                    </p>
                  ) : (
                    filteredConversations.map((conversation) => (
                      <button
                        key={conversation.jid}
                        type="button"
                        onClick={() => setSelectedJid(conversation.jid)}
                        className={`w-full rounded-lg p-3 text-left transition-colors ${selectedJid === conversation.jid ? "bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "hover:bg-gray-50 dark:hover:bg-gray-700"}`}
                      >
                        <div className="font-medium text-gray-900 dark:text-white">
                          {conversation.name}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          +{conversation.number}
                        </div>
                        <div className="mt-1 truncate text-xs text-gray-500">
                          {conversation.lastMessage}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
              <div className="flex h-[560px] min-h-0 flex-col">
                <div className="border-b px-4 py-3 dark:border-gray-700">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {conversations.find(
                      (conversation) => conversation.jid === selectedJid,
                    )?.name || "Pilih percakapan"}
                  </div>
                  {selectedJid && (
                    <div className="text-xs text-gray-500">
                      +
                      {
                        conversations.find(
                          (conversation) => conversation.jid === selectedJid,
                        )?.number
                      }
                    </div>
                  )}
                </div>
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                  {!selectedJid ? (
                    <p className="py-16 text-center text-sm text-gray-500">
                      Pilih percakapan untuk melihat chat.
                    </p>
                  ) : chatLoading ? (
                    <p className="py-16 text-center text-sm text-gray-500">
                      Memuat chat...
                    </p>
                  ) : chatMessages.length === 0 ? (
                    <p className="py-16 text-center text-sm text-gray-500">
                      Belum ada pesan.
                    </p>
                  ) : (
                    chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === "assistant" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${message.role === "assistant" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100"}`}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <form
                  onSubmit={handleSendMessage}
                  className="flex gap-2 border-t p-3 dark:border-gray-700"
                >
                  <input
                    value={messageDraft}
                    onChange={(event) => setMessageDraft(event.target.value)}
                    placeholder={
                      selectedJid ? "Tulis balasan..." : "Pilih percakapan"
                    }
                    disabled={!selectedJid || sendingMessage}
                    maxLength={2000}
                    className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:border-green-500 dark:border-gray-600 dark:bg-gray-900"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={
                      !selectedJid || !messageDraft.trim() || sendingMessage
                    }
                    aria-label="Kirim pesan"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
