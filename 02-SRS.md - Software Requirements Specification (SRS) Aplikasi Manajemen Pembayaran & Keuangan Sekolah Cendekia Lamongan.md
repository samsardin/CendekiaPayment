# Software Requirements Specification (SRS)

# Aplikasi Manajemen Pembayaran & Keuangan Sekolah
## Cendekia Lamongan

---

| Dokumen | Software Requirements Specification |
|----------|-------------------------------------|
| Nama Sistem | Sistem Manajemen Pembayaran & Keuangan Sekolah Cendekia |
| Versi | 1.0 |
| Status | Draft |
| Tanggal | Agustus 2026 |

---

# Daftar Isi

1. Pendahuluan
2. Tujuan Sistem
3. Ruang Lingkup
4. Definisi
5. Aktor Sistem
6. Functional Requirements
7. Non Functional Requirements
8. Business Rules
9. Hak Akses
10. Validasi Sistem
11. Error Handling
12. Integrasi
13. Security
14. Logging & Audit Trail
15. Backup & Recovery
16. Lampiran

---

# 1. Pendahuluan

Dokumen Software Requirements Specification (SRS) ini mendefinisikan seluruh kebutuhan teknis sistem yang akan menjadi acuan bagi Developer, UI/UX Designer, QA Engineer, Project Manager, dan Stakeholder dalam proses pengembangan aplikasi.

Dokumen ini merupakan turunan dari Product Requirement Document (PRD) dan berisi rincian kebutuhan fungsional, kebutuhan non-fungsional, aturan bisnis, validasi, integrasi, hingga keamanan sistem.

---

# 2. Tujuan Sistem

Sistem dikembangkan untuk:

- Mengelola pembayaran siswa secara digital.
- Mengelola keuangan sekolah secara terpusat.
- Mendukung pembayaran online melalui Payment Gateway.
- Mengirim notifikasi otomatis melalui WhatsApp Gateway.
- Menyediakan dashboard keuangan secara real-time.
- Menghasilkan laporan keuangan dan pembayaran secara otomatis.
- Mendukung multi-jenjang sekolah dalam satu aplikasi.

---

# 3. Ruang Lingkup Sistem

## 3.1 Modul Master Data

- Tahun Ajaran
- Jenjang Sekolah
- Kelas
- Siswa
- Orang Tua
- Pos Pembayaran
- Akun Keuangan
- Pos Pengeluaran
- User
- Role & Permission

---

## 3.2 Modul Transaksi

- Generate Tagihan
- Pembayaran
- Angsuran
- Pelunasan
- Pengeluaran
- Kas Masuk
- Kas Keluar

---

## 3.3 Modul Laporan

- Rekap Pembayaran
- Rekap Pengeluaran
- Rekap Piutang
- Cash Flow
- Laporan Akun
- Laporan Tahunan

---

# 4. Definisi

| Istilah | Definisi |
|---------|----------|
| Pos Pembayaran | Jenis pembayaran yang dikenakan kepada siswa |
| Tagihan | Kewajiban pembayaran siswa |
| Angsuran | Pembayaran sebagian dari suatu tagihan |
| Payment Gateway | Layanan pembayaran online |
| WA Gateway | Layanan pengiriman notifikasi WhatsApp |
| Dashboard | Halaman ringkasan informasi keuangan |

---

# 5. Aktor Sistem

## 5.1 Superadmin

Memiliki akses penuh terhadap seluruh modul sistem.

---

## 5.2 Admin

Mengelola operasional harian.

---

## 5.3 Kasir

Melakukan transaksi pembayaran.

---

## 5.4 Orang Tua

Melihat tagihan dan melakukan pembayaran.

---

# 6. Functional Requirements

## FR-001 Login

### Deskripsi

Pengguna dapat masuk ke sistem menggunakan email atau nomor HP.

### Input

- Email / Nomor HP
- Password

### Output

Dashboard sesuai role.

### Validasi

- User aktif
- Password benar

---

## FR-002 Logout

Pengguna dapat keluar dari sistem.

---

## FR-003 Kelola Tahun Ajaran

Fitur:

- Tambah
- Edit
- Tutup Tahun
- Aktifkan Tahun

Business Rule:

Hanya boleh ada satu tahun ajaran aktif.

---

## FR-004 Kelola Jenjang

Jenis:

- KBTK-IT Cendekia
- SDIT Cendekia

Admin dapat menambah jenjang apabila di masa depan terdapat unit baru.

