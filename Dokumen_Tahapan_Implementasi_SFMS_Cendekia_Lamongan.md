# DOKUMEN TAHAPAN IMPLEMENTASI
## Sistem Manajemen Pembayaran & Keuangan Sekolah Cendekia Lamongan

**Berdasarkan PRD v1.0 dan SRS v1.0**  
**Tanggal:** Agustus 2026  
**Status:** Dokumen Panduan Implementasi

---

# 1. TUJUAN DOKUMEN

Dokumen ini menjadi panduan teknis dan operasional untuk mengimplementasikan Aplikasi Manajemen Pembayaran & Keuangan Sekolah Cendekia Lamongan secara bertahap berdasarkan:

1. Product Requirements Document (PRD)
2. Software Requirements Specification (SRS)

PRD mendefinisikan sistem sebagai **School Financial Management System (SFMS)** yang mengelola pembayaran siswa, kas masuk, kas keluar, akun keuangan, laporan, dashboard, dan notifikasi.

SRS menjadi acuan teknis untuk desain database, API, frontend, backend, testing, keamanan, audit trail, backup, dan User Acceptance Test (UAT).

---

# 2. PRINSIP IMPLEMENTASI

Implementasi harus mengikuti prinsip berikut:

### 2.1 Bertahap

```text
Foundation
    ↓
Master Data
    ↓
Tagihan
    ↓
Pembayaran
    ↓
Keuangan
    ↓
Dashboard & Laporan
    ↓
Integrasi
    ↓
Portal Orang Tua
    ↓
Advanced Financial Management
```

### 2.2 Setiap tahap harus dapat diuji

Jangan melanjutkan ke tahap berikutnya apabila modul sebelumnya belum:

- selesai dikembangkan;
- lolos pengujian;
- lolos validasi bisnis;
- memiliki data uji;
- dapat digunakan oleh stakeholder terkait.

### 2.3 Data keuangan tidak boleh mudah diubah

Pembayaran yang telah tervalidasi tidak boleh dihapus. Jika diperlukan koreksi, gunakan proses **void** yang tercatat dalam audit log.

### 2.4 Sistem harus fleksibel

Pos pembayaran harus dapat ditambah atau diubah oleh Admin tanpa perubahan kode aplikasi.

---

# 3. TARGET AKHIR SISTEM

```text
                    SISTEM SFMS
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   MASTER DATA       TRANSAKSI        KEUANGAN
        │                │                │
        ├─ Tahun         ├─ Tagihan       ├─ Akun
        ├─ Jenjang       ├─ Pembayaran    ├─ Pengeluaran
        ├─ Kelas         ├─ Angsuran      ├─ Kas Masuk
        ├─ Siswa         ├─ Pelunasan     └─ Kas Keluar
        ├─ Orang Tua
        └─ Pos
                         │
        ┌────────────────┼────────────────┐
        │                │                │
     LAPORAN         INTEGRASI         PORTAL
        │                │                │
        ├─ Pembayaran    ├─ Payment GW    └─ Orang Tua
        ├─ Pengeluaran   ├─ WhatsApp
        ├─ Piutang       ├─ QRIS
        ├─ Cash Flow     └─ VA
        └─ Tahunan
                         │
                    AUDIT & SECURITY
```

---

# 4. ROADMAP IMPLEMENTASI

| Phase | Fokus | Prioritas |
|---|---|---|
| 0 | Analisis & Persiapan | Wajib |
| 1 | Foundation Sistem | Wajib |
| 2 | Authentication & RBAC | Wajib |
| 3 | Master Data | Wajib |
| 4 | Pos & Akun Keuangan | Wajib |
| 5 | Engine Nominal | Wajib |
| 6 | Generate Tagihan | Wajib |
| 7 | Pembayaran Kasir | Wajib |
| 8 | Angsuran & Pelunasan | Wajib |
| 9 | Pengeluaran & Kas | Wajib |
| 10 | Dashboard | Wajib |
| 11 | Laporan | Wajib |
| 12 | Kwitansi Digital | Wajib |
| 13 | Audit Trail | Wajib |
| 14 | WhatsApp Gateway | Tahap 2 |
| 15 | Payment Gateway | Tahap 2 |
| 16 | Portal Orang Tua | Tahap 3 |
| 17 | API & Mobile | Tahap 3 |
| 18 | Advanced Financial Management | Pengembangan lanjutan |

---

# 5. PHASE 0 — ANALISIS DAN PERSIAPAN

## Tujuan

Menyiapkan fondasi sebelum menulis kode.

## Langkah 0.1 — Bekukan requirement versi awal

