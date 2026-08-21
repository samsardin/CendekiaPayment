# Product Requirements Document (PRD)
# Aplikasi Manajemen Pembayaran & Keuangan Sekolah
## Cendekia Lamongan

**Versi** : 1.0  
**Tanggal** : Agustus 2026  
**Status** : Draft Awal

---

# 1. Latar Belakang

Cendekia Lamongan memiliki dua unit pendidikan:

- KBTK-IT Cendekia
- SDIT Cendekia

Saat ini pengelolaan pembayaran siswa dan pencatatan keuangan masih memerlukan sistem yang lebih terintegrasi agar seluruh proses administrasi, pembayaran, pencatatan kas, pelaporan, hingga monitoring keuangan dapat dilakukan secara real-time.

Sistem yang akan dibangun tidak hanya berfungsi sebagai aplikasi pembayaran sekolah, namun menjadi **School Financial Management System (SFMS)** yang mampu mengelola pemasukan, pengeluaran, saldo akun, laporan keuangan, dan notifikasi pembayaran secara otomatis.

---

# 2. Tujuan Sistem

Membangun sistem yang mampu:

- Mengelola seluruh pembayaran siswa
- Mengelola kas masuk dan kas keluar
- Mengelola akun keuangan sekolah
- Menghasilkan laporan keuangan otomatis
- Mempermudah orang tua melakukan pembayaran
- Mengurangi kesalahan pencatatan
- Menyediakan dashboard keuangan yang informatif
- Mendukung pembayaran digital melalui Payment Gateway

---

# 3. Ruang Lingkup

Sistem mencakup:

- Master Data Sekolah
- Master Data Siswa
- Master Pos Pembayaran
- Master Akun Keuangan
- Tagihan
- Pembayaran
- Payment Gateway
- WA Gateway
- Pengeluaran
- Dashboard
- Laporan
- Hak Akses
- Audit Log

---

# 4. Jenjang Sekolah

## 4.1 KBTK-IT Cendekia

## 4.2 SDIT Cendekia

Setiap jenjang memiliki:

- Tahun Ajaran
- Kelas
- Rombel
- Wali Kelas
- Daftar Siswa

---

# 5. Master Pos Pembayaran

## KBTK

- Biaya Pendidikan KBTK
- Biaya Perlengkapan KBTK
- Biaya Outing KBTK
- Biaya Seragam KBTK
- Uang Komite KBTK
- Infaq Pembangunan KBTK

## SDIT

- Biaya Pendidikan SDIT
- Biaya Perlengkapan SDIT
- Biaya Outing SDIT
- Biaya Ekskul SDIT
- Iuran Komite SDIT
- Infaq Pembangunan SDIT

---

# 6. Manajemen Pos Pembayaran

Admin dapat:

- Menambah Pos Pembayaran
- Menghapus Pos Pembayaran
- Mengubah Nama Pos
- Mengaktifkan / Menonaktifkan Pos
- Mengatur Urutan Tampilan
- Mengatur Jenjang
- Menentukan apakah pos:
  - Bulanan
  - Tahunan
  - Sekali Bayar
  - Angsuran

Tanpa perlu programmer.

---

# 7. Jenis Pembayaran

## A. Bulanan

Contoh:

Biaya Pendidikan

Karakteristik:

- Tagihan otomatis setiap bulan
- Periode Januari-Desember / Tahun Ajaran
- Bisa dibayar sebagian
- Bisa dibayar penuh
- Bisa dibayar beberapa bulan sekaligus

---

## B. Tahunan

Contoh:

- Seragam
- Perlengkapan
- Komite
- Outing
- Ekskul
- Infaq

Walaupun tahunan, sistem harus mendukung:

- Cicilan
- Angsuran bebas
- Pelunasan kapan saja

---

# 8. Fleksibilitas Nominal

Nominal pembayaran harus bisa diatur berdasarkan:

## Level 1

Default Sekolah

Contoh:

SPP SDIT = Rp500.000

---

## Level 2

Per Kelas

Misal:

Kelas 1 = Rp500.000

Kelas 2 = Rp525.000

---

## Level 3

Per Siswa

Misal:

Ahmad = Rp450.000

Fatimah = Rp500.000

Ali = Rp375.000 (Beasiswa)

Prioritas sistem:

Nominal Siswa

↓

Nominal Kelas

↓

Nominal Default

---

# 9. Sistem Tagihan

Tagihan dibuat otomatis.

