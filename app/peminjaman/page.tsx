"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Package, User, X } from "lucide-react";
import Loading from "@/components/ui/loading";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { DatePickerField } from "./DatePickerField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { auth } from "@/lib/auth";
import api from "@/lib/api";
import type { Item, Borrower, Loan, LoanItem } from "@/lib/types";

export default function PeminjamanPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  // Form state
  const [selectedBorrower, setSelectedBorrower] = useState("");
  const [loanItems, setLoanItems] = useState<LoanItem[]>([
    { itemId: "", quantity: 1, serialNumber: "" },
  ]);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [settings, setSettings] = useState<any>(null);
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");

  // Search states
  const [borrowerSearch, setBorrowerSearch] = useState("");
  // Popover state (must be inside component)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Define loadData to fetch items and borrowers
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [itemsRes, borrowersRes] = await Promise.all([
        api.getItems(),
        api.getBorrowers(),
      ]);
      setItems(itemsRes);
      setBorrowers(borrowersRes);
    } catch (err) {
      setError("Gagal memuat data barang atau peminjam");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push("/login");
      return;
    }

    fetch("/api/settings")
      .then((res) => res.json())
      .then((settings) => {
        setSettings(settings);
        const days = settings?.system?.defaultLoanDays || 7;
        const defaultDueDate = new Date();
        defaultDueDate.setDate(defaultDueDate.getDate() + days);
        setDueDate(defaultDueDate);
        loadData();
      })
      .catch(() => {
        setSettings(null);
        const defaultDueDate = new Date();
        defaultDueDate.setDate(defaultDueDate.getDate() + 7);
        setDueDate(defaultDueDate);
        loadData();
      });
  }, [router]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      // Validate items
      const validItems = loanItems.filter(
        (item) => item.itemId && item.quantity > 0
      );
      if (validItems.length === 0) {
        throw new Error("Pilih minimal satu barang untuk dipinjam");
      }

      // Check stock availability
      for (const loanItem of validItems) {
        const itemData = items.find((item) => item.id === loanItem.itemId);
        if (!itemData) {
          throw new Error("Barang tidak ditemukan");
        }
        if (loanItem.quantity > itemData.stock) {
          throw new Error(
            `Stok ${itemData.name} tidak mencukupi (tersedia: ${itemData.stock})`
          );
        }
      }

      // Format borrowDate and dueDate with time in Asia/Jakarta (WIB), 24-hour format
      const nowJakarta = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
      );
      const dueJakarta = dueDate
        ? new Date(
            new Date(dueDate).toLocaleString("en-US", {
              timeZone: "Asia/Jakarta",
            })
          )
        : nowJakarta;

      function toWIBISOString(date: Date) {
        // ISO string in Jakarta time, but with local time (not UTC)
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        const hh = String(date.getHours()).padStart(2, "0");
        const mm = String(date.getMinutes()).padStart(2, "0");
        const ss = String(date.getSeconds()).padStart(2, "0");
        return `${y}-${m}-${d}T${hh}:${mm}:${ss}+07:00`; // WIB offset
      }

      const loanData: Omit<Loan, "id" | "createdAt" | "updatedAt"> = {
        borrowerId: selectedBorrower,
        items: validItems,
        borrowDate: toWIBISOString(nowJakarta),
        dueDate: toWIBISOString(dueJakarta),
        status: "dipinjam",
        purpose: purpose,
        notes: notes || undefined,
      };

      const createdLoan = await api.createLoan(loanData);
      try {
        // Ambil data peminjam
        const borrower = borrowers.find(b => b.id === selectedBorrower);
        // Format items
        const itemsBody = validItems.map(item => {
          const itemData = items.find(i => i.id === item.itemId);
          return {
            item_name: itemData?.name || "Barang",
            qty: item.quantity
          };
        });
        // Compose body
        const postBody = {
          id: createdLoan?.id || "",
          number: borrower?.phone || "",
          name: borrower?.name || "",
          start_date: toWIBISOString(nowJakarta),
          due_date: toWIBISOString(dueJakarta),
          items: itemsBody,
          purpose: purpose,
          notes: notes || undefined
        };
        await fetch("http://145.10.0.6:3000/pinjam", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(postBody)
        });
      } catch (err) {
        console.error("Gagal POST ke API eksternal:", err);
      }

      // Update item stocks
      for (const loanItem of validItems) {
        const itemData = items.find((item) => item.id === loanItem.itemId);
        if (itemData) {
          await api.updateItem(loanItem.itemId, {
            stock: itemData.stock - loanItem.quantity,
          });
        }
      }

      setSuccess("Peminjaman berhasil dicatat!");

      // Reset form
      setSelectedBorrower("");
      setLoanItems([{ itemId: "", quantity: 1, serialNumber: "" }]);
      // Gunakan settings yang sudah di-fetch
      const days = settings?.system?.defaultLoanDays || 7;
      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + days);
      setDueDate(newDueDate);
      setPurpose("");
      setNotes("");
      setBorrowerSearch("");

      // Reload data
      loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mencatat peminjaman"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const addLoanItem = () => {
    setLoanItems([...loanItems, { itemId: "", quantity: 1, serialNumber: "" }]);
  };

  const removeLoanItem = (index: number) => {
    if (loanItems.length > 1) {
      setLoanItems(loanItems.filter((_, i) => i !== index));
    }
  };

  const updateLoanItem = (
    index: number,
    field: keyof LoanItem,
    value: string | number
  ) => {
    const updatedItems = [...loanItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setLoanItems(updatedItems);
  };

  const filteredBorrowers =
    borrowerSearch.trim() === ""
      ? borrowers
      : borrowers.filter((borrower) => {
          const q = borrowerSearch.trim().toLowerCase();
          const keywords = q.split(/\s+/).filter(Boolean);
          // Gabungkan semua field jadi satu string, pastikan string
          const name =
            typeof borrower.name === "string"
              ? borrower.name.toLowerCase()
              : "";
          const nip =
            typeof borrower.nip === "string" ? borrower.nip.toLowerCase() : "";
          const officerId =
            typeof borrower.officerId === "string"
              ? borrower.officerId.toLowerCase()
              : "";
          const combined = `${name} ${nip} ${officerId}`;
          // Semua kata kunci harus ada di string gabungan
          return keywords.every((word) => combined.includes(word));
        });

  // For keyboard navigation
  const [activeBorrowerIdx, setActiveBorrowerIdx] = useState(0);
  useEffect(() => {
    setActiveBorrowerIdx(0);
  }, [borrowerSearch, isLoading]);

  const selectedBorrowerData = borrowers.find(
    (borrower) => borrower.id === selectedBorrower
  );

  if (!auth.isAuthenticated()) {
    return null;
  }

  // Show toast for error
  useEffect(() => {
    if (error) {
      toast.error(error, { duration: 6000, className: "toast-error" });
    }
  }, [error]);

  // Show toast for success
  useEffect(() => {
    if (success) {
      toast.success(success, { duration: 6000, className: "toast-success" });
    }
  }, [success]);

  if (isLoading) {
    return (
      <div className="p-6">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-[90rem] mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fade-in duration-200">
        {/* Compact Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Form Peminjaman
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Catat peminjaman barang baru
          </p>
        </div>

        {/* Alert diganti sonner toast */}

        <div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Borrower Selection - Popover Command Autocomplete */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                <Label className="text-sm font-medium text-gray-900 dark:text-white">
                  Nama Peminjam
                </Label>
              </div>
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isPopoverOpen}
                    className="w-full h-9 text-sm justify-between bg-white text-primary-foreground hover:bg-primary/90 dark:bg-gray-700 dark:text-primary-foreground dark:hover:bg-gray-600 border dark:border-gray-600 transition-colors"
                    onClick={() => setIsPopoverOpen(true)}
                  >
                    {selectedBorrowerData ? (
                      `${selectedBorrowerData.name}`
                    ) : (
                      <span className="text-gray-400">
                        Cari atau pilih peminjam...
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 max-h-72 overflow-auto z-50 min-w-[320px]">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Cari nama atau NIP..."
                      value={borrowerSearch}
                      onValueChange={setBorrowerSearch}
                      autoFocus
                      inputMode="search"
                      ref={(input) => {
                        // Autofocus on mount if popover is open (first render)
                        if (input && isPopoverOpen) {
                          input.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        const q = borrowerSearch.trim().toLowerCase();
                        const keywords = q.split(/\s+/).filter(Boolean);
                        const filtered =
                          q === ""
                            ? borrowers
                            : borrowers.filter((b) => {
                                const name =
                                  typeof b.name === "string"
                                    ? b.name.toLowerCase()
                                    : "";
                                const nip =
                                  typeof b.nip === "string"
                                    ? b.nip.toLowerCase()
                                    : "";
                                const officerId =
                                  typeof b.officerId === "string"
                                    ? b.officerId.toLowerCase()
                                    : "";
                                const combined = `${name} ${nip} ${officerId}`;
                                return keywords.every((word) =>
                                  combined.includes(word)
                                );
                              });
                        if (filtered.length === 0) return;
                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setActiveBorrowerIdx((idx) =>
                            Math.min(idx + 1, filtered.length - 1)
                          );
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setActiveBorrowerIdx((idx) => Math.max(idx - 1, 0));
                        } else if (e.key === "Enter") {
                          e.preventDefault();
                          const selected = filtered[activeBorrowerIdx];
                          if (selected) {
                            setSelectedBorrower(selected.id);
                            setIsPopoverOpen(false);
                            setBorrowerSearch("");
                          }
                        } else if (e.key === "Tab") {
                          setIsPopoverOpen(false);
                        }
                      }}
                    />
                    <CommandList className="max-h-60 overflow-auto">
                      {(() => {
                        const q = borrowerSearch.trim().toLowerCase();
                        const keywords = q.split(/\s+/).filter(Boolean);
                        const filtered =
                          q === ""
                            ? borrowers
                            : borrowers.filter((b) => {
                                const name =
                                  typeof b.name === "string"
                                    ? b.name.toLowerCase()
                                    : "";
                                const nip =
                                  typeof b.nip === "string"
                                    ? b.nip.toLowerCase()
                                    : "";
                                const officerId =
                                  typeof b.officerId === "string"
                                    ? b.officerId.toLowerCase()
                                    : "";
                                const combined = `${name} ${nip} ${officerId}`;
                                return keywords.every((word) =>
                                  combined.includes(word)
                                );
                              });
                        if (filtered.length === 0) {
                          return (
                            <CommandEmpty>
                              Peminjam tidak ditemukan.
                            </CommandEmpty>
                          );
                        }
                        // itemRefs untuk scroll ke item aktif
                        const itemRefs = [];
                        return (
                          <CommandGroup>
                            {filtered.map((borrower, idx) => (
                              <CommandItem
                                key={borrower.id}
                                value={borrower.id}
                                onSelect={() => {
                                  setSelectedBorrower(borrower.id);
                                  setIsPopoverOpen(false);
                                  setBorrowerSearch("");
                                }}
                                ref={(el) => {
                                  itemRefs[idx] = el;
                                  if (idx === activeBorrowerIdx && el)
                                    el.scrollIntoView({ block: "nearest" });
                                }}
                                className={
                                  idx === activeBorrowerIdx
                                    ? "bg-accent-100 dark:bg-accent-900/20 text-accent-700 dark:text-accent-200"
                                    : ""
                                }
                              >
                                <div className="flex flex-col text-left">
                                  <span className="font-medium">
                                    {borrower.name || "-"}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {borrower?.nip && borrower?.officerId
                                      ? `${borrower.nip} - ${borrower.officerId}`
                                      : borrower?.nip
                                      ? borrower.nip
                                      : borrower?.officerId
                                      ? borrower.officerId
                                      : null}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        );
                      })()}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedBorrowerData && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className="text-green-700 dark:text-green-400">
                      <strong>Nama:</strong> {selectedBorrowerData.name}
                    </span>
                    <span className="text-green-700 dark:text-green-400">
                      <strong>NIP:</strong> {selectedBorrowerData.nip}
                    </span>
                    <span className="text-green-700 dark:text-green-400">
                      <strong>ID Pegawai:</strong>{" "}
                      {selectedBorrowerData.officerId}
                    </span>
                    <span className="text-green-700 dark:text-green-400">
                      <strong>No. HP:</strong>{" "}
                      {selectedBorrowerData.phone}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Items Selection - Compact */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                  <Label className="text-sm font-medium text-gray-900 dark:text-white">
                    Daftar Barang
                  </Label>
                </div>
                <button
                  type="button"
                  onClick={addLoanItem}
                  className="btn-outline text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Tambah
                </button>
              </div>

              <div className="space-y-3">
                {loanItems.map((loanItem, index) => {
                  const selectedItem = items.find(
                    (item) => item.id === loanItem.itemId
                  );
                  return (
                    <div
                      key={index}
                      className="p-3 bg-white dark:bg-gray-800 rounded-lg space-y-3 border-l-4 border-accent-600 dark:border-accent-400 pl-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="py-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                          Barang #{index + 1}
                        </span>
                        {loanItems.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeLoanItem(index)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                        <Select
                          value={loanItem.itemId}
                          onValueChange={(value) =>
                            updateLoanItem(index, "itemId", value)
                          }
                          required
                        >
                          <SelectTrigger className="h-9 text-sm bg-gray-50">
                            <SelectValue placeholder="-- Pilih barang --" />
                          </SelectTrigger>
                          <SelectContent>
                            {items.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.name} (Stok: {item.stock})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Input
                          type="number"
                          min="0"
                          max={(() => {
                            const stock = selectedItem?.stock || 1;
                            const maxLoan = settings?.system?.maxLoanItems;
                            return Math.min(stock, maxLoan);
                          })()}
                          value={loanItem.quantity === 0 ? "" : loanItem.quantity.toString()}
                          onChange={(e) => {
                            const val = e.target.value;
                            // Allow empty string (user clears input)
                            if (val === "") {
                              updateLoanItem(index, "quantity", 0);
                            } else {
                              const num = Number.parseInt(val);
                              updateLoanItem(index, "quantity", isNaN(num) ? 0 : num);
                            }
                          }}
                          placeholder="Jumlah"
                          className="h-9 text-sm bg-gray-50"
                          required
                        />

                        <Input
                          type="text"
                          placeholder="No. Seri (opsional)"
                          value={loanItem.serialNumber || ""}
                          onChange={(e) =>
                            updateLoanItem(
                              index,
                              "serialNumber",
                              e.target.value
                            )
                          }
                          className="h-9 text-sm bg-gray-50"
                        />
                      </div>

                      {selectedItem && (
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                          <span className="text-blue-700 dark:text-blue-400">
                            Kategori: {selectedItem.category} - Stok:{" "}
                            {selectedItem.stock}{" "}
                            {selectedItem.description
                              ? `| ${selectedItem.description}`
                              : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Due Date, Purpose, Notes - Compact Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-900 dark:text-white">
                  Jatuh Tempo
                </Label>
                <DatePickerField
                  value={dueDate}
                  onChange={setDueDate}
                  placeholder="Pilih tanggal jatuh tempo..."
                  minDate={new Date()}
                  className="bg-white text-primary-foreground hover:bg-primary/90 dark:bg-gray-700 dark:text-primary-foreground dark:hover:bg-gray-600 border dark:border-gray-600 transition-colors"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-900 dark:text-white">
                  Keperluan
                </Label>
                <Input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="KBM"
                  className="h-9 text-sm mt-1"
                  required
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-900 dark:text-white">
                  Catatan
                </Label>
                <Input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan tambahan..."
                  className="h-9 text-sm mt-1"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  !selectedBorrower ||
                  loanItems.every((item) => !item.itemId)
                }
                className="w-max items-center px-5 py-2 rounded-lg font-medium bg-accent-600 text-white hover:bg-accent-700 focus:ring-2 focus:ring-accent-400 transition-colors shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Memproses...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Catat Peminjaman
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}