Gunakan PRD v1.0 dan SRS v1.0 sebagai baseline.

Buat daftar requirement:

```text
FR-001 Login
FR-002 Logout
FR-003 Tahun Ajaran
FR-004 Jenjang
FR-005 Kelas
FR-006 Siswa
FR-007 Orang Tua
FR-008 Pos Pembayaran
FR-009 Pengaturan Nominal
FR-010 Generate Tagihan
FR-011 Pembayaran
FR-012 Angsuran
FR-013 Payment Gateway
FR-014 WhatsApp Gateway
FR-015 Pengeluaran
FR-016 Dashboard
FR-017 Laporan
FR-018 Dashboard Orang Tua
FR-019 Notifikasi
FR-020 Audit Log
```

Setiap requirement diberi status:

```text
[ ] Belum dikerjakan
[ ] Development
[ ] Testing
[ ] UAT
[ ] Selesai
```

## Langkah 0.2 — Requirement Traceability Matrix

| Requirement | Modul | Backend | Frontend | Test | UAT |
|---|---|---|---|---|---|
| FR-003 | Tahun Ajaran | ✓ | ✓ | ✓ | ✓ |
| FR-006 | Siswa | ✓ | ✓ | ✓ | ✓ |
| FR-010 | Tagihan | ✓ | ✓ | ✓ | ✓ |
| FR-011 | Pembayaran | ✓ | ✓ | ✓ | ✓ |
| FR-013 | Payment Gateway | ✓ | ✓ | ✓ | ✓ |
| FR-014 | WhatsApp | ✓ | ✓ | ✓ | ✓ |
| FR-020 | Audit Log | ✓ | ✓ | ✓ | ✓ |

## Langkah 0.3 — Validasi proses bisnis sekolah

Lakukan workshop dengan:

- Yayasan
- Kepala Sekolah
- Admin
- Bendahara
- Kasir

Hal yang harus diputuskan:

### Pembayaran

- Siapa yang membuat tagihan?
- Siapa yang menerima pembayaran?
- Apakah pembayaran cash langsung dianggap lunas?
- Siapa yang boleh melakukan void?
- Apakah perlu approval?

### Pengeluaran

- Siapa yang membuat pengeluaran?
- Siapa yang melakukan approval?
- Berapa batas nominal approval?
- Apakah setiap pengeluaran wajib memiliki nota?

### Tahun Ajaran

- Kapan tahun ajaran dibuka?
- Kapan ditutup?
- Bagaimana menangani siswa pindahan?
- Bagaimana menangani siswa naik kelas?

### Angsuran

- Apakah semua pos dapat diangsur?
- Apakah ada minimal nominal angsuran?
- Apakah ada tanggal jatuh tempo?

---

# 6. PHASE 1 — FOUNDATION SISTEM

## Tujuan

Membuat kerangka aplikasi.

## Langkah

### 1. Buat repository

Gunakan Git.

```text
main
develop
feature/*
bugfix/*
hotfix/*
```

### 2. Siapkan environment

Minimal:

```text
Development
Testing/Staging
Production
```

Jangan mengembangkan langsung pada production.

### 3. Siapkan database

Database harus mampu mendukung:

- minimal 500 siswa aktif;
- minimal 50.000 transaksi per tahun;
- minimal 100 pengguna bersamaan.

### 4. Siapkan konfigurasi environment

Pisahkan:

```text
APP
DATABASE
MAIL
PAYMENT
WHATSAPP
STORAGE
QUEUE
CACHE
```

Credential layanan eksternal tidak boleh ditulis langsung di source code.

---

# 7. PHASE 2 — AUTHENTICATION DAN RBAC

## Tujuan

Membangun keamanan akses.

Aktor:

1. Superadmin
2. Admin
3. Kasir
4. Orang Tua

## Hak akses

### Superadmin

```text
FULL ACCESS
```

### Admin

```text
Master Data
Tagihan
Pembayaran
Pengeluaran
Laporan
```

### Kasir

```text
Input Pembayaran
Lihat Transaksi
Cetak Kwitansi
```

### Orang Tua

```text
Profil Anak
Tagihan
Pembayaran
Riwayat
Kwitansi
```

## Security

Implementasikan:

- password hashing;
- session timeout;
- CSRF protection;
- XSS protection;
- SQL injection protection;
- authentication API;
- RBAC.

Password menggunakan Argon2id dan session timeout 30 menit.

---

# 8. PHASE 3 — MASTER DATA

Urutan implementasi:

