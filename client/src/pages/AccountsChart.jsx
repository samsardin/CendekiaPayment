import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Building2, Wallet, Plus, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export default function AccountsChart() {
  const [accounts, setAccounts] = useState([]);
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('Kas');
  const [initialBalance, setInitialBalance] = useState('');

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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/accounts', {
        code,
        name,
        type,
        balance: parseFloat(initialBalance) || 0
      });

      if (res.data.success) {
        alert('Akun Keuangan baru berhasil ditambahkan!');
        setShowAddModal(false);
        fetchAccounts();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal membuat akun');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-emerald-600" />
            Chart of Accounts & Rekening Kas
          </h1>
          <p className="text-xs text-slate-500">Struktur Akun Keuangan (General Ledger), Akun Gabungan, dan Saldo Kas/Bank Sekolah</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Tambah Akun COA
        </button>
      </div>

      {/* Cash Balances Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(balances?.cashAccounts || []).map((acc) => (
          <div key={acc.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{acc.code}</span>
              <h3 className="font-bold text-slate-800 text-base">{acc.name}</h3>
              <p className="text-xl font-extrabold text-emerald-600 mt-1">Rp {acc.balance.toLocaleString('id-ID')}</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Consolidated Accounts Info (BR-004 & BR-005) */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-md space-y-2 text-xs">
        <h3 className="font-bold text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Akun Keuangan Gabungan Otomatis (BR-004 & BR-005):
        </h3>
        <ul className="space-y-1 text-slate-300">
          <li>• <span className="font-semibold text-white">Total Biaya Pendidikan</span>: Menggabungkan Biaya Pendidikan KBTK dan SDIT secara otomatis.</li>
          <li>• <span className="font-semibold text-white">Total Infaq Pembangunan</span>: Menggabungkan Infaq KBTK dan SDIT secara otomatis.</li>
        </ul>
      </div>

      {/* Full COA Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Memuat Chart of Accounts...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Kode Akun</th>
                  <th className="py-3 px-4">Nama Akun Keuangan</th>
                  <th className="py-3 px-4">Kategori Akun</th>
                  <th className="py-3 px-4 text-right">Saldo Saat Ini</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{acc.code}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{acc.name}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded font-bold uppercase text-[10px] ${
                        acc.type === 'Kas' || acc.type === 'Bank'
                          ? 'bg-emerald-100 text-emerald-800'
                          : acc.type === 'Gabungan'
                          ? 'bg-purple-100 text-purple-800'
                          : acc.type === 'Pendapatan'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {acc.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-800">
                      Rp {acc.balance.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in text-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">Tambah Akun Keuangan Baru</h3>
            <form onSubmit={handleCreateAccount} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kode Akun *</label>
                  <input type="text" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="101.04" className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tipe Akun *</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl">
                    <option value="Kas">Kas</option>
                    <option value="Bank">Bank</option>
                    <option value="Pendapatan">Pendapatan</option>
                    <option value="Pengeluaran">Pengeluaran</option>
                    <option value="Gabungan">Gabungan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Akun Keuangan *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Contoh: Bank Mandiri Syariah" className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl" />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Saldo Awal (Rp)</label>
                <input type="number" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold" />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl">Batal</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-md">Simpan Akun</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
