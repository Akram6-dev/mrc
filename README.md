<div align="center">
  <img src="public/mrc.png" alt="MRC Logo" width="200"/>
  
  # MRC - Maintenance Repair Calibration
  ### Sistem Manajemen Peminjaman Barang Sekolah
  ### SMKN 1 Subang
  
  ![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?style=flat-square&logo=next.js)
  ![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
  ![License](https://img.shields.io/badge/License-Private-red?style=flat-square)
</div>

---

## 📋 Daftar Isi

- [Tentang MRC](#-tentang-mrc)
- [Fitur Utama](#-fitur-utama)
- [Persyaratan Sistem](#-persyaratan-sistem)
- [Instalasi](#-instalasi)
- [Cara Penggunaan](#-cara-penggunaan)
- [Notifikasi Otomatis](#-notifikasi-otomatis)
- [Struktur Database](#-struktur-database)
- [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
- [Troubleshooting](#-troubleshooting)
- [FAQ](#-faq)
- [Kontributor](#-kontributor)

---

## 🎯 Tentang MRC

**MRC (Maintenance Repair Calibration) Dashboard** adalah aplikasi web modern untuk mengelola peminjaman barang-barang sekolah seperti laptop, proyektor, kabel HDMI, speaker, dan peralatan lainnya. Aplikasi ini dirancang khusus untuk SMKN 1 Subang dengan fitur lengkap dan antarmuka yang mudah digunakan.

### Kenapa Menggunakan MRC?

- ✅ **Mudah Digunakan** - Antarmuka sederhana dan intuitif
- ✅ **Tracking Real-time** - Pantau status peminjaman secara langsung
- ✅ **RFID Support** - Mendukung pemindaian kartu RFID untuk peminjam dan barang
- ✅ **Notifikasi Otomatis** - Pengingat otomatis untuk pengembalian
- ✅ **Laporan Lengkap** - Riwayat dan analisis data peminjaman
- ✅ **Progressive Web App** - Dapat diinstal seperti aplikasi mobile
- ✅ **Responsive Design** - Dapat diakses dari desktop, tablet, dan smartphone

---

## 🚀 Fitur Utama

### 1. Dashboard Interaktif
- **Statistik Real-time**: Total barang, peminjam aktif, barang dipinjam, dan keterlambatan
- **Grafik Visual**: 
  - Distribusi jam peminjaman per hari (Bar Chart)
  - Trend peminjaman per tanggal (Area Chart)
- **Peminjaman Terbaru**: Tabel 5 data peminjaman terakhir
- **Kartu Statistik**: Akses cepat ke setiap modul dengan satu klik

### 2. Manajemen Barang
- ✏️ Tambah, edit, dan hapus data barang
- 🏷️ Kategorisasi barang dengan ikon (laptop, proyektor, kabel, dll.)
- 📸 Upload gambar untuk setiap barang
- 🔢 **Serial Number Management**: Setiap barang bisa memiliki banyak unit dengan RFID/SN unik
- 📊 Status tracking: Tersedia/Dipinjam
- 🔧 Kondisi barang: Baik/Rusak Ringan/Rusak Berat
- 🔍 Filter berdasarkan kategori dan kondisi
- 🔎 Pencarian real-time
- 📱 Tampilan card dan detail lengkap

### 3. Manajemen Peminjam
- 👤 Tambah, edit, dan hapus data peminjam (guru/staff)
- 📇 Data lengkap: Nama, NIP, ID Pegawai, Nomor Telepon, Gender
- 🎫 Support RFID card untuk identifikasi cepat
- 🔍 Pencarian berdasarkan nama, NIP, atau ID pegawai
- 📄 Pagination untuk data dalam jumlah besar
- 📊 Tracking jumlah peminjaman per peminjam

### 4. Peminjaman Barang
- ➕ Form peminjaman yang mudah dan cepat
- 👨‍🏫 Pilih peminjam dengan autocomplete search
- 📦 Pilih barang dengan autocomplete berdasarkan RFID/Serial Number
- 📅 Tentukan tanggal jatuh tempo
- 📝 Tambahkan catatan untuk setiap item
- 🎯 Tujuan peminjaman
- ✅ Validasi ketersediaan barang otomatis
- 🔄 Tambah multiple items dalam satu peminjaman

### 5. Pengembalian Barang
- 📋 Daftar lengkap peminjaman aktif
- ☑️ Checkbox untuk menandai item yang dikembalikan
- 🔍 Filter berdasarkan:
  - Status (Semua/Terlambat/Akan Jatuh Tempo/Dipinjam/Dikembalikan)
  - Pencarian nama peminjam atau barang
- 🔄 Sorting ascending/descending berdasarkan tanggal
- ⚠️ Highlight otomatis untuk peminjaman terlambat (warna merah)
- 📊 Info detail: Tanggal pinjam, jatuh tempo, dan sisa hari
- 💬 Konfirmasi sebelum pengembalian
- ✅ Update status barang otomatis setelah dikembalikan

### 6. Riwayat Peminjaman
- 📚 Catatan lengkap semua peminjaman (aktif dan selesai)
- 🔍 Filter multi-parameter:
  - Status peminjaman
  - Bulan dan tahun
  - Pencarian nama/barang
- 🗂️ Sorting berdasarkan tanggal
- 📄 Pagination dengan 20 data per halaman
- 🖨️ **Export & Print**: Cetak riwayat dengan filter yang dipilih
- 📊 Detail lengkap setiap transaksi
- 🎨 Status visual dengan warna badge

### 7. Booking/Reservasi
- 📅 Sistem reservasi untuk peminjaman di masa depan
- ✅ Admin dapat menerima atau menolak booking
- 📊 Statistik booking: Pending, Diterima, Ditolak
- 🔍 Filter dan pencarian booking
- 📝 Detail lengkap setiap reservasi
- 📱 Tampilan card untuk setiap booking

### 8. Analisis Data
- 📊 **Top 10 Peminjam Terbanyak**: Guru yang paling sering meminjam
- 🏆 **Top 10 Peminjam Tepat Waktu**: Guru paling rajin mengembalikan
- ⚠️ **Top 10 Sering Terlambat**: Tracking keterlambatan
- 📦 **Top 10 Barang Terpopuler**: Barang paling sering dipinjam
- 📈 **Trend Peminjaman Bulanan**: Grafik per bulan
- 📉 **Trend Pengembalian**: Analisis waktu pengembalian
- 🎯 **Rasio Keterlambatan**: Persentase keterlambatan
- 📅 **Analisis per Hari**: Data peminjaman harian

### 9. Stats (Tampilan Monitor)
- 🖥️ Mode fullscreen untuk display/TV
- 🔄 Auto-refresh data
- 📊 Statistik real-time
- 📈 Grafik interaktif
- ⏱️ Welcome overlay dengan animasi
- 🎨 Tampilan yang menarik untuk dipajang

### 10. Pengaturan
- ⚙️ **Profil Admin**:
  - Ubah nama dan username
  - Ganti password
- 🔔 **Notifikasi**:
  - Toggle pengingat terlambat
  - Toggle pengingat pengembalian
- 🛠️ **Sistem**:
  - Atur durasi peminjaman default (hari)
  - Maksimal item per peminjaman
  - Konfirmasi pengembalian
  - Konfirmasi peminjaman
- 💬 **Pesan**:
  - AI Auto-reply
  - Pesan peminjaman
  - Pesan pengembalian
  - Pesan reminder

---

## 💻 Persyaratan Sistem

### Minimum Requirements:
- **Node.js**: versi 18.x atau lebih tinggi
- **NPM**: versi 9.x atau lebih tinggi (atau Yarn/PNPM)
- **RAM**: Minimal 2GB
- **Storage**: Minimal 500MB ruang kosong
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Recommended Requirements:
- **Node.js**: versi 20.x atau lebih tinggi
- **RAM**: 4GB atau lebih
- **Storage**: 1GB ruang kosong
- **Browser**: Versi terbaru dari browser modern

---

## 📦 Instalasi

### Langkah 1: Clone Repository

```bash
git clone https://github.com/abdipr/mrc.git
cd mrc
```

### Langkah 2: Install Dependencies

Pilih salah satu package manager:

```bash
# Menggunakan NPM
npm install

# Atau menggunakan Yarn
yarn install

# Atau menggunakan PNPM
pnpm install
```

### Langkah 3: Setup Database

Database menggunakan file JSON lokal yang sudah tersedia di folder `database/`. File-file yang ada:

- `items.json` - Data barang
- `borrowers.json` - Data peminjam
- `loans.json` - Data peminjaman
- `bookings.json` - Data booking
- `notifications.json` - Data notifikasi
- `settings.json` - Pengaturan aplikasi

**Tidak perlu setup database eksternal**, semua data tersimpan dalam file JSON.

### Langkah 4: Konfigurasi (Opsional)

Edit file `database/settings.json` untuk konfigurasi awal:

```json
{
  "siteName": "Administrator",
  "theme": "light",
  "admin": {
    "username": "admin",
    "password": "admin123"
  },
  "notifications": {
    "overdueReminders": true,
    "returnReminders": true
  },
  "system": {
    "defaultLoanDays": 1,
    "maxLoanItems": 20,
    "returnConfirmation": true,
    "borrowConfirmation": false
  }
}
```

### Langkah 5: Jalankan Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:80` (port 80).

**Catatan**: Untuk production, gunakan:

```bash
npm run build
npm start
```

---

## 📖 Cara Penggunaan
<details>
<summary>1. Login</summary>

1. Buka browser dan akses `http://localhost:80` atau alamat server Anda
2. Halaman login akan muncul dengan logo MRC
3. Masukkan kredensial default:
   - **Username**: `admin`
   - **Password**: Lihat di `database/settings.json`
4. Klik tombol **Masuk**
5. Anda akan diarahkan ke Dashboard

**💡 Tips**: Segera ubah password default di menu Pengaturan setelah login pertama kali.
</details>
<details>
<summary>2. Dashboard</summary>

Dashboard adalah halaman utama yang menampilkan ringkasan aktivitas peminjaman.

#### Fitur Dashboard:

**A. Kartu Statistik (4 Card)**
- **Total Barang**: Jumlah total barang yang tersedia
  - Klik untuk ke halaman Barang
- **Peminjam Aktif**: Jumlah guru yang sedang meminjam
  - Klik untuk ke halaman Pengembalian
- **Sedang Dipinjam**: Total barang yang sedang dipinjam
  - Klik untuk ke halaman Pengembalian
- **Terlambat**: Jumlah peminjaman yang terlambat
  - Klik untuk ke halaman Pengembalian

**B. Tabel Peminjaman Terbaru**
- Menampilkan 5 peminjaman terakhir
- Informasi: Peminjam, Barang, Jatuh Tempo, Status
- Warna highlight merah untuk yang terlambat

**C. Grafik Distribusi Jam Peminjaman**
- Bar chart bertumpuk per jam (0-23)
- Dipisahkan per hari (Senin-Jumat)
- Hover untuk detail per jam

**D. Grafik Trend Peminjaman**
- Area chart per tanggal
- Menampilkan tren naik/turun
- Perbandingan dengan hari sebelumnya
</details>
<details>
<summary>3. Manajemen Barang</summary>

Kelola semua barang yang dapat dipinjam.

#### Menambah Barang Baru:

1. Klik tombol **"+ Tambah Barang"** di pojok kanan atas
2. Dialog form akan terbuka dengan field:
   - **Nama Barang** (wajib): Contoh "Laptop Asus"
   - **Kategori**: Contoh "Elektronik"
   - **Ikon**: Pilih ikon yang sesuai (laptop, proyektor, dll.)
   - **Deskripsi**: Detail barang
   - **Gambar**: Upload foto barang (opsional)
3. **Tambah Serial Number**:
   - Setiap barang bisa punya banyak unit
   - Klik **"+ Serial Number"**
   - Isi:
     - **RFID Code**: Kode RFID unik (wajib)
     - **Serial Number**: SN dari barang (opsional)
     - **Status**: Tersedia/Dipinjam (otomatis tersedia)
     - **Kondisi**: Baik/Rusak Ringan/Rusak Berat
   - Tambahkan sebanyak yang dibutuhkan
4. Klik **"Simpan"**

**💡 Tips**:
- Gunakan scanner RFID untuk input kode RFID lebih cepat
- Upload gambar barang untuk identifikasi visual yang lebih mudah
- Gunakan ikon yang sesuai untuk memudahkan pengenalan

#### Mengedit Barang:

1. Cari barang yang ingin diedit menggunakan search box
2. Atau gunakan filter kategori/kondisi
3. Klik ikon **pensil** pada card barang
4. Ubah data yang diperlukan
5. Untuk serial number:
   - Edit langsung di form
   - Gunakan search untuk filter serial number tertentu
   - Hapus serial dengan klik ikon X
6. Klik **"Update"**

#### Menghapus Barang:

1. Klik ikon **tempat sampah** pada card barang
2. Konfirmasi penghapusan akan muncul
3. **Perhatian**: Barang yang sedang dipinjam tidak bisa dihapus
4. Klik **"Hapus"** untuk konfirmasi

#### Filter dan Pencarian:

- **Search Box**: Ketik nama barang untuk pencarian real-time
- **Filter Kategori**: Pilih kategori tertentu atau "Semua"
- **Filter Kondisi**: Pilih kondisi atau "Semua"
- Kombinasi filter akan otomatis menyaring data
</details>
<details>
<summary>4. Manajemen Peminjam</summary>

Kelola data peminjam (guru dan staff).

#### Menambah Peminjam Baru:

1. Klik tombol **"+ Tambah Peminjam"**
2. Isi form:
   - **Nama Lengkap** (wajib)
   - **NIP**: Nomor Induk Pegawai
   - **ID Pegawai**: ID khusus sekolah
   - **Nomor Telepon**: Format Indonesia (08xxx)
   - **RFID**: Kode kartu RFID (scan dengan RFID reader)
   - **Jenis Kelamin**: Laki-laki/Perempuan
3. Klik **"Simpan"**

**💡 Tips**:
- Pastikan data NIP dan ID Pegawai akurat untuk tracking
- RFID card mempercepat proses peminjaman
- Nomor telepon akan digunakan untuk notifikasi (fitur mendatang)

#### Mengedit Peminjam:

1. Gunakan search box untuk cari peminjam
2. Klik ikon **pensil** pada baris peminjam
3. Edit data yang diperlukan
4. Klik **"Update"**

#### Menghapus Peminjam:

1. Klik ikon **tempat sampah**
2. **Perhatian**: Peminjam yang memiliki riwayat peminjaman aktif tidak bisa dihapus
3. Konfirmasi penghapusan
4. Data akan dihapus permanen

#### Fitur Tambahan:

- **Pagination**: 20 data per halaman
- **Search**: Real-time search by nama, NIP, atau ID
- **Avatar**: Inisial nama dengan warna unik
- **Statistik**: Lihat total peminjaman per orang
</details>
<details>
<summary>5. Peminjaman</summary>

Catat peminjaman barang baru.

#### Cara Melakukan Peminjaman:

1. **Pilih Peminjam**:
   - Klik field "Pilih Peminjam"
   - Popup search akan muncul
   - Ketik nama, NIP, atau ID pegawai
   - Atau scan RFID card peminjam
   - Klik nama peminjam untuk memilih

2. **Pilih Barang**:
   - Klik field "Cari barang (RFID/SN)"
   - Ketik atau scan RFID/Serial Number
   - Barang akan muncul dengan autocomplete
   - Pilih barang yang diinginkan
   - Barang akan ditambahkan ke daftar

3. **Tambah Catatan Item** (opsional):
   - Setelah barang dipilih, field catatan muncul
   - Tulis catatan khusus untuk item tersebut
   - Contoh: "Dengan tas laptop", "Tidak ada charger"

4. **Tambah Lebih Banyak Barang**:
   - Klik **"+ Tambah Item"**
   - Ulangi proses pilih barang
   - Bisa menambahkan hingga batas maksimal (default 20)

5. **Hapus Item**:
   - Klik ikon **X** di sebelah barang
   - Item akan dihapus dari daftar

6. **Tentukan Jatuh Tempo**:
   - Klik field tanggal
   - Pilih tanggal dari kalender
   - Atau akan otomatis diisi dengan default duration (dari settings)

7. **Isi Tujuan Peminjaman** (opsional):
   - Contoh: "Mengajar di Lab Komputer", "Rapat OSIS"

8. **Catatan Tambahan** (opsional):
   - Informasi tambahan tentang peminjaman

9. **Submit**:
   - Klik tombol **"Ajukan Peminjaman"**
   - Loading akan muncul
   - Toast sukses akan muncul jika berhasil
   - Form akan direset otomatis

#### Validasi Otomatis:

- ❌ Tidak bisa memilih barang yang sedang dipinjam
- ❌ Tidak bisa submit tanpa peminjam
- ❌ Tidak bisa submit tanpa barang
- ❌ Tidak bisa submit tanpa tanggal jatuh tempo
- ✅ Autocomplete hanya menampilkan barang tersedia
- ✅ Validasi RFID unik

**💡 Tips**:
- Gunakan RFID scanner untuk input lebih cepat
- Beri catatan detail untuk setiap item
- Pastikan tanggal jatuh tempo sesuai kebutuhan
</details>
<details>
<summary>6. Pengembalian</summary>

Proses pengembalian barang yang dipinjam.

#### Cara Mengembalikan Barang:

1. **Cari Peminjaman**:
   - Gunakan search box untuk cari nama peminjam atau barang
   - Atau gunakan filter:
     - **Semua**: Tampilkan semua peminjaman
     - **Terlambat**: Hanya yang sudah lewat jatuh tempo
     - **Akan Jatuh Tempo**: 3 hari lagi jatuh tempo
     - **Dipinjam**: Sedang dipinjam (belum jatuh tempo)
     - **Dikembalikan**: Sudah dikembalikan

2. **Pilih Item yang Dikembalikan**:
   - Setiap peminjaman menampilkan daftar barang
   - **Centang checkbox** di sebelah item yang akan dikembalikan
   - Bisa pilih sebagian atau semua item
   - Item yang sudah dikembalikan tidak ada checkbox (disabled)

3. **Klik Tombol Kembalikan**:
   - Tombol **"Kembalikan"** akan aktif jika ada item dicentang
   - Klik tombol tersebut

4. **Konfirmasi Pengembalian**:
   - Dialog konfirmasi akan muncul
   - Menampilkan:
     - Nama peminjam
     - Tanggal peminjaman
     - Tanggal jatuh tempo
     - Daftar item yang akan dikembalikan
   - Klik **"Ya, Kembalikan"** untuk konfirmasi

5. **Selesai**:
   - Toast sukses akan muncul
   - Status item berubah menjadi "Dikembalikan"
   - Barang kembali tersedia untuk dipinjam
   - Jika semua item sudah dikembalikan, status peminjaman berubah

#### Visual Indicator:

- 🟢 **Hijau (Badge "Dikembalikan")**: Sudah dikembalikan
- 🟡 **Kuning (Badge "Dipinjam")**: Sedang dipinjam, belum jatuh tempo
- 🔴 **Merah (Badge "Terlambat")**: Sudah lewat jatuh tempo
- 🔴 **Background Merah**: Baris peminjaman yang terlambat

#### Informasi Detail:

Setiap baris peminjaman menampilkan:
- **Peminjam**: Avatar, nama lengkap
- **Barang**: Ikon, nama, dan jumlah
- **Status Item**: Checkbox untuk setiap item (jika belum dikembalikan)
- **Tanggal Pinjam**: Kapan dipinjam
- **Jatuh Tempo**: Deadline pengembalian
- **Sisa Hari**: Berapa hari lagi (atau sudah terlambat berapa hari)

**💡 Tips**:
- Periksa filter "Terlambat" setiap hari
- Gunakan filter "Akan Jatuh Tempo" untuk reminder
- Partial return: Bisa kembalikan sebagian item dulu
</details>
<details>
<summary>7. Riwayat</summary>

Lihat catatan lengkap semua transaksi peminjaman.

#### Filter dan Pencarian:

**A. Pencarian**:
- Ketik di search box
- Cari berdasarkan:
  - Nama peminjam
  - NIP peminjam
  - ID Pegawai
  - Nama barang

**B. Filter Status**:
- **Semua**: Tampilkan semua transaksi
- **Dipinjam**: Masih dipinjam
- **Dikembalikan**: Sudah dikembalikan
- **Terlambat**: Peminjaman yang terlambat

**C. Filter Bulan**:
- Pilih bulan tertentu
- Atau pilih "Semua Bulan"

**D. Filter Tahun**:
- Pilih tahun tertentu
- Atau pilih "Semua Tahun"

**E. Sorting**:
- **Terbaru**: Peminjaman terbaru di atas
- **Terlama**: Peminjaman terlama di atas

#### Pagination:

- Menampilkan 20 data per halaman
- Navigasi: Previous, 1, 2, 3, ..., Next
- Total data ditampilkan di bawah

#### Print/Export:

1. **Set Filter** sesuai yang diinginkan
2. Klik tombol **"🖨️ Cetak Riwayat"**
3. Halaman print preview akan terbuka di tab baru
4. Data yang dicetak sesuai dengan filter yang dipilih
5. **Cetak**:
   - Klik menu Print di browser (Ctrl+P)
   - Pilih printer atau Save as PDF
   - Atur layout: Portrait/Landscape
   - Klik Print

#### Detail Transaksi:

Klik baris peminjaman untuk melihat detail lengkap:
- Informasi peminjam lengkap
- Semua barang yang dipinjam
- Catatan untuk setiap item
- Tujuan peminjaman
- Catatan tambahan
- Timeline: Tanggal pinjam, jatuh tempo, tanggal kembali
- Status setiap item

**💡 Tips**:
- Export PDF untuk arsip bulanan
- Gunakan filter bulan/tahun untuk laporan periodik
- Kombinasi filter untuk analisis spesifik
</details>
<details>
<summary>8. Booking/Reservasi</summary>

Kelola reservasi peminjaman dari pengguna.

#### Melihat Daftar Booking:

**Statistik Card**:
- **Total Pending**: Booking yang menunggu persetujuan
- **Total Diterima**: Booking yang sudah disetujui
- **Total Ditolak**: Booking yang ditolak

**Filter**:
- Status: Semua/Pending/Accepted/Rejected
- Search: Nama peminjam atau barang
- Sort: Terbaru/Terlama

#### Melihat Detail Booking:

1. Klik baris booking
2. Dialog detail akan muncul dengan informasi:
   - **Peminjam**: Nama, NIP, ID Pegawai, Telepon
   - **Barang**: Daftar lengkap dengan ikon
   - **Tanggal**: Start date - End date
   - **Tujuan**: Keperluan booking
   - **Catatan**: Catatan tambahan
   - **Status**: Current status

#### Menerima Booking:

1. Klik tombol **"✓ Terima"** (hijau) pada baris booking
2. Dialog konfirmasi akan muncul
3. Klik **"Ya, Terima"**
4. Status berubah menjadi "Accepted"
5. Barang akan direservasi untuk tanggal tersebut

#### Menolak Booking:

1. Klik tombol **"✕ Tolak"** (merah) pada baris booking
2. Dialog konfirmasi akan muncul
3. Klik **"Ya, Tolak"**
4. Status berubah menjadi "Rejected"

#### Visual Indicator:

- 🟡 **Orange Badge "Pending"**: Menunggu persetujuan
- 🟢 **Hijau Badge "Accepted"**: Sudah diterima
- 🔴 **Merah Badge "Rejected"**: Ditolak

**💡 Tips**:
- Cek halaman booking secara berkala untuk pending requests
- Periksa ketersediaan barang sebelum menerima
- Beri catatan jika menolak untuk komunikasi lebih baik
</details>
<details>
<summary>9. Analisis</summary>

Lihat analisis mendalam tentang pola peminjaman.

#### A. Top 10 Peminjam Terbanyak

**Tabel menampilkan**:
- Ranking 1-10
- Nama peminjam
- NIP
- Total peminjaman
- Avatar dengan warna unik

**Fungsi**:
- Identifikasi pengguna paling aktif
- Planning ketersediaan barang

#### B. Top 10 Peminjam Tepat Waktu

**Tabel menampilkan**:
- Ranking 1-10
- Peminjam yang paling rajin mengembalikan tepat waktu
- Jumlah pengembalian tepat waktu

**Fungsi**:
- Reward atau apresiasi peminjam disiplin
- Role model untuk yang lain

#### C. Top 10 Sering Terlambat

**Tabel menampilkan**:
- Ranking 1-10
- Peminjam yang sering terlambat mengembalikan
- Jumlah keterlambatan

**Fungsi**:
- Warning atau reminder khusus
- Follow-up untuk peminjam bermasalah

#### D. Top 10 Barang Terpopuler

**Tabel menampilkan**:
- Ranking 1-10
- Nama barang
- Kategori
- Total dipinjam
- Ikon barang

**Fungsi**:
- Planning pengadaan barang baru
- Identifikasi kebutuhan populer

#### E. Grafik Trend Peminjaman Bulanan

**Line Chart menampilkan**:
- Sumbu X: Bulan (Jan-Des)
- Sumbu Y: Jumlah peminjaman
- Line: Trend per bulan

**Fungsi**:
- Analisis pola musiman
- Prediksi kebutuhan

#### F. Statistik Tambahan

- **Total Peminjaman**: All-time total
- **Rata-rata per Bulan**: Average
- **Bulan Tertinggi**: Peak month
- **Bulan Terendah**: Lowest month

**💡 Tips**:
- Review analisis setiap bulan
- Export data untuk presentasi
- Gunakan untuk laporan management
</details>
<details>
<summary>10. Stats (Tampilan Monitor)</summary>

Mode fullscreen untuk display/TV di ruangan.

#### Cara Menggunakan:

1. Buka halaman Stats
2. Tampilan fullscreen otomatis
3. Data refresh otomatis setiap beberapa detik

#### Yang Ditampilkan:

**Welcome Overlay**:
- Logo MRC
- "Selamat Datang di MRC"
- Animasi fade in/out
- Loop otomatis

**Dashboard Content**:
- 4 Card statistik besar
- Tabel peminjaman terbaru (lebih banyak)
- Grafik real-time
- Design modern dan eye-catching

#### Fitur Khusus:

- ✨ Animasi smooth
- 🔄 Auto-refresh data
- 📺 Optimized untuk TV/projector
- 🎨 High-contrast colors
- 📊 Large fonts untuk readability

**💡 Tips**:
- Gunakan di ruang staff atau lobby
- Pajang di layar TV untuk transparency
- Refresh browser jika perlu manual update
</details>
<details>
<summary>11. Pengaturan</summary>

Konfigurasi aplikasi dan preferences.

#### Tab Profil Admin

**Edit Profil**:
- **Nama**: Nama admin/sekolah
- **Username**: Username untuk login
- **Password Saat Ini**: Wajib untuk verifikasi
- **Password Baru**: Isi jika ingin ganti password
- **Konfirmasi Password**: Ulangi password baru

**Cara Ganti Password**:
1. Isi "Password Saat Ini"
2. Isi "Password Baru"
3. Isi "Konfirmasi Password"
4. Klik **"Simpan Profil"**
5. Login ulang dengan password baru

#### Tab Notifikasi

**Pengingat Keterlambatan**:
- Toggle ON/OFF
- Fungsi: Notifikasi untuk peminjaman terlambat

**Pengingat Pengembalian**:
- Toggle ON/OFF
- Fungsi: Notifikasi sebelum jatuh tempo (H-1, H-3)

#### Tab Sistem

**Durasi Peminjaman Default**:
- Input: Jumlah hari
- Default: 1 hari
- Fungsi: Otomatis set jatuh tempo di form peminjaman

**Maksimal Item per Peminjaman**:
- Input: Jumlah item
- Default: 20 item
- Fungsi: Limit peminjaman per transaksi

**Konfirmasi Pengembalian**:
- Toggle ON/OFF
- Fungsi: Popup konfirmasi sebelum mengembalikan

**Konfirmasi Peminjaman**:
- Toggle ON/OFF
- Fungsi: Popup konfirmasi sebelum submit peminjaman

#### Tab Pesan

**AI Auto-reply**:
- Toggle ON/OFF
- Fungsi: Balas otomatis dengan AI (fitur mendatang)

**Pesan Peminjaman**:
- Toggle ON/OFF
- Fungsi: Kirim pesan saat peminjaman berhasil

**Pesan Pengembalian**:
- Toggle ON/OFF
- Fungsi: Kirim pesan saat pengembalian

**Pesan Reminder**:
- Toggle ON/OFF
- Fungsi: Kirim reminder sebelum jatuh tempo

**Cara Menyimpan Pengaturan**:
1. Ubah settings yang diinginkan
2. Klik **"Simpan Pengaturan"** di bagian bawah setiap tab
3. Toast konfirmasi akan muncul
4. Settings langsung aktif

**💡 Tips**:
- Backup file `settings.json` secara berkala
- Jangan lupa password admin
- Atur notifikasi sesuai kebutuhan
</details>

---

## 🔔 Notifikasi Otomatis

MRC memiliki sistem notifikasi otomatis yang berjalan di background.

### Cara Kerja:

1. **Background Service**: 
   - File: `scripts/notificationScheduler.js`
   - Berjalan otomatis saat aplikasi start
   - Cek database setiap periode tertentu

2. **Jenis Notifikasi**:
   
   **A. Notifikasi Keterlambatan**:
   - Muncul untuk peminjaman yang lewat jatuh tempo
   - Dicek setiap hari
   - Format: "Peminjaman oleh [Nama] terlambat [X] hari"
   
   **B. Notifikasi Jatuh Tempo Hari Ini**:
   - Reminder untuk yang jatuh tempo hari ini
   - Format: "Peminjaman oleh [Nama] jatuh tempo hari ini"
   
   **C. Notifikasi H-1**:
   - Reminder 1 hari sebelum jatuh tempo
   - Format: "Peminjaman oleh [Nama] akan jatuh tempo besok"

3. **Melihat Notifikasi**:
   - Icon bell (🔔) di header
   - Badge merah untuk unread count
   - Klik untuk buka dropdown
   - List notifikasi terbaru

4. **Menandai Dibaca**:
   - Klik notifikasi untuk mark as read
   - Badge count akan berkurang

### Konfigurasi:

Edit `scripts/notificationScheduler.js` untuk:
- Interval cek (default setiap jam)
- Format pesan
- Logic reminder

**💡 Tips**:
- Jangan stop background service
- Check notifikasi setiap hari
- Export notifikasi untuk arsip

---

## 🗄️ Struktur Database

Database menggunakan file JSON di folder `database/`.

### 1. items.json

```json
{
  "id": "unique-id",
  "name": "Laptop Asus",
  "category": "Elektronik",
  "icon": "laptop",
  "description": "Laptop untuk lab komputer",
  "image": "/uploads/laptop.jpg",
  "items": [
    {
      "rfidCode": "ABC123",
      "sn": "SN001",
      "status": 0,
      "condition": 1,
      "loanId": "loan-id"
    }
  ],
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

**Status**:
- `0` = Dipinjam
- `1` = Tersedia
- `2` = Dibooking

**Condition**:
- `-1` = Hilang
- `0` = Rusak
- `1` = Baik

### 2. borrowers.json

```json
{
  "id": "unique-id",
  "name": "John Doe",
  "nip": "123456789",
  "officerId": "OFF001",
  "rfid": "RFID123",
  "phone": "08123456789",
  "gender": "L",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

### 3. loans.json

```json
{
  "id": "unique-id",
  "borrowerId": "borrower-id",
  "items": [
    {
      "rfidCode": "ABC123",
      "note": "Dengan charger"
    }
  ],
  "dueDate": "2025-01-10T00:00:00.000Z",
  "returnDate": null,
  "purpose": "Mengajar",
  "notes": "Catatan tambahan",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

### 4. bookings.json

```json
{
  "id": "unique-id",
  "borrowerId": "borrower-id",
  "items": [
    {
      "itemId": "item-id",
      "quantity": 1
    }
  ],
  "startDate": "2025-01-15T00:00:00.000Z",
  "endDate": "2025-01-16T00:00:00.000Z",
  "purpose": "Rapat",
  "notes": "Urgent",
  "status": "pending",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

**Status**:
- `pending` = Menunggu
- `accepted` = Diterima
- `rejected` = Ditolak

### 5. notifications.json

```json
{
  "id": 1234567890,
  "message": "Peminjaman oleh John terlambat 2 hari",
  "type": "overdue",
  "read": false,
  "timestamp": "2025-01-01T00:00:00.000Z",
  "slot": "loan-id"
}
```

### 6. settings.json

Lihat bagian [Instalasi - Langkah 4](#langkah-4-konfigurasi-opsional)

---

## 🛠️ Teknologi yang Digunakan

### Frontend:
- **Next.js 15.2.4** - React framework
- **React 19** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 3.4** - Styling
- **shadcn/ui** - Component library
- **Radix UI** - Headless components
- **Lucide React** - Icon library
- **Recharts** - Charting library
- **date-fns** - Date utility
- **Sonner** - Toast notifications
- **GSAP** - Animations

### Backend:
- **Next.js API Routes** - Serverless functions
- **File-based Database** - JSON storage
- **Node.js** - Runtime

### Additional Libraries:
- **react-hook-form** - Form handling
- **zod** - Schema validation
- **xlsx** - Excel export
- **next-pwa** - Progressive Web App
- **next-themes** - Dark mode support

### Development Tools:
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

---

## ❓ Troubleshooting

<details>
<summary>1. Port 80 sudah digunakan</summary>

**Problem**: Error "Port 80 is already in use"

**Solusi**:
```bash
# Option 1: Ubah port di package.json
"dev": "next dev -p 3000"

# Option 2: Kill process di port 80 (Windows)
netstat -ano | findstr :80
taskkill /PID <PID> /F

# Option 3: Kill process (Linux/Mac)
lsof -ti:80 | xargs kill -9
```
</details>
<details>
<summary>2. NPM Install Error</summary>

**Problem**: Gagal install dependencies

**Solusi**:
```bash
# Clear cache
npm cache clean --force

# Delete node_modules dan package-lock.json
rm -rf node_modules package-lock.json

# Install ulang
npm install
```
</details>
<details>
<summary>3. Database File Corrupt</summary>

**Problem**: Error reading JSON files

**Solusi**:
```bash
# Backup dulu
cp database/items.json database/items.json.bak

# Validate JSON
# Gunakan online JSON validator atau:
node -e "console.log(JSON.parse(require('fs').readFileSync('database/items.json')))"

# Fix format jika perlu
```
</details>
<details>
<summary>4. Notifikasi Tidak Muncul</summary>

**Problem**: Background service tidak berjalan

**Solusi**:
```bash
# Cek apakah notificationScheduler.js berjalan
# Lihat di package.json, pastikan:
"dev": "start /B node scripts/notificationScheduler.js && next dev"

# Test manual
node scripts/notificationScheduler.js
```
</details>
<details>
<summary>5. RFID Scanner Tidak Terdeteksi</summary>

**Problem**: Input dari scanner tidak masuk

**Solusi**:
1. Pastikan scanner dikonfigurasi sebagai keyboard emulation
2. Test scanner di notepad/text editor
3. Cek apakah ada karakter tambahan (Enter, Tab) yang perlu difilter
4. Scanner harus mengakhiri input dengan Enter
</details>
<details>
<summary>6. Gambar Upload Tidak Muncul</summary>

**Problem**: Gambar tidak tampil setelah upload

**Solusi**:
```bash
# Pastikan folder public/uploads exist
mkdir public/uploads

# Cek permissions (Linux/Mac)
chmod 755 public/uploads

# Cek path di database/items.json
# Harus relatif: "/uploads/filename.jpg"
```
</details>
<details>
<summary>7. Build Error</summary>

**Problem**: `npm run build` gagal

**Solusi**:
```bash
# Clear .next folder
rm -rf .next

# Rebuild
npm run build

# Cek TypeScript errors
npm run lint
```
</details>
<details>
<summary>8. Data Hilang Setelah Restart</summary>

**Problem**: Data tidak tersimpan

**Solusi**:
1. Pastikan file JSON di `database/` tidak read-only
2. Cek log error di console
3. Pastikan aplikasi memiliki write permission
4. Backup database secara berkala
</details>

---

## 💬 FAQ

**Q: Apakah MRC bisa diakses dari HP?**
A: Ya, MRC fully responsive dan bisa diakses dari smartphone. Bahkan bisa diinstal sebagai PWA.

**Q: Bagaimana cara backup data?**
A: Cukup copy folder `database/` ke tempat aman. Semua data ada di file JSON tersebut.

**Q: Bisa tidak menggunakan database MySQL atau PostgreSQL?**
A: Bisa, tapi perlu modifikasi besar. Saat ini menggunakan JSON untuk simplicity.

**Q: Apakah mendukung multiple user/roles?**
A: Saat ini hanya single admin. Multi-user role sedang development.

**Q: Bagaimana cara reset password admin?**
A: Edit langsung file `database/settings.json`, ubah field `admin.password`.

**Q: Apakah bisa export data ke Excel?**
A: Ya, di halaman Riwayat ada fitur export. Gunakan library xlsx untuk custom export.

**Q: Bagaimana cara update aplikasi?**
A: 
```bash
git pull origin main
npm install  # Jika ada dependency baru
npm run build
npm start
```

**Q: Apakah support RFID reader bluetooth?**
A: Tergantung RFID reader. Jika reader emulate keyboard, otomatis support.

**Q: Data maksimal berapa?**
A: File JSON bisa handle ribuan records. Untuk >10,000 records, consider migrate ke real database.

**Q: Bisa tidak diakses dari internet?**
A: Ya, deploy ke Vercel, Netlify, atau VPS. Tutorial ada di dokumentasi Next.js.

**Q: Support dark mode?**
A: Ya, sudah built-in dengan next-themes.

**Q: Bagaimana cara custom logo?**
A: Ganti file `public/mrc.png` dan `public/mrc-icon.png` dengan logo Anda.

---

## 👥 Kontributor

### Developer:
- **Abdi Putrana Radian** - Siswa Jurusan TKJ SMKN 1 Subang Periode 2023-2026

### Special Thanks:
- Tim MRC
- Guru dan Staff SMKN 1 Subang
- Beta Testers

---

## 📞 Kontak & Support

Untuk pertanyaan, bug report, atau feature request:

- **GitHub Issues**: [https://github.com/abdipr/mrc/issues](https://github.com/abdipr/mrc/issues)
- **Email**: me@abdi.cc
- **Website**: [abdi.cc](https://abdi.cc)

---

## 📄 Lisensi

Aplikasi ini adalah properti MRC di SMKN 1 Subang dan untuk penggunaan internal sekolah.

---

<div align="center">
  <p>Dibuat dengan ❤️ untuk MRC SMKN 1 Subang</p>
  <p>© 2025 Maintenance Repair Calibration - SMKN 1 Subang</p>

  <div style="display: flex; justify-content: center; align-items: center; gap: 10px;">
    <img src="public/mrc.png" alt="MRC Icon" height="40"/>
    <img src="https://abdi.cc/assets/abdi.png" alt="Abdi Icon" height="40"/>
  </div>
</div>

