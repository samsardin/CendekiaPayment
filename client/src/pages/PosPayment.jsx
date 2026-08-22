import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpenCheck, 
  Plus, 
  Sliders, 
  Edit, 
  Trash2, 
  Search, 
  Layers, 
  RefreshCw, 
  Building2, 
  X, 
  AlertTriangle,
  GraduationCap,
  Calendar,
  CreditCard
} from 'lucide-react';

const formatRupiah = (val) => {
  if (val === undefined || val === null || val === '') return 'Rp 0';
  const num = parseFloat(val);
  if (isNaN(num)) return 'Rp 0';
  return 'Rp ' + Math.round(num).toLocaleString('id-ID');
};

export default function PosPayment() {
  const { user } = useAuth();
  const isSuperadmin = user?.role === 'superadmin';
  const isAdminOrSuper = user?.role === 'superadmin' || user?.role === 'admin';

  const [posts, setPosts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [units, setUnits] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [selectedPost, setSelectedPost] = useState(null);
  const [showRuleModal, setShowRuleModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

  // Pos Form State
  const [unitId, setUnitId] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('Bulanan');
  const [defaultAmount, setDefaultAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [sortOrder, setSortOrder] = useState('1');
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Flex Rule Form
  const [targetType, setTargetType] = useState('class');
  const [targetId, setTargetId] = useState('');
  const [ruleAmount, setRuleAmount] = useState('');
  const [ruleLoading, setRuleLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [posRes, accRes, unitRes, classRes] = await Promise.all([
        api.get('/pos'),
        api.get('/accounts'),
        api.get('/master/units'),
        api.get('/master/classes')
      ]);

      if (posRes.data.success) setPosts(posRes.data.data);
      if (accRes.data.success) setAccounts(accRes.data.data);
      if (unitRes.data.success) setUnits(unitRes.data.data);
      if (classRes.data.success) setClasses(classRes.data.data);
    } catch (err) {
      console.error('Fetch data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await api.get('/pos');
      if (res.data.success) setPosts(res.data.data);
    } catch (err) {
      console.error('Fetch posts error:', err);
    }
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedPost(null);
    setUnitId('');
    setCode('');
    setName('');
    setType('Bulanan');
    setDefaultAmount('');
    setAccountId('');
    setSortOrder('1');
  };

  const handleOpenEditModal = (p) => {
    setModalMode('edit');
    setSelectedPost(p);
    setUnitId(p.unit_id ? p.unit_id.toString() : '');
    setCode(p.code || '');
    setName(p.name || '');
    setType(p.type || 'Bulanan');
    setDefaultAmount(p.default_amount !== undefined ? parseFloat(p.default_amount).toString() : '0');
    setAccountId(p.account_id ? p.account_id.toString() : '');
    setSortOrder(p.sort_order ? p.sort_order.toString() : '1');
  };

  const handleSavePos = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      const payload = {
        unit_id: unitId ? parseInt(unitId) : null,
        code: code.trim(),
        name: name.trim(),
        type,
        default_amount: parseFloat(defaultAmount) || 0,
        account_id: accountId ? parseInt(accountId) : null,
        sort_order: parseInt(sortOrder) || 1
      };

      if (modalMode === 'create') {
        const res = await api.post('/pos', payload);
        if (res.data.success) {
          alert('Pos Pembayaran baru berhasil ditambahkan!');
          setModalMode(null);
          fetchPosts();
        }
      } else if (modalMode === 'edit') {
        const res = await api.put(`/pos/${selectedPost.id}`, payload);
        if (res.data.success) {
          alert('Data Pos Pembayaran berhasil diperbarui!');
          setModalMode(null);
          fetchPosts();
        }
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menyimpan data pos pembayaran');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeletePos = async () => {
    if (!deleteModal) return;
    setDeleteLoading(true);
    try {
      const res = await api.delete(`/pos/${deleteModal.id}`);
      if (res.data.success) {
        alert('Pos Pembayaran berhasil dihapus!');
        setDeleteModal(null);
        fetchPosts();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus pos pembayaran');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSetRule = async (e) => {
    e.preventDefault();
    if (!showRuleModal) return;
    setRuleLoading(true);
    try {
      const res = await api.post(`/pos/${showRuleModal.id}/rules`, {
        target_type: targetType,
        target_id: targetId ? parseInt(targetId) : null,
        amount: parseFloat(ruleAmount) || 0
      });

      if (res.data.success) {
        alert('Aturan nominal khusus berhasil disimpan!');
        setShowRuleModal(null);
        fetchPosts();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menyimpan aturan');
    } finally {
      setRuleLoading(false);
    }
  };

  // Filter posts
  const filteredPosts = posts.filter((p) => {
    const term = search.toLowerCase();
    const matchSearch =
      !search ||
      (p.code && p.code.toLowerCase().includes(term)) ||
      (p.name && p.name.toLowerCase().includes(term));

    const matchUnit = !unitFilter || (p.unit_name && p.unit_name.includes(unitFilter));
    const matchType = !typeFilter || p.type === typeFilter;

    return matchSearch && matchUnit && matchType;
  });

  const getTypeBadge = (type) => {
    switch (type) {
      case 'Bulanan':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Tahunan':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Angsuran':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Sekali Bayar':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
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
            <BookOpenCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Master Pos Pembayaran &amp; Aturan Nominal</h1>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase">
                Katalog Biaya
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola pos SPP, Infaq, Seragam, Buku, dan aturan nominal khusus per jenjang/kelas/siswa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95"
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
              <span>Tambah Pos Pembayaran</span>
            </button>
          )}
        </div>
      </div>

      {/* Info Badge Hierarchy */}
      <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl border border-emerald-200/80 text-xs text-emerald-950 space-y-1.5 shadow-xs">
        <p className="font-extrabold flex items-center gap-2 text-emerald-900">
          <Sliders className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Hirarki Prioritas Penentuan Nominal (PRD 8):</span>
        </p>
        <p className="text-emerald-800 text-[11px] font-medium pl-6">
          Nominal Khusus Siswa (Level 3) ➔ Nominal Per Kelas (Level 2) ➔ Nominal Per Jenjang ➔ Nominal Default Sekolah
        </p>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode pos atau nama pos pembayaran..."
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

        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/60 border border-slate-200 text-slate-800 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
          >
            <option value="">Semua Jenjang</option>
            <option value="KBTK">KBTK-IT Cendekia</option>
            <option value="SDIT">SDIT Cendekia</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/60 border border-slate-200 text-slate-800 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
          >
            <option value="">Semua Tipe</option>
            <option value="Bulanan">Bulanan</option>
            <option value="Tahunan">Tahunan</option>
            <option value="Angsuran">Angsuran</option>
            <option value="Sekali Bayar">Sekali Bayar</option>
          </select>

          <span className="text-xs font-bold text-slate-400 px-2.5 py-1 bg-slate-100 rounded-xl whitespace-nowrap">
            {filteredPosts.length} Pos
          </span>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Memuat data pos pembayaran...</span>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">
            Tidak ada pos pembayaran yang sesuai dengan filter pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Kode Pos</th>
                  <th className="py-3.5 px-4">Nama Pos Pembayaran</th>
                  <th className="py-3.5 px-4">Unit Sekolah</th>
                  <th className="py-3.5 px-4">Tipe Pembayaran</th>
                  <th className="py-3.5 px-4">Nominal Default</th>
                  <th className="py-3.5 px-4">Mapping Akun Keuangan</th>
                  <th className="py-3.5 px-4 text-center">Nominal Khusus</th>
                  {isAdminOrSuper && (
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredPosts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900">
                      {p.code}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {p.name}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-700">
                      {p.unit_name || 'Semua Unit (KBTK & SDIT)'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-lg font-extrabold uppercase text-[10px] border ${getTypeBadge(p.type)}`}>
                        {p.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                      {formatRupiah(p.default_amount)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {p.account_name ? (
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-semibold">
                          {p.account_code} - {p.account_name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Belum di-mapping</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => {
                          setShowRuleModal(p);
                          setRuleAmount(p.default_amount ? p.default_amount.toString() : '');
                        }}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl border border-emerald-200 text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Atur Flex Rule</span>
                      </button>
                    </td>
                    {isAdminOrSuper && (
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg border border-amber-200 transition-all cursor-pointer"
                            title="Edit Pos Pembayaran"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {isSuperadmin && (
                            <button
                              onClick={() => setDeleteModal(p)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 transition-all cursor-pointer"
                              title="Hapus Pos Pembayaran"
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

      {/* ================= MODAL TAMBAH / EDIT POS ================= */}
      {modalMode && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in text-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 lg:p-7 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100 shadow-xs">
                  <BookOpenCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {modalMode === 'create' ? 'Tambah Master Pos Pembayaran' : 'Edit Pos Pembayaran'}
                  </h3>
                  <p className="text-xs text-slate-500">Konfigurasi pos biaya &amp; tagihan siswa</p>
                </div>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePos} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Kode Pos *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="SPP-SDIT"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Tipe Pembayaran *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="Bulanan">Bulanan (SPP)</option>
                    <option value="Tahunan">Tahunan (Daftar Ulang)</option>
                    <option value="Angsuran">Angsuran (Infaq Gedung)</option>
                    <option value="Sekali Bayar">Sekali Bayar (Seragam)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Nama Pos Pembayaran *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Biaya Pendidikan / SPP SDIT"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Unit Sekolah</label>
                  <select
                    value={unitId}
                    onChange={(e) => setUnitId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="">Semua Jenjang</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Urutan Tampil</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Nominal Default (Rp) *</label>
                <input
                  type="number"
                  required
                  value={defaultAmount}
                  onChange={(e) => setDefaultAmount(e.target.value)}
                  placeholder="500000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                {defaultAmount && !isNaN(parseFloat(defaultAmount)) && (
                  <p className="text-[11px] font-bold text-emerald-700">
                    Terbaca: {formatRupiah(defaultAmount)}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Mapping Akun Keuangan (COA Buku Besar)</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="">-- Pilih Akun Pendapatan --</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} - {a.name} ({a.type})
                    </option>
                  ))}
                </select>
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
                  <span>{saveLoading ? 'Menyimpan...' : 'Simpan Pos'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI HAPUS POS ================= */}
      {deleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in text-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 lg:p-7 space-y-5 shadow-2xl border border-rose-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3 text-rose-700">
                <div className="w-11 h-11 rounded-2xl bg-rose-600 flex items-center justify-center text-white font-bold">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-rose-950 text-base">Hapus Pos Pembayaran</h3>
                  <p className="text-xs text-slate-500 font-mono">{deleteModal.code}</p>
                </div>
              </div>
              <button
                onClick={() => setDeleteModal(null)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-900 space-y-1.5 leading-relaxed">
              <p className="font-bold">Apakah Anda yakin ingin menghapus pos pembayaran ini?</p>
              <p>
                Pos: <strong>{deleteModal.name}</strong> ({deleteModal.code})<br />
                Nominal Default: <strong>{formatRupiah(deleteModal.default_amount)}</strong>
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeletePos}
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

      {/* ================= MODAL ATUR FLEX RULE ================= */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in text-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 lg:p-7 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Atur Nominal Khusus</h3>
                <p className="text-xs text-emerald-700 font-bold mt-0.5">{showRuleModal.name}</p>
              </div>
              <button
                onClick={() => setShowRuleModal(null)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSetRule} className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Target Aturan (Level Prioritas)</label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="class">Per Kelas (Level 2)</option>
                  <option value="student">Per Siswa Khusus (Level 3)</option>
                </select>
              </div>

              {targetType === 'class' && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Pilih Kelas</label>
                  <select
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.unit_name})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Nominal Khusus Baru (Rp) *</label>
                <input
                  type="number"
                  required
                  value={ruleAmount}
                  onChange={(e) => setRuleAmount(e.target.value)}
                  placeholder="500000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                {ruleAmount && !isNaN(parseFloat(ruleAmount)) && (
                  <p className="text-[11px] font-bold text-emerald-700">
                    Terbaca: {formatRupiah(ruleAmount)}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRuleModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={ruleLoading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
                >
                  <span>{ruleLoading ? 'Menyimpan...' : 'Simpan Aturan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
