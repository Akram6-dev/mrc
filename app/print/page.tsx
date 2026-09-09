"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatDate, isOverdue } from "@/lib/utils";
import api from "@/lib/api";
import type { LoanWithDetails } from "@/lib/types";

export default function PrintRiwayatPage() {
  const [loans, setLoans] = useState<LoanWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : undefined;

  // Read filters from query string
  const search = searchParams?.get("search")?.toLowerCase() || "";
  const status = searchParams?.get("status") || "all";
  const month = searchParams?.get("month") || "all";
  const sort = (searchParams?.get("sort") as "asc" | "desc") || "desc";

  useEffect(() => {
    async function loadLoansWithDetails() {
      try {
        setLoading(true);
        const [loansData, items, borrowers] = await Promise.all([
          api.getLoanHistory(),
          api.getItems(true),
          api.getBorrowers(true),
        ]);

        // Index borrowers and items by id for fast lookup
        const borrowerMap = Object.fromEntries(
          (borrowers || []).map((b) => [b.id?.toString(), b]),
        );
        const itemMap = Object.fromEntries(
          (items || []).map((item) => [item.id?.toString(), item]),
        );

        // Build a lookup from serial (rfidCode or sn) -> parent item name
        const serialLookup: Record<string, string> = {};
        (items || []).forEach((parent: any) => {
          if (Array.isArray(parent.items)) {
            parent.items.forEach((s: any) => {
              if (s.rfidCode) serialLookup[String(s.rfidCode)] = parent.name;
              if (s.sn) serialLookup[String(s.sn)] = parent.name;
            });
          }
        });

        // Gabungkan semua data ke satu array
        const mapped = (loansData || []).map((loan: any) => {
          const borrower: any = loan.borrowerId
            ? (borrowerMap[loan.borrowerId?.toString()] ?? {})
            : {};
          // Build itemDetails using latest shapes and fallbacks for legacy shapes
          let rawItems: any[] = Array.isArray(loan.items) ? loan.items : [];

          // Normalize each raw item into { name, quantity }
          const normalized: Array<{ name: string; quantity: number }> =
            rawItems.map((it: any) => {
              // Prefer resolving by serial (rfidCode or sn) using serialLookup
              if (it.rfidCode && serialLookup[String(it.rfidCode)]) {
                return {
                  name: serialLookup[String(it.rfidCode)],
                  quantity: Number(it.quantity ?? it.qty ?? 1),
                };
              }
              if (it.sn && serialLookup[String(it.sn)]) {
                return {
                  name: serialLookup[String(it.sn)],
                  quantity: Number(it.quantity ?? it.qty ?? 1),
                };
              }

              // Latest shape: item has itemId which is id string and we look up itemMap
              if (it.itemId && typeof it.itemId === "string") {
                const base = itemMap[it.itemId.toString()] ?? {};
                return {
                  name:
                    base.name ||
                    (base as any).itemName ||
                    it.name ||
                    it.itemName ||
                    "Unknown",
                  quantity: Number(it.quantity ?? it.qty ?? 1),
                };
              }
              // Newer: itemId might be an object with id
              if (it.itemId && typeof it.itemId === "object") {
                const base = itemMap[it.itemId.id?.toString()] ?? {};
                return {
                  name:
                    base.name ||
                    (base as any).itemName ||
                    it.name ||
                    it.itemName ||
                    "Unknown",
                  quantity: Number(it.quantity ?? it.qty ?? 1),
                };
              }
              // Legacy: item has name and quantity fields directly
              const name =
                it.name ||
                it.itemName ||
                (itemMap[it.itemId?.toString()] &&
                  itemMap[it.itemId?.toString()].name) ||
                "Unknown";
              const qty = Number(it.quantity ?? it.qty ?? 1);
              return { name, quantity: qty };
            });

          // Aggregate by name
          const aggMap: Record<string, number> = {};
          normalized.forEach((n) => {
            const key = (n.name || "Unknown").trim();
            if (!key) return;
            aggMap[key] =
              (aggMap[key] || 0) +
              (Number.isFinite(n.quantity) ? n.quantity : 1);
          });

          const aggregatedItems = Object.keys(aggMap).map((name) => ({
            name,
            quantity: aggMap[name],
          }));

          // Keep itemDetails for backwards compatibility in case other code expects it
          const itemDetails = normalized.map((n) => ({
            name: n.name,
            quantity: n.quantity,
          }));

          return {
            ...loan,
            borrower,
            itemDetails,
            aggregatedItems,
          };
        });
        setLoans(mapped as any);
      } finally {
        setLoading(false);
      }
    }
    loadLoansWithDetails();
  }, []);

  // Apply filter logic like riwayat
  let filtered = loans;
  if (search && search.trim() !== "") {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter((loan) => {
      const borrowerName =
        typeof loan.borrower?.name === "string"
          ? loan.borrower.name.toLowerCase()
          : "";
      const borrowerNIP =
        typeof loan.borrower?.nip === "string"
          ? loan.borrower.nip.toLowerCase()
          : "";
      const borrowerOfficerId =
        typeof loan.borrower?.officerId === "string"
          ? loan.borrower.officerId.toLowerCase()
          : "";
      const itemMatch = loan.itemDetails?.some((item: any) =>
        typeof item.name === "string"
          ? item.name.toLowerCase().includes(q)
          : false,
      );
      return (
        borrowerName.includes(q) ||
        itemMatch ||
        borrowerNIP.includes(q) ||
        borrowerOfficerId.includes(q)
      );
    });
  }
  if (status !== "all") {
    filtered = filtered.filter((loan) => loan.status === status);
  }
  if (month !== "all") {
    filtered = filtered.filter((loan) => {
      const date = new Date(loan.borrowDate);
      const m = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      return m === month;
    });
  }
  // Sort by createdAt
  filtered = [...filtered].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return sort === "desc" ? bTime - aTime : aTime - bTime;
  });
  const printLoans = filtered;
  const today = new Date();
  const tanggalCetak =
    today.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }) +
    " " +
    today.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        window.print();
      }, 300);
    }
  }, [loading]);

  if (loading) {
    return (
      <div style={{ fontFamily: "inherit", textAlign: "center", padding: 40 }}>
        Memuat data...
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "inherit",
        background: "#fff",
        color: "#000",
        minHeight: "100vh",
        padding: 0,
        margin: 0,
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 32,
            borderBottom: "1px solid #e5e7eb",
            paddingBottom: 16,
          }}
        >
          <img
            src="/mrc.png"
            alt="Logo MRC"
            style={{ width: 100, height: 60, objectFit: "contain" }}
          />
          <div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 700,
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Riwayat Peminjaman MRC
            </h1>
            <div style={{ fontSize: 14, color: "#444" }}>
              Dicetak: {tanggalCetak}
            </div>
          </div>
        </div>
        {/* Modern Table */}
        <div style={{ overflowX: "auto" }}>
          <table className="modern-print-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Peminjam</th>
                <th>Barang</th>
                <th>Tgl Pinjam</th>
                <th>Jatuh Tempo</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {printLoans.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{ textAlign: "center", padding: 24, color: "#aaa" }}
                  >
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                printLoans.map((loan, idx) => (
                  <tr key={loan.id}>
                    <td>{idx + 1}</td>
                    <td style={{ textAlign: "left" }}>
                      <div style={{ fontWeight: 600, color: "#111" }}>
                        {typeof loan.borrower?.name === "string" &&
                        loan.borrower.name.trim()
                          ? loan.borrower.name
                          : "Peminjam"}
                      </div>
                      <div style={{ fontSize: 12, color: "#666" }}>
                        {loan.borrower?.nip && loan.borrower?.officerId
                          ? `${loan.borrower.nip} - ${loan.borrower.officerId}`
                          : loan.borrower?.nip
                            ? loan.borrower.nip
                            : loan.borrower?.officerId
                              ? loan.borrower.officerId
                              : null}
                      </div>
                    </td>
                    <td>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {(
                          ((loan as any).aggregatedItems ||
                            (loan as any).itemDetails ||
                            []) as any[]
                        ).map((item: any, i: number) => (
                          <li
                            key={item.id ?? item.name ?? i}
                            style={{ color: "#222" }}
                          >
                            {item.name}{" "}
                            <span style={{ color: "#888" }}>
                              {item.quantity ?? item.qty ?? 1}x
                            </span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td>{formatDate(loan.borrowDate)}</td>
                    <td>{formatDate(loan.dueDate)}</td>
                    <td>
                      {loan.status === "dikembalikan"
                        ? "Dikembalikan"
                        : isOverdue(loan.dueDate)
                          ? "Terlambat"
                          : "Dipinjam"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <style>{`
          .modern-print-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            border: 2px solid #d1d5db;
            border-radius: 16px;
            font-size: 15px;
            background: #fff;
            overflow: hidden;
            box-shadow: 0 2px 8px 0 #0001;
          }
          .modern-print-table thead th {
            position: sticky;
            top: 0;
            background: #f3f4f6;
            border-bottom: 2px solid #d1d5db;
            padding: 12px 8px;
            font-weight: 700;
            text-align: center;
            z-index: 1;
          }
          .modern-print-table tbody td {
            border-bottom: 2px solid #e5e7eb;
            padding: 10px 8px;
            text-align: center;
            background: #fff;
          }
          .modern-print-table tbody tr:nth-child(even) td {
            background: #f9fafb;
          }
          .modern-print-table tbody tr:last-child td {
            border-bottom: none;
          }
          .modern-print-table td ul {
            list-style: disc;
            margin: 0;
            padding-left: 18px;
            text-align: left;
          }
          .modern-print-table td {
            border-right: 2px solid #e5e7eb;
          }
          .modern-print-table td:last-child, .modern-print-table th:last-child {
            border-right: none;
          }
          .modern-print-table th:first-child, .modern-print-table td:first-child {
            border-left: none;
          }
        `}</style>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  border: "1px solid #d1d5db",
  padding: "8px",
  fontWeight: 600,
  textAlign: "center",
  background: "#f3f4f6",
  borderTopLeftRadius: 0,
  borderTopRightRadius: 0,
};
const tdStyleCenter: React.CSSProperties = {
  border: "1px solid #d1d5db",
  padding: "8px",
  textAlign: "center",
};
const tdStyleLeft: React.CSSProperties = {
  border: "1px solid #d1d5db",
  padding: "8px",
  textAlign: "left",
};