```text
Tahun Ajaran
      ↓
Jenjang
      ↓
Kelas
      ↓
Rombel
      ↓
Wali Kelas
      ↓
Orang Tua
      ↓
Siswa
```

---

# 9. MODUL TAHUN AJARAN

## Fitur

- Tambah
- Edit
- Aktifkan
- Tutup

Business rule:

```text
HANYA BOLEH ADA 1 TAHUN AJARAN AKTIF
```

## Test

Jika 2026/2027 sudah aktif dan Admin mencoba mengaktifkan tahun kedua:

```text
ERROR:
Tahun ajaran lain masih aktif.
```

---

# 10. MODUL JENJANG

Data awal:

```text
KBTK-IT Cendekia
SDIT Cendekia
```

Struktur harus memungkinkan penambahan unit baru.

---

# 11. MODUL KELAS

Field minimal:

```text
Nama Kelas
Jenjang
Wali Kelas
Kapasitas
```

Jika menggunakan rombel:

```text
Jenjang
  └── Kelas
       └── Rombel
            └── Siswa
```

---

# 12. MODUL ORANG TUA

Data:

```text
Nama Ayah
Nama Ibu
Nomor WhatsApp
Email
Alamat
```

Satu orang tua dapat mempunyai lebih dari satu anak.

Relasi:

```text
Orang Tua
   │
   ├── Anak 1
   ├── Anak 2
   └── Anak 3
```

---

# 13. MODUL SISWA

Field:

```text
NIS
NISN
Nama
Jenis Kelamin
Tempat Lahir
Tanggal Lahir
Alamat
Jenjang
Kelas
Orang Tua
Status
```

Status:

```text
Aktif
Pindah
Lulus
Keluar
```

Validasi:

```text
NIS harus unik
Nomor WA orang tua harus valid
```

---

# 14. PHASE 4 — POS PEMBAYARAN

## Tujuan

Membangun mesin konfigurasi pembayaran.

Pos pembayaran harus dapat dibuat tanpa programmer.

## Data

```text
Nama Pos
Kode
Jenjang
Jenis
Akun Keuangan
Status
Urutan
Dapat Diangsur
```

Jenis:

```text
Bulanan
Tahunan
Sekali Bayar
Angsuran
```

---

# 15. DATA POS AWAL

## KBTK

```text
Biaya Pendidikan KBTK
Biaya Perlengkapan KBTK
Biaya Outing KBTK
Biaya Seragam KBTK
Uang Komite KBTK
Infaq Pembangunan KBTK
```

## SDIT

```text
Biaya Pendidikan SDIT
Biaya Perlengkapan SDIT
Biaya Outing SDIT
Biaya Ekskul SDIT
Iuran Komite SDIT
Infaq Pembangunan SDIT
```

---

# 16. PHASE 5 — AKUN KEUANGAN

Sistem harus memetakan pembayaran ke akun yang benar.

## Akun gabungan

```text
Total Biaya Pendidikan
    ├── Biaya Pendidikan KBTK
    └── Biaya Pendidikan SDIT

Total Infaq Pembangunan
    ├── Infaq Pembangunan KBTK
    └── Infaq Pembangunan SDIT
```

## Akun terpisah

```text
Perlengkapan KBTK
Perlengkapan SDIT
Outing KBTK
Outing SDIT
Seragam KBTK
Ekskul SDIT
Komite KBTK
Komite SDIT
```

---

# 17. PHASE 6 — ENGINE NOMINAL

Nominal dapat berasal dari:

```text
Default Sekolah
      ↓
Jenjang
      ↓
Kelas
      ↓
Siswa
```

Prioritas sistem:

```text
Siswa
  ↓
Kelas
  ↓
Jenjang
  ↓
Default
```

Contoh:

```text
Default = Rp500.000

Kelas 1 = Rp500.000
Kelas 2 = Rp525.000

Ahmad = Rp450.000
Ali = Rp375.000
```

Maka:

```text
Ahmad → Rp450.000
Ali   → Rp375.000
Siswa lain kelas 2 → Rp525.000
Siswa kelas lain → Default
```

---

# 18. PHASE 7 — ENGINE TAGIHAN

## Tujuan

Membuat tagihan secara otomatis.

Status:

```text
Belum Dibayar
Sebagian
Lunas
Terlambat
```

Workflow:

```text
Tahun Ajaran Aktif
       ↓
Pilih Jenjang
       ↓
Pilih Kelas
       ↓
Ambil Siswa Aktif
       ↓
Ambil Pos Pembayaran
       ↓
Hitung Nominal
       ↓
Tentukan Jatuh Tempo
       ↓
Generate Tagihan
```

