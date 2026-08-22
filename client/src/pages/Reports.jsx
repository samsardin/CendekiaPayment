import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  FilePieChart, 
  Printer, 
  Search, 
  Download, 
  CreditCard, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  AlertCircle,
  School,
  Calendar,
  RefreshCw,
  X,
  ChevronRight,
  BookOpen
} from 'lucide-react';

const formatRupiah = (val) => {
  if (val === undefined || val === null || val === '') return 'Rp 0';
  const num = parseFloat(val);
  if (isNaN(num)) return 'Rp 0';
  return `Rp ${Math.round(num).toLocaleString('id-ID')}`;
};

export default function Reports() {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'ledger', 'by-post', 'by-class'
  const [summary, setSummary] = useState(null);
  const [byPost, setByPost] = useState([]);
  const [byClass, setByClass] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedUnit, setSelectedUnit] = useState('');

  // Kartu Piutang Search
  const [students, setStudents] = useState([]);
  const [stSearch, setStSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentLedger, setStudentLedger] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  useEffect(() => {
    fetchReportSummary();
  }, [selectedUnit]);

  const fetchReportSummary = async () => {
    setLoading(true);
    try {
      const unitQuery = selectedUnit ? `?unit_id=${selectedUnit}` : '';
      const [sumRes, postRes, classRes, unitRes] = await Promise.all([
        api.get(`/reports/summary${unitQuery}`),
        api.get(`/reports/by-post${unitQuery}`),
        api.get(`/reports/by-class${unitQuery}`),
        api.get('/master/units')
      ]);

      if (sumRes.data.success) setSummary(sumRes.data);
      if (postRes.data.success) setByPost(postRes.data.data);
      if (classRes.data.success) setByClass(classRes.data.data);
      if (unitRes.data.success) setUnits(unitRes.data.data);
    } catch (err) {
      console.error('Fetch reports error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchStudentLedger = async (query) => {
    setStSearch(query);
    if (query.length >= 2) {
      try {
        const res = await api.get(`/master/students?search=${encodeURIComponent(query)}`);
        if (res.data.success) setStudents(res.data.data);
      } catch (err) {
        console.error(err);
      }
    } else {
      setStudents([]);
    }
  };

  const fetchStudentLedger = async (stId) => {
    setLedgerLoading(true);
    try {
      const res = await api.get(`/reports/student-ledger/${stId}`);
      if (res.data.success) {
        setStudentLedger(res.data);
      }
    } catch (err) {
      console.error('Fetch ledger error:', err);
    } finally {
      setLedgerLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-7 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-600/20 shrink-0">
            <FilePieChart className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                Laporan Keuangan &amp; Kartu Piutang
              </h1>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase">
                Rekap Akuntansi
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Rekap penerimaan kas, buku pembantu piutang siswa, laporan per pos dan per kelas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={fetchReportSummary}
            disabled={loading}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            title="Segarkan Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Export Laporan</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200 shadow-xs">
        {/* Navigation Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1">
          {[
            { id: 'summary', label: 'Ringkasan Keuangan' },
            { id: 'ledger', label: 'Kartu Piutang Siswa' },
            { id: 'by-post', label: 'Laporan Per Pos' },
            { id: 'by-class', label: 'Laporan Per Kelas' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter Jenjang Sekolah */}
        <div className="flex items-center gap-2 px-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden md:inline">Jenjang:</span>
          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
          >
            <option value="">Semua Jenjang (KBTK &amp; SDIT)</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ================= TAB 1: RINGKASAN KEUANGAN ================= */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs font-medium flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Memuat data ringkasan keuangan...</span>
            </div>
          ) : summary ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Pemasukan */}
              <div className="bg-gradient-to-tr from-emerald-600 to-teal-600 rounded-3xl p-5 text-white shadow-lg shadow-emerald-700/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider">Total Pemasukan</span>
                    <div className="p-2 bg-white/10 backdrop-blur-md rounded-2xl">
                      <TrendingUp className="w-5 h-5 text-emerald-100" />
                    </div>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black mt-3 tracking-tight">
                    {formatRupiah(summary.totalIncome)}
                  </h3>
                </div>
                <p className="text-[11px] text-emerald-100 font-medium mt-3 pt-2 border-t border-white/10">
                  Penerimaan kas &amp; bank terverifikasi
                </p>
              </div>

              {/* Total Pengeluaran */}
              <div className="bg-gradient-to-tr from-rose-600 to-pink-600 rounded-3xl p-5 text-white shadow-lg shadow-rose-700/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-rose-100 uppercase tracking-wider">Total Pengeluaran</span>
                    <div className="p-2 bg-white/10 backdrop-blur-md rounded-2xl">
                      <TrendingDown className="w-5 h-5 text-rose-100" />
                    </div>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black mt-3 tracking-tight">
                    {formatRupiah(summary.totalExpense)}
                  </h3>
                </div>
                <p className="text-[11px] text-rose-100 font-medium mt-3 pt-2 border-t border-white/10">
                  Beban operasional &amp; belanja sekolah
                </p>
              </div>

              {/* Net Cash Flow */}
              <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 rounded-3xl p-5 text-white shadow-lg shadow-slate-900/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Net Cash Flow</span>
                    <div className="p-2 bg-white/10 backdrop-blur-md rounded-2xl">
                      <Wallet className="w-5 h-5 text-slate-300" />
                    </div>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black mt-3 tracking-tight text-emerald-400">
                    {formatRupiah(summary.netCashFlow)}
                  </h3>
                </div>
                <p className="text-[11px] text-slate-300 font-medium mt-3 pt-2 border-t border-white/10">
                  Surplus / sisa kas bersih sekolah
                </p>
              </div>

              {/* Total Outstanding Piutang */}
              <div className="bg-gradient-to-tr from-amber-600 to-orange-600 rounded-3xl p-5 text-white shadow-lg shadow-amber-700/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-100 uppercase tracking-wider">Total Piutang Siswa</span>
                    <div className="p-2 bg-white/10 backdrop-blur-md rounded-2xl">
                      <AlertCircle className="w-5 h-5 text-amber-100" />
                    </div>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black mt-3 tracking-tight">
                    {formatRupiah(summary.totalPiutang)}
                  </h3>
                </div>
                <p className="text-[11px] text-amber-100 font-medium mt-3 pt-2 border-t border-white/10">
                  Tagihan belum lunas / tertunggak
                </p>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ================= TAB 2: KARTU PIUTANG SISWA ================= */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-7 space-y-6">
          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-800 text-base">Cari Kartu Piutang Siswa (Buku Pembantu)</h3>
            <p className="text-xs text-slate-500">Ketik nama siswa atau NIS untuk melihat rincian seluruh histori kewajiban dan pembayaran</p>

            <div className="relative max-w-md mt-2">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={stSearch}
                onChange={(e) => handleSearchStudentLedger(e.target.value)}
                placeholder="Ketik nama atau NIS siswa..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
              />

              {students.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 z-30 max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {students.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => {
                        setSelectedStudent(st);
                        setStudents([]);
                        setStSearch('');
                        fetchStudentLedger(st.id);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-emerald-50/50 text-xs flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div>
                        <span className="font-extrabold text-slate-900 block">{st.name}</span>
                        <span className="text-slate-400 text-[11px]">Kelas: {st.class_name || '-'} ({st.unit_name || 'Unit'})</span>
                      </div>
                      <span className="font-mono text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        NIS: {st.nis}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {ledgerLoading && (
            <div className="p-8 text-center text-slate-400 text-xs font-medium flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Memuat buku pembantu piutang siswa...</span>
            </div>
          )}

          {studentLedger && !ledgerLoading && (
            <div className="space-y-6 pt-4 border-t border-slate-100">
              {/* Student Header Card */}
              <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md border border-emerald-900/40">
                <div>
                  <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block mb-1">
                    Kartu Pembantu Piutang Siswa
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black">{studentLedger.student?.name}</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    NIS: <strong>{studentLedger.student?.nis}</strong> • Kelas: <strong>{studentLedger.student?.class_name}</strong> ({studentLedger.student?.unit_name})
                  </p>
                </div>
                <div className="text-left sm:text-right bg-white/10 sm:bg-transparent p-3 sm:p-0 rounded-2xl backdrop-blur-xs">
                  <span className="text-[11px] text-emerald-300 font-bold block uppercase tracking-wider">Total Sisa Piutang:</span>
                  <h2 className="text-2xl sm:text-3xl font-black text-amber-300 mt-0.5">
                    {formatRupiah(studentLedger.summary?.totalPiutang)}
                  </h2>
                </div>
              </div>

              {/* Ledger Items Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] sm:text-[11px]">
                      <th className="py-3 px-4">No. Tagihan</th>
                      <th className="py-3 px-4">Pos Tagihan</th>
                      <th className="py-3 px-4">Nominal</th>
                      <th className="py-3 px-4">Diskon/Potongan</th>
                      <th className="py-3 px-4">Sudah Dibayar</th>
                      <th className="py-3 px-4">Sisa Piutang</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {(studentLedger.ledgerItems || []).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{item.invoice_number}</td>
                        <td className="py-3.5 px-4 font-bold text-emerald-700">{item.post_name}</td>
                        <td className="py-3.5 px-4 font-bold">{formatRupiah(item.nominal)}</td>
                        <td className="py-3.5 px-4 text-slate-500">{item.discount > 0 ? `-${formatRupiah(item.discount)}` : 'Rp 0'}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">{formatRupiah(item.paid)}</td>
                        <td className="py-3.5 px-4 font-black text-amber-700">{formatRupiah(item.remaining)}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                            item.status === 'Lunas' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-amber-50 text-amber-800 border-amber-200'
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

      {/* ================= TAB 3: LAPORAN PER POS ================= */}
      {activeTab === 'by-post' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Rekapitulasi Laporan Keuangan Per Pos Pembayaran</h3>
              <p className="text-xs text-slate-500">Performa penerimaan kas dan sisa piutang per pos tagihan sekolah</p>
            </div>
            <span className="text-xs font-bold text-slate-400 px-3 py-1 bg-slate-100 rounded-xl">
              {byPost.length} Pos Pembayaran
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] sm:text-[11px]">
                  <th className="py-3.5 px-5">Nama Pos Pembayaran</th>
                  <th className="py-3.5 px-5">Unit Sekolah</th>
                  <th className="py-3.5 px-5">Jumlah Tagihan</th>
                  <th className="py-3.5 px-5">Total Nominal Tagihan</th>
                  <th className="py-3.5 px-5">Total Terbayar</th>
                  <th className="py-3.5 px-5">Total Piutang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {byPost.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">
                      Belum ada data laporan pos pembayaran pada unit ini.
                    </td>
                  </tr>
                ) : (
                  byPost.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-900">{p.post_name}</td>
                      <td className="py-3.5 px-5 font-semibold text-emerald-700">{p.unit_name || 'Semua Unit'}</td>
                      <td className="py-3.5 px-5 font-bold">{p.total_invoices || 0} Tagihan</td>
                      <td className="py-3.5 px-5 font-bold text-slate-800">{formatRupiah(p.total_nominal)}</td>
                      <td className="py-3.5 px-5 font-black text-emerald-700 text-sm">{formatRupiah(p.total_paid)}</td>
                      <td className="py-3.5 px-5 font-black text-amber-700 text-sm">{formatRupiah(p.total_piutang)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 4: LAPORAN PER KELAS ================= */}
      {activeTab === 'by-class' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Rekapitulasi Laporan Keuangan Per Kelas</h3>
              <p className="text-xs text-slate-500">Penerimaan kas dan sisa piutang terbagi per rombongan belajar</p>
            </div>
            <span className="text-xs font-bold text-slate-400 px-3 py-1 bg-slate-100 rounded-xl">
              {byClass.length} Kelas
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] sm:text-[11px]">
                  <th className="py-3.5 px-5">Nama Kelas</th>
                  <th className="py-3.5 px-5">Jenjang Sekolah</th>
                  <th className="py-3.5 px-5">Jumlah Siswa</th>
                  <th className="py-3.5 px-5">Total Pembayaran Terkonfirmasi</th>
                  <th className="py-3.5 px-5">Total Piutang Kelas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {byClass.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400 font-medium">
                      Belum ada data laporan kelas pada unit ini.
                    </td>
                  </tr>
                ) : (
                  byClass.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-900">{c.class_name}</td>
                      <td className="py-3.5 px-5 font-semibold text-emerald-700">{c.unit_name}</td>
                      <td className="py-3.5 px-5 font-bold">{c.student_count || 0} Siswa</td>
                      <td className="py-3.5 px-5 font-black text-emerald-700 text-sm">{formatRupiah(c.total_paid)}</td>
                      <td className="py-3.5 px-5 font-black text-amber-700 text-sm">{formatRupiah(c.total_piutang)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
