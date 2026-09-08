"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Package, User, X } from "lucide-react";
import {
  Laptop,
  Cable,
  Projector,
  HdmiPort,
  Plug,
  Mouse,
  Tablet,
  Printer,
  Monitor,
  Keyboard,
  Speaker,
  Presentation,
  MicVocal,
} from "lucide-react";

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
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import Loading from "@/components/ui/loading";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { DatePickerField } from "./DatePickerField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SerialAutocomplete from "./SerialAutocomplete";
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
import { getColorFromName } from "@/lib/utils";


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
  // Loan per serial number
  const [loanItems, setLoanItems] = useState<LoanItem[]>([
    { rfidCode: "", note: "" },
  ]);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [settings, setSettings] = useState<any>(null);
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");

  // Search states
  const [borrowerSearch, setBorrowerSearch] = useState("");
  // Popover state (must be inside component)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Serial popover/search state (move to top-level to avoid Rules of Hooks error)
  const [isSerialPopoverOpen, setIsSerialPopoverOpen] = useState(false);
  const [serialSearch, setSerialSearch] = useState("");
  const [activeSerialIdx, setActiveSerialIdx] = useState(0);

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
        const days = settings?.system?.defaultLoanDays || 0;
        const defaultDueDate = new Date();
        defaultDueDate.setDate(defaultDueDate.getDate() + days);
        setDueDate(defaultDueDate);
        loadData();
      })
      .catch(() => {
        setSettings(null);
        const defaultDueDate = new Date();
        defaultDueDate.setDate(defaultDueDate.getDate() + 0);
        setDueDate(defaultDueDate);
        loadData();
      });
  }, [router]);
  // State untuk alert dialog konfirmasi
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingSubmitEvent, setPendingSubmitEvent] = useState<React.FormEvent | null>(null);

  // Fungsi submit utama
  const doSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const borrower = borrowers.find((entry) => entry.id === selectedBorrower);
      if (!borrower) {
        throw new Error("Pilih peminjam terlebih dahulu");
      }
      if (borrower.isFrozen) {
        throw new Error("Akun peminjam sedang nonaktif dan tidak dapat dipilih");
      }
      // Validate serials
      const validItems = loanItems.filter((item) => item.rfidCode);
      if (validItems.length === 0) {
        throw new Error("Pilih minimal satu serial number untuk dipinjam");
      }
      // Check serial availability
      for (const loanItem of validItems) {
        const serial = items.flatMap(i => i.items || []).find(s => s.rfidCode === loanItem.rfidCode);
        if (!serial) {
          throw new Error(`Serial number ${loanItem.rfidCode} tidak ditemukan`);
        }
        if (serial.status !== 1) {
          throw new Error(`Serial number ${loanItem.rfidCode} tidak tersedia untuk dipinjam`);
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
        items: validItems.map(({ rfidCode, note }) => ({ rfidCode, note })),
        borrowDate: toWIBISOString(nowJakarta),
        dueDate: toWIBISOString(dueJakarta),
        status: "dipinjam",
        purpose: purpose,
        notes: notes || undefined,
      };

      const createdLoan = await api.createLoan(loanData);
      // Kirim pesan ke endpoint eksternal jika settings.messages.loanMessage true
      if (settings?.messages?.loanMessage) {
        try {
          // Ambil data peminjam
          const borrower = borrowers.find(b => b.id === selectedBorrower);
          // Format items
          // Gabungkan serial dengan nama barang yang sama
          const itemsBody = Object.values(
            validItems.reduce((acc, item) => {
              // Temukan info barang
              const found = items.flatMap(i => (i.items || []).map(s => ({
                itemName: i.name,
                rfidCode: s.rfidCode,
                category: i.category,
                description: i.description
              }))).find(s => s.rfidCode === item.rfidCode);

              const key = found?.itemName || "Barang";
              if (!acc[key]) {
                acc[key] = {
                  item_name: key,
                  qty: 0,
                };
              }
              acc[key].qty += 1;
              return acc;
            }, {} as Record<string, { item_name: string; qty: number }>)
          ).map(group => ({
            item_name: group.item_name,
            qty: group.qty,
          }));
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
          await fetch("/external/pinjam", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(postBody)
          });
        } catch (err) {
          console.error("Gagal POST ke API eksternal:", err);
        }
      }

      // Update hanya item yang punya serial yang dipinjam
      for (const item of items) {
        if (!item.items) continue;
        const hasBorrowedSerial = item.items.some(s => validItems.some(li => li.rfidCode === s.rfidCode));
        if (!hasBorrowedSerial) continue;
        const updatedSerials = item.items.map(s => {
          const isBorrowed = validItems.some(li => li.rfidCode === s.rfidCode);
          if (isBorrowed) {
            return { ...s, status: 0 as 0, loanId: createdLoan.id };
          }
          return s;
        });
        await api.updateItem(item.id, { items: updatedSerials });
      }

      setSuccess("Peminjaman berhasil dicatat!");

      // Reset form
      setSelectedBorrower("");
      setLoanItems([{ rfidCode: "", note: "" }]);
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

  // Handler submit form
  const handleSubmit = (e: React.FormEvent) => {
    if (settings?.system?.borrowConfirmation) {
      setPendingSubmitEvent(e);
      setShowConfirmDialog(true);
    } else {
      doSubmit(e);
    }
  };

  const addLoanItem = () => {
    setLoanItems([...loanItems, { rfidCode: "", note: "" }]);
  };

  const removeLoanItem = (index: number) => {
    if (loanItems.length > 1) {
      setLoanItems(loanItems.filter((_, i) => i !== index));
    }
  };

  const updateLoanItem = (
    index: number,
    field: keyof LoanItem,
    value: string
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
        const rfid =
          typeof borrower.rfid === "string" ? borrower.rfid.toLowerCase() : "";

        const combined = `${name} ${nip} ${officerId} ${rfid}`;
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
                              const rfid =
                                typeof b.rfid === "string"
                                  ? b.rfid.toLowerCase()
                                  : "";
                              const combined = `${name} ${nip} ${officerId} ${rfid}`;
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
                          if (selected && !selected.isFrozen) {
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
                              const rfid =
                                typeof b.rfid === "string"
                                  ? b.rfid.toLowerCase()
                                  : "";
                              const combined = `${name} ${nip} ${officerId} ${rfid}`;
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
                                disabled={borrower.isFrozen}
                                onSelect={() => {
                                  if (borrower.isFrozen) return;
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
                                  `${idx === activeBorrowerIdx ? "bg-accent-100 dark:bg-accent-900/20 text-accent-700 dark:text-accent-200" : ""} ${borrower.isFrozen ? "opacity-50 cursor-not-allowed" : ""}`
                                }
                              >
                                <div className="flex flex-col text-left">
                                  <span className="font-medium">
                                    {borrower.name || "-"}{borrower.isFrozen ? " (Nonaktif)" : ""}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* LEFT: List barang yang dipinjam */}
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Package className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                    <Label className="text-sm font-medium text-gray-900 dark:text-white">
                      Tambah Serial Dipinjam
                    </Label>
                  </div>
                  {/* Serial Search Popover, same as borrower search */}
                  {(() => {
                    // Flat list of available serials
                    const availableSerials = items
                      .flatMap((item) => (item.items || []).map((serial) => ({
                        ...serial,
                        itemName: item.name,
                        itemId: item.id,
                        category: item.category,
                        description: item.description,
                      })))
                      .filter((serial) => serial.status === 1 && !loanItems.some(li => li.rfidCode === serial.rfidCode));
                    // Filter by search
                    const filtered = serialSearch.trim() === ""
                      ? availableSerials
                      : availableSerials.filter((s) => {
                        const q = serialSearch.trim().toLowerCase();
                        return (
                          String(s.rfidCode).toLowerCase().includes(q) ||
                          (s.itemName || "").toLowerCase().includes(q)
                        );
                      });
                    // Handler
                    const handleSerialKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (filtered.length === 0) return;
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setActiveSerialIdx((idx) => Math.min(idx + 1, filtered.length - 1));
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setActiveSerialIdx((idx) => Math.max(idx - 1, 0));
                      } else if (e.key === "Enter") {
                        e.preventDefault();
                        const selected = filtered[activeSerialIdx];
                        if (selected) {
                          setLoanItems((prev) => [...prev, { rfidCode: selected.rfidCode, note: "" }]);
                          setSerialSearch("");
                          setActiveSerialIdx(0);
                          setIsSerialPopoverOpen(false);
                        }
                      } else if (e.key === "Tab") {
                        setIsSerialPopoverOpen(false);
                      }
                    };
                    return (
                      <Popover open={isSerialPopoverOpen} onOpenChange={setIsSerialPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isSerialPopoverOpen}
                            className="w-full h-9 text-sm justify-between bg-white text-primary-foreground hover:bg-primary/90 dark:bg-gray-700 dark:text-primary-foreground dark:hover:bg-gray-600 border dark:border-gray-600 transition-colors"
                            onClick={() => setIsSerialPopoverOpen(true)}
                          >
                            {serialSearch ? (
                              serialSearch
                            ) : (
                              <span className="text-gray-400">Cari atau scan serial number...</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 max-h-72 overflow-auto z-50 min-w-[320px]">
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Cari serial number atau nama barang..."
                              value={serialSearch}
                              onValueChange={setSerialSearch}
                              autoFocus
                              inputMode="search"
                              onKeyDown={handleSerialKeyDown}
                            />
                            <CommandList className="max-h-60 overflow-auto">
                              {filtered.length === 0 ? (
                                <CommandEmpty>Serial tidak ditemukan.</CommandEmpty>
                              ) : (
                                <CommandGroup>
                                  {filtered.map((serial, idx) => (
                                    <CommandItem
                                      key={serial.rfidCode}
                                      value={serial.rfidCode}
                                      onSelect={() => {
                                        setLoanItems((prev) => [...prev, { rfidCode: serial.rfidCode, note: "" }]);
                                        setSerialSearch("");
                                        setActiveSerialIdx(0);
                                        setIsSerialPopoverOpen(false);
                                      }}
                                      ref={el => {
                                        if (idx === activeSerialIdx && el) el.scrollIntoView({ block: "nearest" });
                                      }}
                                      className={idx === activeSerialIdx ? "bg-accent-100 dark:bg-accent-900/20 text-accent-700 dark:text-accent-200" : ""}
                                    >
                                      <span className="font-medium">{serial.itemName}</span>
                                      <span className="ml-2 text-xs text-gray-500">{serial.sn} | {serial.rfidCode}</span>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    );
                  })()}
                  {/* List of added serials */}
                  <div className="space-y-3 mt-2">
                    {loanItems.map((loanItem, index) => {
                      const serial = items
                        .flatMap((item) => (item.items || []).map((s) => ({
                          ...s,
                          itemName: item.name,
                          itemId: item.id,
                          category: item.category,
                          description: item.description,
                          image: item.image,
                          icon: item.icon,
                        })))
                        .find((s) => s.rfidCode === loanItem.rfidCode);
                      if (!serial) return null;
                      return (
                        <div
                          key={index}
                          className="p-3 bg-white dark:bg-gray-800 rounded-lg border-l-4 border-accent-600 dark:border-accent-400 pl-4"
                        >
                          <div className="flex items-center gap-3 justify-between">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {/* Item image, fallback to icon */}
                              {serial.image ? (
                                <img
                                  src={serial.image.startsWith("/assets/") ? serial.image : `/assets/img/${serial.image}`}
                                  alt={serial.itemName}
                                  className="w-12 h-12 object-cover rounded-md bg-gray-100 dark:bg-gray-900 flex-shrink-0"
                                />
                              ) : (
                                (() => {
                                  const iconKey = serial.icon || "laptop";
                                  const IconComponent = ICON_OPTIONS.find(opt => opt.value === iconKey)?.icon || Package;
                                  return (
                                    <span className="w-12 h-12 flex items-center justify-center rounded-md bg-gray-100 dark:bg-gray-900 text-gray-400">
                                      <IconComponent className="w-6 h-6" />
                                    </span>
                                  );
                                })()
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {serial.itemName}
                                  </span>
                                  <span className="text-xs px-2 py-0.5 rounded bg-accent-100 dark:bg-accent-900/20 text-accent-700 dark:text-accent-200 ml-1">
                                    SN: {serial.sn}
                                  </span>
                                </div>
                                {serial.description && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {serial.description}
                                  </div>
                                )}
                              </div>
                            </div>
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
                          <Input
                            type="text"
                            placeholder="Catatan (opsional)"
                            value={loanItem.note || ""}
                            onChange={(e) => updateLoanItem(index, "note", e.target.value)}
                            className="h-9 text-sm bg-gray-50 mt-2"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* RIGHT: Rangkuman peminjaman */}
                <div>
                  <div className="relative bg-gradient-to-br from-accent-100/80 via-white/90 to-accent-200/60 dark:from-accent-900/40 dark:via-gray-800 dark:to-accent-900/10 rounded-2xl shadow-lg border border-accent-200 dark:border-accent-700 p-6 sticky top-6 overflow-hidden">
                    {/* Decorative accent */}
                    <div className="absolute -top-8 -right-8 w-32 h-32 bg-accent-200 dark:bg-accent-900/30 rounded-full opacity-20 pointer-events-none" />
                    <div className="flex items-center gap-4 mb-5">
                      <div className={`flex-shrink-0 w-14 h-14 rounded-full ${getColorFromName(selectedBorrowerData?.name)} flex items-center justify-center text-white text-2xl font-bold`}>
                        <User className="w-8 h-8" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-lg font-bold text-gray-900 dark:text-white truncate">
                          {selectedBorrowerData?.name || <span className="text-gray-400">Pilih peminjam</span>}
                        </div>
                        {/* Fallback logic for NIP/officerId */}
                        {selectedBorrowerData?.nip ? (
                          <div className="text-xs text-accent-700 dark:text-accent-200 font-medium mt-0.5">NIP: {selectedBorrowerData.nip}</div>
                        ) : selectedBorrowerData?.officerId ? (
                          <div className="text-xs text-accent-700 dark:text-accent-200 font-medium mt-0.5">ID Pegawai: {selectedBorrowerData.officerId}</div>
                        ) : null}
                        {selectedBorrowerData?.phone && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">No. HP: {selectedBorrowerData.phone}</div>
                        )}
                      </div>
                    </div>
                    <div className="my-3 border-t border-dashed border-accent-200 dark:border-accent-700" />
                    <div className="mb-2">
                      <div className="text-xs font-semibold text-accent-700 dark:text-accent-200 mb-1 tracking-wide uppercase">Total Barang Dipinjam</div>
                      <div className="flex flex-col gap-1">
                        {(() => {
                          // Hitung jumlah per nama barang
                          const countPerItem: Record<string, number> = {};
                          loanItems.forEach((loanItem) => {
                            const serial = items
                              .flatMap((item) => (item.items || []).map((s) => ({
                                ...s,
                                itemName: item.name,
                                icon: item.icon,
                              })))
                              .find((s) => s.rfidCode === loanItem.rfidCode);
                            if (serial && serial.itemName) {
                              countPerItem[serial.itemName] = (countPerItem[serial.itemName] || 0) + 1;
                            }
                          });
                          const itemNames = Object.keys(countPerItem);
                          if (itemNames.length === 0) {
                            return <div className="text-gray-400 text-xs">Belum ada barang dipilih</div>;
                          }
                          return itemNames.map((name) => (
                            <div key={name} className="flex items-center justify-between text-sm py-1 px-2 rounded-lg bg-white/70 dark:bg-gray-900/40 mb-1">
                              <span className="flex items-center gap-2 min-w-0">
                                {/* Icon per barang, mapping sesuai data icon */}
                                {(() => {
                                  // Cari serial pertama dengan nama barang ini
                                  const serial = items
                                    .flatMap((item) => (item.items || []).map((s) => ({
                                      ...s,
                                      itemName: item.name,
                                      icon: item.icon,
                                    })))
                                    .find((s) => s.itemName === name);
                                  const iconKey = serial?.icon || "laptop";
                                  const Icon = ICON_OPTIONS.find(opt => opt.value === iconKey)?.icon || Package;
                                  return <Icon className="w-4 h-4 text-accent-600 dark:text-accent-200 flex-shrink-0" />;
                                })()}
                                <span className="truncate font-medium text-gray-900 dark:text-white">{name}</span>
                              </span>
                              <span
                                className="ml-2 px-0 py-1 rounded bg-accent-600 text-white font-bold text-lg shadow leading-none inline-flex justify-center items-center min-w-[36px] w-[36px] text-center"
                              >
                                {countPerItem[name]}
                              </span>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                    {/* Tambahan: input jatuh tempo, keperluan, catatan, tombol submit */}
                    <div className="mt-6 space-y-3">
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
                      <div className="flex justify-end pt-2">
                        {/* Submit Button */}
                        {settings?.system?.borrowConfirmation ? (
                          <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                            <AlertDialogTrigger asChild>
                              <Button
                                type="button"
                                disabled={
                                  isSubmitting ||
                                  !selectedBorrower ||
                                  loanItems.every((item) => !item.rfidCode)
                                }
                                className="w-max items-center px-5 py-2 rounded-lg font-medium bg-accent-600 text-white hover:bg-accent-700 focus:ring-2 focus:ring-accent-400 transition-colors shadow-sm"
                                onClick={(e) => {
                                  setPendingSubmitEvent(e);
                                  setShowConfirmDialog(true);
                                }}
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
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Konfirmasi Peminjaman</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin mencatat peminjaman ini?
                                  Data akan disimpan dan peminjam akan dikirim pesan notifikasi.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel
                                  onClick={() => setShowConfirmDialog(false)}
                                  className="rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 transition-colors">
                                  Batal
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    setShowConfirmDialog(false);
                                    if (pendingSubmitEvent) {
                                      doSubmit(pendingSubmitEvent);
                                      setPendingSubmitEvent(null);
                                    }
                                  }}
                                  autoFocus
                                  className="rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-400 transition-colors shadow-sm"
                                >
                                  Ya, Catat
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <Button
                            type="submit"
                            disabled={
                              isSubmitting ||
                              !selectedBorrower ||
                              loanItems.every((item) => !item.rfidCode)
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
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}