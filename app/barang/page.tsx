"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Edit, Trash2, Filter } from "lucide-react"
// Icon components mapping (lucide-react)
import {
  Laptop,
  Cable,
  Projector,
  Mouse,
  Tablet,
  Printer,
  Monitor,
  Keyboard,
  Speaker,
  HdmiPort,
  Plug,
  Presentation,
  MicVocal,
  Package,
  X,
} from "lucide-react"
import Loading from "@/components/ui/loading"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { auth } from "@/lib/auth"
import api from "@/lib/api"
import type { Item } from "@/lib/types"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"
import "@/app/globals.css"


export default function BarangPage() {
  const [items, setItems] = useState<Item[]>([])
  const [filteredItems, setFilteredItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)
// Remove local error/success state, use toast instead
const [search, setSearch] = useState("")
const [categoryFilter, setCategoryFilter] = useState("all")
const [conditionFilter, setConditionFilter] = useState("all")


// Icon options for devices, simpan komponen icon langsung
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
]

  // Modal states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [deletingItem, setDeletingItem] = useState<Item | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    stock: 0,
    condition: "Baik" as "Baik" | "Rusak" | "Hilang",
    description: "",
    icon: "laptop", // default icon
  })

  const router = useRouter()

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push("/login")
      return
    }
    loadItems()
  }, [router])

  useEffect(() => {
    filterItems()
  }, [items, search, categoryFilter, conditionFilter])

  const loadItems = async () => {
    try {
      setIsLoading(true)
      const data = await api.getItems()
      setItems(data)
    } catch (err) {
      toast.error("Gagal memuat data barang", { className: "toast-error", duration: 6000 })
    } finally {
      setIsLoading(false)
    }
  }

  const filterItems = () => {
    let filtered = items

    if (search) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.category.toLowerCase().includes(search.toLowerCase()),
      )
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.category === categoryFilter)
    }

    if (conditionFilter !== "all") {
      filtered = filtered.filter((item) => item.condition === conditionFilter)
    }

    setFilteredItems(filtered)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingItem) {
        await api.updateItem(editingItem.id, formData)
        toast.success("Barang berhasil diperbarui", { className: "toast-success", duration: 6000 })
      } else {
        await api.createItem(formData)
        toast.success("Barang berhasil ditambahkan", { className: "toast-success", duration: 6000 })
      }

      setIsDialogOpen(false)
      setEditingItem(null)
      resetForm()
      loadItems()
    } catch (err) {
      toast.error("Gagal menyimpan data barang", { className: "toast-error", duration: 6000 })
    }
  }

  const handleEdit = (item: Item) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      category: item.category,
      stock: item.stock,
      condition: item.condition,
      description: item.description || "",
      icon: item.icon || "laptop",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingItem) return

    try {
      await api.deleteItem(deletingItem.id)
      toast.success("Barang berhasil dihapus", { className: "toast-success", duration: 6000 })
      loadItems()
    } catch (err) {
      toast.error("Gagal menghapus barang", { className: "toast-error", duration: 6000 })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      stock: 0,
      condition: "Baik",
      description: "",
      icon: "laptop",
    })
  }

  const openAddDialog = () => {
    setEditingItem(null)
    resetForm()
    setIsDialogOpen(true)
  }

  const categories = [...new Set(items.map((item) => item.category))].filter(Boolean)

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
      <div className="max-w-[90rem] mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fade-in duration-200">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Barang</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Kelola data barang yang tersedia untuk dipinjam</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button onClick={openAddDialog} className="btn-outline">
                <Plus className="w-5 h-5 mr-2" />
                Tambah Barang
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl w-full bg-gray-50 dark:bg-gray-900 dark:border dark:border-gray-700 rounded-lg">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Barang" : "Tambah Barang Baru"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-6">
                  {/* Nama Barang full width */}
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nama Barang *</Label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field max-w-2xl w-full"
                      required
                    />
                  </div>
                  {/* Grid 2 kolom untuk input lainnya */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icon Barang *</Label>
                      <Select
                        value={formData.icon}
                        onValueChange={(val) => setFormData({ ...formData, icon: val })}
                        required
                      >
                        <SelectTrigger className="input-field">
                          <SelectValue placeholder="Pilih icon" />
                        </SelectTrigger>
                        <SelectContent>
                          {ICON_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-2">
                          {(() => {
                            const Icon = opt.icon
                            return <Icon className="w-6 h-6 text-accent-600 dark:text-accent-400" />
                          })()}
                                {opt.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Kategori *</Label>
                      <Input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Stok *</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: Number.parseInt(e.target.value) || 0 })}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Kondisi *</Label>
                      <Select
                        value={formData.condition}
                        onValueChange={(val) => setFormData({ ...formData, condition: val as 'Baik' | 'Rusak' | 'Hilang' })}
                        required
                      >
                        <SelectTrigger className="input-field">
                          <SelectValue placeholder="Pilih kondisi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Baik">Baik</SelectItem>
                          <SelectItem value="Rusak">Rusak</SelectItem>
                          <SelectItem value="Hilang">Hilang</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {/* Deskripsi tetap full width di bawah */}
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Deskripsi</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="input-field"
                      placeholder="Deskripsi tambahan (opsional)"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <DialogClose asChild>
                    <Button
                      onClick={() => {
                        setIsDialogOpen(false)
                        setEditingItem(null)
                        resetForm()
                      }}
                      className="px-5 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 transition-colors"
                    >
                      Batal
                    </Button>
                  </DialogClose>
                  <Button type="submit" className="px-5 py-2 rounded-lg font-medium bg-accent-600 text-white hover:bg-accent-700 focus:ring-2 focus:ring-accent-400 transition-colors shadow-sm">
                    {editingItem ? "Perbarui" : "Tambahkan"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Alerts replaced by toast notifications */}

        {/* Filters */}
        <div className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative md:col-span-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <Input
                type="text"
                placeholder="Cari barang..."
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

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="input-field">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={conditionFilter} onValueChange={setConditionFilter}>
              <SelectTrigger className="input-field">
                <SelectValue placeholder="Semua Kondisi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kondisi</SelectItem>
                <SelectItem value="Baik">Baik</SelectItem>
                <SelectItem value="Rusak">Rusak</SelectItem>
                <SelectItem value="Hilang">Hilang</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => {
                setSearch("")
                setCategoryFilter("all")
                setConditionFilter("all")
              }}
              className="w-max flex items-center text-sm font-medium text-gray-600 border-gray-600 border dark:text-gray-400 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700/20 rounded-lg transition-colors"
              variant={"outline"}
            >
              <Filter className="w-4 h-4 mr-2" />
              Reset Filter
            </Button>
          </div>
        </div>

        {/* Items Table - shadcn/ui Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.length === 0 ? (
            <div className="col-span-full">
              <div className="card p-12 text-center">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  {search || categoryFilter || conditionFilter
                    ? "Tidak ada barang yang sesuai dengan filter"
                    : "Belum ada data barang"}
                </p>
              </div>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div key={item.id} className="card-hover p-6 flex flex-col h-full">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-14 h-14 flex items-center justify-center bg-accent-100 dark:bg-accent-900 rounded-xl">
                    {(() => {
                      const Icon = ICON_OPTIONS.find(opt => opt.value === (item.icon || "laptop"))?.icon || Laptop
                      return <Icon className="w-8 h-8 text-accent-600 dark:text-accent-400" />
                    })()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{item.name}</h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{item.category}</div>
                  </div>
                  <div className="flex-shrink-0">
                  <span className={`font-semibold text-2xl ${item.stock === 0 ? "text-red-600 dark:text-red-400" : item.stock < 5 ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"}`}>{item.stock}</span><span className="text-lg text-gray-500 dark:text-gray-400 font-semibold">x</span>
                  </div>
                </div>
                {item.description && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">{item.description}</div>
                )}
                <div className="flex flex-wrap gap-3 text-sm mb-4">
                  <span className={`badge ${item.condition === "Baik" ? "badge-success" : item.condition === "Rusak" ? "badge-warning" : "badge-danger"}`}>{item.condition}</span>
                </div>
                <div className="flex items-center mt-auto">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(item.updatedAt)}</span>
                  <div className="flex-grow" />
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleEdit(item)}
                      className="w-12 p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => {
                        setDeletingItem(item)
                        setIsDeleteDialogOpen(true)
                      }}
                      className="w-12 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>


      {/* Delete Confirmation - shadcn/ui AlertDialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        setIsDeleteDialogOpen(open)
        if (!open) setDeletingItem(null)
      }}>
        <AlertDialogContent className="max-w-md w-full bg-gray-50 dark:bg-gray-900 dark:border dark:border-gray-700 rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Barang</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus barang <span className="font-semibold">"{deletingItem?.name}"</span>? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <AlertDialogCancel asChild>
              <Button
                onClick={() => {
                  setIsDeleteDialogOpen(false)
                  setDeletingItem(null)
                }}
                className="px-5 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 transition-colors"
              >
                Batal
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                autoFocus
                onClick={async () => {
                  await handleDelete()
                  setIsDeleteDialogOpen(false)
                  setDeletingItem(null)
                }}
                className="px-5 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-400 transition-colors shadow-sm"
              >
                Hapus
              </Button>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