---

# 19. AUTO GENERATE TAGIHAN

Sediakan fitur:

```text
Generate Tagihan
```

Parameter:

```text
Tahun Ajaran
Jenjang
Kelas
Pos
Periode
Tanggal Jatuh Tempo
```

Sediakan juga:

```text
Generate Semua
```

untuk seluruh siswa pada awal tahun ajaran.

---

# 20. PENCEGAHAN DUPLIKASI TAGIHAN

Sebelum generate:

```text
Apakah tagihan siswa
+ pos
+ periode
+ tahun ajaran
sudah ada?
```

Jika YA:

```text
Jangan buat duplikat.
```

Jika TIDAK:

```text
Buat tagihan.
```

---

# 21. PHASE 8 — MODUL PEMBAYARAN KASIR

Implementasikan pembayaran manual terlebih dahulu.

## Metode

```text
Cash
Transfer Bank
QRIS
Virtual Account
E-Wallet
Minimarket
```

Workflow:

```text
Kasir login
   ↓
Cari siswa
   ↓
Lihat tagihan
   ↓
Pilih tagihan
   ↓
Masukkan nominal
   ↓
Pilih metode
   ↓
Validasi
   ↓
Simpan pembayaran
   ↓
Update tagihan
   ↓
Update saldo akun
   ↓
Generate nomor transaksi
   ↓
Generate kwitansi
   ↓
Selesai
```

---

# 22. VALIDASI PEMBAYARAN

Minimal:

```text
Nominal > 0
Nominal <= sisa tagihan
Metode pembayaran wajib
Tagihan masih aktif
Siswa ditemukan
```

---

# 23. STATUS PEMBAYARAN

```text
Pending
Paid
Failed
Expired
```

Untuk pembayaran offline:

```text
Cash → Paid setelah disimpan/validasi kasir
```

Untuk payment gateway:

```text
Pending
   ↓
Callback
   ↓
Paid / Failed / Expired
```

---

# 24. NOMOR TRANSAKSI

Setiap pembayaran harus memiliki nomor transaksi unik.

Contoh:

```text
PAY-20260821-000001
```

Nomor tersebut harus UNIQUE.

---

# 25. PHASE 9 — ANGSURAN

Contoh:

```text
Tagihan = Rp2.000.000

Pembayaran 1 = Rp500.000
Sisa         = Rp1.500.000

Pembayaran 2 = Rp300.000
Sisa         = Rp1.200.000

Pembayaran 3 = Rp700.000
Sisa         = Rp500.000

Pembayaran 4 = Rp500.000
Sisa         = Rp0
```

Status:

```text
Sebagian
↓
Sebagian
↓
Sebagian
↓
Lunas
```

---

# 26. PHASE 10 — PENGELUARAN

## Master pengeluaran

```text
Gaji Pegawai
Dapur Cendekia
Listrik
Internet
Sarpras
Perawatan Sarpras
Administrasi Kantor
Rapat
Perjalanan Dinas
Upgrading SDM
```

## Transaksi pengeluaran

Field:

```text
Tanggal
Nomor Bukti
Kategori
Nominal
Keterangan
Lampiran Nota
Pembuat
Approval
```

Workflow:

```text
Input
  ↓
Validasi
  ↓
Approval jika diperlukan
  ↓
Posting pengeluaran
  ↓
Kurangi saldo akun
  ↓
Audit log
```

---

# 27. PHASE 11 — CASH ENGINE

Konsep dasar:

```text
Saldo Akhir
=
Saldo Awal
+
Kas Masuk
-
Kas Keluar
```

Pembayaran siswa menjadi kas masuk.

Pengeluaran menjadi kas keluar.

---

# 28. PHASE 12 — DASHBOARD

Bangun setelah transaksi benar.

Minimal:

```text
Saldo Kas
Pendapatan Hari Ini
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
```

---

# 29. DASHBOARD BERDASARKAN ROLE

## Superadmin

Melihat keseluruhan sistem.

## Admin

Melihat operasional sekolah.

## Kasir

```text
Transaksi Hari Ini
Total Cash Hari Ini
Transaksi Terakhir
```

## Orang Tua

```text
Anak
Tagihan
Sudah Dibayar
Sisa
Riwayat
Kwitansi
```

---

# 30. PHASE 13 — LAPORAN

Jenis laporan:

```text
Harian
Bulanan
Tahunan
Per Pos
Per Jenjang
Per Kelas
Per Anak
Kas
Pengeluaran
Piutang
Pelunasan
Payment Gateway
Cash
```

Export:

```text
PDF
Excel
CSV
```