---

## FR-005 Kelola Kelas

Data:

- Nama Kelas
- Jenjang
- Wali Kelas
- Kapasitas

---

## FR-006 Kelola Siswa

Field:

- NIS
- NISN
- Nama
- Jenis Kelamin
- Tempat Lahir
- Tanggal Lahir
- Alamat
- Jenjang
- Kelas
- Orang Tua
- Status

Status:

- Aktif
- Pindah
- Lulus
- Keluar

---

## FR-007 Kelola Orang Tua

Data:

- Nama Ayah
- Nama Ibu
- Nomor WA
- Email
- Alamat

Satu orang tua dapat memiliki lebih dari satu anak.

---

## FR-008 Kelola Pos Pembayaran

Admin dapat:

- Menambah Pos
- Mengubah Pos
- Menonaktifkan Pos
- Menghapus Pos (jika belum digunakan)

Jenis:

- Bulanan
- Tahunan
- Sekali Bayar
- Angsuran

---

## FR-009 Pengaturan Nominal

Nominal dapat ditentukan berdasarkan:

1. Default Sekolah
2. Jenjang
3. Kelas
4. Siswa

Prioritas:

Siswa > Kelas > Jenjang > Default

---

## FR-010 Generate Tagihan

Tagihan dibuat otomatis berdasarkan:

- Tahun Ajaran
- Jenjang
- Kelas
- Pos Pembayaran

---

## FR-011 Pembayaran

Metode:

- Cash
- Transfer
- QRIS
- Virtual Account
- E-Wallet
- Minimarket

Status:

- Pending
- Paid
- Failed
- Expired

---

## FR-012 Angsuran

Semua pos pembayaran dapat diatur mendukung angsuran.

Sistem otomatis menghitung:

- Total Tagihan
- Total Dibayar
- Sisa Tagihan

---

## FR-013 Payment Gateway

Sistem harus mampu menerima callback dari payment gateway.

Setelah callback sukses:

- Status pembayaran berubah menjadi Lunas.
- Saldo akun bertambah.
- Riwayat transaksi dibuat.
- WA dikirim.
- Kwitansi dibuat.

---

## FR-014 WhatsApp Gateway

Setelah pembayaran berhasil sistem mengirim:

- Nama siswa
- Pos pembayaran
- Nominal
- Metode
- Nomor transaksi
- Link kwitansi

---

## FR-015 Pengeluaran

Data:

- Nomor Bukti
- Tanggal
- Pos Pengeluaran
- Nominal
- Keterangan
- Lampiran

---

## FR-016 Dashboard

Dashboard menampilkan:

- Saldo Kas
- Pendapatan Hari Ini
- Pendapatan Bulan Ini
- Pengeluaran Hari Ini
- Cash Flow
- Grafik Pendapatan
- Grafik Pengeluaran
- Total Piutang
- Jumlah Siswa
- Jumlah Pembayaran

---

## FR-017 Laporan

Jenis:

- Harian
- Bulanan
- Tahunan
- Per Pos
- Per Jenjang
- Per Kelas
- Per Anak
- Piutang
- Pengeluaran
- Cash Flow

Export:

- PDF
- Excel
- CSV

---

## FR-018 Dashboard Orang Tua

Menampilkan:

- Profil Anak
- Tagihan
- Riwayat Pembayaran
- Riwayat Angsuran
- Download Kwitansi

---

## FR-019 Notifikasi

Sistem mengirim notifikasi ketika:

- Tagihan dibuat
- Pembayaran berhasil
- Angsuran diterima
- Tagihan mendekati jatuh tempo

---

## FR-020 Audit Log

Seluruh aktivitas sistem harus direkam.

---

# 7. Non Functional Requirements

## Performance

- Waktu respon halaman ≤ 3 detik.
- Mendukung minimal 500 siswa aktif.
- Mendukung minimal 50.000 transaksi per tahun.
- Mendukung minimal 100 pengguna bersamaan.

## Availability

- Uptime minimal 99%.

## Compatibility

- Chrome
- Firefox
- Edge
- Safari

## Responsive

- Desktop
- Tablet
- Smartphone

## Security

- HTTPS
- Password Hashing (Argon2/Bcrypt)
- CSRF Protection
- XSS Protection
- SQL Injection Protection

---

# 8. Business Rules

## BR-001

Hanya satu Tahun Ajaran yang aktif.

---

## BR-002

Nominal pembayaran dapat berbeda untuk setiap siswa.

