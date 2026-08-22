import React, { useState, useEffect, useRef } from 'react';
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
  BookOpen,
  FileText,
  Building,
  Check,
  Scale,
  DollarSign
} from 'lucide-react';

const formatRupiah = (val) => {
  if (val === undefined || val === null || val === '') return 'Rp 0';
  const num = parseFloat(val);
  if (isNaN(num)) return 'Rp 0';
  return `Rp ${Math.round(num).toLocaleString('id-ID')}`;
};

export default function Reports() {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'income-statement', 'ledger', 'by-post', 'by-class'
  const [summary, setSummary] = useState(null);
  const [incomeStatement, setIncomeStatement] = useState(null);
  const [byPost, setByPost] = useState([]);
  const [byClass, setByClass] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  // Kartu Piutang Search
  const [students, setStudents] = useState([]);
  const [stSearch, setStSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentLedger, setStudentLedger] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Print & Export Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printType, setPrintType] = useState('summary'); // 'summary', 'income-statement', 'by-post', 'by-class', 'ledger'

  const printAreaRef = useRef(null);

  useEffect(() => {
    fetchReportSummary();
  }, [selectedUnit, selectedMonth]);

  const fetchReportSummary = async () => {
    setLoading(true);
    try {
      const params = [];
      if (selectedUnit) params.push(`unit_id=${selectedUnit}`);
      if (selectedMonth) params.push(`month_period=${selectedMonth}`);
      const queryStr = params.length > 0 ? `?${params.join('&')}` : '';

      const [sumRes, incRes, postRes, classRes, unitRes] = await Promise.all([
        api.get(`/reports/summary${queryStr}`),
        api.get(`/reports/income-statement${queryStr}`),
        api.get(`/reports/by-post${queryStr}`),
        api.get(`/reports/by-class${queryStr}`),
        api.get('/master/units')
      ]);

      if (sumRes.data.success) setSummary(sumRes.data);
      if (incRes.data.success) setIncomeStatement(incRes.data.data);
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

  const handleOpenPrintModal = (type = activeTab) => {
    setPrintType(type);
    setShowPrintModal(true);
  };

  const handleExecutePrint = () => {
    window.print();
  };

  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const getSelectedUnitName = () => {
    if (!selectedUnit) return 'Semua Jenjang (KBTK & SDIT)';
    const found = units.find(u => String(u.id) === String(selectedUnit));
    return found ? `${found.name} (${found.code})` : 'Unit Terpilih';
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
              Laporan laba rugi, rekap penerimaan kas, buku pembantu piutang siswa, per pos dan per kelas
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
            onClick={() => handleOpenPrintModal(activeTab)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Export Laporan</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200 shadow-xs">
        {/* Navigation Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1">
          {[
            { id: 'summary', label: 'Ringkasan Keuangan' },
            { id: 'income-statement', label: 'Laporan Laba Rugi (Aktivitas)' },
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

        {/* Filter Controls: Periode Bulan & Jenjang Sekolah */}
        <div className="flex items-center gap-2.5 px-1 flex-wrap">
          {/* Filter Bulan */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Periode:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
            />
            {selectedMonth && (
              <button
                onClick={() => setSelectedMonth('')}
                className="text-[10px] text-slate-400 hover:text-rose-600 font-bold"
                title="Reset Bulan"
              >
                Reset
              </button>
            )}
          </div>

          {/* Filter Jenjang */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Jenjang:</span>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="">Semua Jenjang</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.code}
                </option>
              ))}
            </select>
          </div>
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

      {/* ================= TAB 2: LAPORAN LABA RUGI (INCOME STATEMENT) ================= */}
      {activeTab === 'income-statement' && (
        <div className="space-y-6">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs font-medium flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Memuat Laporan Laba Rugi...</span>
            </div>
          ) : incomeStatement ? (
            <div className="space-y-6">
              {/* Top 3 Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-3xl p-5 border border-emerald-200 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Pendapatan (A)</span>
                    <h3 className="text-2xl font-black text-emerald-800">{formatRupiah(incomeStatement.totalRevenues)}</h3>
                    <p className="text-[10px] text-emerald-600 font-medium">Dari pembayaran SPP, infaq &amp; dana masuk</p>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-rose-200 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Beban Operasional (B)</span>
                    <h3 className="text-2xl font-black text-rose-800">{formatRupiah(incomeStatement.totalExpenses)}</h3>
                    <p className="text-[10px] text-rose-600 font-medium">Dari pengeluaran gaji &amp; belanja sekolah</p>
                  </div>
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                    <TrendingDown className="w-6 h-6" />
                  </div>
                </div>

                <div className={`rounded-3xl p-5 border shadow-sm flex items-center justify-between ${
                  incomeStatement.isSurplus ? 'bg-slate-900 text-white border-slate-800' : 'bg-rose-900 text-white border-rose-800'
                }`}>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      {incomeStatement.isSurplus ? 'Surplus Bersih (A - B)' : 'Defisit Bersih (A - B)'}
                    </span>
                    <h3 className={`text-2xl font-black ${incomeStatement.isSurplus ? 'text-emerald-400' : 'text-rose-300'}`}>
                      {formatRupiah(incomeStatement.netIncome)}
                    </h3>
                    <p className="text-[10px] text-slate-300 font-medium">
                      {incomeStatement.isSurplus ? '🟢 Keuangan Sekolah Mengalami Surplus' : '🔴 Keuangan Sekolah Mengalami Defisit'}
                    </p>
                  </div>
                  <div className="p-3 bg-white/10 rounded-2xl">
                    <Scale className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              {/* Breakdown Tables (Pendapatan vs Beban) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Pendapatan Table */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
                  <div className="p-4 sm:p-5 border-b border-emerald-100 bg-emerald-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm">1. Pendapatan Operasional &amp; Non-Operasional</h4>
                        <p className="text-[11px] text-slate-500">Penerimaan dana kas &amp; bank</p>
                      </div>
                    </div>
                    <span className="font-black text-emerald-800 text-sm">{formatRupiah(incomeStatement.totalRevenues)}</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                          <th className="py-2.5 px-4">Kode</th>
                          <th className="py-2.5 px-4">Nama Pos Pendapatan</th>
                          <th className="py-2.5 px-4 text-center">Txn</th>
                          <th className="py-2.5 px-4 text-right">Nominal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {incomeStatement.revenues.length === 0 ? (
                          <tr><td colSpan="4" className="py-6 text-center text-slate-400">Belum ada data pendapatan.</td></tr>
                        ) : (
                          incomeStatement.revenues.map((r, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80">
                              <td className="py-3 px-4 font-mono font-bold text-slate-500">{r.account_code}</td>
                              <td className="py-3 px-4 font-bold text-slate-900">{r.account_name}</td>
                              <td className="py-3 px-4 text-center">{r.transaction_count}</td>
                              <td className="py-3 px-4 text-right font-black text-emerald-700">{formatRupiah(r.total_amount)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. Beban Table */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
                  <div className="p-4 sm:p-5 border-b border-rose-100 bg-rose-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-rose-100 text-rose-800 rounded-xl">
                        <TrendingDown className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm">2. Beban Pengeluaran Operasional</h4>
                        <p className="text-[11px] text-slate-500">Biaya gaji, belanja &amp; pemeliharaan</p>
                      </div>
                    </div>
                    <span className="font-black text-rose-800 text-sm">{formatRupiah(incomeStatement.totalExpenses)}</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                          <th className="py-2.5 px-4">Kode</th>
                          <th className="py-2.5 px-4">Kategori Beban</th>
                          <th className="py-2.5 px-4 text-center">Txn</th>
                          <th className="py-2.5 px-4 text-right">Nominal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {incomeStatement.expenses.length === 0 ? (
                          <tr><td colSpan="4" className="py-6 text-center text-slate-400">Belum ada catatan pengeluaran disetujui.</td></tr>
                        ) : (
                          incomeStatement.expenses.map((e, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80">
                              <td className="py-3 px-4 font-mono font-bold text-slate-500">{e.account_code}</td>
                              <td className="py-3 px-4 font-bold text-slate-900">{e.account_name}</td>
                              <td className="py-3 px-4 text-center">{e.expense_count}</td>
                              <td className="py-3 px-4 text-right font-black text-rose-700">{formatRupiah(e.total_amount)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ================= TAB 3: KARTU PIUTANG SISWA ================= */}
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
                <div className="text-left sm:text-right bg-white/10 sm:bg-transparent p-3 sm:p-0 rounded-2xl backdrop-blur-xs flex flex-col sm:items-end gap-2">
                  <div>
                    <span className="text-[11px] text-emerald-300 font-bold block uppercase tracking-wider">Total Sisa Piutang:</span>
                    <h2 className="text-2xl sm:text-3xl font-black text-amber-300 mt-0.5">
                      {formatRupiah(studentLedger.summary?.totalPiutang)}
                    </h2>
                  </div>
                  <button
                    onClick={() => handleOpenPrintModal('ledger')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Kartu Siswa Ini</span>
                  </button>
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

      {/* ================= TAB 4: LAPORAN PER POS ================= */}
      {activeTab === 'by-post' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Rekapitulasi Laporan Keuangan Per Pos Pembayaran</h3>
              <p className="text-xs text-slate-500">Performa penerimaan kas dan sisa piutang per pos tagihan sekolah</p>
            </div>
            <button
              onClick={() => handleOpenPrintModal('by-post')}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Laporan Pos</span>
            </button>
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

      {/* ================= TAB 5: LAPORAN PER KELAS ================= */}
      {activeTab === 'by-class' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Rekapitulasi Laporan Keuangan Per Kelas</h3>
              <p className="text-xs text-slate-500">Penerimaan kas dan sisa piutang terbagi per rombongan belajar</p>
            </div>
            <button
              onClick={() => handleOpenPrintModal('by-class')}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Laporan Kelas</span>
            </button>
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

      {/* ================= MODAL PRATINJAU DOKUMEN CETAK RESMI ================= */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden print:max-h-none print:shadow-none print:border-none print:w-full">
            {/* Modal Control Bar (Hidden on Print) */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">Pratinjau Cetak Dokumen Resmi</h3>
                  <p className="text-[11px] text-slate-500">Format standar kertas A4 laporan keuangan sekolah</p>
                </div>
              </div>

              {/* Format Switcher & Action Buttons */}
              <div className="flex items-center gap-2">
                <select
                  value={printType}
                  onChange={(e) => setPrintType(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <option value="summary">Ringkasan Keuangan</option>
                  <option value="income-statement">Laporan Laba Rugi</option>
                  <option value="by-post">Laporan Per Pos</option>
                  <option value="by-class">Laporan Per Kelas</option>
                  {studentLedger && <option value="ledger">Kartu Piutang Siswa</option>}
                </select>

                <button
                  onClick={handleExecutePrint}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak (A4 / PDF)</span>
                </button>

                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable A4 Document Body */}
            <div id="printable-report" className="p-6 sm:p-10 overflow-y-auto space-y-6 print:p-0 print:overflow-visible font-sans text-slate-900 bg-white" ref={printAreaRef}>
              {/* KOP SURAT RESMI */}
              <div className="border-b-4 border-double border-slate-900 pb-4 text-center space-y-1">
                <h3 className="text-sm font-bold tracking-widest text-emerald-800 uppercase">YAYASAN CENDEKIA LAMONGAN</h3>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  SEKOLAH ISLAM TERPADU CENDEKIA
                </h1>
                <p className="text-xs font-semibold text-slate-600">
                  KBTK-IT CENDEKIA &bull; SDIT CENDEKIA
                </p>
                <p className="text-[11px] text-slate-500">
                  Jl. Cendekia No. 01, Lamongan, Jawa Timur &bull; Telp: (0322) 123456 &bull; Email: info@cendekia.sch.id
                </p>
              </div>

              {/* DOCUMENT TITLE */}
              <div className="text-center space-y-1 py-2">
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900 underline decoration-2 underline-offset-4">
                  {printType === 'summary' && 'LAPORAN RINGKASAN KEUANGAN SEKOLAH'}
                  {printType === 'income-statement' && 'LAPORAN LABA RUGI / AKTIVITAS KEUANGAN (INCOME STATEMENT)'}
                  {printType === 'by-post' && 'LAPORAN REKAPITULASI PEMBAYARAN PER POS'}
                  {printType === 'by-class' && 'LAPORAN REKAPITULASI KEUANGAN PER KELAS'}
                  {printType === 'ledger' && 'KARTU PEMBANTU PIUTANG SISWA'}
                </h2>
                <p className="text-xs text-slate-600">
                  Unit: <strong>{getSelectedUnitName()}</strong> &bull; {selectedMonth ? `Bulan: ${selectedMonth} • ` : ''}Per Tanggal: <strong>{todayFormatted}</strong>
                </p>
              </div>

              {/* DOCUMENT BODY BASED ON TYPE */}
              {printType === 'summary' && summary && (
                <div className="space-y-6">
                  {/* Summary Grid Table */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-slate-300 bg-slate-50/60 space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">1. TOTAL PENERIMAAN / PEMASUKAN</span>
                      <h3 className="text-xl font-black text-emerald-800">{formatRupiah(summary.totalIncome)}</h3>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-300 bg-slate-50/60 space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">2. TOTAL PENGELUARAN OPERASIONAL</span>
                      <h3 className="text-xl font-black text-rose-800">{formatRupiah(summary.totalExpense)}</h3>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-300 bg-slate-50/60 space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">3. NET CASH FLOW (SURPLUS/SISA KAS)</span>
                      <h3 className="text-xl font-black text-slate-900">{formatRupiah(summary.netCashFlow)}</h3>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-300 bg-slate-50/60 space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">4. TOTAL SISA PIUTANG SISWA</span>
                      <h3 className="text-xl font-black text-amber-800">{formatRupiah(summary.totalPiutang)}</h3>
                    </div>
                  </div>

                  {/* Pos Breakdown Table */}
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800">Rincian Pos Pembayaran Terbesar:</h4>
                    <table className="w-full text-left border-collapse text-xs border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 font-bold">
                          <th className="p-2.5 border-r border-slate-300 w-10 text-center">No</th>
                          <th className="p-2.5 border-r border-slate-300">Nama Pos Pembayaran</th>
                          <th className="p-2.5 border-r border-slate-300">Unit</th>
                          <th className="p-2.5 border-r border-slate-300 text-right">Total Tagihan</th>
                          <th className="p-2.5 border-r border-slate-300 text-right">Terbayar</th>
                          <th className="p-2.5 text-right">Sisa Piutang</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {byPost.map((p, idx) => (
                          <tr key={p.id}>
                            <td className="p-2 border-r border-slate-200 text-center">{idx + 1}</td>
                            <td className="p-2 border-r border-slate-200 font-semibold">{p.post_name}</td>
                            <td className="p-2 border-r border-slate-200">{p.unit_name || 'Semua'}</td>
                            <td className="p-2 border-r border-slate-200 text-right font-mono">{formatRupiah(p.total_nominal)}</td>
                            <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-emerald-800">{formatRupiah(p.total_paid)}</td>
                            <td className="p-2 text-right font-mono font-bold text-amber-800">{formatRupiah(p.total_piutang)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {printType === 'income-statement' && incomeStatement && (
                <div className="space-y-6">
                  {/* 1. Pendapatan */}
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-emerald-800">1. PENDAPATAN OPERASIONAL &amp; NON-OPERASIONAL</h4>
                    <table className="w-full text-left border-collapse text-xs border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 font-bold">
                          <th className="p-2.5 border-r border-slate-300 w-16">Kode</th>
                          <th className="p-2.5 border-r border-slate-300">Pos / Rekening Pendapatan</th>
                          <th className="p-2.5 border-r border-slate-300 text-center w-20">Transaksi</th>
                          <th className="p-2.5 text-right w-36">Jumlah Nominal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {incomeStatement.revenues.map((r, idx) => (
                          <tr key={idx}>
                            <td className="p-2 border-r border-slate-200 font-mono">{r.account_code}</td>
                            <td className="p-2 border-r border-slate-200 font-semibold">{r.account_name}</td>
                            <td className="p-2 border-r border-slate-200 text-center">{r.transaction_count}</td>
                            <td className="p-2 text-right font-mono font-bold text-emerald-800">{formatRupiah(r.total_amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-emerald-50/80 border-t-2 border-emerald-300 font-black">
                          <td colSpan="3" className="p-2 text-right uppercase">TOTAL PENDAPATAN (A):</td>
                          <td className="p-2 text-right font-mono text-emerald-950 font-black">{formatRupiah(incomeStatement.totalRevenues)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* 2. Beban */}
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-rose-800">2. BEBAN &amp; PENGELUARAN OPERASIONAL</h4>
                    <table className="w-full text-left border-collapse text-xs border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 font-bold">
                          <th className="p-2.5 border-r border-slate-300 w-16">Kode</th>
                          <th className="p-2.5 border-r border-slate-300">Kategori Beban / Pengeluaran</th>
                          <th className="p-2.5 border-r border-slate-300 text-center w-20">Transaksi</th>
                          <th className="p-2.5 text-right w-36">Jumlah Nominal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {incomeStatement.expenses.map((e, idx) => (
                          <tr key={idx}>
                            <td className="p-2 border-r border-slate-200 font-mono">{e.account_code}</td>
                            <td className="p-2 border-r border-slate-200 font-semibold">{e.account_name}</td>
                            <td className="p-2 border-r border-slate-200 text-center">{e.expense_count}</td>
                            <td className="p-2 text-right font-mono font-bold text-rose-800">{formatRupiah(e.total_amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-rose-50/80 border-t-2 border-rose-300 font-black">
                          <td colSpan="3" className="p-2 text-right uppercase">TOTAL BEBAN PENGELUARAN (B):</td>
                          <td className="p-2 text-right font-mono text-rose-950 font-black">{formatRupiah(incomeStatement.totalExpenses)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* 3. Surplus / Defisit Bersih */}
                  <div className="p-4 rounded-xl border-2 border-slate-900 bg-slate-100 flex items-center justify-between font-black text-sm">
                    <span className="uppercase tracking-wider">
                      {incomeStatement.isSurplus ? 'SURPLUS BERSIH OPERASIONAL (A - B):' : 'DEFISIT BERSIH OPERASIONAL (A - B):'}
                    </span>
                    <span className={`text-base font-mono ${incomeStatement.isSurplus ? 'text-emerald-900' : 'text-rose-900'}`}>
                      {formatRupiah(incomeStatement.netIncome)}
                    </span>
                  </div>
                </div>
              )}

              {printType === 'by-post' && (
                <div className="space-y-4">
                  <table className="w-full text-left border-collapse text-xs border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 font-bold">
                        <th className="p-2.5 border-r border-slate-300 w-10 text-center">No</th>
                        <th className="p-2.5 border-r border-slate-300">Nama Pos Tagihan</th>
                        <th className="p-2.5 border-r border-slate-300">Unit Sekolah</th>
                        <th className="p-2.5 border-r border-slate-300 text-center">Jumlah Tagihan</th>
                        <th className="p-2.5 border-r border-slate-300 text-right">Total Nominal</th>
                        <th className="p-2.5 border-r border-slate-300 text-right">Total Terbayar</th>
                        <th className="p-2.5 text-right">Total Piutang</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {byPost.map((p, idx) => (
                        <tr key={p.id}>
                          <td className="p-2 border-r border-slate-200 text-center">{idx + 1}</td>
                          <td className="p-2 border-r border-slate-200 font-semibold">{p.post_name}</td>
                          <td className="p-2 border-r border-slate-200">{p.unit_name || 'Semua Unit'}</td>
                          <td className="p-2 border-r border-slate-200 text-center">{p.total_invoices || 0}</td>
                          <td className="p-2 border-r border-slate-200 text-right font-mono">{formatRupiah(p.total_nominal)}</td>
                          <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-emerald-800">{formatRupiah(p.total_paid)}</td>
                          <td className="p-2 text-right font-mono font-bold text-amber-800">{formatRupiah(p.total_piutang)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {printType === 'by-class' && (
                <div className="space-y-4">
                  <table className="w-full text-left border-collapse text-xs border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 font-bold">
                        <th className="p-2.5 border-r border-slate-300 w-10 text-center">No</th>
                        <th className="p-2.5 border-r border-slate-300">Nama Rombel / Kelas</th>
                        <th className="p-2.5 border-r border-slate-300">Jenjang</th>
                        <th className="p-2.5 border-r border-slate-300 text-center">Jumlah Siswa</th>
                        <th className="p-2.5 border-r border-slate-300 text-right">Total Pembayaran</th>
                        <th className="p-2.5 text-right">Total Piutang</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {byClass.map((c, idx) => (
                        <tr key={c.id}>
                          <td className="p-2 border-r border-slate-200 text-center">{idx + 1}</td>
                          <td className="p-2 border-r border-slate-200 font-semibold">{c.class_name}</td>
                          <td className="p-2 border-r border-slate-200">{c.unit_name}</td>
                          <td className="p-2 border-r border-slate-200 text-center">{c.student_count || 0} Siswa</td>
                          <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-emerald-800">{formatRupiah(c.total_paid)}</td>
                          <td className="p-2 text-right font-mono font-bold text-amber-800">{formatRupiah(c.total_piutang)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {printType === 'ledger' && studentLedger && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Nama Siswa: <strong>{studentLedger.student?.name}</strong></span>
                      <span>Kelas: <strong>{studentLedger.student?.class_name}</strong></span>
                    </div>
                    <div className="flex justify-between">
                      <span>NIS: <strong>{studentLedger.student?.nis}</strong></span>
                      <span>Jenjang: <strong>{studentLedger.student?.unit_name}</strong></span>
                    </div>
                  </div>

                  <table className="w-full text-left border-collapse text-xs border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 font-bold">
                        <th className="p-2.5 border-r border-slate-300 w-10 text-center">No</th>
                        <th className="p-2.5 border-r border-slate-300">No. Tagihan</th>
                        <th className="p-2.5 border-r border-slate-300">Pos Tagihan</th>
                        <th className="p-2.5 border-r border-slate-300 text-right">Nominal</th>
                        <th className="p-2.5 border-r border-slate-300 text-right">Diskon</th>
                        <th className="p-2.5 border-r border-slate-300 text-right">Terbayar</th>
                        <th className="p-2.5 border-r border-slate-300 text-right">Sisa Piutang</th>
                        <th className="p-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(studentLedger.ledgerItems || []).map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2 border-r border-slate-200 text-center">{idx + 1}</td>
                          <td className="p-2 border-r border-slate-200 font-mono">{item.invoice_number}</td>
                          <td className="p-2 border-r border-slate-200 font-semibold">{item.post_name}</td>
                          <td className="p-2 border-r border-slate-200 text-right font-mono">{formatRupiah(item.nominal)}</td>
                          <td className="p-2 border-r border-slate-200 text-right font-mono">{item.discount > 0 ? `-${formatRupiah(item.discount)}` : '-'}</td>
                          <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-emerald-800">{formatRupiah(item.paid)}</td>
                          <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-amber-800">{formatRupiah(item.remaining)}</td>
                          <td className="p-2 text-center uppercase font-bold text-[10px]">{item.status}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 border-t-2 border-slate-400 font-bold">
                        <td colSpan="6" className="p-2.5 text-right uppercase">Total Sisa Kewajiban Piutang:</td>
                        <td className="p-2.5 text-right font-mono text-amber-900 font-black text-sm">
                          {formatRupiah(studentLedger.summary?.totalPiutang)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* TANDA TANGAN / SIGNATURE BLOCK */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-xs text-center break-inside-avoid">
                <div className="space-y-16">
                  <p>Mengetahui,<br /><strong>Kepala Sekolah</strong></p>
                  <div>
                    <p className="font-bold underline uppercase">( __________________________ )</p>
                    <p className="text-[10px] text-slate-500">NIY / NIP Sekolah</p>
                  </div>
                </div>

                <div className="space-y-16">
                  <p>Lamongan, {todayFormatted}<br /><strong>Bendahara / Keuangan</strong></p>
                  <div>
                    <p className="font-bold underline uppercase">( __________________________ )</p>
                    <p className="text-[10px] text-slate-500">Bagian Keuangan Cendekia</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