---

# 31. PHASE 14 — KWITANSI DIGITAL

Isi:

```text
Logo Sekolah
Nomor Transaksi
Nama Siswa
Kelas
Rincian
Nominal
Kasir
QR Verification
```

Workflow:

```text
Pembayaran sukses
      ↓
Generate Receipt
      ↓
Generate QR
      ↓
Simpan/akses PDF
      ↓
Download / kirim ke orang tua
```

---

# 32. PHASE 15 — AUDIT TRAIL

Aktivitas minimal:

```text
Login
Logout
Tambah Data
Ubah Data
Hapus Data
Pembayaran
Void Pembayaran
Pengeluaran
Perubahan Hak Akses
```

Data audit minimal:

```text
Waktu
User
IP Address
Browser
Aktivitas
Data sebelum
Data sesudah
```

---

# 33. VOID PEMBAYARAN

Jangan menggunakan DELETE untuk transaksi pembayaran yang sudah tervalidasi.

Gunakan:

```text
Pembayaran
   ↓
Void Request
   ↓
Validasi Hak Akses
   ↓
Void
   ↓
Reverse Saldo
   ↓
Reverse Status Tagihan
   ↓
Audit Log
```

History transaksi tetap tersedia.

---

# 34. PHASE 16 — WHATSAPP GATEWAY

Sistem mengirim:

```text
Nama Siswa
Pos
Nominal
Tanggal
Metode
Nomor Transaksi
Sisa Tagihan
Link Kwitansi
```

Event:

```text
Tagihan dibuat
       ↓
WA notification

Pembayaran sukses
       ↓
WA receipt

Mendekati jatuh tempo
       ↓
WA reminder

Angsuran belum lunas
       ↓
WA reminder
```

---

# 35. PHASE 17 — PAYMENT GATEWAY

Payment Gateway dibangun setelah engine tagihan dan pembayaran internal stabil.

Arsitektur:

```text
Application
     │
     ↓
Payment Service
     │
     ├── Gateway A
     ├── Gateway B
     └── Gateway C
```

Workflow callback:

```text
Orang Tua
   ↓
Checkout
   ↓
Payment Gateway
   ↓
Pembayaran
   ↓
Callback/Webhook
   ↓
Validasi Signature
   ↓
Validasi Transaction
   ↓
Update Payment
   ↓
Update Tagihan
   ↓
Update Akun
   ↓
Generate Kwitansi
   ↓
WA
   ↓
Audit
```

---

# 36. PHASE 18 — PORTAL ORANG TUA

Menu:

```text
Dashboard
Anak Saya
Tagihan
Pembayaran
Riwayat
Angsuran
Kwitansi
Profil
```

Orang tua dapat:

- login sendiri;
- melihat tagihan;
- melihat riwayat;
- mengunduh kwitansi;
- melakukan pembayaran online.

---

# 37. MULTI-ANAK

Satu akun orang tua harus dapat menangani beberapa anak.

```text
Orang Tua
 ├── Ahmad - SDIT
 ├── Fatimah - SDIT
 └── Ali - KBTK
```

Portal:

```text
Pilih Anak
   ↓
Lihat Tagihan Anak
```

---

# 38. PHASE 19 — BACKUP DAN RECOVERY

Backup:

```text
Database → setiap hari
File lampiran → setiap hari
```

Retention:

```text
Minimal 30 hari
```

Sistem harus mendukung:

```text
Full Restore
Partial Restore
```

Backup harus diuji melalui proses restore.

---

# 39. PHASE 20 — TESTING

## Unit Test

```text
calculateOutstanding()
calculatePayment()
calculateBalance()
resolveNominal()
generateInvoiceNumber()
```

## Feature Test

```text
Generate Tagihan
Pembayaran
Angsuran
Void
Pengeluaran
```

## Integration Test

```text
Payment Gateway
WhatsApp
Storage
Notification
```

## Security Test

```text
RBAC
Authentication
CSRF
XSS
SQL Injection
Session Timeout
```

---

# 40. TEST CASE KRITIS

### TC-001 — Login benar

Expected:

```text
Dashboard tampil
```

### TC-002 — Password salah

Expected:

```text
ERR-001
```

### TC-003 — Siswa tidak ditemukan

Expected:

```text
ERR-002
```

### TC-004 — Tagihan sudah lunas

Expected:

```text
ERR-003
```

### TC-005 — Pembayaran melebihi sisa

Expected:

```text
ERR-004
```

### TC-006 — Payment Gateway gagal

Expected:

```text
ERR-005
```

### TC-007 — WhatsApp gagal

