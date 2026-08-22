import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  Wallet, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  CheckCircle2, 
  Coins, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Layers, 
  X,
  AlertTriangle,
  Info
} from 'lucide-react';

const formatRupiah = (val) => {
  if (val === undefined || val === null || val === '') return 'Rp 0';
  const num = parseFloat(val);
  if (isNaN(num)) return 'Rp 0';
  return 'Rp ' + Math.round(num).toLocaleString('id-ID');
};

export default function AccountsChart() {
  const { user } = useAuth();
  const isSuperadmin = user?.role === 'superadmin';
  const isAdminOrSuper = user?.role === 'superadmin' || user?.role === 'admin';

  const [accounts, setAccounts] = useState([]);
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal State: Create / Edit
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('Kas');
  const [balance, setBalance] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  // Delete State
  const [deleteAccountModal, setDeleteAccountModal] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const [accRes, balRes] = await Promise.all([
        api.get('/accounts'),
        api.get('/accounts/balances')
      ]);

      if (accRes.data.success) setAccounts(accRes.data.data);
      if (balRes.data.success) setBalances(balRes.data);
    } catch (err) {
      console.error('Fetch accounts error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedAccount(null);
    setCode('');
    setName('');
    setType('Kas');
    setBalance('');
  };

  const handleOpenEditModal = (acc) => {
    setModalMode('edit');
    setSelectedAccount(acc);
    setCode(acc.code || '');
    setName(acc.name || '');
    setType(acc.type || 'Kas');
    setBalance(acc.balance !== undefined ? parseFloat(acc.balance).toString() : '0');
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      if (modalMode === 'create') {
        const res = await api.post('/accounts', {
          code: code.trim(),
          name: name.trim(),
          type,
          balance: parseFloat(balance) || 0
        });
        if (res.data.success) {
          alert('Akun keuangan baru berhasil ditambahkan!');
          setModalMode(null);
          fetchAccounts();
        }
      } else if (modalMode === 'edit') {
        const res = await api.put(`/accounts/${selectedAccount.id}`, {
          code: code.trim(),
          name: name.trim(),
          type,
          balance: parseFloat(balance) || 0
        });
        if (res.data.success) {
          alert('Data akun keuangan berhasil diperbarui!');
          setModalMode(null);
          fetchAccounts();
        }
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menyimpan data akun keuangan');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteAccountModal) return;
    setDeleteLoading(true);
    try {
      const res = await api.delete(`/accounts/${deleteAccountModal.id}`);
      if (res.data.success) {
        alert('Akun keuangan berhasil dihapus!');
        setDeleteAccountModal(null);
        fetchAccounts();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus akun keuangan');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filter accounts
  const filteredAccounts = accounts.filter((acc) => {
    const term = search.toLowerCase();
    const matchSearch =
      !search ||
      (acc.code && acc.code.toLowerCase().includes(term)) ||
      (acc.name && acc.name.toLowerCase().includes(term));

    const matchCategory = !categoryFilter || acc.type === categoryFilter;

    return matchSearch && matchCategory;
  });

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'Kas':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Bank':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Piutang':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'Pendapatan':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Pengeluaran':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Gabungan':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-7 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-600/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Chart of Accounts &amp; Rekening Kas</h1>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase">
                Buku Besar (GL)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Struktur akun keuangan, buku kas, rekening bank operasional, dan akun gabungan sekolah
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={fetchAccounts}
            disabled={loading}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            title="Segarkan Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>

          {isAdminOrSuper && (
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Akun COA</span>
            </button>
          )}
        </div>
      </div>

      {/* Cash & Bank Balances Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(balances?.cashAccounts || []).map((acc) => (
          <div 
            key={acc.id} 
            className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow relative overflow-hidden"
          >
            <div className="space-y-1 z-10">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider font-mono block">
                {acc.code}
              </span>
              <h3 className="font-extrabold text-slate-800 text-sm">{acc.name}</h3>
              <p className="text-xl font-black text-emerald-700 mt-1">
                {formatRupiah(acc.balance)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100 shadow-xs shrink-0">
              {acc.type === 'Bank' ? <CreditCard className="w-6 h-6" /> : <Wallet className="w-6 h-6" />}
            </div>
          </div>
        ))}
      </div>

      {/* Consolidated Accounts Info (BR-004 & BR-005) */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl shadow-md space-y-2 text-xs border border-slate-800">
        <h3 className="font-bold text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Akun Keuangan Gabungan Otomatis (BR-004 &amp; BR-005):</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-300 text-[11px] pl-6">
          <div>• <strong className="text-white">Total Biaya Pendidikan</strong>: Menggabungkan penerimaan SPP KBTK dan SDIT secara realtime.</div>
          <div>• <strong className="text-white">Total Infaq Pembangunan</strong>: Menggabungkan Infaq KBTK dan SDIT secara realtime.</div>
        </div>
      </div>

      {/* Toolbar: Search & Category Filter */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode akun atau nama akun keuangan..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/60 border border-slate-200 text-slate-800 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
          >
            <option value="">Semua Kategori</option>
            <option value="Kas">Kas</option>
            <option value="Bank">Bank</option>
            <option value="Piutang">Piutang</option>
            <option value="Pendapatan">Pendapatan</option>
            <option value="Pengeluaran">Pengeluaran</option>
            <option value="Gabungan">Gabungan</option>
          </select>

          <span className="text-xs font-bold text-slate-400 px-2 py-1 bg-slate-100 rounded-xl whitespace-nowrap">
            {filteredAccounts.length} Akun
          </span>
        </div>
      </div>

      {/* Full COA Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Memuat Chart of Accounts...</span>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">
            Tidak ada akun keuangan yang sesuai dengan pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-5">Kode Akun</th>
                  <th className="py-3.5 px-5">Nama Akun Keuangan</th>
                  <th className="py-3.5 px-5">Kategori Akun</th>
                  <th className="py-3.5 px-5 text-right">Saldo Saat Ini</th>
                  {isAdminOrSuper && (
                    <th className="py-3.5 px-5 text-center">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-extrabold text-slate-900">
                      {acc.code}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-slate-800">
                      {acc.name}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2.5 py-0.5 rounded-lg font-extrabold uppercase text-[10px] border ${getCategoryBadge(acc.type)}`}>
                        {acc.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right font-black text-slate-900 text-sm">
                      {formatRupiah(acc.balance)}
                    </td>
                    {isAdminOrSuper && (
                      <td className="py-3.5 px-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(acc)}
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg border border-amber-200 transition-all cursor-pointer"
                            title="Edit Akun Keuangan"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {isSuperadmin && (
                            <button
                              onClick={() => setDeleteAccountModal(acc)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 transition-all cursor-pointer"
                              title="Hapus Akun Keuangan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL TAMBAH / EDIT AKUN ================= */}
      {modalMode && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in text-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 lg:p-7 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100 shadow-xs">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {modalMode === 'create' ? 'Tambah Akun Keuangan Baru' : 'Edit Akun Keuangan'}
                  </h3>
                  <p className="text-xs text-slate-500">Buku Besar / Chart of Accounts (COA)</p>
                </div>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Kode Akun *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Contoh: 101.04"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Kategori Akun *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="Kas">Kas (Tunai)</option>
                    <option value="Bank">Bank (Rekening)</option>
                    <option value="Piutang">Piutang</option>
                    <option value="Pendapatan">Pendapatan</option>
                    <option value="Pengeluaran">Pengeluaran</option>
                    <option value="Gabungan">Gabungan</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Nama Akun Keuangan *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Bank Mandiri Syariah Cendekia"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  {modalMode === 'create' ? 'Saldo Awal (Rp)' : 'Saldo Saat Ini (Rp)'}
                </label>
                <input
                  type="number"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                {balance && !isNaN(parseFloat(balance)) && (
                  <p className="text-[11px] font-bold text-emerald-700">
                    Terbaca: {formatRupiah(balance)}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveLoading || !code || !name}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
                >
                  <span>{saveLoading ? 'Menyimpan...' : 'Simpan Akun'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI HAPUS AKUN ================= */}
      {deleteAccountModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in text-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 lg:p-7 space-y-5 shadow-2xl border border-rose-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3 text-rose-700">
                <div className="w-11 h-11 rounded-2xl bg-rose-600 flex items-center justify-center text-white font-bold">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-rose-950 text-base">Hapus Akun Keuangan</h3>
                  <p className="text-xs text-slate-500 font-mono">{deleteAccountModal.code}</p>
                </div>
              </div>
              <button
                onClick={() => setDeleteAccountModal(null)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-900 space-y-1.5 leading-relaxed">
              <p className="font-bold">Apakah Anda yakin ingin menghapus akun ini?</p>
              <p>
                Akun: <strong>{deleteAccountModal.name}</strong> ({deleteAccountModal.code})<br />
                Saldo: <strong>{formatRupiah(deleteAccountModal.balance)}</strong>
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setDeleteAccountModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black rounded-xl shadow-lg shadow-rose-600/20 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleteLoading ? 'Menghapus...' : 'Hapus Sekarang'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
