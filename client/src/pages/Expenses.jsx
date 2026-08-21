import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { TrendingDown, Plus, CheckCircle, XCircle, AlertTriangle, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Expenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Modal
  const [showModal, setShowModal] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Gaji Pegawai');
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState('');
  const [errorAlert, setErrorAlert] = useState(null);

  const categories = [
    'Gaji Pegawai',
    'Dapur Cendekia',
    'Listrik',
    'Internet',
    'Sarpras',
    'Perawatan Sarpras',
    'Administrasi Kantor',
    'Rapat',
    'Perjalanan Dinas',
    'Upgrading SDM'
  ];

  useEffect(() => {
    fetchExpenses();
    fetchAccounts();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/expenses');
      if (res.data.success) setExpenses(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/accounts');
      if (res.data.success) {
        // Filter expense accounts
        setAccounts(res.data.data.filter(a => a.type === 'Pengeluaran' || a.code.startsWith('5')));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    setErrorAlert(null);
    try {
      const res = await api.post('/expenses', {
        date,
        category,
        account_id: accountId || (accounts[0] ? accounts[0].id : 1),
        amount: parseFloat(amount),
        description,
        attachment_url: attachment || '/uploads/nota-sample.jpg'
      });

      if (res.data.success) {
        alert(res.data.message);
        setShowModal(false);
        fetchExpenses();
      }
    } catch (err) {
      setErrorAlert(err.response?.data?.error || 'Gagal menyimpan pengeluaran');
    }
  };

  const handleApproveReject = async (id, action) => {
    try {
      const res = await api.put(`/expenses/${id}/approve`, { action });
      if (res.data.success) {
        alert(res.data.message);
        fetchExpenses();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal mengubah status approval');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <TrendingDown className="w-7 h-7 text-rose-600" />
            Pengeluaran & Beban Operasional
          </h1>
          <p className="text-xs text-slate-500">Pencatatan kas keluar, voucher pengeluaran, lampiran nota & persetujuan (approval workflow)</p>
        </div>
        <button
          onClick={() => {
            setShowModal(true);
            setErrorAlert(null);
          }}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Input Pengeluaran Baru
        </button>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Memuat daftar pengeluaran...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">No. Voucher</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Kategori Beban</th>
                  <th className="py-3 px-4">Keterangan</th>
                  <th className="py-3 px-4">Nominal</th>
                  <th className="py-3 px-4">Pembuat</th>
                  <th className="py-3 px-4">Status Approval</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{exp.voucher_number}</td>
                    <td className="py-3.5 px-4">{exp.date}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-rose-50 text-rose-800 font-semibold px-2 py-0.5 rounded border border-rose-200">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate">{exp.description || '-'}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      Rp {exp.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4">{exp.creator_name}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase ${
                          exp.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : exp.status === 'Pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {exp.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {exp.status === 'Pending' && ['superadmin', 'admin'].includes(user?.role) ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleApproveReject(exp.id, 'approve')}
                            className="p-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200"
                            title="Setujui"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleApproveReject(exp.id, 'reject')}
                            className="p-1 bg-rose-100 text-rose-700 rounded hover:bg-rose-200"
                            title="Tolak"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Selesai</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Input Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in text-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">Input Pengeluaran / Beban Kas Baru</h3>

            {errorAlert && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start gap-2 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{errorAlert}</span>
              </div>
            )}

            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tanggal *</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kategori Beban *</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl">
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Akun Beban Keuangan (COA)</label>
                <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl">
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nominal Pengeluaran (Rp) *</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="Contoh: 1500000" className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800" />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Keterangan / Rincian</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Peruntukan pengeluaran..." className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl" />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lampiran Nota / Kwitansi (URL)</label>
                <input type="text" value={attachment} onChange={(e) => setAttachment(e.target.value)} placeholder="/uploads/nota-listrik.pdf" className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl" />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl">Batal</button>
                <button type="submit" className="px-5 py-2 bg-rose-600 text-white font-bold rounded-xl shadow-md">Simpan Pengeluaran</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
