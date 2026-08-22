import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  Users, 
  CreditCard, 
  AlertCircle,
  Building,
  CheckCircle2, 
  Clock, 
  Landmark, 
  QrCode, 
  Receipt, 
  Banknote, 
  Calendar, 
  ShieldCheck, 
  ShoppingCart, 
  School, 
  Layers, 
  Sparkles,
  FilePieChart,
  PlusCircle,
  Activity,
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const formatRupiah = (val) => {
  const num = Number(val) || 0;
  return `Rp ${Math.round(num).toLocaleString('id-ID')}`;
};

const PIE_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1'];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdminOrSuperAdmin = user?.role === 'superadmin' || user?.role === 'admin';

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await api.get('/dashboard/metrics');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-500">Memuat Financial Dashboard Cendekia...</p>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const charts = data?.charts || {};

  const cashierCash = metrics.cashierCash || { today: 0, week: 0, month: 0, total: 0, todayCount: 0, weekCount: 0, monthCount: 0, totalCount: 0 };
  const transferBank = metrics.transferBank || { today: 0, week: 0, month: 0, total: 0, todayCount: 0, weekCount: 0, monthCount: 0, totalCount: 0 };
  const paymentGateway = metrics.paymentGateway || { today: 0, week: 0, month: 0, total: 0, todayCount: 0, weekCount: 0, monthCount: 0, totalCount: 0 };
  const recentTransactions = metrics.recentTransactions || [];
  const collectionStats = metrics.collectionStats || { paidCount: 0, unpaidCount: 0, totalCount: 0, percentage: 0 };

  return (
    <div className="p-6 lg:p-8 space-y-7 max-w-7xl mx-auto">
      {/* Header & Quick Action Shortcuts */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">
              {isAdminOrSuperAdmin ? 'Dashboard Financial Management' : 'Dashboard Kasir & Loket Pembayaran'}
            </h1>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Realtime
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isAdminOrSuperAdmin 
              ? 'Monitoring arus kas, efektivitas penagihan SPP & performa keuangan Sekolah Cendekia'
              : `Selamat datang, ${user?.name || 'Kasir'}. Siap melayani pembayaran tagihan siswa.`}
          </p>
        </div>

        {/* Quick Action Shortcuts Bar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => navigate('/kasir-pos')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Kasir POS</span>
          </button>

          {isAdminOrSuperAdmin && (
            <>
              <button
                onClick={() => navigate('/invoices')}
                className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>Buat Tagihan</span>
              </button>

              <button
                onClick={() => navigate('/expenses')}
                className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <TrendingDown className="w-4 h-4 text-rose-600" />
                <span>Pengeluaran</span>
              </button>

              <button
                onClick={() => navigate('/reports')}
                className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <FilePieChart className="w-4 h-4 text-indigo-600" />
                <span>Laporan</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 4 Main Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Saldo Kas & Bank */}
        <div className="bg-gradient-to-tr from-emerald-700 via-emerald-800 to-teal-700 rounded-3xl p-5 text-white shadow-xl shadow-emerald-900/10 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
            <Wallet className="w-36 h-36 text-white" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">
                {isAdminOrSuperAdmin ? 'Total Saldo Kas & Bank' : 'Setoran Kasir Hari Ini'}
              </span>
              <div className="p-2 bg-white/10 backdrop-blur-md rounded-2xl">
                <Wallet className="w-5 h-5 text-emerald-200" />
              </div>
            </div>
            <div className="mt-3">
              <h2 className="text-2xl lg:text-3xl font-black tracking-tight">
                {isAdminOrSuperAdmin 
                  ? formatRupiah(metrics.totalCash)
                  : formatRupiah(cashierCash.today)}
              </h2>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-emerald-100 font-semibold">
            {isAdminOrSuperAdmin ? (
              <>
                <span>Kas Loket: {formatRupiah(metrics.mainCashBalance)}</span>
                <span>Bank: {formatRupiah(Number(metrics.bankBcaBalance || 0) + Number(metrics.bankBsiBalance || 0))}</span>
              </>
            ) : (
              <span>{cashierCash.todayCount || 0} Transaksi Diterima Hari Ini</span>
            )}
          </div>
        </div>

        {/* Pemasukan Hari Ini */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pemasukan Hari Ini</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                {formatRupiah(metrics.todayIncome)}
              </h2>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Bulan Ini: {formatRupiah(metrics.monthIncome)}</span>
          </div>
        </div>

        {/* Pengeluaran Hari Ini */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {isAdminOrSuperAdmin ? 'Pengeluaran Hari Ini' : 'Siswa Aktif'}
              </span>
              <div className="p-2 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
                {isAdminOrSuperAdmin ? <ArrowDownRight className="w-5 h-5" /> : <Users className="w-5 h-5 text-emerald-600" />}
              </div>
            </div>
            <div className="mt-3">
              {isAdminOrSuperAdmin ? (
                <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                  {formatRupiah(metrics.todayExpense)}
                </h2>
              ) : (
                <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                  {metrics.activeStudents || 0} Siswa
                </h2>
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span>{isAdminOrSuperAdmin ? 'Beban Operasional Sekolah' : 'SDIT & KBTK-IT Cendekia'}</span>
          </div>
        </div>

        {/* Total Piutang Siswa */}
        <div className="bg-white rounded-3xl p-5 border border-amber-200 bg-amber-50/20 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Total Piutang Siswa</span>
              <div className="p-2 bg-amber-100 text-amber-700 rounded-2xl border border-amber-200">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <h2 className="text-2xl lg:text-3xl font-black text-amber-950 tracking-tight">
                {formatRupiah(metrics.totalPiutang)}
              </h2>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between text-xs text-amber-800 font-bold">
            <span>{metrics.activeStudents || 0} Siswa Aktif</span>
            <span>{metrics.totalTransactions || 0} Tagihan</span>
          </div>
        </div>
      </div>

      {/* ================= SECTION: GRAFIK TREN KEUANGAN & COLLECTION RATE ================= */}
      {isAdminOrSuperAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left (2 Cols): Monthly Cashflow Trends Bar Chart */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold border border-indigo-100 shadow-xs">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-base">Tren Arus Kas Bulanan (Cash Flow)</h3>
                  <p className="text-xs text-slate-500">Perbandingan pemasukan vs pengeluaran sekolah 6 bulan terakhir</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-xl self-start sm:self-auto">
                Tahun Ajaran 2026/2027
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.monthlyTrend || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} axisLine={{ stroke: '#CBD5E1' }} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)}Jt`} />
                  <Tooltip 
                    formatter={(value) => [formatRupiah(value), '']}
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '16px', color: '#fff', fontSize: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="income" name="Pemasukan" fill="#10B981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expense" name="Pengeluaran" fill="#F43F5E" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right (1 Col): SPP Collection Rate Progress & Top Posts */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100 shadow-xs">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-base">Tingkat Pelunasan Tagihan</h3>
                  <p className="text-xs text-slate-500">Efektivitas penagihan SPP &amp; Biaya Siswa</p>
                </div>
              </div>

              {/* Progress Bar & Percentage */}
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                  <span>Persentase Lunas</span>
                  <span className="text-lg font-black text-emerald-700">{collectionStats.percentage}%</span>
                </div>
                
                {/* Visual Progress Bar */}
                <div className="w-full bg-emerald-200/80 rounded-full h-3.5 overflow-hidden p-0.5">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-1000 shadow-xs"
                    style={{ width: `${Math.min(100, Math.max(5, collectionStats.percentage))}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-emerald-800 font-semibold pt-1">
                  <span>Lunas: <strong>{collectionStats.paidCount} Tagihan</strong></span>
                  <span>Belum: <strong>{collectionStats.unpaidCount} Tagihan</strong></span>
                </div>
              </div>

              {/* Top Payment Posts Distribution */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Top Sumber Pemasukan Sekolah:
                </span>
                <div className="space-y-2">
                  {(charts.topPosts || []).slice(0, 4).map((tp, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 hover:bg-slate-100/70 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                        <span className="font-bold text-slate-700 truncate max-w-[140px]">{tp.name}</span>
                      </div>
                      <span className="font-extrabold text-slate-900">{formatRupiah(tp.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/invoices')}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Kelola Daftar Tagihan Siswa</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ================= SECTION: LIVE RECENT TRANSACTIONS FEED ================= */}
      {recentTransactions.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold border border-teal-100 shadow-xs">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Aktivitas Transaksi Kasir Terbaru</h3>
                <p className="text-xs text-slate-500">5 pembayaran terakhir yang tercatat di sistem loket</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/history-transaksi')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Lihat Semua Riwayat</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-5">No. Kuitansi</th>
                  <th className="py-3.5 px-5">Nama Siswa</th>
                  <th className="py-3.5 px-5">Pos Tagihan</th>
                  <th className="py-3.5 px-5">Jumlah Bayar</th>
                  <th className="py-3.5 px-5">Metode</th>
                  <th className="py-3.5 px-5">Waktu</th>
                  <th className="py-3.5 px-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {recentTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-extrabold text-slate-900">
                      {t.transaction_number || '-'}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-slate-800">
                      {t.student_name || 'Siswa'} {t.unit_code ? `(${t.unit_code})` : ''}
                    </td>
                    <td className="py-3.5 px-5 text-slate-600">
                      {t.post_name || 'Biaya Pendidikan'}
                    </td>
                    <td className="py-3.5 px-5 font-black text-emerald-700 text-sm">
                      {formatRupiah(t.amount)}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="bg-slate-100 text-slate-800 font-bold px-2.5 py-1 rounded-lg text-[10px]">
                        {t.payment_method || 'Cash'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-medium text-slate-400 text-[11px]">
                      {t.payment_date ? new Date(t.payment_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-black px-2.5 py-0.5 rounded-full text-[10px] uppercase">
                        {t.status || 'Paid'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REKAPITULASI PENERIMAAN HARIAN KASIR PER JENJANG (KBTK & SDIT) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <School className="w-5 h-5 text-emerald-600" />
              Rekapitulasi Penerimaan Harian Kasir (Per Jenjang &amp; Pos Pembayaran)
            </h2>
            <p className="text-xs text-slate-500">
              Penerimaan kasir hari ini ({new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}) terbagi per unit KBTK &amp; SDIT
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(metrics.dailyUnitRecap || [
            { unitId: 1, unitName: 'KBTK-IT Cendekia', unitCode: 'KBTK', totalAmount: 0, totalCash: 0, totalNonCash: 0, transactionCount: 0, posts: [] },
            { unitId: 2, unitName: 'SDIT Cendekia', unitCode: 'SDIT', totalAmount: 0, totalCash: 0, totalNonCash: 0, transactionCount: 0, posts: [] }
          ]).map((unit) => {
            const isKBTK = unit.unitCode === 'KBTK' || unit.unitName?.includes('KBTK');
            return (
              <div 
                key={unit.unitId || unit.unitCode} 
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow"
              >
                {/* Unit Header Badge */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shadow-xs ${
                      isKBTK ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {unit.unitCode}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-base">{unit.unitName}</h3>
                      <p className="text-[11px] text-slate-400 font-medium">Hari ini: {unit.transactionCount || 0} Transaksi Pembayaran</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Hari Ini</span>
                    <span className={`text-lg font-black ${isKBTK ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {formatRupiah(unit.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Sub-KPI: Tunai vs Non-Tunai */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Tunai (Cash)</span>
                      <span className="text-xs font-black text-emerald-700">{formatRupiah(unit.totalCash)}</span>
                    </div>
                    <Banknote className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Non-Tunai</span>
                      <span className="text-xs font-black text-teal-700">{formatRupiah(unit.totalNonCash)}</span>
                    </div>
                    <QrCode className="w-4 h-4 text-teal-500" />
                  </div>
                </div>

                {/* Breakdown per Pos Pembayaran Table */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Rincian Per Pos Pembayaran:
                  </span>
                  
                  {(!unit.posts || unit.posts.length === 0) ? (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
                      Belum ada transaksi pembayaran untuk {unit.unitName} hari ini.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden text-xs">
                      {unit.posts.map((p, pIdx) => (
                        <div key={pIdx} className="p-3 hover:bg-slate-50/80 transition-colors flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800 block">{p.postName}</span>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              <span>{p.transactionCount} Txn</span>
                              <span>•</span>
                              <span>Cash: {formatRupiah(p.totalCash)}</span>
                              <span>•</span>
                              <span>Non-Cash: {formatRupiah(p.totalNonCash)}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-slate-900 text-sm block">{formatRupiah(p.totalAmount)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Link */}
                <button
                  onClick={() => navigate(`/history-transaksi?period=harian&unit=${unit.unitCode}`)}
                  className="w-full py-2.5 px-3 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 text-xs font-extrabold rounded-2xl border border-slate-200 hover:border-emerald-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Buka Rincian {unit.transactionCount || 0} Riwayat Transaksi {unit.unitCode} Hari Ini &rarr;</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ONLY RENDER BREAKDOWN SECTIONS FOR ADMIN & SUPERADMIN */}
      {isAdminOrSuperAdmin && (
        <>
          {/* SECTION 1: RINCIAN PEMASUKAN TUNAI KASIR */}
          <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Rincian Pemasukan Tunai / Kasir POS</h2>
                  <p className="text-xs text-slate-500">Penerimaan uang fisik tunai langsung dari loket kasir</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                Total Kasir: {formatRupiah(cashierCash.total)} ({cashierCash.totalCount || 0} Txn)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    Tunai Hari Ini
                  </span>
                  <span className="text-[11px] text-emerald-700 bg-emerald-200/60 px-2 py-0.5 rounded font-bold">{cashierCash.todayCount || 0} Txn</span>
                </div>
                <h3 className="text-2xl font-black text-emerald-950">
                  {formatRupiah(cashierCash.today)}
                </h3>
                <p className="text-[11px] text-emerald-700">Diterima hari ini via Kasir</p>
              </div>

              <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-teal-900">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    Tunai Pekan Ini (7 Hari)
                  </span>
                  <span className="text-[11px] text-teal-700 bg-teal-200/60 px-2 py-0.5 rounded font-bold">{cashierCash.weekCount || 0} Txn</span>
                </div>
                <h3 className="text-2xl font-black text-teal-950">
                  {formatRupiah(cashierCash.week)}
                </h3>
                <p className="text-[11px] text-teal-700">Akumulasi 7 hari terakhir</p>
              </div>

              <div className="p-4 bg-emerald-100/40 rounded-2xl border border-emerald-300 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-700" />
                    Tunai Bulan Ini
                  </span>
                  <span className="text-[11px] text-emerald-800 bg-emerald-300/60 px-2 py-0.5 rounded font-bold">{cashierCash.monthCount || 0} Txn</span>
                </div>
                <h3 className="text-2xl font-black text-emerald-950">
                  {formatRupiah(cashierCash.month)}
                </h3>
                <p className="text-[11px] text-emerald-700">Akumulasi bulan berjalan</p>
              </div>
            </div>
          </div>

          {/* SECTION 2: RINCIAN PEMASUKAN TRANSFER BANK */}
          <div className="bg-white rounded-3xl p-6 border border-blue-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-blue-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Rincian Pemasukan Transfer Bank (BCA / BSI)</h2>
                  <p className="text-xs text-slate-500">Penerimaan dana transfer rekening bank sekolah</p>
                </div>
              </div>
              <span className="text-xs font-bold text-blue-800 bg-blue-100 px-3 py-1 rounded-full">
                Total Transfer: {formatRupiah(transferBank.total)} ({transferBank.totalCount || 0} Txn)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-600" />
                    Transfer Hari Ini
                  </span>
                  <span className="text-[11px] text-blue-700 bg-blue-200/60 px-2 py-0.5 rounded font-bold">{transferBank.todayCount || 0} Txn</span>
                </div>
                <h3 className="text-2xl font-black text-blue-950">
                  {formatRupiah(transferBank.today)}
                </h3>
                <p className="text-[11px] text-blue-700">Transfer masuk hari ini</p>
              </div>

              <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    Transfer Pekan Ini (7 Hari)
                  </span>
                  <span className="text-[11px] text-indigo-700 bg-indigo-200/60 px-2 py-0.5 rounded font-bold">{transferBank.weekCount || 0} Txn</span>
                </div>
                <h3 className="text-2xl font-black text-indigo-950">
                  {formatRupiah(transferBank.week)}
                </h3>
                <p className="text-[11px] text-indigo-700">Akumulasi 7 hari terakhir</p>
              </div>

              <div className="p-4 bg-sky-100/40 rounded-2xl border border-sky-300 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-sky-950">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-sky-700" />
                    Transfer Bulan Ini
                  </span>
                  <span className="text-[11px] text-sky-800 bg-sky-300/60 px-2 py-0.5 rounded font-bold">{transferBank.monthCount || 0} Txn</span>
                </div>
                <h3 className="text-2xl font-black text-sky-950">
                  {formatRupiah(transferBank.month)}
                </h3>
                <p className="text-[11px] text-sky-700">Akumulasi bulan berjalan</p>
              </div>
            </div>
          </div>

          {/* SECTION 3: RINCIAN PEMASUKAN PAYMENT GATEWAY */}
          <div className="bg-white rounded-3xl p-6 border border-violet-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-violet-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-violet-100 text-violet-800 rounded-xl">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Rincian Pemasukan Payment Gateway (QRIS &amp; Virtual Account)</h2>
                  <p className="text-xs text-slate-500">Penerimaan dana otomatis via Payment Gateway Digital</p>
                </div>
              </div>
              <span className="text-xs font-bold text-violet-800 bg-violet-100 px-3 py-1 rounded-full">
                Total Gateway: {formatRupiah(paymentGateway.total)} ({paymentGateway.totalCount || 0} Txn)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-violet-50/60 rounded-2xl border border-violet-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-violet-900">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-violet-600" />
                    Gateway Hari Ini
                  </span>
                  <span className="text-[11px] text-violet-700 bg-violet-200/60 px-2 py-0.5 rounded font-bold">{paymentGateway.todayCount || 0} Txn</span>
                </div>
                <h3 className="text-2xl font-black text-violet-950">
                  {formatRupiah(paymentGateway.today)}
                </h3>
                <p className="text-[11px] text-violet-700">Diterima otomatis hari ini</p>
              </div>

              <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-purple-900">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    Gateway Pekan Ini (7 Hari)
                  </span>
                  <span className="text-[11px] text-purple-700 bg-purple-200/60 px-2 py-0.5 rounded font-bold">{paymentGateway.weekCount || 0} Txn</span>
                </div>
                <h3 className="text-2xl font-black text-purple-950">
                  {formatRupiah(paymentGateway.week)}
                </h3>
                <p className="text-[11px] text-purple-700">Akumulasi 7 hari terakhir</p>
              </div>

              <div className="p-4 bg-violet-100/40 rounded-2xl border border-violet-300 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-violet-950">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-violet-700" />
                    Gateway Bulan Ini
                  </span>
                  <span className="text-[11px] text-violet-800 bg-violet-300/60 px-2 py-0.5 rounded font-bold">{paymentGateway.monthCount || 0} Txn</span>
                </div>
                <h3 className="text-2xl font-black text-violet-950">
                  {formatRupiah(paymentGateway.month)}
                </h3>
                <p className="text-[11px] text-violet-700">Akumulasi bulan berjalan</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