Status:

- Belum Dibayar
- Sebagian
- Lunas
- Terlambat

Informasi:

- Nomor Tagihan
- Nama Siswa
- Kelas
- Pos
- Nominal
- Sudah Dibayar
- Sisa
- Jatuh Tempo

---

# 10. Sistem Angsuran

Semua pos (kecuali ditentukan lain) dapat diangsur.

Contoh:

Seragam

Rp2.000.000

Bayar:

Rp500.000

Rp300.000

Rp700.000

Rp500.000

Status otomatis:

Lunas

---

# 11. Struktur Akun Keuangan

## Akun Gabungan

### Total Biaya Pendidikan

Menggabungkan:

- Biaya Pendidikan KBTK
- Biaya Pendidikan SDIT

---

### Total Infaq Pembangunan

Menggabungkan:

- Infaq KBTK
- Infaq SDIT

---

## Akun Terpisah

- Perlengkapan KBTK
- Perlengkapan SDIT
- Outing KBTK
- Outing SDIT
- Seragam KBTK
- Ekskul SDIT
- Komite KBTK
- Komite SDIT

Sistem harus otomatis memetakan pembayaran ke akun yang sesuai.

---

# 12. Pengeluaran

Master Pengeluaran:

- Gaji Pegawai
- Dapur Cendekia
- Listrik
- Internet
- Sarpras
- Perawatan Sarpras
- Administrasi Kantor
- Rapat
- Perjalanan Dinas
- Upgrading SDM

Admin dapat:

- Menambah
- Mengurangi
- Mengubah Nama

---

# 13. Transaksi Pengeluaran

Field:

Tanggal

Nomor Bukti

Kategori

Nominal

Keterangan

Lampiran Nota

Pembuat

Approval

---

# 14. Metode Pembayaran

Harus mendukung:

- Cash
- Transfer Bank
- QRIS
- Virtual Account
- E-Wallet
- Minimarket
- Payment Gateway

Payment Gateway bersifat configurable.

---

# 15. WhatsApp Gateway

Setelah pembayaran berhasil:

Orang tua menerima:

- Nominal
- Pos
- Tanggal
- Metode
- Sisa Tagihan
- Link Kwitansi

Template dapat diubah admin.

---

# 16. Kwitansi Digital

Generate otomatis.

Berisi:

Logo Sekolah

Nomor Transaksi

Nama Siswa

Kelas

Rincian

Nominal

Kasir

QR Verification

Download PDF

---

# 17. Dashboard Keuangan

Role:

Superadmin

Admin

Dashboard berisi:

Saldo Kas

Pemasukan Hari Ini

Pengeluaran Hari Ini

Pendapatan Bulan Ini

Grafik Pendapatan

Grafik Pengeluaran

SPP Tertagih

SPP Belum Dibayar

Piutang

Top Pos Pembayaran

Jumlah Transaksi

Jumlah Siswa Aktif

Cash Flow

---

# 18. Role & Hak Akses

## Superadmin

Semua akses.

---

## Admin

Mengelola:

Siswa

Tagihan

Laporan

Pengeluaran

Pembayaran

Master Data

---

## Kasir

Input pembayaran

Cetak kwitansi

Melihat transaksi

Tidak boleh mengubah master.

---

## Orang Tua

Login sendiri.

Melihat:

Tagihan

Riwayat

Download Kwitansi

Bayar Online

Profil Anak

---

# 19. Login

Email / No HP

Password

OTP (opsional)

Forgot Password

---

# 20. Laporan

Laporan Harian

Laporan Bulanan

Laporan Tahunan

Laporan Per Pos

Laporan Per Jenjang

Laporan Per Kelas

Laporan Per Anak

Laporan Kas

Laporan Pengeluaran

Laporan Piutang

Laporan Pelunasan

Rekap Payment Gateway

Rekap Cash

Export:

PDF

Excel

CSV

---

# 21. Audit Log

Semua aktivitas tersimpan.

Contoh:

Login

Logout

Edit Nominal

Hapus Pembayaran

Tambah Pengeluaran

Edit Master

Tidak boleh dihapus.

---

# 22. Notifikasi

WhatsApp

Email (opsional)

Reminder:

SPP Jatuh Tempo

Tagihan Baru

Pembayaran Berhasil

Angsuran Belum Lunas

---

# 23. Fitur Tambahan (Rekomendasi)

## A. Auto Generate Tagihan Awal Tahun