Expected:

```text
ERR-006
```

---

# 41. PHASE 21 — USER ACCEPTANCE TEST

UAT dilakukan bersama:

```text
Superadmin
Admin
Kasir
Bendahara
Perwakilan Orang Tua
```

## Skenario UAT

1. Membuat tahun ajaran.
2. Membuat jenjang.
3. Membuat kelas.
4. Import siswa.
5. Membuat pos pembayaran.
6. Mengatur nominal default.
7. Mengatur nominal kelas.
8. Mengatur nominal siswa.
9. Generate tagihan.
10. Melakukan pembayaran cash.
11. Melakukan pembayaran angsuran.
12. Melakukan pelunasan.
13. Mencatat pengeluaran.
14. Melihat saldo.
15. Mencetak laporan.
16. Mencetak kwitansi.
17. Melakukan void.
18. Memeriksa audit log.

---

# 42. MIGRASI DATA AWAL

Siapkan:

```text
Tahun Ajaran
Jenjang
Kelas
Rombel
Siswa
Orang Tua
Pos Pembayaran
Nominal
Akun Keuangan
Saldo Awal
```

Gunakan workflow:

```text
Import
 ↓
Validasi
 ↓
Preview
 ↓
Perbaikan
 ↓
Import Final
```

---

# 43. SALDO AWAL

Saldo awal harus ditentukan secara resmi.

Contoh:

| Akun | Saldo Awal |
|---|---:|
| Kas Sekolah | Rp... |
| Bank BCA | Rp... |
| Bank Mandiri | Rp... |

Nilai harus berasal dari data keuangan yang disepakati sekolah/yayasan.

---

# 44. GO-LIVE STRATEGY

Jangan langsung mematikan sistem lama.

Gunakan parallel run:

```text
OLD SYSTEM
    +
NEW SYSTEM
```

Contoh:

```text
Minggu 1 → Data master
Minggu 2 → Tagihan
Minggu 3 → Pembayaran
Minggu 4 → Laporan
Minggu 5 → Go-Live
```

---

# 45. CHECKLIST GO-LIVE

- [ ] Semua user sudah dibuat
- [ ] Role sudah benar
- [ ] Data siswa sudah tervalidasi
- [ ] Data orang tua sudah tervalidasi
- [ ] Kelas sudah benar
- [ ] Tahun ajaran aktif sudah benar
- [ ] Pos pembayaran sudah benar
- [ ] Nominal sudah benar
- [ ] Akun keuangan sudah benar
- [ ] Tagihan sudah diuji
- [ ] Pembayaran sudah diuji
- [ ] Angsuran sudah diuji
- [ ] Pengeluaran sudah diuji
- [ ] Laporan sudah diverifikasi
- [ ] Kwitansi sudah diuji
- [ ] Audit log aktif
- [ ] Backup aktif
- [ ] Restore sudah diuji
- [ ] HTTPS aktif
- [ ] Production environment siap
- [ ] UAT disetujui

---

# 46. URUTAN DEVELOPMENT YANG PALING DISARANKAN

```text
01. Project Setup
        ↓
02. Database
        ↓
03. Authentication
        ↓
04. Role & Permission
        ↓
05. Tahun Ajaran
        ↓
06. Jenjang
        ↓
07. Kelas/Rombel
        ↓
08. Orang Tua
        ↓
09. Siswa
        ↓
10. Akun Keuangan
        ↓
11. Pos Pembayaran
        ↓
12. Pengaturan Nominal
        ↓
13. Generate Tagihan
        ↓
14. Pembayaran Cash
        ↓
15. Angsuran
        ↓
16. Pelunasan
        ↓
17. Saldo/Kas
        ↓
18. Pengeluaran
        ↓
19. Dashboard
        ↓
20. Laporan
        ↓
21. Kwitansi
        ↓
22. Audit Log
        ↓
23. Backup
        ↓
24. Testing
        ↓
25. UAT
        ↓
26. WhatsApp
        ↓
27. Payment Gateway
        ↓
28. Portal Orang Tua
        ↓
29. API
        ↓
30. Mobile
```

---

# 47. DEFINITION OF DONE

Sebuah modul dianggap selesai apabila:

```text
Requirement tersedia
        +
Database selesai
        +
Backend selesai
        +
Frontend selesai
        +
Validation selesai
        +
Authorization selesai
        +
Audit selesai
        +
Unit Test
        +
Feature Test
        +
UAT
```

Artinya:

```text
Coding selesai ≠ Modul selesai
```

---

# 48. PRIORITAS MVP

## MVP 1

