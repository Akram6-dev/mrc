"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DatePickerField } from "../peminjaman/DatePickerField";
import { auth } from "@/lib/auth";

export default function BookPublicPage() {
  const [borrowers, setBorrowers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [error, setError] = useState("");

  // Borrower selection
  const [selectedBorrower, setSelectedBorrower] = useState("");
  const [borrowerSearch, setBorrowerSearch] = useState("");
  const [borrowerValidationMsg, setBorrowerValidationMsg] = useState<
    string | null
  >(null);

  // Booking items: [{ itemId, name, qty }]
  const [bookingItems, setBookingItems] = useState<
    { itemId: string; name: string; qty: number; max: number }[]
  >([]);

  // Date & duration
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [duration, setDuration] = useState(1);
  const [notes, setNotes] = useState("");
  const [purpose, setPurpose] = useState("");
  const [pickupTime, setPickupTime] = useState("");

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetch("/api/borrowers").then((res) => res.json()),
      fetch("/api/items").then((res) => res.json()),
    ])
      .then(([borrowers, items]) => {
        setBorrowers(borrowers);
        setItems(items);
        setBookingItems(
          items.map((item: any) => ({
            itemId: item.id,
            name: item.name,
            qty: 0,
            max:
              item.items?.filter(
                (s: any) =>
                  s.status === 1 &&
                  (s.condition === 1 || String(s.condition) === "1"),
              ).length || 0,
          })),
        );
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Borrower autocomplete logic
  const filteredBorrowers =
    borrowerSearch.trim() === ""
      ? borrowers
      : borrowers.filter((b: any) => {
          const q = borrowerSearch.trim().toLowerCase();
          return (
            b.name.toLowerCase().includes(q) ||
            b.nip?.toLowerCase().includes(q) ||
            b.officerId?.toLowerCase().includes(q)
          );
        });

  // Handle booking submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccess("");
    setError("");
    try {
      if (!selectedBorrower) throw new Error("Pilih nama peminjam");
      if (!bookingItems.some((it) => it.qty > 0))
        throw new Error("Pilih minimal satu barang");
      if (!startDate) throw new Error("Pilih tanggal pinjam");
      if (!duration || duration < 1) throw new Error("Durasi minimal 1 hari");
      if (!purpose.trim()) throw new Error("Keperluan harus diisi");
      if (!pickupTime.trim()) throw new Error("Jam pengambilan harus diisi");
      // Validate pickup time is between 06:30 and 16:00
      const [h, m] = pickupTime.split(":").map(Number);
      const totalMinutes = h * 60 + m;
      if (totalMinutes < 390 || totalMinutes > 960) {
        throw new Error("Jam pengambilan hanya boleh antara 06:30 dan 16:00");
      }
      const tz = "Asia/Jakarta";
      const y = startDate.getFullYear();
      const mo = startDate.getMonth();
      const d = startDate.getDate();
      // Buat Date di Asia/Jakarta dengan jam dari pickupTime
      // Date.UTC(y, mo, d, h, m) -> UTC, lalu offset ke Jakarta (UTC+7)
      // Tapi supaya benar, kita buat string ISO lokal Jakarta, lalu parse ke UTC
      // Format: "YYYY-MM-DDTHH:mm:00.000+07:00"
      const pad = (n: number) => n.toString().padStart(2, "0");
      const jakartaDateStr = `${y}-${pad(mo + 1)}-${pad(d)}T${pad(h)}:${pad(m)}:00.000+07:00`;
      // Parse ke Date, lalu toISOString agar UTC
      const jakartaDate = new Date(jakartaDateStr);
      // Cek stok
      for (const it of bookingItems) {
        if (it.qty > it.max)
          throw new Error(`Jumlah ${it.name} melebihi stok (${it.max})`);
      }
      // Simpan booking
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          borrowerId: selectedBorrower,
          items: bookingItems
            .filter((it) => it.qty > 0)
            .map((it) => ({ itemId: it.itemId, qty: it.qty })),
          startDate: jakartaDate.toISOString(),
          duration,
          purpose: purpose.trim(),
          notes: notes.trim(),
          status: "pending",
        }),
      });
      if (!res.ok) throw new Error("Gagal mencatat booking");
      const booking = await res.json();
      // Update items: set status 2 (dibooking) dan loanId = booking.id untuk serial yang di-booking
      for (const it of bookingItems.filter((it) => it.qty > 0)) {
        const item = items.find((i: any) => i.id === it.itemId);
        if (!item || !Array.isArray(item.items)) continue;
        // Ambil N pertama yang status 1 dan condition 1
        const n = it.qty;
        const updatedSerials = [...item.items];

        const isEligible = (s: any) =>
          s &&
          s.status === 1 &&
          (s.condition === 1 || String(s.condition) === "1");
        const eligibleIndices = item.items
          .map((s: any, idx: number) => (isEligible(s) ? idx : -1))
          .filter((idx: number) => idx !== -1)
          .slice(0, n);

        let changed = 0;
        for (const idx of eligibleIndices) {
          updatedSerials[idx] = {
            ...updatedSerials[idx],
            status: 2,
            loanId: booking.id,
          };
          changed++;
        }

        if (changed > 0) {
          await fetch("/api/items", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...auth.getAuthHeaders(),
            },
            body: JSON.stringify({ ...item, items: updatedSerials }),
          });
        }
      }
      setSuccess(
        "Booking berhasil dikirim! Admin akan memproses permintaan Anda.",
      );
      setShowSuccessDialog(true);
      setSelectedBorrower("");
      setBookingItems(bookingItems.map((it) => ({ ...it, qty: 0 })));
      setStartDate(undefined);
      setDuration(1);
      setNotes("");
      setPurpose("");
      setPickupTime("");
    } catch (err: any) {
      toast.error(err.message || "Gagal mencatat booking", {
        duration: 4000,
        className: "toast-error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  async function closeOrFallback() {
    try {
      window.close();
    } catch (err) {}
    setTimeout(() => {
      setShowSuccessDialog(false);
      setSelectedBorrower("");
      setBorrowerSearch("");
      setBorrowerValidationMsg(null);
      setBookingItems(
        items.map((item: any) => ({
          itemId: item.id,
          name: item.name,
          qty: 0,
          max:
            item.items?.filter(
              (s: any) =>
                s.status === 1 &&
                (s.condition === 1 || String(s.condition) === "1"),
            ).length || 0,
        })),
      );
      setStartDate(undefined);
      setDuration(1);
      setNotes("");
      setPurpose("");
      setPickupTime("");
    }, 200);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-accent-100 dark:from-gray-900 dark:to-accent-900 p-0 m-0 flex flex-col select-none user-select-none">
      <div className="flex flex-col items-center pt-8 pb-2">
        <img
          src="/mrc.png"
          alt="MRC Logo"
          className="h-12 mb-2"
          style={{ objectFit: "contain" }}
        />
        <h1 className="text-2xl font-bold text-center tracking-tight text-accent-700 dark:text-accent-200 mb-1">
          Booking Barang
        </h1>
        <div className="text-xs text-gray-500 mb-2">MRC SMKN 1 Subang</div>
      </div>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md mx-auto px-4 pb-8 space-y-5 sm:space-y-6 flex flex-col flex-1"
      >
        <div>
          <Label className="block text-base font-semibold mb-2">
            Nama Peminjam (NIP / ID Pegawai){" "}
            <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="Masukkan NIP atau ID Pegawai..."
            value={borrowerSearch}
            onChange={(e) => {
              const v = String(e.target.value || "");
              setBorrowerSearch(v);
              const q = v.trim();
              if (q === "") {
                setBorrowerValidationMsg(null);
                setSelectedBorrower("");
                return;
              }
              const byNip = borrowers.find(
                (b: any) => b.nip && String(b.nip).trim() === q,
              );
              if (byNip) {
                setSelectedBorrower(byNip.id);
                setBorrowerValidationMsg(byNip.name);
                return;
              }
              const byOfficer = borrowers.find(
                (b: any) => b.officerId && String(b.officerId).trim() === q,
              );
              if (byOfficer) {
                setSelectedBorrower(byOfficer.id);
                setBorrowerValidationMsg(byOfficer.name);
                return;
              }
              setSelectedBorrower("");
              setBorrowerValidationMsg(
                "Tidak ditemukan peminjam dengan pencarian tersebut",
              );
            }}
            className="w-full rounded-lg"
            inputMode="text"
          />
          {borrowerValidationMsg ? (
            <div
              className={`mt-1 text-sm ${selectedBorrower ? "text-green-600" : "text-red-600"}`}
            >
              {selectedBorrower ? (
                <>
                  Ditemukan: <strong>{borrowerValidationMsg}</strong>
                </>
              ) : (
                borrowerValidationMsg
              )}
            </div>
          ) : (
            <div className="mt-1 text-sm text-gray-500">
              Masukkan NIP atau ID pegawai untuk memilih peminjam.
            </div>
          )}
        </div>
        <div>
          <Label className="block text-base font-semibold mb-2">
            Barang <span className="text-red-500">*</span>
          </Label>
          <div className="max-h-[420px] overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800 shadow-sm">
            {isLoading
              ? Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 px-2 py-3 sm:py-4 animate-pulse"
                  >
                    <div className="w-16 h-16 rounded-md bg-gray-200 dark:bg-gray-800 flex-shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-3 w-1/2 bg-gray-100 dark:bg-gray-800 rounded" />
                      <div className="h-3 w-1/4 bg-gray-100 dark:bg-gray-800 rounded" />
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800" />
                      <div className="w-14 h-8 rounded bg-gray-100 dark:bg-gray-800" />
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800" />
                    </div>
                  </div>
                ))
              : bookingItems.map((item, idx) => {
                  const itemData = items.find((i: any) => i.id === item.itemId);
                  const imgUrl =
                    itemData?.image || itemData?.img || "/placeholder.jpg";
                  const desc = itemData?.description || itemData?.desc || "";
                  return (
                    <div
                      key={item.itemId}
                      className="flex items-center gap-3 px-2 py-3 sm:py-4"
                    >
                      <img
                        src={imgUrl}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-md bg-gray-100 dark:bg-gray-800 flex-shrink-0"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-base truncate mb-0.5">
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate mb-1.5">
                          {desc}
                        </div>
                        <div className="text-xs text-accent-700">
                          Stok: {item.max}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="w-8 h-8 p-0 text-lg rounded-full bg-accent-100 dark:bg-gray-800"
                          aria-label="Kurangi"
                          disabled={item.qty <= 0}
                          onClick={() =>
                            setBookingItems((items) =>
                              items.map((it, i) =>
                                i === idx
                                  ? { ...it, qty: Math.max(0, it.qty - 1) }
                                  : it,
                              ),
                            )
                          }
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          min={0}
                          max={item.max}
                          value={item.qty}
                          onChange={(e) => {
                            const val = Math.max(
                              0,
                              Math.min(item.max, Number(e.target.value)),
                            );
                            setBookingItems((items) =>
                              items.map((it, i) =>
                                i === idx ? { ...it, qty: val } : it,
                              ),
                            );
                          }}
                          className="w-14 text-center px-1 py-1 text-base rounded-md"
                          disabled={item.max === 0}
                          inputMode="numeric"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="w-8 h-8 p-0 text-lg rounded-full bg-accent-100 dark:bg-gray-800"
                          aria-label="Tambah"
                          disabled={item.qty >= item.max}
                          onClick={() =>
                            setBookingItems((items) =>
                              items.map((it, i) =>
                                i === idx
                                  ? { ...it, qty: Math.min(it.max, it.qty + 1) }
                                  : it,
                              ),
                            )
                          }
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  );
                })}
          </div>

          {/* Summary Card */}
          <div className="mt-4 mb-2">
            {bookingItems.filter((it) => it.qty > 0).length > 0 && (
              <div className="rounded-lg bg-white/90 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 shadow-sm px-4 py-3">
                <div className="font-semibold text-base mb-2 text-accent-700 dark:text-accent-200">
                  Ringkasan Peminjaman
                </div>
                {selectedBorrower && (
                  <div className="mb-2 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <span className="font-bold">Peminjam:</span>
                    <span className="truncate">
                      {borrowers.find((b: any) => b.id === selectedBorrower)
                        ?.name || "-"}
                    </span>
                  </div>
                )}
                <div className="mt-1 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <span className="font-bold">
                    Barang ({bookingItems.filter((it) => it.qty > 0).length}):
                  </span>
                </div>
                <ul className="space-y-1">
                  {bookingItems
                    .filter((it) => it.qty > 0)
                    .map((it) => {
                      const itemData = items.find(
                        (i: any) => i.id === it.itemId,
                      );
                      const idx = bookingItems
                        .filter((x) => x.qty > 0)
                        .findIndex((x) => x.itemId === it.itemId);
                      return (
                        <li
                          key={it.itemId}
                          className={
                            `flex items-center justify-between text-sm rounded-md px-2 py-1 ` +
                            (idx % 2 === 1
                              ? "bg-gray-100 dark:bg-gray-800/40"
                              : "")
                          }
                        >
                          <span className="truncate flex-1">
                            {itemData?.name || it.name}
                          </span>
                          <span className="ml-2 text-accent-700 dark:text-accent-200">
                            <span className="font-bold">{it.qty}</span>x
                          </span>
                        </li>
                      );
                    })}
                </ul>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <Label className="block text-base font-semibold mb-1">
              Tanggal Pinjam <span className="text-red-500">*</span>
            </Label>
            <DatePickerField
              value={startDate}
              onChange={setStartDate}
              placeholder="Pilih tanggal pinjam..."
              minDate={new Date()}
              className="bg-white text-primary-foreground hover:bg-primary/90 dark:bg-gray-700 dark:text-primary-foreground dark:hover:bg-gray-600 border dark:border-gray-600 transition-colors rounded-lg h-10"
            />
          </div>
          <div className="w-32">
            <Label className="block text-base font-semibold mb-2">
              Durasi (hari) <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center">
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="w-10 h-10 p-0 text-lg rounded-r-none border-r-none bg-white dark:bg-gray-800"
                aria-label="Kurangi durasi"
                disabled={duration <= 1}
                onClick={() => setDuration((d) => Math.max(1, d - 1))}
              >
                -
              </Button>
              <Input
                type="number"
                min={1}
                max={30}
                value={duration}
                onChange={(e) =>
                  setDuration(Math.max(1, Math.min(30, Number(e.target.value))))
                }
                className="w-14 text-center py-1 text-base rounded-none"
                required
                inputMode="numeric"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="w-10 h-10 p-0 text-lg rounded-l-none border-l-none bg-white dark:bg-gray-800"
                aria-label="Tambah durasi"
                disabled={duration >= 30}
                onClick={() => setDuration((d) => Math.min(30, d + 1))}
              >
                +
              </Button>
            </div>
          </div>
        </div>
        <div>
          <Label className="block text-base font-semibold mb-2">
            Jam Pengambilan <span className="text-red-500">*</span>
          </Label>
          <Input
            type="time"
            value={pickupTime}
            onChange={(e) => setPickupTime(e.target.value)}
            className="w-full rounded-lg"
            required
            min="06:30"
            max="16:00"
          />
        </div>
        <div>
          <Label className="block text-base font-semibold mb-2">
            Keperluan <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="contoh: KBM"
            className="w-full rounded-lg"
            required
          />
        </div>
        <div>
          <Label className="block text-base font-semibold mb-2">Catatan</Label>
          <Input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Catatan tambahan (opsional)"
            className="w-full rounded-lg"
          />
        </div>
        <Button
          type="submit"
          className="w-full py-3 rounded-lg font-medium bg-accent-600 text-white hover:bg-accent-700 transition-all shadow-lg mt-4 active:scale-95"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Memproses..." : "Kirim Booking"}
        </Button>
        {/* Success Dialog */}
        <Dialog open={showSuccessDialog}>
          <DialogContent className="max-w-xs rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-green-600 text-center">
                Booking Berhasil!
              </DialogTitle>
            </DialogHeader>
            <div className="text-center text-base mt-2 mb-2">
              Silakan datang ke MRC pada jam{" "}
              <span className="font-bold">{pickupTime}</span> sesuai yang
              dipilih.
              <br />
              Admin akan memproses permintaan Anda.
            </div>
            <DialogFooter className="flex justify-center">
              <Button
                type="button"
                className="w-full mt-2 bg-accent-600 hover:bg-accent-700 text-white font-semibold rounded-lg shadow"
                onClick={() => closeOrFallback()}
              >
                Tutup Halaman
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {error && (
          <div className="text-red-600 text-center font-medium mt-2">
            {error}
          </div>
        )}
      </form>
    </main>
  );
}
