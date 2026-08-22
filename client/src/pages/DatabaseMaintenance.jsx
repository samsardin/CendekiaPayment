import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Database, 
  HardDriveDownload, 
  HardDriveUpload, 
  RefreshCw, 
  Trash2, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle,
  Download, 
  Upload, 
  AlertTriangle, 
  Server, 
  Activity,
  Layers,
  Users,
  Receipt,
  CreditCard,
  Building2,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  FileJson,
  Sparkles,
  Info
} from 'lucide-react';

export default function DatabaseMaintenance() {
  const { user } = useAuth();
  const isSuperadmin = user?.role === 'superadmin';

  // Stats State
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Backup State
  const [backupLoading, setBackupLoading] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState(null);

  // Restore State
  const fileInputRef = useRef(null);
  const [restoreFile, setRestoreFile] = useState(null);
  const [restoreParsedData, setRestoreParsedData] = useState(null);
  const [restoreMode, setRestoreMode] = useState('replace'); // 'replace' | 'merge'
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreResult, setRestoreResult] = useState(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  // Reset Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetMode, setResetMode] = useState('transactions_only'); // 'transactions_only' | 'full_reset'
  const [confirmCodeInput, setConfirmCodeInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetResult, setResetResult] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await api.get('/maintenance/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Fetch db stats error:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // 1. BACKUP DATABASE HANDLER
  const handleDownloadBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await api.get('/maintenance/backup');
      const dataStr = JSON.stringify(res.data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.href = url;
      link.download = `Cendekia_Database_Backup_${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setLastBackupTime(new Date().toLocaleTimeString('id-ID'));
      fetchStats();
    } catch (err) {
      console.error('Backup error:', err);
      alert(err.response?.data?.error || 'Gagal mengunduh backup database.');
    } finally {
      setBackupLoading(false);
    }
  };

  // 2. RESTORE DATABASE HANDLERS
  const handleSelectRestoreFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setRestoreFile(file);
    setRestoreResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (!parsed.data || typeof parsed.data !== 'object') {
          alert('Format file JSON tidak valid. Pastikan file backup dari Cendekia SFMS.');
          setRestoreParsedData(null);
          return;
        }
        setRestoreParsedData(parsed);
        setShowRestoreModal(true);
      } catch (err) {
        console.error('JSON parse error:', err);
        alert('Gagal membaca file JSON. Format file rusak atau bukan JSON valid.');
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async () => {
    if (!restoreParsedData) return;

    const confirmMsg = restoreMode === 'replace'
      ? 'PERINGATAN: Mode Timpa Total akan menggantikan seluruh data database saat ini dengan data dari file backup. Lanjutkan?'
      : 'Mode Gabungkan akan menambahkan data yang belum ada. Lanjutkan?';

    if (!window.confirm(confirmMsg)) return;

    setRestoreLoading(true);
    setRestoreResult(null);
    try {
      const res = await api.post('/maintenance/restore', {
        backupData: restoreParsedData,
        mode: restoreMode
      });
      if (res.data.success) {
        setRestoreResult(res.data);
        fetchStats();
      }
    } catch (err) {
      console.error('Restore error:', err);
      alert(err.response?.data?.error || 'Gagal memulihkan database.');
    } finally {
      setRestoreLoading(false);
    }
  };

  // 3. RESET DATABASE HANDLER
  const handleOpenResetModal = (mode) => {
    setResetMode(mode);
    setConfirmCodeInput('');
    setPasswordInput('');
    setResetResult(null);
    setShowResetModal(true);
  };

  const handleExecuteReset = async (e) => {
    e.preventDefault();
    if (confirmCodeInput !== 'RESET-DATABASE-CENDEKIA') {
      alert('Kode konfirmasi tidak cocok. Harap ketik RESET-DATABASE-CENDEKIA');
      return;
    }
    if (!passwordInput) {
      alert('Masukkan password akun Superadmin Anda.');
      return;
    }

    setResetLoading(true);
    setResetResult(null);
    try {
      const res = await api.post('/maintenance/reset', {
        mode: resetMode,
        confirmCode: confirmCodeInput,
        password: passwordInput
      });
      if (res.data.success) {
        setResetResult(res.data);
        fetchStats();
      }
    } catch (err) {
      console.error('Reset error:', err);
      alert(err.response?.data?.error || 'Gagal mereset database.');
    } finally {
      setResetLoading(false);
    }
  };

  const tableLabels = {
    students: 'Siswa Terdaftar',
    invoices: 'Daftar Tagihan',
    payments: 'Transaksi Pembayaran',
    payment_items: 'Item Kuitansi',
    expenses: 'Catatan Pengeluaran',
    payment_posts: 'Pos Pembayaran',
    classes: 'Kelas & Tingkat',
    units: 'Unit Sekolah',
    accounts: 'Akun Keuangan (GL)',
    users: 'Akun Pengguna',
    academic_years: 'Tahun Ajaran',
    audit_logs: 'Log Aktivitas Sistem'
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-600/20">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Pemeliharaan &amp; Cadangan Database</h1>
            <p className="text-xs text-slate-500 mt-0.5">Kelola pencadangan (backup), pemulihan (restore), serta pemeliharaan keamanan data</p>
          </div>
        </div>

        <button
          onClick={fetchStats}
          disabled={loadingStats}
          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${loadingStats ? 'animate-spin' : ''}`} />
          <span>Segarkan Status</span>
        </button>
      </div>

      {/* Database Health Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold border border-emerald-500/30">
                <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                Database Online &amp; Terhubung
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {stats?.engine || 'PostgreSQL (Supabase Cloud)'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-100">Koneksi Database Cloud Supabase Aktif</h3>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Seluruh transaksi kasir, kuitansi, data siswa, dan tagihan tersinkronisasi otomatis secara realtime dengan perlindungan fail-safe cloud database.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] text-slate-300 uppercase font-bold block">Total Siswa</span>
              <span className="text-xl font-black text-emerald-400">{stats?.tables?.students || 0}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] text-slate-300 uppercase font-bold block">Total Tagihan</span>
              <span className="text-xl font-black text-amber-300">{stats?.tables?.invoices || 0}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] text-slate-300 uppercase font-bold block">Transaksi Kasir</span>
              <span className="text-xl font-black text-teal-300">{stats?.tables?.payments || 0}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] text-slate-300 uppercase font-bold block">Log Audit</span>
              <span className="text-xl font-black text-indigo-300">{stats?.tables?.audit_logs || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Features Grid: Backup & Restore */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* FITUR 1: BACKUP DATABASE */}
        <div className="bg-white rounded-3xl p-6 lg:p-7 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100 shadow-xs">
              <HardDriveDownload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">1. Cadangkan Database (Backup)</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Unduh seluruh struktur data dan riwayat keuangan sekolah ke dalam file cadangan terenkripsi berformat <code>.json</code>.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
              <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">Mencakup Data:</span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Profil &amp; Mutasi Siswa</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Daftar Tagihan SPP &amp; Non-SPP</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Kwitansi Kasir &amp; Gateway</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Buku Kas &amp; Pengeluaran</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Master Pos Tarif</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Audit Trail Keamanan</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              {lastBackupTime ? `Terakhir diunduh: ${lastBackupTime}` : 'Simpan cadangan berkala ke komputer Anda'}
            </span>
            <button
              type="button"
              onClick={handleDownloadBackup}
              disabled={backupLoading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{backupLoading ? 'Menyiapkan Data...' : 'Download Backup (.json)'}</span>
            </button>
          </div>
        </div>

        {/* FITUR 2: RESTORE DATABASE */}
        <div className="bg-white rounded-3xl p-6 lg:p-7 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold border border-indigo-100 shadow-xs">
              <HardDriveUpload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">2. Pulihkan Database (Restore)</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Unggah file cadangan <code>.json</code> untuk memulihkan seluruh data siswa, tagihan, dan riwayat transaksi ke database aplikasi.
              </p>
            </div>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/30 hover:bg-indigo-50/60 p-6 rounded-2xl text-center cursor-pointer transition-all space-y-2"
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleSelectRestoreFile}
                accept=".json" 
                className="hidden" 
              />
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-800">
                  {restoreFile ? restoreFile.name : 'Pilih File Backup (.json) dari Komputer'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Hanya file JSON valid hasil ekspor Cendekia SFMS</p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-[11px] text-slate-400">Pastikan file berasal dari sumber terpercaya</span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <FileJson className="w-4 h-4" />
              <span>Pilih File Restore</span>
            </button>
          </div>
        </div>
      </div>

      {/* FITUR 3: DANGER ZONE - RESET DATABASE (HANYA SUPERADMIN) */}
      <div className="bg-rose-50/50 rounded-3xl p-6 lg:p-7 border border-rose-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 text-rose-800">
          <div className="w-11 h-11 rounded-2xl bg-rose-600 flex items-center justify-center text-white font-bold shadow-md shadow-rose-600/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-rose-950">3. Pemeliharaan Khusus &amp; Reset Data (Zona Bahaya)</h3>
            <p className="text-xs text-rose-700 mt-0.5">Tindakan ini permanen. Selalu unduh backup database terlebih dahulu sebelum melakukan reset.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Option A: Reset Transaksi Saja */}
          <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <h4>Reset Transaksi &amp; Kosongkan Pembayaran Kasir</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Menghapus riwayat transaksi kasir, kuitansi, dan pengeluaran. Seluruh tagihan siswa dikembalikan menjadi <strong>Belum Bayar (Rp 0 terbayar)</strong>. 
                <span className="block mt-1 font-semibold text-emerald-700">✓ Data siswa, kelas, pos tarif &amp; akun tetap utuh.</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenResetModal('transactions_only')}
              disabled={!isSuperadmin}
              className="w-full py-2.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-extrabold rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              Reset Riwayat Transaksi Kasir Saja
            </button>
          </div>

          {/* Option B: Reset Total Default Pabrik */}
          <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h4>Reset Total &amp; Inisialisasi Ulang Data Standar</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Membersihkan seluruh database dan mengembalikan master data ke setelan awal demo standar sekolah (Unit KBTK &amp; SDIT Cendekia).
                <span className="block mt-1 font-bold text-rose-600">⚠️ Seluruh data siswa dan tagihan yang ada saat ini akan dihapus.</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenResetModal('full_reset')}
              disabled={!isSuperadmin}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            >
              Reset Total Database &amp; Data Standar
            </button>
          </div>
        </div>

        {!isSuperadmin && (
          <div className="p-3 bg-amber-100/60 rounded-xl text-[11px] text-amber-900 font-semibold flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Fitur Reset Database hanya dapat dieksekusi oleh pengguna dengan hak akses <strong>Superadmin</strong>.</span>
          </div>
        )}
      </div>

      {/* ================= MODAL RESTORE DATABASE PREVIEW ================= */}
      {showRestoreModal && restoreParsedData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 lg:p-8 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold">
                  <HardDriveUpload className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Konfirmasi Pemulihan Database</h3>
                  <p className="text-xs text-slate-500">File: {restoreFile?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowRestoreModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Backup */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Aplikasi:</span>
                <span className="font-bold">{restoreParsedData.app || 'Cendekia SFMS'}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Waktu Backup:</span>
                <span className="font-mono font-semibold">{new Date(restoreParsedData.exported_at).toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Table Records Summary Grid */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Rincian Data yang Akan Dipulihkan:</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {Object.entries(restoreParsedData.data || {}).map(([tbl, rows]) => (
                  <div key={tbl} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold truncate">{tableLabels[tbl] || tbl}</span>
                    <span className="font-extrabold text-indigo-600 text-sm">{Array.isArray(rows) ? rows.length : 0}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mode Selector */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-700 block">Metode Pemulihan:</label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`p-3 rounded-2xl border cursor-pointer transition-all text-xs flex items-center gap-2.5 ${
                  restoreMode === 'replace' ? 'bg-indigo-50/60 border-indigo-500 font-bold text-indigo-950' : 'border-slate-200 text-slate-600'
                }`}>
                  <input
                    type="radio"
                    name="restoreMode"
                    value="replace"
                    checked={restoreMode === 'replace'}
                    onChange={(e) => setRestoreMode(e.target.value)}
                    className="text-indigo-600"
                  />
                  <div>
                    <span className="block">Timpa Total (Replace)</span>
                    <span className="text-[10px] font-normal text-slate-500">Sesuai file backup</span>
                  </div>
                </label>

                <label className={`p-3 rounded-2xl border cursor-pointer transition-all text-xs flex items-center gap-2.5 ${
                  restoreMode === 'merge' ? 'bg-indigo-50/60 border-indigo-500 font-bold text-indigo-950' : 'border-slate-200 text-slate-600'
                }`}>
                  <input
                    type="radio"
                    name="restoreMode"
                    value="merge"
                    checked={restoreMode === 'merge'}
                    onChange={(e) => setRestoreMode(e.target.value)}
                    className="text-indigo-600"
                  />
                  <div>
                    <span className="block">Gabungkan (Merge)</span>
                    <span className="text-[10px] font-normal text-slate-500">Tanpa hapus data baru</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Result feedback */}
            {restoreResult && (
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-bold">{restoreResult.message}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowRestoreModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                {restoreResult ? 'Tutup' : 'Batal'}
              </button>

              {!restoreResult && (
                <button
                  type="button"
                  onClick={handleExecuteRestore}
                  disabled={restoreLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
                >
                  <Upload className="w-4 h-4" />
                  <span>{restoreLoading ? 'Memulihkan Database...' : 'Mulai Restore Sekarang'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL RESET DATABASE CONFIRMATION ================= */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 lg:p-8 space-y-5 shadow-2xl border border-rose-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3 text-rose-700">
                <div className="w-11 h-11 rounded-2xl bg-rose-600 flex items-center justify-center text-white font-bold">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-rose-950 text-base">Konfirmasi Reset Database</h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {resetMode === 'transactions_only' ? 'Reset Riwayat Transaksi Kasir' : 'Reset Total Database'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-900 space-y-1.5 leading-relaxed">
              <p className="font-bold">⚠️ Perhatian Khusus:</p>
              <p>
                {resetMode === 'transactions_only'
                  ? 'Seluruh riwayat pembayaran kasir, kuitansi, dan pengeluaran akan dihapus. Tagihan siswa akan dikosongkan status pembayarannya.'
                  : 'Seluruh database akan dibersihkan dan dikembalikan ke data awal standar sekolah.'}
              </p>
            </div>

            <form onSubmit={handleExecuteReset} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Ketik teks konfirmasi: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-rose-600 font-mono">RESET-DATABASE-CENDEKIA</code>
                </label>
                <input
                  type="text"
                  required
                  value={confirmCodeInput}
                  onChange={(e) => setConfirmCodeInput(e.target.value)}
                  placeholder="RESET-DATABASE-CENDEKIA"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Password Superadmin:</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Masukkan password akun Anda"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {resetResult && (
                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="font-bold">{resetResult.message}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  {resetResult ? 'Tutup' : 'Batal'}
                </button>

                {!resetResult && (
                  <button
                    type="submit"
                    disabled={resetLoading || confirmCodeInput !== 'RESET-DATABASE-CENDEKIA' || !passwordInput}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-lg shadow-rose-600/20 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{resetLoading ? 'Memproses Reset...' : 'Eksekusi Reset Sekarang'}</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
