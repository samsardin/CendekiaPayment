import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { BookOpenCheck, Plus, Sliders, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function PosPayment() {
  const [posts, setPosts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(null);

  // New Pos Form
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('Bulanan');
  const [defaultAmount, setDefaultAmount] = useState('');
  const [accountId, setAccountId] = useState('');

  // Flex Rule Form
  const [targetType, setTargetType] = useState('class');
  const [targetId, setTargetId] = useState('');
  const [ruleAmount, setRuleAmount] = useState('');
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    fetchPosts();
    fetchAccounts();
    fetchClasses();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/pos');
      if (res.data.success) setPosts(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/accounts');
      if (res.data.success) setAccounts(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await api.get('/master/classes');
      if (res.data.success) setClasses(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePos = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/pos', {
        code,
        name,
        type,
        default_amount: parseFloat(defaultAmount) || 0,
        account_id: accountId || null
      });

      if (res.data.success) {
        alert('Pos Pembayaran baru berhasil ditambahkan!');
        setShowAddModal(false);
        fetchPosts();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal membuat pos');
    }
  };

  const handleSetRule = async (e) => {
    e.preventDefault();
    if (!showRuleModal) return;

    try {
      const res = await api.post(`/pos/${showRuleModal.id}/rules`, {
        target_type: targetType,
        target_id: targetId ? parseInt(targetId) : null,
        amount: parseFloat(ruleAmount)
      });

      if (res.data.success) {
        alert('Aturan nominal khusus berhasil disimpan!');
        setShowRuleModal(null);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menyimpan aturan');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <BookOpenCheck className="w-7 h-7 text-emerald-600" />
            Master Pos Pembayaran & Aturan Nominal
          </h1>
          <p className="text-xs text-slate-500">Tambah/edit pos SPP, Seragam, Komite, dan atur nominal khusus per kelas/siswa</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Tambah Pos Pembayaran
        </button>
      </div>

      {/* Info Badge Hierarchy */}
      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
        <p className="font-bold flex items-center gap-1.5 text-emerald-800">
          <Sliders className="w-4 h-4 text-emerald-600" />
          Hirarki Prioritas Penentuan Nominal (PRD 8):
        </p>
        <p className="text-emerald-700">
          Nominal Khusus Siswa ➔ Nominal Per Kelas ➔ Nominal Per Jenjang ➔ Nominal Default Sekolah
        </p>
      </div>

      {/* Posts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Memuat pos pembayaran...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Kode Pos</th>
                  <th className="py-3 px-4">Nama Pos Pembayaran</th>
                  <th className="py-3 px-4">Unit Sekolah</th>
                  <th className="py-3 px-4">Tipe Pembayaran</th>
                  <th className="py-3 px-4">Nominal Default</th>
                  <th className="py-3 px-4">Mapping Akun Keuangan</th>
                  <th className="py-3 px-4 text-center">Nominal Khusus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {posts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-800">{p.code}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{p.name}</td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-700">{p.unit_name || 'Semua Unit'}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                        {p.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      Rp {p.default_amount.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {p.account_name ? `${p.account_code} - ${p.account_name}` : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => {
                          setShowRuleModal(p);
                          setRuleAmount(p.default_amount.toString());
                        }}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg border border-emerald-200 text-xs inline-flex items-center gap-1"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Atur Flex Rule</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Pos Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in text-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">Tambah Master Pos Pembayaran</h3>
            <form onSubmit={handleCreatePos} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kode Pos *</label>
                  <input type="text" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="POS-SPP-01" className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tipe Pembayaran *</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl">
                    <option value="Bulanan">Bulanan</option>
                    <option value="Tahunan">Tahunan</option>
                    <option value="Angsuran">Angsuran</option>
                    <option value="Sekali Bayar">Sekali Bayar</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Pos Pembayaran *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Contoh: Biaya Ekskul SDIT" className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl" />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nominal Default (Rp) *</label>
                <input type="number" value={defaultAmount} onChange={(e) => setDefaultAmount(e.target.value)} required className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold" />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mapping Akun Keuangan (COA)</label>
                <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl">
                  <option value="">-- Pilih Akun GL --</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl">Batal</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-md">Simpan Pos</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Flex Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in text-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2">
              Atur Nominal Khusus: {showRuleModal.name}
            </h3>

            <form onSubmit={handleSetRule} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Aturan</label>
                <select value={targetType} onChange={(e) => setTargetType(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl">
                  <option value="class">Per Kelas (Level 2)</option>
                  <option value="student">Per Siswa Khusus (Level 3)</option>
                </select>
              </div>

              {targetType === 'class' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pilih Kelas</label>
                  <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl">
                    <option value="">-- Pilih --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nominal Khusus Baru (Rp)</label>
                <input type="number" value={ruleAmount} onChange={(e) => setRuleAmount(e.target.value)} required className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold" />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowRuleModal(null)} className="px-3 py-1.5 bg-slate-100 text-slate-700 font-bold rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-lg shadow-sm">Simpan Aturan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