```text
Login
Role
Tahun Ajaran
Jenjang
Kelas
Siswa
Orang Tua
Pos Pembayaran
Akun Keuangan
Nominal
Tagihan
Pembayaran Cash
Angsuran
Pelunasan
Pengeluaran
Saldo
Dashboard
Laporan
Kwitansi
Audit Log
Backup
```

Dengan MVP ini sekolah sudah dapat menjalankan operasional pembayaran secara digital tanpa menunggu payment gateway.

## MVP 2

```text
WhatsApp Gateway
Payment Gateway
QRIS
Virtual Account
E-Wallet
Reminder
Approval Pengeluaran
```

## MVP 3

```text
Portal Orang Tua
Mobile App
Mobile Kasir
API
Dashboard BI
Rekonsiliasi Bank
```

---

# 49. FITUR JANGKA PANJANG

Setelah sistem pembayaran stabil, sistem dapat dikembangkan menjadi:

### General Ledger

Double-entry accounting.

### Budgeting

```text
Anggaran
vs
Realisasi
```

### Approval Workflow

```text
Kasir
 ↓
Admin
 ↓
Bendahara
 ↓
Kepala Sekolah
 ↓
Yayasan
```

### Dashboard Analitik

```text
Tren Pembayaran
Piutang/Kelas
Keterlambatan
Proyeksi Cash Flow
```

### Virtual Account per Siswa

Setiap siswa memiliki VA unik.

### Multi Unit

Memungkinkan penambahan unit pendidikan lain.

---

# 50. HAL YANG JANGAN DILAKUKAN

## Jangan 1

Membangun Payment Gateway sebelum engine tagihan dan pembayaran internal stabil.

## Jangan 2

Membuat dashboard sebelum transaksi benar.

## Jangan 3

Menghapus transaksi pembayaran yang sudah tervalidasi.

## Jangan 4

Menyimpan saldo sebagai angka yang dapat diedit bebas.

Saldo harus merupakan hasil transaksi.

## Jangan 5

Membuat nominal langsung hard-code di program.

Nominal harus berasal dari konfigurasi.

## Jangan 6

Membuat sistem hanya untuk satu tahun ajaran.

## Jangan 7

Membuat user hanya berdasarkan role tanpa permission.

---

# 51. STRUKTUR MODUL AKHIR

```text
AUTH
├── Login
├── Logout
├── Password
└── Session

MASTER
├── Tahun Ajaran
├── Jenjang
├── Kelas
├── Rombel
├── Wali Kelas
├── Siswa
├── Orang Tua
├── Pos Pembayaran
├── Akun Keuangan
├── Pos Pengeluaran
└── User

BILLING
├── Generate Tagihan
├── Tagihan
├── Angsuran
├── Pelunasan
├── Diskon
└── Denda

PAYMENT
├── Cash
├── Transfer
├── QRIS
├── VA
├── E-Wallet
├── Minimarket
└── Payment Gateway

FINANCE
├── Kas Masuk
├── Kas Keluar
├── Pengeluaran
├── Saldo
└── Akun

REPORT
├── Pembayaran
├── Pengeluaran
├── Piutang
├── Cash Flow
├── Per Pos
├── Per Jenjang
├── Per Kelas
├── Per Siswa
└── Tahunan

NOTIFICATION
├── WhatsApp
├── Email
└── Reminder

DOCUMENT
├── Kwitansi
├── QR Verification
└── Export

SECURITY
├── Role
├── Permission
├── Audit Log
└── Session

SYSTEM
├── Backup
├── Restore
├── Configuration
└── API
```

---

# 52. URUTAN PENGERJAAN TIM

## Backend

```text
Database
Model
Migration
Service
Business Logic
API
Authentication
Authorization
Payment
Notification
Audit
```

## Frontend

```text
Layout
Dashboard
Master Data
Form
Table
Tagihan
Pembayaran
Pengeluaran
Laporan
Portal Orang Tua
```

## QA

```text
Test Case
Unit Test
Feature Test
Integration Test
Security Test
Regression Test
UAT
```

## DevOps

```text
Server
Database
HTTPS
Deployment
Backup
Monitoring
Logging
Recovery
```

---

# 53. MILESTONE PROYEK

### M1 — Foundation

```text
Project + Database + Authentication
```

### M2 — Master Data

```text
Tahun + Jenjang + Kelas + Siswa + Orang Tua
```

### M3 — Billing

```text
Pos + Nominal + Tagihan
```

### M4 — Payment

```text
Pembayaran + Angsuran + Pelunasan
```

### M5 — Finance

