import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FilePieChart, Printer, Search, Download, CreditCard, CheckCircle2 } from 'lucide-react';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'ledger', 'by-post', 'by-class'
  const [summary, setSummary] = useState(null);
  const [byPost, setByPost] = useState([]);
  const [byClass, setByClass] = useState([]);
  const [loading, setLoading] = useState(true);

  // Kartu Piutang Search
  const [students, setStudents] = useState([]);
  const [stSearch, setStSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentLedger, setStudentLedger] = useState(null);

  useEffect(() => {
    fetchReportSummary();
  }, []);

  const fetchReportSummary = async () => {
    setLoading(true);
    try {
      const [sumRes, postRes, classRes] = await Promise.all([
        api.get('/reports/summary'),
        api.get('/reports/by-post'),
        api.get('/reports/by-class')
      ]);

      if (sumRes.data.success) setSummary(sumRes.data);
      if (postRes.data.success) setByPost(postRes.data.data);
      if (classRes.data.success) setByClass(classRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchStudentLedger = async (query) => {
    setStSearch(query);
    if (query.length >= 2) {
      try {
        const res = await api.get(`/master/students?search=${query}`);
        if (res.data.success) setStudents(res.data.data);
      } catch (err) {
        console.error(err);
      }
    } else {
      setStudents([]);
    }
  };

  const fetchStudentLedger = async (stId) => {
    try {
      const res = await api.get(`/reports/student-ledger/${stId}`);
      if (res.data.success) {
        setStudentLedger(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <FilePieChart className="w-7 h-7 text-emerald-600" />
            Laporan Keuangan & Kartu Piutang Siswa
          </h1>
          <p className="text-xs text-slate-500">Rekap harian/bulanan/tahun, kartu piutang siswa, laporan per pos & per kelas</p>
        </div>
        <button
          onClick={handlePrint}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" />
          Export / Cetak Laporan
        </button>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit text-xs font-bold">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 rounded-xl transition-all ${activeTab === 'summary' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Ringkasan Keuangan
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 rounded-xl transition-all ${activeTab === 'ledger' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Kartu Piutang Siswa (Fitur 23.B)
        </button>
        <button
          onClick={() => setActiveTab('by-post')}
          className={`px-4 py-2 rounded-xl transition-all ${activeTab === 'by-post' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Laporan Per Pos
        </button>
        <button
          onClick={() => setActiveTab('by-class')}
          className={`px-4 py-2 rounded-xl transition-all ${activeTab === 'by-class' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Laporan Per Kelas
        </button>
      </div>

      {/* TAB 1: RINGKASAN KEUANGAN */}
      {activeTab === 'summary' && summary && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-white">
            <div className="bg-emerald-600 rounded-2xl p-5 shadow-md">
              <span className="text-[11px] font-bold text-emerald-100 uppercase">Total Pemasukan</span>
              <h3 className="text-2xl font-extrabold mt-1">Rp {(summary.totalIncome || 0).toLocaleString('id-ID')}</h3>
            </div>
            <div className="bg-rose-600 rounded-2xl p-5 shadow-md">
              <span className="text-[11px] font-bold text-rose-100 uppercase">Total Pengeluaran</span>
              <h3 className="text-2xl font-extrabold mt-1">Rp {(summary.totalExpense || 0).toLocaleString('id-ID')}</h3>
            </div>
            <div className="bg-slate-900 rounded-2xl p-5 shadow-md">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Net Cash Flow</span>
              <h3 className="text-2xl font-extrabold mt-1">Rp {(summary.netCashFlow || 0).toLocaleString('id-ID')}</h3>
            </div>
            <div className="bg-amber-600 rounded-2xl p-5 shadow-md">
              <span className="text-[11px] font-bold text-amber-100 uppercase">Total Outstanding Piutang</span>
              <h3 className="text-2xl font-extrabold mt-1">Rp {(summary.totalPiutang || 0).toLocaleString('id-ID')}</h3>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KARTU PIUTANG SISWA */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 text-sm">Cari Kartu Piutang Siswa</h3>
            <div className="relative max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={stSearch}
                onChange={(e) => handleSearchStudentLedger(e.target.value)}
                placeholder="Ketik nama / NIS siswa..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />

              {students.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 z-30 max-h-48 overflow-y-auto">
                  {students.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => {
                        setSelectedStudent(st);
                        setStudents([]);
                        setStSearch('');
                        fetchStudentLedger(st.id);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-100 text-xs flex justify-between"
                    >
                      <span className="font-bold text-slate-800">{st.name} ({st.class_name})</span>
                      <span className="text-slate-400">NIS: {st.nis}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {studentLedger && (
            <div className="space-y-6 pt-4 border-t border-slate-100">
              <div className="bg-emerald-900 text-white p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold">{studentLedger.student.name}</h3>
                  <p className="text-xs text-emerald-200 mt-0.5">NIS: {studentLedger.student.nis} • Kelas: {studentLedger.student.class_name} ({studentLedger.student.unit_name})</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-emerald-300">Total Sisa Piutang:</span>
                  <h2 className="text-2xl font-black text-amber-300">
                    Rp {studentLedger.summary.totalPiutang.toLocaleString('id-ID')}
                  </h2>
                </div>
              </div>

              {/* Ledger Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                      <th className="py-2.5 px-3">No. Tagihan</th>
                      <th className="py-2.5 px-3">Pos Pembayaran</th>
                      <th className="py-2.5 px-3">Nominal Tagihan</th>
                      <th className="py-2.5 px-3">Diskon/Beasiswa</th>
                      <th className="py-2.5 px-3">Sudah Dibayar</th>
                      <th className="py-2.5 px-3">Sisa Piutang</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {studentLedger.ledgerItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-bold text-slate-800">{item.invoice_number}</td>
                        <td className="py-3 px-3 font-semibold text-emerald-700">{item.post_name}</td>
                        <td className="py-3 px-3 font-bold">Rp {item.nominal.toLocaleString('id-ID')}</td>
                        <td className="py-3 px-3 text-emerald-600 font-semibold">-Rp {item.discount.toLocaleString('id-ID')}</td>
                        <td className="py-3 px-3 font-bold text-slate-800">Rp {item.paid.toLocaleString('id-ID')}</td>
                        <td className="py-3 px-3 font-extrabold text-amber-700">Rp {item.remaining.toLocaleString('id-ID')}</td>
                        <td className="py-3 px-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            item.status === 'Lunas' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LAPORAN PER POS */}
      {activeTab === 'by-post' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <th className="py-3 px-4">Nama Pos Pembayaran</th>
                  <th className="py-3 px-4">Unit Sekolah</th>
                  <th className="py-3 px-4">Jumlah Tagihan</th>
                  <th className="py-3 px-4">Total Nominal</th>
                  <th className="py-3 px-4">Total Terbayar</th>
                  <th className="py-3 px-4">Total Piutang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {byPost.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-800">{p.post_name}</td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-700">{p.unit_name || 'Semua Unit'}</td>
                    <td className="py-3.5 px-4">{p.total_invoices || 0}</td>
                    <td className="py-3.5 px-4 font-bold">Rp {(p.total_nominal || 0).toLocaleString('id-ID')}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">Rp {(p.total_paid || 0).toLocaleString('id-ID')}</td>
                    <td className="py-3.5 px-4 font-bold text-amber-700">Rp {(p.total_piutang || 0).toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: LAPORAN PER KELAS */}
      {activeTab === 'by-class' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <th className="py-3 px-4">Nama Kelas</th>
                  <th className="py-3 px-4">Jenjang Sekolah</th>
                  <th className="py-3 px-4">Jumlah Siswa</th>
                  <th className="py-3 px-4">Total Pembayaran Terkonfirmasi</th>
                  <th className="py-3 px-4">Total Piutang Kelas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {byClass.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-800">{c.class_name}</td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-700">{c.unit_name}</td>
                    <td className="py-3.5 px-4">{c.student_count || 0} Siswa</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">Rp {(c.total_paid || 0).toLocaleString('id-ID')}</td>
                    <td className="py-3.5 px-4 font-bold text-amber-700">Rp {(c.total_piutang || 0).toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
