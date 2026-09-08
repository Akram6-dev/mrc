"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Edit, Trash2, Users, X, Table2, Lock, Unlock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination"
import { toast } from "sonner"
import Loading from "@/components/ui/loading"
import { auth } from "@/lib/auth"
import api from "@/lib/api"

import type { Borrower } from "@/lib/types"
import { formatDate } from "@/lib/utils"

export default function PeminjamPage() {
  const [borrowers, setBorrowers] = useState<Borrower[]>([])
  const [filteredBorrowers, setFilteredBorrowers] = useState<Borrower[]>([])
  const [isLoading, setIsLoading] = useState(true)
  // Notif pakai sonner
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [search, setSearch] = useState("")
  // Pagination
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  // Modal states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingBorrower, setEditingBorrower] = useState<Borrower | null>(null)
  const [deletingBorrower, setDeletingBorrower] = useState<Borrower | null>(null)

  // Form states
  const [formData, setFormData] = useState<{
    name: string
    nip: string
    officerId: string
    rfid: string
    phone: string
    gender: "L" | "P"
  }>({
    name: "",
    nip: "",
    officerId: "",
    rfid: "",
    phone: "",
    gender: "L",
  })

  const router = useRouter()

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push("/login")
      return
    }
    loadBorrowers()
  }, [router])

  useEffect(() => {
    filterBorrowers()
    setPage(1) // Reset ke halaman 1 jika filter berubah
  }, [borrowers, search])

  const loadBorrowers = async () => {
    try {
      setIsLoading(true)
      const data = await api.getBorrowers()
      setBorrowers(data.map((b: any) => ({
        id: b.id,
        name: b.name,
        nip: b.nip,
        officerId: b.officerId,
        rfid: b.rfid || "",
        phone: b.phone || "",
        gender: b.gender,
        isFrozen: Boolean(b.isFrozen),
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      })))
    } catch (err) {
      setError("Gagal memuat data peminjam")
    } finally {
      setIsLoading(false)
    }
  }

  const filterBorrowers = () => {
    let filtered = borrowers
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((borrower) => {
        const name = typeof borrower.name === "string" ? borrower.name.toLowerCase() : "";
        const nip = typeof borrower.nip === "string" ? borrower.nip.toLowerCase() : "";
        const officerId = typeof borrower.officerId === "string" ? borrower.officerId.toLowerCase() : "";
        const phone = typeof borrower.phone === "string" ? borrower.phone.toLowerCase() : "";
        return (
          name.includes(q) ||
          nip.includes(q) ||
          officerId.includes(q) ||
          phone.includes(q)
        );
      });
    }
    setFilteredBorrowers(filtered)
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredBorrowers.length / PAGE_SIZE)
  const paginatedBorrowers = filteredBorrowers.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError("")
      setSuccess("")

      if (editingBorrower) {
        await api.updateBorrower(editingBorrower.id, formData)
        toast.success("Data peminjam berhasil diperbarui", {
          duration: 6000,
          className: "toast-success"
        })
      } else {
        await api.createBorrower(formData)
        toast.success("Peminjam berhasil ditambahkan", {
          duration: 6000,
          className: "toast-success"
        })
      }

      setIsDialogOpen(false)
      setEditingBorrower(null)
      resetForm()
      setTimeout(() => {
        loadBorrowers()
      }, 300)
    } catch (err: any) {
      toast.error("Gagal menyimpan data peminjam: " + (err?.message || JSON.stringify(err)), {
        duration: 6000,
        className: "toast-error"
      })
    }
  }

  const handleEdit = (borrower: Borrower) => {
    setEditingBorrower(borrower)
    setFormData({
      name: borrower.name,
      nip: borrower.nip,
      officerId: borrower.officerId,
      rfid: borrower.rfid || "",
      phone: borrower.phone || "",
      gender: borrower.gender,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingBorrower) return

    try {
      await api.deleteBorrower(deletingBorrower.id)
      toast.success("Peminjam berhasil dihapus", {
        duration: 6000,
        className: "toast-success"
      })
      setDeletingBorrower(null)
      setIsDeleteDialogOpen(false)
      setTimeout(() => {
        loadBorrowers()
      }, 300)
    } catch (err: any) {
      toast.error("Gagal menghapus peminjam: " + (err?.message || JSON.stringify(err)), {
        duration: 6000,
        className: "toast-error"
      })
    }
  }

  const handleToggleFreeze = async (borrower: Borrower) => {
    try {
      await api.updateBorrower(borrower.id, { isFrozen: !borrower.isFrozen })
      toast.success(borrower.isFrozen ? "Akun peminjam diaktifkan" : "Akun peminjam dinonaktifkan", {
        duration: 4000,
        className: "toast-success",
      })
      loadBorrowers()
    } catch (err: any) {
      toast.error("Gagal mengubah status akun: " + (err?.message || "Terjadi kesalahan"), {
        duration: 6000,
        className: "toast-error",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      nip: "",
      officerId: "",
      rfid: "",
      phone: "",
      gender: "L",
    })
  }

  const openAddDialog = () => {
    setEditingBorrower(null)
    resetForm()
    setIsDialogOpen(true)
  }

  const handleExportExcel = async () => {
    const XLSX = await import("xlsx")
    const rows = filteredBorrowers.map((borrower) => ({
      "Nama": borrower.name || "",
      "NIP": borrower.nip || "",
      "ID Pegawai": borrower.officerId || "",
      "Jenis Kelamin": borrower.gender === "L" ? "Laki-laki" : "Perempuan",
      "No. HP": borrower.phone || "",
      "RFID": borrower.rfid || "",
      "Terdaftar": borrower.createdAt ? formatDate(borrower.createdAt) : "",
    }))
    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Peminjam")
    XLSX.writeFile(workbook, `mrc-peminjam-${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  if (!auth.isAuthenticated()) return null

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg">
        <div className="max-w-[90rem] mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Loading />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="max-w-[90rem] mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Peminjam</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Kelola data guru dan staff yang dapat meminjam barang</p>
          </div>
          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm"
            >
              <Table2 className="w-5 h-5" />
              Export Excel
            </button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) {
              setEditingBorrower(null)
              resetForm()
            }
          }}>
            <DialogTrigger asChild>
              <button onClick={openAddDialog} className="btn-outline">
                <Plus className="w-5 h-5 mr-2" />
                Tambah Peminjam
              </button>
            </DialogTrigger>
            <DialogContent
              className="max-w-lg w-full bg-white dark:bg-gray-900 rounded-xl shadow-md"
              aria-describedby="peminjam-dialog-desc"
            >
              <DialogHeader>
                <DialogTitle>{editingBorrower ? "Edit Peminjam" : "Tambah Peminjam Baru"}</DialogTitle>
                <p id="peminjam-dialog-desc" className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {editingBorrower ? "Perbarui data peminjam di bawah ini." : "Isi data peminjam di bawah ini untuk menambah peminjam baru."}
                </p>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                <div className="space-y-6">
                  {/* Nama Lengkap full width */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nama Lengkap *</label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field max-w-2xl w-full"
                      placeholder="Arif Rahman Hakim"
                      required
                    />
                  </div>
                  {/* Grid 2 kolom 2 baris untuk sisanya */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Jenis Kelamin *</label>
                      <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value as "L" | "P" })} required>
                        <SelectTrigger className="input-field" aria-label="Jenis Kelamin">
                          <SelectValue placeholder="Pilih Jenis Kelamin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="L" className="focus:bg-accent-100 dark:focus:bg-accent-900">Laki-laki</SelectItem>
                          <SelectItem value="P" className="focus:bg-accent-100 dark:focus:bg-accent-900">Perempuan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">NIP</label>
                      <Input
                        type="text"
                        value={formData.nip}
                        onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                        className="input-field"
                        placeholder="1999xxxxxxxxxxxxxx"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ID Pegawai</label>
                      <Input
                        type="text"
                        value={formData.officerId}
                        onChange={(e) => setFormData({ ...formData, officerId: e.target.value })}
                        className="input-field"
                        placeholder="12345"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">No. HP</label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="input-field"
                        placeholder="08xxxxxxxxxx"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">RFID</label>
                    <Input
                      type="text"
                      value={formData.rfid}
                      onChange={(e) => setFormData({ ...formData, rfid: e.target.value })}
                      className="input-field max-w-2xl w-full"
                      placeholder="0123456789"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <DialogClose asChild>
                    <Button
                      type="button"
                      onClick={() => {
                        setIsDialogOpen(false)
                        setEditingBorrower(null)
                        resetForm()
                      }}
                      className="px-5 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 transition-all"
                    >
                      Batal
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    className="px-5 py-2 rounded-lg font-medium bg-accent-600 text-white hover:bg-accent-700 focus:ring-2 focus:ring-accent-400 transition-all shadow-sm"
                  >
                    {editingBorrower ? "Perbarui" : "Simpan"}
                  </Button>
                </div>
              </form>
            </DialogContent>
            </Dialog>
          </div>
        </div>
        {/* Search */}
        <div className="p-6 mb-6">
          <div className="relative max-w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            <Input
              type="text"
              placeholder="Cari peminjam..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 pr-10"
            />
            {search && (
              <button
                type="button"
                aria-label="Clear search"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 p-1 rounded-full transition-colors"
                onClick={() => setSearch("")}
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-end my-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-disabled={page === 1}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      isActive={page === i + 1}
                      onClick={() => setPage(i + 1)}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    aria-disabled={page === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {/* Borrowers Grid */}
        <div className="card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>NIP</TableHead>
                <TableHead>ID Pegawai</TableHead>
                <TableHead>L/P</TableHead>
                <TableHead>No. HP</TableHead>
                <TableHead>Terdaftar</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedBorrowers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 rounded-b-lg">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      {search ? "Tidak ada peminjam yang sesuai dengan pencarian" : "Belum ada data peminjam"}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedBorrowers.map((borrower) => (
                  <TableRow
                    key={borrower.id}
                    className={paginatedBorrowers.indexOf(borrower) % 2 === 1 ? "bg-gray-50 dark:bg-gray-800/40" : ""}
                  >
                    <TableCell className="font-medium text-gray-900 dark:text-white">
                      <div>{borrower.name}</div>
                      {borrower.isFrozen && <div className="text-xs font-normal text-amber-600">Akun nonaktif</div>}
                    </TableCell>
                    <TableCell>{borrower.nip}</TableCell>
                    <TableCell>{borrower.officerId}</TableCell>
                    <TableCell>{borrower.gender === "L" ? "L" : "P"}</TableCell>
                    <TableCell>{borrower.phone}</TableCell>
                    <TableCell>{formatDate(borrower.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEdit(borrower)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleFreeze(borrower)}
                          title={borrower.isFrozen ? "Aktifkan akun" : "Nonaktifkan akun"}
                          className={`p-2 rounded-lg transition-colors ${borrower.isFrozen
                            ? "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                            : "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                            }`}
                        >
                          {borrower.isFrozen ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => {
                            setDeletingBorrower(borrower)
                            setIsDeleteDialogOpen(true)
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-end mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-disabled={page === 1}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      isActive={page === i + 1}
                      onClick={() => setPage(i + 1)}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    aria-disabled={page === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Dialog sudah dipindahkan ke header agar konsisten dengan barang */}

      {/* Delete Confirmation with AlertDialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        setIsDeleteDialogOpen(open)
        if (!open) setDeletingBorrower(null)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Peminjam</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data peminjam "{deletingBorrower?.name}"? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setDeletingBorrower(null)
              }}
              className="rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 transition-colors"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              autoFocus
              className=" rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-400 transition-colors shadow-sm"
              onClick={handleDelete}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
