import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Receipt, 
  Search, 
  Filter, 
  Send, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  Edit,
  Sparkles,
  Save,
  X,
  School,
  Users,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Check,
  Calendar,
  Layers,
  Coins
} from 'lucide-react';

const AY_MONTHS = [
  { code: '2026-07', label: 'Juli 2026' },
  { code: '2026-08', label: 'Agustus 2026' },
  { code: '2026-09', label: 'September 2026' },
  { code: '2026-10', label: 'Oktober 2026' },
  { code: '2026-11', label: 'November 2026' },
  { code: '2026-12', label: 'Desember 2026' },
  { code: '2027-01', label: 'Januari 2027' },
  { code: '2027-02', label: 'Februari 2027' },
  { code: '2027-03', label: 'Maret 2027' },
  { code: '2027-04', label: 'April 2027' },
  { code: '2027-05', label: 'Mei 2027' },
  { code: '2027-06', label: 'Juni 2027' }
];

export default function InvoicesList() {
  const { user } = useAuth();
  const isAdminOrSuperAdmin = user?.role === 'superadmin' || user?.role === 'admin';

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [units, setUnits] = useState([]);
  const [classes, setClasses] = useState([]);

  // Generate Modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [genPostId, setGenPostId] = useState('');
  const [genDueDate, setGenDueDate] = useState('2026-12-31');
  const [posts, setPosts] = useState([]);

  // Direct Edit Single Invoice Modal
  const [editModalInv, setEditModalInv] = useState(null);
  const [customNominal, setCustomNominal] = useState('');
  const [customDiscount, setCustomDiscount] = useState('0');
  const [applyAllMonths, setApplyAllMonths] = useState(true);
  const [editReason, setEditReason] = useState('Beasiswa / Tarif Khusus Siswa');
  const [saveLoading, setSaveLoading] = useState(false);

  // Wizard Custom Tarif (5 Steps: Jenjang -> Kelas -> Siswa -> Pos Pembayaran -> Input Nominal)
  const [showCustomSppWizard, setShowCustomSppWizard] = useState(false);
  const [wizStep, setWizStep] = useState(1);
  const [wizUnit, setWizUnit] = useState(null);
  const [wizClass, setWizClass] = useState(null);
  const [wizClassesList, setWizClassesList] = useState([]);
  const [wizStudent, setWizStudent] = useState(null);
  const [wizStudentsList, setWizStudentsList] = useState([]);
  const [wizStudentSearch, setWizStudentSearch] = useState('');
  const [wizStudentInvoices, setWizStudentInvoices] = useState([]);
  const [wizSelectedPost, setWizSelectedPost] = useState(null);

  // Rates State for SPP 12 Months
  const [wizMonthlyRates, setWizMonthlyRates] = useState([]);
  // Rates State for Non-SPP
  const [wizNonSppNominal, setWizNonSppNominal] = useState('');
  const [wizNonSppDiscount, setWizNonSppDiscount] = useState('0');
  const [wizTargetInvoiceId, setWizTargetInvoiceId] = useState(null);
  const [wizReason, setWizReason] = useState('Beasiswa / Tarif Khusus Siswa');
  const [wizSaveLoading, setWizSaveLoading] = useState(false);

  useEffect(() => {
    fetchInvoices();
    fetchUnits();
    fetchPosts();
  }, [statusFilter, unitFilter, classFilter]);

  useEffect(() => {
    fetchClasses();
  }, [unitFilter]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      let url = `/invoices?1=1`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (unitFilter) url += `&unit_id=${unitFilter}`;
      if (classFilter) url += `&class_id=${classFilter}`;
      if (search) url += `&search=${search}`;

      const res = await api.get(url);
      if (res.data.success) {
        setInvoices(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnits = async () => {
    try {
      const res = await api.get('/master/units');
      if (res.data.success) setUnits(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClasses = async () => {
    try {
      let url = `/master/classes`;
      if (unitFilter) url += `?unit_id=${unitFilter}`;
      const res = await api.get(url);
      if (res.data.success) setClasses(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await api.get('/pos');
      if (res.data.success) setPosts(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInvoices();
  };

  const handleSendWAReminder = async (invoiceId) => {
    try {
      const res = await api.post(`/invoices/${invoiceId}/reminder`);
      if (res.data.success) {
        alert('Pengingat WhatsApp berhasil dikirim ke nomor orang tua!');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal mengirim WA reminder');
    }
  };

  const handleOpenEditModal = (inv) => {
    setEditModalInv(inv);
    setCustomNominal(inv.nominal.toString());
    setCustomDiscount(inv.discount_amount ? inv.discount_amount.toString() : '0');
    setApplyAllMonths(inv.post_name?.includes('SPP') || inv.post_name?.includes('Biaya Pendidikan'));
    setEditReason('Potongan / Tarif Khusus Siswa');
  };

  const handleSaveCustomNominal = async (e) => {
    e.preventDefault();
    if (!editModalInv) return;

    setSaveLoading(true);
    try {
      const res = await api.put(`/invoices/${editModalInv.id}`, {
        nominal: parseFloat(customNominal),
        discount_amount: parseFloat(customDiscount || 0),
        apply_to_all_months: applyAllMonths,
        reason: editReason
      });

      if (res.data.success) {
        alert(res.data.message);
        setEditModalInv(null);
        fetchInvoices();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal mengubah nominal tagihan');
    } finally {
      setSaveLoading(false);
    }
  };

  // ================= WIZARD HANDLERS =================
  const handleOpenCustomSppWizard = () => {
    setShowCustomSppWizard(true);
    setWizStep(1);
    setWizUnit(null);
    setWizClass(null);
    setWizStudent(null);
    setWizStudentSearch('');
    setWizStudentInvoices([]);
    setWizSelectedPost(null);
    setWizReason('Beasiswa / Tarif Khusus Siswa');
  };

  const handleWizSelectUnit = async (unit) => {
    setWizUnit(unit);
    setWizStep(2);
    setWizClass(null);
    setWizStudent(null);
    try {
      const res = await api.get(`/master/classes?unit_id=${unit.id}`);
      if (res.data.success) {
        setWizClassesList(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleWizSelectClass = async (cls) => {
    setWizClass(cls);
    setWizStep(3);
    setWizStudent(null);
    try {
      const res = await api.get(`/master/students?class_id=${cls.id}`);
      if (res.data.success) {
        setWizStudentsList(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleWizSelectStudent = async (student) => {
    setWizStudent(student);
    setWizStep(4);
    try {
      const res = await api.get(`/invoices?student_id=${student.id}`);
      if (res.data.success) {
        setWizStudentInvoices(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleWizSelectPost = (postType, postData) => {
    setWizSelectedPost({ type: postType, data: postData });

    if (postType === 'SPP') {
      // Build 12 months rates array from student invoices
      const sppInvs = wizStudentInvoices.filter(i => 
        i.post_name?.includes('SPP') || i.post_name?.includes('Biaya Pendidikan') || i.month_period?.includes('-')
      );

      const rates = AY_MONTHS.map(m => {
        const found = sppInvs.find(i => i.month_period === m.code);
        return {
          month_period: m.code,
          label: m.label,
          invoice_id: found ? found.id : null,
          nominal: found ? found.nominal : (wizUnit?.code === 'SDIT' ? 500000 : 350000),
          discount_amount: found ? found.discount_amount : 0,
          status: found ? found.status : 'Belum Dibayar'
        };
      });
      setWizMonthlyRates(rates);
    } else {
      // Non-SPP post
      const found = wizStudentInvoices.find(i => i.post_id === postData.id || i.post_code === postData.code);
      setWizTargetInvoiceId(found ? found.id : null);
      setWizNonSppNominal(found ? found.nominal.toString() : postData.default_amount.toString());
      setWizNonSppDiscount(found ? found.discount_amount.toString() : '0');
    }

    setWizStep(5);
  };

  const handleApplySameRateToAllMonths = () => {
    const targetVal = prompt('Masukkan nominal SPP yang ingin disamakan ke SEMUA 12 Bulan (cth: 100000):', '100000');
    if (targetVal !== null && !isNaN(parseFloat(targetVal))) {
      const num = parseFloat(targetVal);
      setWizMonthlyRates(wizMonthlyRates.map(r => ({ ...r, nominal: num })));
    }
  };

  const handleUpdateMonthlyRate = (code, val) => {
    setWizMonthlyRates(wizMonthlyRates.map(r => r.month_period === code ? { ...r, nominal: parseFloat(val) || 0 } : r));
  };

  const handleWizSubmitCustomNominals = async (e) => {
    e.preventDefault();
    if (!wizStudent || !wizSelectedPost) return;

    setWizSaveLoading(true);
    try {
      if (wizSelectedPost.type === 'SPP') {
        // Send monthly updates
        const res = await api.post('/invoices/custom-monthly-spp', {
          student_id: wizStudent.id,
          monthly_updates: wizMonthlyRates.map(r => ({
            month_period: r.month_period,
            nominal: r.nominal,
            discount_amount: r.discount_amount
          })),
          reason: wizReason
        });
        if (res.data.success) {
          alert(res.data.message);
          setShowCustomSppWizard(false);
          fetchInvoices();
        }
      } else {
        // Single Non-SPP invoice update
        if (wizTargetInvoiceId) {
          const res = await api.put(`/invoices/${wizTargetInvoiceId}`, {
            nominal: parseFloat(wizNonSppNominal),
            discount_amount: parseFloat(wizNonSppDiscount || 0),
            apply_to_all_months: false,
            reason: wizReason
          });
          if (res.data.success) {
            alert(res.data.message);
            setShowCustomSppWizard(false);
            fetchInvoices();
          }
        }
      }
    } catch (err) {
      console.error('Submit custom rates error:', err);
      alert(err.response?.data?.error || err.message || 'Gagal menyimpan tarif khusus siswa');
    } finally {
      setWizSaveLoading(false);
    }
  };

  const filteredWizStudents = wizStudentsList.filter(s => 
    s.name.toLowerCase().includes(wizStudentSearch.toLowerCase()) ||
    s.nis.toLowerCase().includes(wizStudentSearch.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Daftar Tagihan & Piutang Siswa</h1>
          <p className="text-xs text-slate-500">Kelola tagihan SPP bulanan, biaya masuk, seragam & atur tarif khusus/beasiswa per siswa</p>
        </div>
        {isAdminOrSuperAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenCustomSppWizard}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>⚡ Set Tarif Khusus Semua Pos / SPP Per-Bulan</span>
            </button>

            <button
              onClick={() => setShowGenerateModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Generate Tagihan Baru</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari No. Tagihan / Siswa / NIS..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={unitFilter}
              onChange={(e) => {
                setUnitFilter(e.target.value);
                setClassFilter('');
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="">Semua Unit</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>

            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="">Semua Kelas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="">Semua Status</option>
              <option value="Belum Dibayar">Belum Dibayar</option>
              <option value="Sebagian">Sebagian</option>
              <option value="Lunas">Lunas</option>
            </select>
          </div>

          {(statusFilter || unitFilter || classFilter || search) && (
            <button
              onClick={() => {
                setStatusFilter('');
                setUnitFilter('');
                setClassFilter('');
                setSearch('');
              }}
              className="text-xs text-rose-600 font-semibold hover:underline px-2"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Memuat daftar tagihan...</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">Tidak ada tagihan yang cocok dengan filter</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">No. Tagihan</th>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-4">Kelas & Jenjang</th>
                  <th className="py-3 px-4">Pos Pembayaran</th>
                  <th className="py-3 px-4">Nominal Tagihan</th>
                  <th className="py-3 px-4">Dibayar</th>
                  <th className="py-3 px-4">Sisa Tagihan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {invoices.map((inv) => {
                  const remaining = Math.max(0, inv.nominal - inv.discount_amount - inv.paid_amount);

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-800">{inv.invoice_number}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{inv.student_name}</div>
                        <div className="text-[11px] text-slate-400">NIS: {inv.nis}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div>{inv.class_name}</div>
                        <div className="text-[11px] text-slate-400">{inv.unit_name}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-200">
                          {inv.post_name} {inv.month_period ? `(${inv.month_period})` : ''}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold">
                        Rp {inv.nominal.toLocaleString('id-ID')}
                        {inv.discount_amount > 0 && (
                          <div className="text-[10px] text-emerald-600 font-extrabold">Diskon/Potongan: -Rp {inv.discount_amount.toLocaleString('id-ID')}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-emerald-700 font-semibold">Rp {inv.paid_amount.toLocaleString('id-ID')}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">Rp {remaining.toLocaleString('id-ID')}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase ${
                            inv.status === 'Lunas'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'Sebagian'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isAdminOrSuperAdmin && inv.status !== 'Lunas' && (
                            <button
                              onClick={() => handleOpenEditModal(inv)}
                              title="Custom Nominal / Potongan Khusus Siswa Ini"
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg border border-amber-300 transition-all text-xs font-bold inline-flex items-center gap-1"
                            >
                              <Edit className="w-3.5 h-3.5 text-amber-600" />
                              <span>Custom Nominal</span>
                            </button>
                          )}

                          {inv.status !== 'Lunas' && (
                            <button
                              onClick={() => handleSendWAReminder(inv.id)}
                              title="Kirim Pengingat WhatsApp"
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition-all text-xs font-semibold inline-flex items-center gap-1"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>WA</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL WIZARD: JENJANG -> KELAS -> SISWA -> POS -> TARIF KHUSUS (PER-BULAN SPP & ALL POS) ================= */}
      {showCustomSppWizard && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-4xl lg:max-w-5xl w-full p-6 lg:p-8 space-y-5 shadow-2xl border border-slate-200 max-h-[95vh] overflow-y-auto">
            {/* Header Wizard */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Atur Tarif Khusus Semua Pos &amp; SPP Per-Bulan</h3>
                  <p className="text-[11px] text-slate-400">Pilih Jenjang ➔ Kelas ➔ Siswa ➔ Pos Pembayaran ➔ Nominal Khusus</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCustomSppWizard(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Header */}
            <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-bold">
              <div className={`p-2 rounded-xl border ${wizStep >= 1 ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-100 text-slate-400'}`}>
                1. Jenjang
              </div>
              <div className={`p-2 rounded-xl border ${wizStep >= 2 ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-100 text-slate-400'}`}>
                2. Kelas
              </div>
              <div className={`p-2 rounded-xl border ${wizStep >= 3 ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-100 text-slate-400'}`}>
                3. Siswa
              </div>
              <div className={`p-2 rounded-xl border ${wizStep >= 4 ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-100 text-slate-400'}`}>
                4. Pos
              </div>
              <div className={`p-2 rounded-xl border ${wizStep >= 5 ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-100 text-slate-400'}`}>
                5. Nominal
              </div>
            </div>

            {/* STEP 1: PILIH JENJANG */}
            {wizStep === 1 && (
              <div className="space-y-4 py-2">
                <p className="text-xs font-bold text-slate-700">Langkah 1: Pilih Jenjang Pendidikan</p>
                <div className="grid grid-cols-2 gap-4">
                  {units.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleWizSelectUnit(u)}
                      className="p-5 rounded-2xl border-2 border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 text-left transition-all group space-y-2"
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                        <School className="w-5 h-5" />
                      </div>
                      <h4 className="font-extrabold text-slate-800 text-sm">{u.name}</h4>
                      <p className="text-[11px] text-slate-500">{u.code}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: PILIH KELAS */}
            {wizStep === 2 && (
              <div className="space-y-4 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-700">
                    Langkah 2: Pilih Kelas di <span className="text-amber-600 font-extrabold">{wizUnit?.name}</span>
                  </p>
                  <button onClick={() => setWizStep(1)} className="text-xs text-amber-600 font-bold flex items-center gap-1">
                    <ArrowLeft className="w-3.5 h-3.5" /> Ubah Jenjang
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-1">
                  {wizClassesList.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleWizSelectClass(c)}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 text-left transition-all space-y-1"
                    >
                      <h4 className="font-bold text-slate-800 text-xs">{c.name}</h4>
                      <p className="text-[10px] text-slate-400">Tingkat {c.level}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: PILIH SISWA */}
            {wizStep === 3 && (
              <div className="space-y-4 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-700">
                    Langkah 3: Pilih Nama Siswa di <span className="text-amber-600 font-extrabold">{wizClass?.name}</span>
                  </p>
                  <button onClick={() => setWizStep(2)} className="text-xs text-amber-600 font-bold flex items-center gap-1">
                    <ArrowLeft className="w-3.5 h-3.5" /> Ubah Kelas
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={wizStudentSearch}
                    onChange={(e) => setWizStudentSearch(e.target.value)}
                    placeholder="Cari nama siswa di kelas ini..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                  {filteredWizStudents.length === 0 ? (
                    <p className="text-xs text-slate-400 col-span-2 text-center py-4">Tidak ada siswa ditemukan</p>
                  ) : (
                    filteredWizStudents.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => handleWizSelectStudent(st)}
                        className="p-3 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 text-left transition-all flex items-center justify-between"
                      >
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-xs">{st.name}</h4>
                          <p className="text-[10px] text-slate-400">NIS: {st.nis}</p>
                        </div>
                        <GraduationCap className="w-4 h-4 text-slate-400" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: PILIH POS PEMBAYARAN */}
            {wizStep === 4 && (
              <div className="space-y-4 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-700">
                    Langkah 4: Pilih Pos Pembayaran Untuk Siswa <span className="text-amber-600 font-extrabold">{wizStudent?.name}</span>
                  </p>
                  <button onClick={() => setWizStep(3)} className="text-xs text-amber-600 font-bold flex items-center gap-1">
                    <ArrowLeft className="w-3.5 h-3.5" /> Ganti Siswa
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Option 1: SPP 12 Bulan (Custom Per Month) */}
                  <button
                    onClick={() => handleWizSelectPost('SPP', { name: 'Biaya Pendidikan / SPP (Per-Bulan)' })}
                    className="p-4 rounded-2xl border-2 border-emerald-400 bg-emerald-50/50 hover:bg-emerald-100/60 text-left transition-all space-y-1.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="bg-emerald-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded uppercase">
                        PER-BULAN (12 BULAN)
                      </span>
                      <Calendar className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h4 className="font-black text-slate-900 text-sm">Biaya Pendidikan / SPP (12 Bulan)</h4>
                    <p className="text-[11px] text-slate-600">Atur nominal khusus secara individu per-bulan (cth: Juli Rp 100k, Agustus Rp 150k, dll).</p>
                  </button>

                  {/* Option 2: Non-SPP Posts */}
                  {posts.filter(p => !p.code?.includes('SPP') && (!p.unit_id || p.unit_id === wizUnit?.id)).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleWizSelectPost('NON_SPP', p)}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 text-left transition-all space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="bg-amber-100 text-amber-800 font-bold text-[10px] px-2 py-0.5 rounded uppercase">
                          {p.type}
                        </span>
                        <Coins className="w-4 h-4 text-amber-600" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-xs">{p.name}</h4>
                      <p className="text-[11px] text-slate-500 font-mono">Standard: Rp {p.default_amount.toLocaleString('id-ID')}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 5: FORM INPUT TARIF KHUSUS (PER-BULAN SPP ATAU NON-SPP) */}
            {wizStep === 5 && (
              <form onSubmit={handleWizSubmitCustomNominals} className="space-y-5 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-700">
                    Langkah 5: Masukkan Tarif Khusus - <span className="text-amber-600 font-extrabold">{wizSelectedPost?.data?.name}</span>
                  </p>
                  <button type="button" onClick={() => setWizStep(4)} className="text-xs text-amber-600 font-bold flex items-center gap-1">
                    <ArrowLeft className="w-3.5 h-3.5" /> Ganti Pos
                  </button>
                </div>

                {/* Selected Info Banner */}
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs space-y-1">
                  <p><span className="font-bold text-slate-700">Siswa Terpilih:</span> <span className="font-extrabold text-amber-950 text-sm">{wizStudent?.name}</span> (NIS: {wizStudent?.nis})</p>
                  <p><span className="font-bold text-slate-700">Kelas:</span> {wizClass?.name} ({wizUnit?.name}) • <span className="font-bold text-slate-700">Pos:</span> {wizSelectedPost?.data?.name}</p>
                </div>

                {/* CASE A: CUSTOM PER-MONTH SPP (12 MONTHS GRID) */}
                {wizSelectedPost?.type === 'SPP' ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-slate-800">
                        Atur Nominal SPP Per-Bulan (12 Bulan Tahun Ajaran):
                      </label>
                      <button
                        type="button"
                        onClick={handleApplySameRateToAllMonths}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold rounded-lg shadow-xs transition-all flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>⚡ Samakan Semua Bulan</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
                      {wizMonthlyRates.map((m) => (
                        <div key={m.month_period} className="bg-white p-3 rounded-xl border border-slate-200 space-y-1 shadow-xs">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-extrabold text-slate-800">{m.label}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${m.status === 'Lunas' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              {m.status === 'Lunas' ? 'LUNAS' : 'BELUM'}
                            </span>
                          </div>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Rp</span>
                            <input
                              type="number"
                              disabled={m.status === 'Lunas'}
                              value={m.nominal}
                              onChange={(e) => handleUpdateMonthlyRate(m.month_period, e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className={`w-full pl-8 pr-2 py-1.5 border rounded-lg text-xs font-bold ${
                                m.status === 'Lunas' ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white border-amber-300 focus:ring-2 focus:ring-amber-500/20'
                              }`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* CASE B: SINGLE NON-SPP POST */
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Nominal Baru Khusus Siswa Ini (Rp)
                      </label>
                      <input
                        type="number"
                        value={wizNonSppNominal}
                        onChange={(e) => setWizNonSppNominal(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        required
                        placeholder="Contoh: 2500000"
                        className="w-full px-4 py-2.5 bg-white border border-amber-400 rounded-xl font-extrabold text-base text-slate-900 focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Diskon / Potongan Tambahan (Rp)
                      </label>
                      <input
                        type="number"
                        value={wizNonSppDiscount}
                        onChange={(e) => setWizNonSppDiscount(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sm text-slate-800"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Alasan / Catatan Beasiswa</label>
                  <input
                    type="text"
                    value={wizReason}
                    onChange={(e) => setWizReason(e.target.value)}
                    placeholder="Contoh: Beasiswa Yatim / Keringanan Infaq Bersaudara"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomSppWizard(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={wizSaveLoading}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>{wizSaveLoading ? 'Menyimpan...' : 'Simpan Tarif Khusus Siswa'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL EDIT SINGLE INVOICE CUSTOM NOMINAL */}
      {editModalInv && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-800 text-base">Atur Nominal & Tarif Khusus Siswa</h3>
              </div>
              <button 
                onClick={() => setEditModalInv(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomNominal} className="space-y-4">
              <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs space-y-1">
                <p><span className="font-bold text-slate-700">Nama Siswa:</span> <span className="font-extrabold text-amber-900">{editModalInv.student_name}</span> (NIS: {editModalInv.nis})</p>
                <p><span className="font-bold text-slate-700">Pos Pembayaran:</span> {editModalInv.post_name} ({editModalInv.month_period || 'Tahunan'})</p>
                <p><span className="font-bold text-slate-700">Nominal Standar Awal:</span> Rp {editModalInv.nominal.toLocaleString('id-ID')}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nominal Baru Khusus Siswa Ini (Rp)
                </label>
                <input
                  type="number"
                  value={customNominal}
                  onChange={(e) => setCustomNominal(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  required
                  placeholder="Contoh: 100000"
                  className="w-full px-4 py-2.5 bg-white border border-amber-400 rounded-xl font-extrabold text-base text-slate-900 focus:ring-2 focus:ring-amber-500/20"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Ketik tarif khusus siswa ini (misal: <span className="font-bold text-slate-700">100000</span> untuk beasiswa SPP Rp 100.000).
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Diskon / Potongan Tambahan (Rp)
                </label>
                <input
                  type="number"
                  value={customDiscount}
                  onChange={(e) => setCustomDiscount(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sm text-slate-800"
                />
              </div>

              {/* Checkbox apply to all 12 SPP months */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-emerald-900">
                  <input
                    type="checkbox"
                    checked={applyAllMonths}
                    onChange={(e) => setApplyAllMonths(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Terapkan tarif Rp {parseFloat(customNominal || 0).toLocaleString('id-ID')} ke SEMUA 12 bulan SPP siswa ini</span>
                </label>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Alasan / Catatan Beasiswa</label>
                <input
                  type="text"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Alasan khusus e.g. Beasiswa Yatim / Diskon Bersaudara"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalInv(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{saveLoading ? 'Menyimpan...' : 'Simpan Tarif Khusus'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