Sekali klik membuat seluruh tagihan siswa.

---

## B. Kartu Piutang Siswa

Riwayat lengkap pembayaran setiap siswa.

---

## C. Dashboard Orang Tua

Progress pembayaran per tahun ajaran.

---

## D. Multi Tahun Ajaran

Data tetap tersimpan walaupun berganti tahun.

---

## E. Mutasi Siswa

Naik kelas

Lulus

Pindah

Keluar

---

## F. Diskon

Beasiswa

Potongan Saudara

Potongan Khusus

Potongan Persentase

Potongan Nominal

---

## G. Denda Keterlambatan (Opsional)

Bisa diaktifkan atau dimatikan.

---

## H. Refund

Jika terjadi kelebihan pembayaran.

---

## I. Approval Pengeluaran

Pengeluaran di atas nominal tertentu harus disetujui Kepala Sekolah/Yayasan.

---

## J. Rekonsiliasi Bank

Mencocokkan transaksi bank dengan pembayaran.

---

## K. Multi Rekening

Mendukung banyak rekening bank.

---

## L. Backup Database Otomatis

Backup harian.

---

## M. Restore Data

Restore dari backup.

---

## N. Dashboard Yayasan

Menampilkan:

- Saldo
- Cash Flow
- Pendapatan
- Pengeluaran
- Grafik
- Outstanding Piutang
- Total Kas

---

## O. QR Verification

Setiap kwitansi memiliki QR Code untuk verifikasi keaslian.

---

## P. API Integration

Disiapkan API untuk integrasi dengan:

- Website Sekolah
- Aplikasi Mobile
- Sistem Akademik
- Payment Gateway
- WA Gateway

---

# 24. Non Functional Requirements

- Web Based
- Responsive
- Mobile Friendly
- HTTPS
- Role Based Access Control
- Audit Trail
- Backup Otomatis
- Enkripsi Password (bcrypt/argon2)
- Session Timeout
- Kecepatan akses < 3 detik
- Mendukung minimal 500 siswa aktif
- Mendukung minimal 50.000 transaksi per tahun

---

# 25. Roadmap Pengembangan

## Phase 1
- Master Data
- Siswa
- Pos Pembayaran
- Tagihan
- Pembayaran
- Dashboard
- Laporan

## Phase 2
- Payment Gateway
- WhatsApp Gateway
- QRIS
- Virtual Account
- Approval Pengeluaran

## Phase 3
- Mobile Apps Orang Tua
- Mobile Apps Kasir
- API Integrasi
- Business Intelligence Dashboard
- Rekonsiliasi Bank Otomatis

---

# 26. Saran Pengembangan Strategis

Agar aplikasi memiliki nilai jangka panjang, disarankan menambahkan beberapa modul berikut:

1. **Modul Akuntansi Double Entry (General Ledger)** sehingga seluruh transaksi otomatis membentuk jurnal akuntansi dan menghasilkan Laporan Laba Rugi, Neraca, serta Arus Kas.

2. **Budgeting (Rencana Anggaran Tahunan)** untuk membandingkan realisasi terhadap anggaran setiap pos.

3. **Approval Workflow Bertingkat** (Kasir → Admin → Bendahara → Kepala Sekolah → Yayasan) sesuai nominal transaksi.

4. **Portal Orang Tua** yang menyediakan informasi tagihan, histori pembayaran, notifikasi, serta dokumen kwitansi dalam satu dashboard.

5. **Dashboard Analitik** yang menampilkan tren pembayaran, piutang per kelas, tingkat keterlambatan, dan proyeksi arus kas.

6. **Integrasi Virtual Account per Siswa** sehingga setiap siswa memiliki nomor VA unik dan pembayaran dapat terverifikasi otomatis.

7. **Multi Unit & Multi Cabang**, sehingga aplikasi dapat digunakan oleh unit pendidikan lain di bawah Yayasan Cendekia tanpa perubahan besar.

---

# Penutup

PRD ini menjadi acuan utama dalam analisis kebutuhan, desain UI/UX, desain database, pengembangan backend, frontend, pengujian, dan implementasi sistem Aplikasi Manajemen Pembayaran & Keuangan Sekolah Cendekia Lamongan. Seluruh fitur dirancang dengan prinsip fleksibilitas, keamanan, kemudahan penggunaan, dan skalabilitas agar mampu mendukung operasional sekolah dalam jangka panjang.