import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Plus, 
  CheckCircle2, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Check, 
  AlertTriangle, 
  X, 
  Clock, 
  ShieldCheck, 
  Layers,
  School
} from 'lucide-react';

export default function AcademicYears() {
  const { user } = useAuth();
  const isSuperadmin = user?.role === 'superadmin';
  const isAdminOrSuper = user?.role === 'superadmin' || user?.role === 'admin';

  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Form (Create / Edit)
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [selectedAY, setSelectedAY] = useState(null);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  // Delete Modal
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Activate Modal
  const [activateModal, setActivateModal] = useState(null);
  const [activateLoading, setActivateLoading] = useState(false);

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  const fetchAcademicYears = async () => {
    setLoading(true);
    try {
      const res = await api.get('/master/academic-years');
      if (res.data.success) {
        setAcademicYears(res.data.data);
      }
    } catch (err) {
      console.error('Fetch academic years error:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeAY = academicYears.find((ay) => Number(ay.is_active) === 1);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedAY(null);
    setName('');
    setStartDate('2026-07-01');
    setEndDate('2027-06-30');
  };

  const handleOpenEditModal = (ay) => {
    setModalMode('edit');
    setSelectedAY(ay);
    setName(ay.name || '');
    setStartDate(ay.start_date ? ay.start_date.substring(0, 10) : '');
    setEndDate(ay.end_date ? ay.end_date.substring(0, 10) : '');
  };

  const handleSaveAY = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      if (modalMode === 'create') {
        const res = await api.post('/master/academic-years', {
          name: name.trim(),
          start_date: startDate || null,
          end_date: endDate || null
        });
        if (res.data.success) {
          alert('Tahun ajaran baru berhasil ditambahkan!');
          setModalMode(null);
          fetchAcademicYears();
        }
      } else if (modalMode === 'edit') {
        const res = await api.put(`/master/academic-years/${selectedAY.id}`, {
          name: name.trim(),
          start_date: startDate || null,
          end_date: endDate || null
        });
        if (res.data.success) {
          alert('Data tahun ajaran berhasil diperbarui!');
          setModalMode(null);
          fetchAcademicYears();
        }
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menyimpan tahun ajaran');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleActivateAY = async () => {
    if (!activateModal) return;
    setActivateLoading(true);
    try {
      const res = await api.put(`/master/academic-years/${activateModal.id}/activate`);
      if (res.data.success) {
        alert(res.data.message || 'Tahun ajaran berhasil diaktifkan!');
        setActivateModal(null);
        fetchAcademicYears();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal mengaktifkan tahun ajaran');
    } finally {
      setActivateLoading(false);
    }
  };

  const handleDeleteAY = async () => {
    if (!deleteModal) return;
    setDeleteLoading(true);
    try {
      const res = await api.delete(`/master/academic-years/${deleteModal.id}`);
      if (res.data.success) {
        alert('Tahun ajaran berhasil dihapus!');
        setDeleteModal(null);
        fetchAcademicYears();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus tahun ajaran');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-7 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-600/20">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Tahun Ajaran &amp; Periode Sekolah</h1>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase">
                Master Periode
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola kalender tahun ajaran, setel periode aktif acuan tagihan siswa dan pembukuan kas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={fetchAcademicYears}
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
              <span>Tambah Tahun Ajaran</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Academic Year Hero Card */}
      {activeAY && (
        <div className="relative bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-emerald-900/50 overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500 text-white font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Tahun Ajaran Aktif Saat Ini
                </span>
                <span className="text-xs text-slate-400 font-medium">Acuan Sistem SFMS</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Tahun Ajaran {activeAY.name}
              </h2>
              <p className="text-xs text-slate-300 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  Periode Operasional: <strong>{activeAY.start_date ? new Date(activeAY.start_date).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : 'Juli'}</strong> s/d <strong>{activeAY.end_date ? new Date(activeAY.end_date).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : 'Juni'}</strong>
                </span>
              </p>
            </div>

            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60 backdrop-blur-md space-y-1 text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Aturan Sistem (BR-001)</span>
              <p className="text-xs text-emerald-300 font-bold">Semua pembuatan tagihan baru otomatis merujuk ke tahun ajaran ini.</p>
            </div>
          </div>
        </div>
      )}

      {/* Academic Years Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base">Daftar Seluruh Tahun Ajaran</h3>
            <p className="text-xs text-slate-500">Histori kalender tahun ajaran dan status aktifasi sekolah</p>
          </div>
          <span className="text-xs font-bold text-slate-400 px-3 py-1 bg-slate-100 rounded-xl">
            {academicYears.length} Tahun Ajaran
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Memuat data tahun ajaran...</span>
          </div>
        ) : academicYears.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">
            Belum ada data tahun ajaran. Silakan tambahkan tahun ajaran pertama.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-5">Tahun Ajaran</th>
                  <th className="py-3.5 px-5">Status Periode</th>
                  <th className="py-3.5 px-5">Tanggal Mulai</th>
                  <th className="py-3.5 px-5">Tanggal Selesai</th>
                  <th className="py-3.5 px-5 text-center">Status Aktifasi</th>
                  {isAdminOrSuper && (
                    <th className="py-3.5 px-5 text-center">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {academicYears.map((ay) => {
                  const isActive = Number(ay.is_active) === 1;
                  return (
                    <tr key={ay.id} className={`hover:bg-slate-50/80 transition-colors ${isActive ? 'bg-emerald-50/30' : ''}`}>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2.5">
                          <span className="font-extrabold text-slate-900 text-sm">{ay.name}</span>
                          {isActive && (
                            <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Aktif
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-xl text-[11px] border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                            Sedang Berjalan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-xl text-[11px]">
                            Non-Aktif / Arsip
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 font-medium text-slate-600">
                        {ay.start_date ? new Date(ay.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td className="py-4 px-5 font-medium text-slate-600">
                        {ay.end_date ? new Date(ay.end_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td className="py-4 px-5 text-center">
                        {isActive ? (
                          <span className="text-emerald-700 font-bold text-xs inline-flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Aktif Utama
                          </span>
                        ) : (
                          isAdminOrSuper && (
                            <button
                              onClick={() => setActivateModal(ay)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-700 font-bold rounded-xl border border-slate-200 text-xs transition-all cursor-pointer shadow-xs active:scale-95 inline-flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Setel Aktif</span>
                            </button>
                          )
                        )}
                      </td>
                      {isAdminOrSuper && (
                        <td className="py-4 px-5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(ay)}
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg border border-amber-200 transition-all cursor-pointer"
                              title="Edit Data Tahun Ajaran"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {isSuperadmin && !isActive && (
                              <button
                                onClick={() => setDeleteModal(ay)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 transition-all cursor-pointer"
                                title="Hapus Tahun Ajaran"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL TAMBAH / EDIT TAHUN AJARAN ================= */}
      {modalMode && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in text-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 lg:p-7 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100 shadow-xs">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {modalMode === 'create' ? 'Tambah Tahun Ajaran Baru' : 'Edit Data Tahun Ajaran'}
                  </h3>
                  <p className="text-xs text-slate-500">Master Kalender Akademik Sekolah</p>
                </div>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAY} className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Nama Tahun Ajaran *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: 2026/2027 atau 2027/2028"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Tanggal Selesai</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
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
                  disabled={saveLoading || !name}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
                >
                  <span>{saveLoading ? 'Menyimpan...' : 'Simpan Tahun Ajaran'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI AKTIFKAN ================= */}
      {activateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in text-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 lg:p-7 space-y-5 shadow-2xl border border-emerald-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3 text-emerald-700">
                <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-bold">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Aktifkan Tahun Ajaran</h3>
                  <p className="text-xs text-emerald-700 font-bold">Tahun Ajaran {activateModal.name}</p>
                </div>
              </div>
              <button
                onClick={() => setActivateModal(null)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-2 leading-relaxed">
              <p className="font-bold">Apakah Anda yakin ingin mengaktifkan tahun ajaran {activateModal.name}?</p>
              <p className="text-slate-600 text-[11px]">
                Sesuai aturan sistem (BR-001), hanya satu tahun ajaran yang boleh aktif. Pengaktifan ini akan menjadikan <strong>{activateModal.name}</strong> sebagai acuan penerbitan tagihan &amp; pembayaran baru di seluruh modul.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setActivateModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleActivateAY}
                disabled={activateLoading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>{activateLoading ? 'Mengaktifkan...' : 'Ya, Aktifkan Sekarang'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI HAPUS ================= */}
      {deleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in text-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 lg:p-7 space-y-5 shadow-2xl border border-rose-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3 text-rose-700">
                <div className="w-11 h-11 rounded-2xl bg-rose-600 flex items-center justify-center text-white font-bold">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-rose-950 text-base">Hapus Tahun Ajaran</h3>
                  <p className="text-xs text-slate-500 font-mono">{deleteModal.name}</p>
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
              <p className="font-bold">Apakah Anda yakin ingin menghapus tahun ajaran ini?</p>
              <p>Tahun Ajaran: <strong>{deleteModal.name}</strong></p>
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
                onClick={handleDeleteAY}
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