```text
Akun + Pengeluaran + Saldo
```

### M6 — Reporting

```text
Dashboard + Laporan + Kwitansi
```

### M7 — Security

```text
Audit + Backup + Recovery
```

### M8 — Integration

```text
WhatsApp + Payment Gateway
```

### M9 — Parent Portal

```text
Portal Orang Tua + Online Payment
```

### M10 — Expansion

```text
API + Mobile + BI + Rekonsiliasi
```

---

# 54. DOKUMEN YANG SEBAIKNYA DIBUAT SELAMA DEVELOPMENT

```text
01. System Architecture Document
02. Database Design Document
03. API Specification
04. UI/UX Specification
05. Requirement Traceability Matrix
06. Test Case Document
07. UAT Document
08. Deployment Guide
09. Backup & Recovery Procedure
10. User Manual
11. Admin Manual
12. Change Request Log
```

---

# 55. HASIL AKHIR YANG HARUS DICAPAI

Alur utama:

```text
TAHUN AJARAN
      ↓
SISWA
      ↓
POS PEMBAYARAN
      ↓
NOMINAL
      ↓
TAGIHAN
      ↓
PEMBAYARAN
      ↓
TRANSAKSI
      ↓
AKUN KEUANGAN
      ↓
SALDO
      ↓
KWITANSI
      ↓
LAPORAN
      ↓
DASHBOARD
      ↓
AUDIT LOG
```

Kemudian:

```text
PEMBAYARAN
     ↓
WHATSAPP
     +
PAYMENT GATEWAY
     ↓
PORTAL ORANG TUA
```

Dengan demikian sistem tidak dibangun sebagai kumpulan halaman CRUD, tetapi sebagai **satu alur transaksi keuangan yang terintegrasi**.

---

# 56. REKOMENDASI URUTAN IMPLEMENTASI PALING AMAN

```text
SPRINT 1
├── Project Setup
├── Database Foundation
├── Authentication
└── RBAC

SPRINT 2
├── Tahun Ajaran
├── Jenjang
├── Kelas
└── Rombel

SPRINT 3
├── Orang Tua
└── Siswa

SPRINT 4
├── Akun Keuangan
├── Pos Pembayaran
└── Pos Pengeluaran

SPRINT 5
├── Pengaturan Nominal
└── Engine Tagihan

SPRINT 6
├── Generate Tagihan
├── Pembayaran Cash
└── Nomor Transaksi

SPRINT 7
├── Angsuran
├── Pelunasan
└── Update Saldo

SPRINT 8
├── Pengeluaran
├── Approval
└── Cash Flow

SPRINT 9
├── Dashboard
├── Laporan
└── Export

SPRINT 10
├── Kwitansi
├── QR Verification
└── Audit Log

SPRINT 11
├── Testing
├── Security
├── Backup
└── Recovery

SPRINT 12
├── UAT
├── Migrasi Data
├── Parallel Run
└── Go-Live

SETELAH MVP
├── WhatsApp Gateway
├── Payment Gateway
├── QRIS
├── Virtual Account
├── Portal Orang Tua
├── API
└── Mobile
```

---

# 57. KESIMPULAN

PRD dan SRS sudah cukup kuat untuk menjadi baseline implementasi. PRD mendefinisikan apa yang harus dibangun, sedangkan SRS memberikan rincian kebutuhan fungsional, aturan bisnis, validasi, keamanan, audit, integrasi, dan recovery.

Strategi paling aman:

```text
MASTER DATA
      ↓
BILLING ENGINE
      ↓
PAYMENT ENGINE
      ↓
FINANCIAL ENGINE
      ↓
REPORTING
      ↓
AUDIT & SECURITY
      ↓
INTEGRATION
      ↓
PARENT PORTAL
      ↓
ADVANCED FINANCE
```

**Jangan memulai dari Payment Gateway atau dashboard.**

Fondasi yang harus benar terlebih dahulu:

```text
Siswa
→ Pos Pembayaran
→ Nominal
→ Tagihan
→ Pembayaran
→ Saldo
```

Jika rangkaian tersebut benar, maka Payment Gateway, WhatsApp, dashboard, laporan, portal orang tua, dan aplikasi mobile dapat dibangun di atas fondasi yang sama.

---

## STATUS DOKUMEN

**Dokumen:** Tahapan Implementasi Sistem Manajemen Pembayaran & Keuangan Sekolah Cendekia Lamongan  
**Basis:** PRD v1.0 + SRS v1.0  
**Status:** Implementation Guide  
**Versi:** 1.0  
**Tanggal:** Agustus 2026
