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
  ShoppingCart
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

const formatRupiah = (val) => {
  const num = Number(val) || 0;
  return `Rp ${Math.round(num).toLocaleString('id-ID')}`;
};

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
          <p className="text-sm font-medium text-slate-500">Memuat Financial Dashboard...</p>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const charts = data?.charts || {};

  const cashierCash = metrics.cashierCash || { today: 0, week: 0, month: 0, total: 0, todayCount: 0, weekCount: 0, monthCount: 0, totalCount: 0 };
  const transferBank = metrics.transferBank || { today: 0, week: 0, month: 0, total: 0, todayCount: 0, weekCount: 0, monthCount: 0, totalCount: 0 };
  const paymentGateway = metrics.paymentGateway || { today: 0, week: 0, month: 0, total: 0, todayCount: 0, weekCount: 0, monthCount: 0, totalCount: 0 };

  return (
    <div className="p-6 space-y-6">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isAdminOrSuperAdmin ? 'Dashboard Financial Management' : 'Dashboard Kasir & Loket Pembayaran'}
          </h1>
          <p className="text-xs text-slate-500">
            {isAdminOrSuperAdmin 
              ? 'Ringkasan kas, pendapatan, pengeluaran & tagihan Sekolah Cendekia Lamongan'
              : `Selamat datang, ${user?.name || 'Kasir'}. Siap melayani transaksi loket pembayaran siswa.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdminOrSuperAdmin ? (
            <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Real-time Sync Active
            </span>
          ) : (
            <button
              onClick={() => navigate('/kasir-pos')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Buka Kasir POS & Loket Pembayaran
            </button>
          )}
        </div>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cash Balance */}
        <div className="bg-gradient-to-tr from-emerald-700 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-700/20 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <Wallet className="w-32 h-32 text-white" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">
              {isAdminOrSuperAdmin ? 'Total Saldo Kas & Bank' : 'Setoran Kasir Hari Ini'}
            </span>
            <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl">
              <Wallet className="w-5 h-5 text-emerald-100" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-extrabold tracking-tight">
              {isAdminOrSuperAdmin 
                ? formatRupiah(metrics.totalCash)
                : formatRupiah(cashierCash.today)}
            </h2>
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-emerald-100 font-medium">
              {isAdminOrSuperAdmin ? (
                <>
                  <span>Kas Kasir: {formatRupiah(metrics.mainCashBalance)}</span>
                  <span>BCA/BSI: {formatRupiah(Number(metrics.bankBcaBalance || 0) + Number(metrics.bankBsiBalance || 0))}</span>
                </>
              ) : (
                <span>{cashierCash.todayCount || 0} Transaksi Tunai Diterima Hari Ini</span>
              )}
            </div>
          </div>
        </div>

        {/* Today's Income */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pemasukan Hari Ini</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold text-slate-800">{formatRupiah(metrics.todayIncome)}</h2>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Pendapatan Bulan Ini: {formatRupiah(metrics.monthIncome)}</span>
            </div>
          </div>
        </div>

        {/* Today's Expense */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isAdminOrSuperAdmin ? 'Pengeluaran Hari Ini' : 'Siswa Aktif'}
            </span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              {isAdminOrSuperAdmin ? <ArrowDownRight className="w-5 h-5" /> : <Users className="w-5 h-5 text-emerald-600" />}
            </div>
          </div>
          <div className="mt-3">
            {isAdminOrSuperAdmin ? (
              <>
                <h2 className="text-2xl font-bold text-slate-800">{formatRupiah(metrics.todayExpense)}</h2>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Building className="w-3.5 h-3.5" />
                  <span>Beban Operasional Sekolah</span>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-slate-800">{metrics.activeStudents || 0} Siswa</h2>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>SDIT & KBTK-IT Cendekia</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Total Piutang */}
        <div className="bg-white rounded-2xl p-5 border border-amber-200 bg-amber-50/20 shadow-sm relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Total Piutang Siswa</span>
            <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold text-amber-900">{formatRupiah(metrics.totalPiutang)}</h2>
            <div className="mt-3 flex items-center justify-between text-xs text-amber-700 font-medium">
              <span>{metrics.activeStudents || 0} Siswa Aktif</span>
              <span>{metrics.totalTransactions || 0} Transaksi</span>
            </div>
          </div>
        </div>
      </div>

      {/* ONLY RENDER BREAKDOWN SECTIONS FOR ADMIN & SUPERADMIN */}
      {isAdminOrSuperAdmin && (
        <>
          {/* SECTION 1: RINCIAN PEMASUKAN TUNAI KASIR (HARIAN, PEKANAN, BULANAN) */}
          <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Rincian Pemasukan Tunai / Kasir POS</h2>
                  <p className="text-xs text-slate-500">Total penerimaan uang tunai langsung dari loket pembayaran kasir</p>
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
                  <span className="text-[11px] text-emerald-700 bg-emerald-200/60 px-2 py-0.5 rounded">{cashierCash.todayCount || 0} Txn</span>
                </div>
                <h3 className="text-2xl font-extrabold text-emerald-950">
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
                  <span className="text-[11px] text-teal-700 bg-teal-200/60 px-2 py-0.5 rounded">{cashierCash.weekCount || 0} Txn</span>
                </div>
                <h3 className="text-2xl font-extrabold text-teal-950">
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
                  <span className="text-[11px] text-emerald-800 bg-emerald-300/60 px-2 py-0.5 rounded">{cashierCash.monthCount || 0} Txn</span>
                </div>
                <h3 className="text-2xl font-extrabold text-emerald-950">
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
                  <p className="text-xs text-slate-500">Total penerimaan dana transfer rekening bank sekolah</p>
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
                  <span className="text-[11px] text-blue-700 bg-blue-200/60 px-2 py-0.5 rounded">{transferBank.todayCount || 0} Txn</span>
                </div>
                <h3 className="text-2xl font-extrabold text-blue-950">
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
                  <span className="text-[11px] text-indigo-700 bg-indigo-200/60 px-2 py-0.5 rounded">{transferBank.weekCount || 0} Txn</span>
                </div>
                <h3 className="text-2xl font-extrabold text-indigo-950">
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
                  <span className="text-[11px] text-sky-800 bg-sky-300/60 px-2 py-0.5 rounded">{transferBank.monthCount || 0} Txn</span>
                </div>
                <h3 className="text-2xl font-extrabold text-sky-950">
                  {formatRupiah(transferBank.month)}
                </h3>
                <p className="text-[11px] text-sky-700">Akumulasi bulan berjalan</p>
              </div>
            </div>
          </div>

          {/* SECTION 3: RINCIAN PEMASUKAN PAYMENT GATEWAY (QRIS & VIRTUAL ACCOUNT) */}
          <div className="bg-white rounded-3xl p-6 border border-violet-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-violet-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-violet-100 text-violet-800 rounded-xl">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Rincian Pemasukan Payment Gateway (QRIS & Virtual Account)</h2>
                  <p className="text-xs text-slate-500">Penerimaan dana otomatis via Payment Gateway Digital (Midtrans/Xendit)</p>
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
                  <span className="text-[11px] text-violet-700 bg-violet-200/60 px-2 py-0.5 rounded">{paymentGateway.todayCount || 0} Txn</span>
                </div>
                <h3 className="text-2xl font-extrabold text-violet-950">
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
                  <span className="text-[11px] text-purple-700 bg-purple-200/60 px-2 py-0.5 rounded">{paymentGateway.weekCount || 0} Txn</span>
                </div>
                <h3 className="text-2xl font-extrabold text-purple-950">
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
                  <span className="text-[11px] text-violet-800 bg-violet-300/60 px-2 py-0.5 rounded">{paymentGateway.monthCount || 0} Txn</span>
                </div>
                <h3 className="text-2xl font-extrabold text-violet-950">
                  {formatRupiah(paymentGateway.month)}
                </h3>
                <p className="text-[11px] text-violet-700">Akumulasi bulan berjalan</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* VISUAL CHARTS SECTION (FOR ADMIN & SUPERADMIN) */}
      {isAdminOrSuperAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cash Flow Bar Chart (2 columns) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Tren Arus Kas (Pendapatan vs Pengeluaran)</h3>
                <p className="text-xs text-slate-500">Analisis kinerja keuangan per bulan (dalam Rp)</p>
              </div>
              <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">Tahun 2026</span>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.monthlyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val / 1000000}M`} />
                  <Tooltip 
                    formatter={(value) => [`Rp ${value.toLocaleString('id-ID')}`, '']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="income" name="Pemasukan" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} />
                  <Bar dataKey="expense" name="Pengeluaran" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Payment Posts Distribution (1 column) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Top Pos Pembayaran</h3>
              <p className="text-xs text-slate-500">Kontribusi pendapatan terbesar sekolah</p>
            </div>

            <div className="space-y-3 flex-1 flex flex-col justify-center">
              {(charts.topPosts || []).map((post, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 truncate max-w-[180px]">{post.name}</span>
                    <span className="text-emerald-600 font-bold">{formatRupiah(post.total)}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(100, ((post.total || 0) / 100000000) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500">Status SPP Lunas:</span>
              <div className="flex items-center gap-2 font-bold text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>85% Tertagih</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