---

## BR-003

Pos pembayaran dapat ditambah tanpa mengubah kode aplikasi.

---

## BR-004

Pos "Biaya Pendidikan KBTK" dan "Biaya Pendidikan SDIT" wajib dipetakan ke akun **Total Biaya Pendidikan**.

---

## BR-005

Pos "Infaq Pembangunan KBTK" dan "Infaq Pembangunan SDIT" wajib dipetakan ke akun **Total Infaq Pembangunan**.

---

## BR-006

Semua transaksi pembayaran harus menghasilkan nomor transaksi unik.

---

## BR-007

Pembayaran yang sudah tervalidasi tidak dapat dihapus, hanya dapat dibatalkan melalui proses pembatalan (void) yang tercatat di audit log.

---

## BR-008

Nominal angsuran tidak boleh melebihi sisa tagihan.

---

## BR-009

Tagihan dianggap **Lunas** jika total pembayaran sama atau lebih besar dari nominal tagihan.

---

## BR-010

Pengeluaran tidak boleh disimpan jika saldo kas akun yang dipilih tidak mencukupi (opsional sesuai kebijakan yayasan).

---

# 9. Hak Akses

| Modul | Superadmin | Admin | Kasir | Orang Tua |
|--------|------------|-------|--------|------------|
| Dashboard | CRUD | View | - | - |
| Master Data | CRUD | CRUD | - | - |
| Pembayaran | CRUD | CRUD | Create/View | View Sendiri |
| Pengeluaran | CRUD | CRUD | - | - |
| Laporan | View | View | View Terbatas | Riwayat Sendiri |
| User Management | CRUD | - | - | - |

---

# 10. Validasi Sistem

## Login

- Email wajib valid.
- Password minimal 8 karakter.

## Pembayaran

- Nominal > 0.
- Tidak boleh melebihi sisa tagihan.
- Metode pembayaran wajib dipilih.

## Pengeluaran

- Pos wajib dipilih.
- Nominal > 0.
- Tanggal wajib diisi.

## Master Siswa

- NIS harus unik.
- Nomor WA orang tua harus valid.

---

# 11. Error Handling

| Kode | Pesan |
|------|-------|
| ERR-001 | Username atau Password salah |
| ERR-002 | Siswa tidak ditemukan |
| ERR-003 | Tagihan sudah lunas |
| ERR-004 | Nominal melebihi sisa tagihan |
| ERR-005 | Payment Gateway gagal |
| ERR-006 | WA Gateway gagal |
| ERR-007 | Data tidak ditemukan |
| ERR-008 | Anda tidak memiliki hak akses |

---

# 12. Integrasi

## Payment Gateway

Fungsi:

- QRIS
- Virtual Account
- E-Wallet
- Minimarket

## WhatsApp Gateway

Digunakan untuk:

- Notifikasi pembayaran
- Reminder jatuh tempo
- Pengiriman kwitansi

---

# 13. Security Requirements

- Password di-hash menggunakan Argon2id.
- Session timeout setelah 30 menit tidak aktif.
- Role Based Access Control (RBAC).
- Semua endpoint API menggunakan autentikasi.
- Audit log tidak dapat dihapus oleh pengguna biasa.

---

# 14. Logging & Audit Trail

Sistem mencatat:

- Login
- Logout
- Tambah data
- Ubah data
- Hapus data (soft delete)
- Pembayaran
- Void pembayaran
- Pengeluaran
- Perubahan hak akses

Data log minimal menyimpan:

- Waktu
- User
- IP Address
- Browser
- Aktivitas
- Data sebelum dan sesudah perubahan (jika relevan)

---

# 15. Backup & Recovery

- Backup database otomatis setiap hari.
- Backup file lampiran setiap hari.
- Mendukung restore penuh maupun parsial.
- Backup disimpan minimal 30 hari.

---

# 16. Catatan Teknis

Dokumen SRS ini menjadi acuan utama pada tahap desain database, pembuatan API, pengembangan frontend dan backend, penyusunan test case, serta proses User Acceptance Test (UAT). Setiap perubahan kebutuhan harus melalui proses *change request* dan revisi dokumen agar seluruh tim memiliki referensi yang sama.

> **Catatan untuk versi berikutnya:** Dokumen ini masih dapat diperkaya dengan spesifikasi per layar (screen specification), spesifikasi API yang lebih rinci, matriks traceability requirement, acceptance criteria per fitur, dan workflow approval untuk transaksi keuangan.