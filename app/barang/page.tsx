"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Edit, Trash2, Filter, Image as ImageIcon, Table2 } from "lucide-react"
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
  Image,
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
  // Items with serials: each item has an array of serials (with status)
  const [items, setItems] = useState<any[]>([])
  const [filteredItems, setFilteredItems] = useState<any[]>([])
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
    description: "",
    icon: "laptop", // default icon
    image: "", // path to uploaded image (relative to /public)
    items: [{ rfidCode: "", sn: "", status: 1, condition: 1 }], // for editing serials
    serialSearch: "", // for filtering serial numbers in the form
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")

  const router = useRouter()

  // Refs to RFID inputs so we can focus newly added rows
  const serialRefs = useRef<Array<HTMLInputElement | null>>([])

  const addNewSerial = () => {
    const newIndex = formData.items.length
    const newItem = { rfidCode: "", sn: "", status: 1, condition: 1 }
    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }))
    // Focus the new input on next tick after DOM updates
    setTimeout(() => {
      serialRefs.current[newIndex]?.focus()
    }, 0)
  }

  const handleSerialKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      // If we're on the last row, add a new one and focus it
      if (idx === formData.items.length - 1) {
        addNewSerial()
      } else {
        // Otherwise focus next row's RFID input
        const next = serialRefs.current[idx + 1]
        if (next) next.focus()
      }
    }
  }

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
      // Stock excludes serials marked as missing.
      const mapped = data.map((item: any) => ({
        ...item,
        stock: Array.isArray(item.items) ? item.items.filter((s: any) => s.condition !== -1).length : 0,
        items: Array.isArray(item.items)
          ? item.items.map((s: any) => ({
            rfidCode: s.rfidCode,
            sn: s.sn,
            status: s.status,
            condition: typeof s.condition === "number" ? s.condition : 1,
            loanId: s.loanId || null,
          }))
          : [{ rfidCode: '', sn: '', status: 1, condition: 1, loanId: null }],
      }))
      setItems(mapped)
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
      // Tampilkan barang jika ada minimal satu serial dengan kondisi sesuai filter
      let targetCondition = 1;
      if (conditionFilter === "Baik") targetCondition = 1;
      else if (conditionFilter === "Rusak") targetCondition = 0;
      else if (conditionFilter === "Hilang") targetCondition = -1;
      filtered = filtered.filter((item) =>
        Array.isArray(item.items) && item.items.some((s: { condition: number }) => s.condition === targetCondition)
      );
    }

    setFilteredItems(filtered)
  }

  const handleExportItems = async () => {
    const XLSX = await import("xlsx")
    const rows = filteredItems.flatMap((item) => {
      const serials = Array.isArray(item.items) ? item.items : []
      if (serials.length === 0) {
        return [{
          Nama: item.name,
          Kategori: item.category,
          Deskripsi: item.description || "",
          Serial: "",
          Status: "",
          Kondisi: "",
        }]
      }
      return serials.map((serial: any) => ({
        Nama: item.name,
        Kategori: item.category,
        Deskripsi: item.description || "",
        Serial: serial.sn || serial.rfidCode || "",
        Status: serial.status === 1 ? "Tersedia" : serial.status === 0 ? "Dipinjam" : "Tidak tersedia",
        Kondisi: serial.condition === 1 ? "Baik" : serial.condition === 0 ? "Rusak" : "Hilang",
      }))
    })
    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Barang")
    XLSX.writeFile(workbook, `mrc-barang-${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Handle image upload if any
      let imagePath = formData.image || ""
      if (imageFile) {
        const epoch = Date.now()
        const ext = imageFile.name.split('.').pop() || 'png'
        const fileName = `${epoch}.${ext}`
        const destPath = `/assets/img/${fileName}`
        // Save file to public/assets/img/ (client-side, use API route or fallback to window.fs if available)
        // For now, try to use fetch to a local API route (must be implemented in /pages/api/upload.js)
        const form = new FormData()
        form.append('file', imageFile, fileName)
        const res = await fetch('/api/upload', { method: 'POST', body: form })
        if (res.ok) {
          imagePath = destPath
        } else {
          toast.error('Gagal upload gambar, lanjut tanpa gambar', { className: 'toast-error', duration: 6000 })
        }
      }
      // Calculate stock from total serials
      const serials = formData.items || []
      const stock = serials.length
      const now = new Date().toISOString()
      const payload = {
        ...formData,
        image: imagePath,
        stock,
        items: serials.map((s: any, idx: number) => ({
          rfidCode: s.rfidCode,
          sn: s.sn,
          status: typeof s.status === "number" ? s.status : 1,
          condition: typeof s.condition === "number" ? s.condition : 1,
          loanId: s.loanId || null,
        })),
      }
      if (editingItem) {
        await api.updateItem(editingItem.id, payload)
        toast.success("Barang berhasil diperbarui", { className: "toast-success", duration: 6000 })
      } else {
        await api.createItem(payload)
        toast.success("Barang berhasil ditambahkan", { className: "toast-success", duration: 6000 })
      }

      setIsDialogOpen(false)
      setEditingItem(null)
      resetForm()
      setImageFile(null)
      setImagePreview("")
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
      description: item.description || "",
      icon: item.icon || "laptop",
      image: item.image || "",
      items: item.items && Array.isArray(item.items) && item.items.length > 0
        ? item.items.map((s: any) => ({
          rfidCode: s.rfidCode,
          sn: s.sn,
          status: s.status,
          condition: typeof s.condition === "number" ? s.condition : 1,
          loanId: s.loanId || null,
        }))
        : [{ rfidCode: "", sn: "", status: 1, condition: 1, loanId: null }],
      serialSearch: "",
    })
    setImageFile(null)
    setImagePreview(item.image ? item.image : "")
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
      description: "",
      icon: "laptop",
      image: "",
      items: [{ rfidCode: "", sn: "", status: 1, condition: 1 }],
      serialSearch: "",
    })
    setImageFile(null)
    setImagePreview("")
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Barang</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Kelola data barang yang tersedia untuk dipinjam</p>
          </div>
          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <button
              onClick={handleExportItems}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm"
            >
              <Table2 className="w-5 h-5" />
              Export Excel
            </button>
            <button
              onClick={() => router.push('/barang/detail')}
              className="bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium px-3 py-2 rounded-lg transition-all shadow-soft hover:shadow-medium transform hover:scale-[1.02] active:scale-[0.98] flex items-center duration-300 select-none cursor-pointer"
            >
              <Search className="w-5 h-5 mr-2" />
              Cek Serial Number
            </button>
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
                      {/* Upload Gambar */}
                      <div className="md:col-span-2">
                        <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gambar (opsional)</Label>
                        <div className="flex items-center gap-4">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => {
                              const file = e.target.files?.[0] || null
                              setImageFile(file)
                              if (file) {
                                const reader = new FileReader()
                                reader.onload = ev => setImagePreview(ev.target?.result as string)
                                reader.readAsDataURL(file)
                              } else {
                                setImagePreview("")
                              }
                            }}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-accent-50 file:text-accent-700 hover:file:bg-accent-100 dark:file:bg-gray-800 dark:file:text-gray-200 dark:hover:file:bg-gray-700 transition-colors"
                          />
                          {(imagePreview || formData.image) && (
                            <div className="relative w-20 h-20 border rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                              <img
                                src={imagePreview || formData.image}
                                alt="Preview"
                                className="object-contain w-full h-full"
                              />
                              <button
                                type="button"
                                className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-gray-500 hover:text-red-600"
                                onClick={() => {
                                  setImageFile(null)
                                  setImagePreview("")
                                  setFormData(f => ({ ...f, image: "" }))
                                }}
                                aria-label="Hapus gambar"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Ukuran maksimal 2MB. Format: jpg, png, webp, dll.</div>
                      </div>
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
                      <div className="md:col-span-2">
                        <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Serial Number</Label>
                        <div>
                          <div className="p-2 flex flex-col gap-2">
                            <div className="flex items-center gap-2 w-full">
                              <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                                <Input
                                  type="text"
                                  placeholder="Cari serial number..."
                                  value={formData.serialSearch || ""}
                                  onChange={e => setFormData({ ...formData, serialSearch: e.target.value })}
                                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault()
                                      e.stopPropagation()
                                    }
                                  }}
                                  className="input-field pl-10 pr-10 w-full"
                                />
                                {formData.serialSearch && (
                                  <button
                                    type="button"
                                    aria-label="Clear serial search"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 p-1 rounded-full transition-colors"
                                    onClick={() => setFormData({ ...formData, serialSearch: "" })}
                                  >
                                    <X className="h-5 w-5" />
                                  </button>
                                )}
                              </div>
                              <button
                                className="btn-outline flex-shrink-0"
                                type="button"
                                onClick={() => setFormData({ ...formData, items: [...formData.items, { rfidCode: "", sn: "", status: 1, condition: 1 }] })}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Tambah Item
                              </button>
                            </div>
                          </div>
                          <div className="max-h-56 overflow-y-auto">
                            {(formData.items && formData.items
                              .filter(s =>
                                !formData.serialSearch ||
                                (s.rfidCode || "").toLowerCase().includes((formData.serialSearch || "").toLowerCase()) ||
                                (s.sn || "").toLowerCase().includes((formData.serialSearch || "").toLowerCase())
                              )
                            ).map((s, idx) => (
                              <div key={idx} className="flex gap-2 items-center py-2 px-2 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                                <span className="flex-shrink-0 font-mono text-gray-500">{idx + 1}.</span>
                                <Input
                                  type="text"
                                  placeholder="RFID"
                                  value={s.rfidCode}
                                  ref={(el: HTMLInputElement | null) => { serialRefs.current[idx] = el }}
                                  onChange={e => {
                                    const items = [...formData.items]
                                    items[idx].rfidCode = e.target.value
                                    setFormData({ ...formData, items })
                                  }}
                                  onKeyDown={(e) => handleSerialKeyDown(e as unknown as React.KeyboardEvent<HTMLInputElement>, idx)}
                                  className="input-field w-full"
                                  required
                                />
                                <Input
                                  type="text"
                                  placeholder="Serial Number"
                                  value={s.sn}
                                  onChange={e => {
                                    const items = [...formData.items]
                                    items[idx].sn = e.target.value
                                    setFormData({ ...formData, items })
                                  }}
                                  onKeyDown={(e) => handleSerialKeyDown(e as unknown as React.KeyboardEvent<HTMLInputElement>, idx)}
                                  className="input-field w-full"
                                />
                                {/* Status badge only, not editable */}
                                <span
                                  className={`inline-block px-2 py-1 rounded text-xs font-semibold
                                    ${s.condition === -1
                                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                      : s.status === 1
                                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                      : s.status === 2
                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"}
                                `}
                                >
                                  {s.condition === -1
                                    ? "Hilang"
                                    : s.status === 1
                                      ? "Tersedia"
                                    : s.status === 2
                                      ? "Dibooking"
                                      : "Dipinjam"}
                                </span>
                                {/* Condition editable */}
                                <Select
                                  value={typeof s.condition === "number" ? String(s.condition) : "1"}
                                  onValueChange={val => {
                                    const items = [...formData.items]
                                    items[idx].condition = Number(val)
                                    setFormData({ ...formData, items })
                                  }}
                                >
                                  <SelectTrigger className="input-field w-28">
                                    <SelectValue placeholder="Kondisi" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">Baik</SelectItem>
                                    <SelectItem value="0">Rusak</SelectItem>
                                    {editingItem && <SelectItem value="-1">Hilang</SelectItem>}
                                  </SelectContent>
                                </Select>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="ml-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 w-16"
                                  onClick={() => {
                                    const items = formData.items.filter((_, i) => i !== idx)
                                    setFormData({ ...formData, items })
                                  }}
                                  disabled={formData.items.length === 1}
                                  aria-label="Hapus Serial"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Jumlah barang dihitung dari jumlah serial number.</div>
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
                <div className="flex items-center gap-4 mb-4">
                  {/* Icon barang di kiri */}
                  <div className="w-14 h-14 flex items-center justify-center bg-accent-100 dark:bg-accent-900 rounded-xl">
                    {(() => {
                      const Icon = ICON_OPTIONS.find(opt => opt.value === (item.icon || "laptop"))?.icon || Laptop
                      return <Icon className="w-8 h-8 text-accent-600 dark:text-accent-400" />
                    })()}
                  </div>
                  {/* Gambar barang di kanan icon, lebih besar */}
                  <div className="relative w-20 h-20 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-xl"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <ImageIcon className="w-10 h-10 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{item.name}</h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{item.category}</div>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`font-semibold text-2xl ${item.stock === 0 ? "text-red-600 dark:text-red-400" : item.stock < 5 ? "text-yellow-600 dark:text-yellow-400" : "text-accent-600 dark:text-accent-400"}`}>{item.stock}</span><span className="text-lg text-gray-500 dark:text-gray-400 font-semibold">x</span>
                  </div>
                </div>
                {item.description && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">{item.description}</div>
                )}
                <div className="flex flex-col gap-2 text-sm">
                  {(() => {
                    const baik = item.items?.filter((s: any) => s.condition === 1).length || 0;
                    const rusak = item.items?.filter((s: any) => s.condition === 0).length || 0;
                    const hilang = item.items?.filter((s: any) => s.condition === -1).length || 0;
                    // Status counts
                    const tersedia = item.items?.filter((s: any) => s.status === 1 && s.condition !== -1).length || 0;
                    const dipinjam = item.items?.filter((s: any) => s.status === 0).length || 0;
                    const dibooking = item.items?.filter((s: any) => s.status === 2).length || 0;
                    return <>
                      {/* Condition badges (atas) */}
                      <div className="flex items-center gap-2">
                        {baik > 0 && (
                          <span className="badge badge-success">{baik} Baik</span>
                        )}
                        {rusak > 0 && (
                          <span className="badge badge-warning">{rusak} Rusak</span>
                        )}
                        {hilang > 0 && (
                          <span className="badge badge-danger">{hilang} Hilang</span>
                        )}
                      </div>
                      {/* Status count badges (bawah) */}
                      <div className="flex items-center gap-2">
                        {tersedia > 0 && (
                          <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">{tersedia} Tersedia</span>
                        )}
                        {dipinjam > 0 && (
                          <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">{dipinjam} Dipinjam</span>
                        )}
                        {dibooking > 0 && (
                          <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">{dibooking} Dibooking</span>
                        )}
                      </div>
                    </>;
                  })()}
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
