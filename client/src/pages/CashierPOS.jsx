import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  School, 
  GraduationCap, 
  UserCheck, 
  Receipt, 
  CreditCard, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  RotateCcw,
  Search,
  ChevronRight,
  History,
  Calendar,
  Wallet,
  ArrowUpRight,
  CalendarDays,
  CheckSquare,
  Square,
  Sparkles,
  Zap,
  Check,
  Building2,
  Coins,
  Send,
  X,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const monthLabels = {
  '2026-07': 'Juli 2026',
  '2026-08': 'Agustus 2026',
  '2026-09': 'September 2026',
  '2026-10': 'Oktober 2026',
  '2026-11': 'November 2026',
  '2026-12': 'Desember 2026',
  '2027-01': 'Januari 2027',
  '2027-02': 'Februari 2027',
  '2027-03': 'Maret 2027',
  '2027-04': 'April 2027',
  '2027-05': 'Mei 2027',
  '2027-06': 'Juni 2027'
};

export default function CashierPOS() {
  const navigate = useNavigate();

  // Active View Tab: 'pos' (Form Transaksi Kasir) or 'history' (Riwayat Pembayaran Kasir)
  const [activeTab, setActiveTab] = useState('pos');

  // Step state for POS: 1 (Jenjang), 2 (Kelas), 3 (Siswa), 4 (Pembayaran)
  const [step, setStep] = useState(1);

  // Master Data State
  const [units, setUnits] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [invoices, setInvoices] = useState([]);

  // Selected State
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Multi-Select Invoices State (Supports paying multiple SPP months simultaneously into 1 invoice transaction)
  const [selectedInvoices, setSelectedInvoices] = useState([]);

  // Search filter for students
  const [studentSearch, setStudentSearch] = useState('');

  // Payment Form State
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');
  const [cashReceived, setCashReceived] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(null);

  // History State (Harian, Pekanan, Bulanan, Semua)
  const [historyPeriod, setHistoryPeriod] = useState('all');
  const [historyMethod, setHistoryMethod] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historySummary, setHistorySummary] = useState({ totalAmount: 0, totalCash: 0, totalNonCash: 0, totalCount: 0 });
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchUnits();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchPaymentHistory();
    }
  }, [activeTab, historyPeriod, historyMethod, historySearch]);

  useEffect(() => {
    if (selectedInvoices.length > 0) {
      const totalRemaining = selectedInvoices.reduce((acc, inv) => {
        const rem = Math.max(0, inv.nominal - inv.discount_amount - inv.paid_amount);
        return acc + rem;
      }, 0);
      setPayAmount(totalRemaining.toString());
      setCashReceived(totalRemaining.toString());
    } else {
      setPayAmount('');
      setCashReceived('');
    }
  }, [selectedInvoices]);

  useEffect(() => {
    setCashReceived(payAmount);
  }, [payAmount]);

  const fetchUnits = async () => {
    try {
      const res = await api.get('/master/units');
      if (res.data.success) {
        setUnits(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClasses = async (unitId) => {
    try {
      const res = await api.get(`/master/classes?unit_id=${unitId}`);
      if (res.data.success) {
        setClasses(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async (classId) => {
    try {
      const res = await api.get(`/master/students?class_id=${classId}`);
      if (res.data.success) {
        setStudents(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInvoices = async (studentId) => {
    try {
      const res = await api.get(`/invoices?student_id=${studentId}`);
      if (res.data.success) {
        setInvoices(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPaymentHistory = async () => {
    setHistoryLoading(true);
    try {
      let url = `/payments?period=${historyPeriod}`;
      if (historyMethod) url += `&payment_method=${historyMethod}`;
      if (historySearch) url += `&search=${historySearch}`;

      const res = await api.get(url);
      if (res.data.success) {
        setPaymentHistory(res.data.data);

        // Compute summary metrics
        let totalAmount = 0;
        let totalCash = 0;
        let totalNonCash = 0;
        res.data.data.forEach(p => {
          totalAmount += p.amount;
          if (p.payment_method === 'Cash' || p.payment_method === 'Tunai') {
            totalCash += p.amount;
          } else {
            totalNonCash += p.amount;
          }
        });
        setHistorySummary({
          totalAmount,
          totalCash,
          totalNonCash,
          totalCount: res.data.data.length
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Selection Handlers
  const handleSelectUnit = (unit) => {
    setSelectedUnit(unit);
    setSelectedClass(null);
    setSelectedStudent(null);
    setSelectedInvoices([]);
    fetchClasses(unit.id);
    setStep(2);
  };

  const handleSelectClass = (cls) => {
    setSelectedClass(cls);
    setSelectedStudent(null);
    setSelectedInvoices([]);
    fetchStudents(cls.id);
    setStep(3);
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setSelectedInvoices([]);
    fetchInvoices(student.id);
    setStep(4);
  };

  const handleResetSelection = () => {
    setStep(1);
    setSelectedUnit(null);
    setSelectedClass(null);
    setSelectedStudent(null);
    setSelectedInvoices([]);
    setInvoices([]);
    setPayAmount('');
    setCashReceived('');
    setNotes('');
  };

  // Toggle invoice checkbox selection
  const handleToggleInvoiceSelection = (inv) => {
    const isSelected = selectedInvoices.some(i => i.id === inv.id);
    if (isSelected) {
      setSelectedInvoices(selectedInvoices.filter(i => i.id !== inv.id));
    } else {
      setSelectedInvoices([...selectedInvoices, inv]);
    }
  };

  const handleSelectAllSppInvoices = () => {
    const unpaidSppInvoices = invoices.filter(inv => {
      const isSpp = (inv.post_name?.includes('SPP') || inv.post_name?.includes('Biaya Pendidikan')) && inv.month_period?.includes('-');
      const remaining = Math.max(0, inv.nominal - inv.discount_amount - inv.paid_amount);
      return isSpp && remaining > 0;
    });

    if (selectedInvoices.length === unpaidSppInvoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(unpaidSppInvoices);
    }
  };

  // Process POS Checkout Submission
  const handleProcessPayment = async (e) => {
    e.preventDefault();

    if (selectedInvoices.length === 0) {
      alert('Pilih minimal 1 tagihan yang ingin dibayar!');
      return;
    }

    const amountNum = parseFloat(payAmount);
    if (!amountNum || amountNum <= 0) {
      alert('Masukkan nominal pembayaran yang valid!');
      return;
    }

    const totalRemaining = selectedInvoices.reduce((acc, inv) => {
      const rem = Math.max(0, inv.nominal - inv.discount_amount - inv.paid_amount);
      return acc + rem;
    }, 0);

    if (amountNum > totalRemaining) {
      alert(`Nominal pembayaran (Rp ${amountNum.toLocaleString('id-ID')}) melebihi sisa tagihan terpilih (Rp ${totalRemaining.toLocaleString('id-ID')}).`);
      return;
    }

    const cashNum = parseFloat(cashReceived || 0);
    if (payMethod === 'Cash' && cashNum < amountNum) {
      alert(`Uang diterima (Rp ${cashNum.toLocaleString('id-ID')}) kurang dari nominal pembayaran (Rp ${amountNum.toLocaleString('id-ID')}).`);
      return;
    }

    setLoading(true);
    try {
      const invoiceIds = selectedInvoices.map(i => i.id);

      const res = await api.post('/payments', {
        invoice_ids: invoiceIds,
        amount: amountNum,
        payment_method: payMethod,
        notes: notes || `Pembayaran ${selectedInvoices.length} Tagihan oleh Kasir POS`
      });

      if (res.data.success) {
        const changeAmount = payMethod === 'Cash' ? Math.max(0, cashNum - amountNum) : 0;
        const receiptNum = res.data.data?.receipt_number || res.data.transaction_number || res.data.payment_id;
        setSuccessModal({
          payment: res.data.data || res.data,
          receipt_number: receiptNum,
          change: changeAmount,
          itemsCount: selectedInvoices.length,
          student_name: selectedStudent?.name,
          class_name: selectedClass?.name,
          unit_name: selectedUnit?.name
        });

        // Refresh invoices list & clear form
        fetchInvoices(selectedStudent.id);
        setSelectedInvoices([]);
        setPayAmount('');
        setCashReceived('');
        setNotes('');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal memproses pembayaran kasir');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Hero Header & Active Tab Navigation */}
      <div className="relative bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 shadow-xl border border-emerald-900/40 overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg text-white">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Kasir POS &amp; Terminal Pembayaran</h1>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/30 uppercase">
                  Live POS
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">Sistem Pembayaran Kasir Sekolah Cendekia Lamongan</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/60 backdrop-blur-md">
            <button
              onClick={() => setActiveTab('pos')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'pos'
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Kasir POS (Bayar Tagihan)</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Riwayat Transaksi Kasir</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= VIEW 1: KASIR POS ================= */}
      {activeTab === 'pos' && (
        <div className="space-y-6">
          {/* Stepper Header Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="grid grid-cols-4 gap-2 w-full md:w-auto text-[11px] font-bold">
              <div className={`px-3 py-2 rounded-xl flex items-center gap-2 ${step >= 1 ? 'bg-emerald-500 text-white shadow-xs' : 'bg-slate-100 text-slate-400'}`}>
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
                <span>Jenjang</span>
              </div>
              <div className={`px-3 py-2 rounded-xl flex items-center gap-2 ${step >= 2 ? 'bg-emerald-500 text-white shadow-xs' : 'bg-slate-100 text-slate-400'}`}>
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">2</span>
                <span>Kelas</span>
              </div>
              <div className={`px-3 py-2 rounded-xl flex items-center gap-2 ${step >= 3 ? 'bg-emerald-500 text-white shadow-xs' : 'bg-slate-100 text-slate-400'}`}>
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">3</span>
                <span>Siswa</span>
              </div>
              <div className={`px-3 py-2 rounded-xl flex items-center gap-2 ${step >= 4 ? 'bg-emerald-500 text-white shadow-xs' : 'bg-slate-100 text-slate-400'}`}>
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">4</span>
                <span>Kasir</span>
              </div>
            </div>

            {selectedStudent && (
              <div className="flex items-center gap-3">
                <div className="text-right text-xs">
                  <span className="font-extrabold text-slate-900 text-sm block">{selectedStudent.name}</span>
                  <span className="text-slate-500">{selectedClass?.name} ({selectedUnit?.code})</span>
                </div>
                <button
                  onClick={handleResetSelection}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 text-xs flex items-center gap-1.5 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Ganti Siswa</span>
                </button>
              </div>
            )}
          </div>

          {/* STEP 1: PILIH JENJANG */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-700">Langkah 1: Pilih Jenjang Pendidikan</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {(units.length > 0 ? units : [
                  { id: 1, code: 'KBTK', name: 'KBTK-IT Cendekia' },
                  { id: 2, code: 'SDIT', name: 'SDIT Cendekia' }
                ]).map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleSelectUnit(u)}
                    className="p-6 bg-white rounded-3xl border-2 border-slate-200 hover:border-emerald-500 hover:shadow-xl text-left transition-all group relative overflow-hidden space-y-3"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      <School className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-lg">{u.name}</h3>
                      <p className="text-xs text-slate-500">Kode Unit: {u.code}</p>
                    </div>
                    <div className="pt-2 flex items-center text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
                      <span>Pilih Unit Ini</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: PILIH KELAS */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-700">
                  Langkah 2: Pilih Kelas di <span className="text-emerald-700 font-extrabold">{selectedUnit?.name}</span>
                </h2>
                <button onClick={() => setStep(1)} className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1">
                  &larr; Ganti Jenjang
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {(classes.length > 0 ? classes : (
                  selectedUnit?.code === 'KBTK' ? [
                    { id: 1, name: 'Kelompok Bermain (KB)', teacher: 'Ustz. Aisyah, S.Pd', capacity: 20 },
                    { id: 2, name: 'TK-A Bintang', teacher: 'Ustz. Khadijah, S.Pd', capacity: 25 },
                    { id: 3, name: 'TK-B Bulan', teacher: 'Ustz. Maryam, S.Pd', capacity: 25 }
                  ] : [
                    { id: 4, name: 'Kelas 1 Abu Bakar', teacher: 'Ust. Ali Imran, S.Pd.I', capacity: 28 },
                    { id: 5, name: 'Kelas 1 Umar', teacher: 'Ustz. Halimah, S.Pd', capacity: 28 },
                    { id: 6, name: 'Kelas 2 Utsman', teacher: 'Ust. Mahmud, S.Pd', capacity: 30 },
                    { id: 7, name: 'Kelas 3 Ali', teacher: 'Ustz. Nur, S.Si', capacity: 30 }
                  ]
                )).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectClass(c)}
                    className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md text-left transition-all space-y-2 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm">{c.name}</h3>
                    <p className="text-[11px] text-slate-400">{c.homeroom_teacher || 'Wali Kelas'}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: PILIH SISWA */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-700">
                  Langkah 3: Pilih Nama Siswa di <span className="text-emerald-700 font-extrabold">{selectedClass?.name}</span>
                </h2>
                <button onClick={() => setStep(2)} className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1">
                  &larr; Ganti Kelas
                </button>
              </div>

              <div className="relative max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Cari Nama Siswa / NIS..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(() => {
                  const getFallbackStudents = (clsName) => {
                    if (!clsName) return [];
                    if (clsName.includes('Umar')) {
                      return [
                        { id: 256, nis: '2026022001', name: 'Hamzah Abdul Jabbar', gender: 'L' },
                        { id: 257, nis: '2026022002', name: 'Zaskia Adya Mecca', gender: 'P' },
                        { id: 258, nis: '2026022003', name: 'Fathan Mubina', gender: 'L' },
                        { id: 259, nis: '2026022004', name: 'Talita Zhafira', gender: 'P' },
                        { id: 260, nis: '2026022005', name: 'Reyhan Al-Ghifari', gender: 'L' },
                        { id: 261, nis: '2026022006', name: 'Naura Hafizah', gender: 'P' },
                        { id: 262, nis: '2026022007', name: 'Gibran Al-Farabi', gender: 'L' },
                        { id: 263, nis: '2026022008', name: 'Salma Al-Aqila', gender: 'P' },
                        { id: 264, nis: '2026022009', name: 'Zaydan Ahmad', gender: 'L' },
                        { id: 265, nis: '2026022010', name: 'Calista Humaira', gender: 'P' }
                      ];
                    }
                    if (clsName.includes('Abu Bakar')) {
                      return [
                        { id: 239, nis: '2026021001', name: 'Muhammad Ali Rayyan', gender: 'L' },
                        { id: 240, nis: '2026021002', name: 'Khalifah Umar Al-Ghazi', gender: 'L' },
                        { id: 241, nis: '2026021003', name: 'Syakira Nabila', gender: 'P' },
                        { id: 242, nis: '2026021004', name: 'Sultan Pasha', gender: 'L' },
                        { id: 243, nis: '2026021005', name: 'Alya Mukhbita', gender: 'P' },
                        { id: 244, nis: '2026021006', name: 'Rafif Hamizan', gender: 'L' },
                        { id: 245, nis: '2026021007', name: 'Kaylah Az-Zahra', gender: 'P' },
                        { id: 246, nis: '2026021008', name: 'Zhafran Khairy', gender: 'L' },
                        { id: 247, nis: '2026021009', name: 'Medina Safiyyah', gender: 'P' },
                        { id: 248, nis: '2026021010', name: 'Arkana Rizky Pratama', gender: 'L' }
                      ];
                    }
                    if (clsName.includes('Utsman')) {
                      return [
                        { id: 274, nis: '2026023001', name: 'Fatimah Az-Zahra Subagyo', gender: 'P' },
                        { id: 275, nis: '2026023002', name: 'Salman Al-Farisi', gender: 'L' },
                        { id: 276, nis: '2026023003', name: 'Aisyah Aqilah', gender: 'P' },
                        { id: 277, nis: '2026023004', name: 'Danial Rizky', gender: 'L' },
                        { id: 278, nis: '2026023005', name: 'Zahra Nur Aini', gender: 'P' }
                      ];
                    }
                    return [
                      { id: 291, nis: '2026024001', name: 'Ibrahim Zhafran Pratama', gender: 'L' },
                      { id: 292, nis: '2026024002', name: 'Khadijah Azzahra', gender: 'P' },
                      { id: 293, nis: '2026024003', name: 'Tariq Ziyad', gender: 'L' }
                    ];
                  };

                  const activeStudentList = students && students.length > 0 ? students : getFallbackStudents(selectedClass?.name);
                  const displayList = activeStudentList.filter(s => 
                    s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
                    s.nis?.includes(studentSearch)
                  );

                  if (displayList.length === 0) {
                    return <p className="text-xs text-slate-400 col-span-3 text-center py-6">Tidak ada siswa ditemukan</p>;
                  }

                  return displayList.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectStudent(s)}
                      className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md text-left transition-all flex items-center justify-between group"
                    >
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm group-hover:text-emerald-700 transition-colors">{s.name}</h4>
                        <p className="text-xs text-slate-400 font-mono">NIS: {s.nis}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                    </button>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* STEP 4: FORM CHECKOUT POS KASIR (SPP + NON-SPP + CHECKOUT SIDEBAR) */}
          {step === 4 && selectedStudent && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* LEFT COLUMN (2/3 width): TAGIHAN SPP 12 BULAN & NON-SPP */}
              <div className="lg:col-span-2 space-y-6">
                {/* PART 1: 12 MONTHS SPP GRID */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-emerald-600" />
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">Biaya Pendidikan / SPP (12 Bulan)</h3>
                        <p className="text-[11px] text-slate-400">Pilih 1 atau beberapa bulan untuk dibayar bersamaan</p>
                      </div>
                    </div>

                    <button
                      onClick={handleSelectAllSppInvoices}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs transition-all flex items-center gap-1"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Pilih Semua SPP</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {(() => {
                      const getFallbackInvoicesForStudent = (student) => {
                        if (!student) return [];
                        const sppMonths = [
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

                        const fallbackList = [];
                        sppMonths.forEach((m, idx) => {
                          fallbackList.push({
                            id: 1000 + idx,
                            invoice_number: `INV/SPP/${student.nis}/${m.code.replace('-', '')}`,
                            student_id: student.id,
                            post_name: 'Biaya Pendidikan / SPP',
                            month_period: m.code,
                            nominal: 500000,
                            discount_amount: 0,
                            paid_amount: idx === 0 ? 500000 : 0,
                            status: idx === 0 ? 'Lunas' : 'Belum Dibayar'
                          });
                        });

                        const nonSppItems = [
                          { id: 2001, name: 'Infaq Pembangunan SDIT', nominal: 4500000, paid: 1500000, status: 'Sebagian' },
                          { id: 2002, name: 'Seragam & Atribut Sekolah', nominal: 1200000, paid: 0, status: 'Belum Dibayar' },
                          { id: 2003, name: 'Buku Paket & LKS (Tahunan)', nominal: 850000, paid: 0, status: 'Belum Dibayar' },
                          { id: 2004, name: 'Kegiatan Outing & Rihlah', nominal: 450000, paid: 0, status: 'Belum Dibayar' },
                          { id: 2005, name: 'Komite Sekolah & Majelis', nominal: 150000, paid: 0, status: 'Belum Dibayar' }
                        ];

                        nonSppItems.forEach((item) => {
                          fallbackList.push({
                            id: item.id,
                            invoice_number: `INV/${item.name.replace(/\s+/g, '')}/${student.nis}/2026`,
                            student_id: student.id,
                            post_name: item.name,
                            month_period: 'Tahunan',
                            nominal: item.nominal,
                            discount_amount: 0,
                            paid_amount: item.paid,
                            status: item.status
                          });
                        });

                        return fallbackList;
                      };

                      const currentInvoices = invoices && invoices.length > 0 ? invoices : getFallbackInvoicesForStudent(selectedStudent);
                      const sppList = currentInvoices.filter(inv => (inv.post_name?.includes('SPP') || inv.post_name?.includes('Biaya Pendidikan')) && inv.month_period?.includes('-'));

                      return sppList.map((inv) => {
                        const isSelected = selectedInvoices.some(i => i.id === inv.id);
                        const isPaid = inv.status === 'Lunas';
                        const remaining = Math.max(0, inv.nominal - inv.discount_amount - inv.paid_amount);

                        return (
                          <div
                            key={inv.id}
                            onClick={() => !isPaid && handleToggleInvoiceSelection(inv)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative space-y-2 ${
                              isPaid
                                ? 'bg-emerald-50/50 border-emerald-200 opacity-80 cursor-not-allowed'
                                : isSelected
                                ? 'bg-emerald-500 text-white border-emerald-600 shadow-md ring-2 ring-emerald-400/30'
                                : 'bg-white border-slate-200 hover:border-emerald-400 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                isPaid
                                  ? 'bg-emerald-200 text-emerald-800'
                                  : isSelected
                                  ? 'bg-white/20 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {monthLabels[inv.month_period] || inv.month_period}
                              </span>
                              {isSelected ? (
                                <CheckCircle2 className="w-4 h-4 text-white" />
                              ) : isPaid ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300" />
                              )}
                            </div>

                            <div>
                              <p className={`text-xs font-black ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                                Rp {remaining.toLocaleString('id-ID')}
                              </p>
                              {inv.discount_amount > 0 && (
                                <p className={`text-[9px] ${isSelected ? 'text-emerald-100' : 'text-emerald-600'}`}>
                                  Disc: -Rp {inv.discount_amount.toLocaleString('id-ID')}
                                </p>
                              )}
                            </div>

                            <div className="text-[9px] font-bold">
                              <span className={isPaid ? 'text-emerald-700' : isSelected ? 'text-emerald-100' : 'text-rose-600'}>
                                {isPaid ? '✓ LUNAS' : `STATUS: ${inv.status.toUpperCase()}`}
                              </span>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* PART 2: NON-SPP INVOICES (Infaq, Seragam, Perlengkapan, Outing, Ekskul, Komite) */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Coins className="w-5 h-5 text-amber-500" />
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">Pos Pembayaran Non-SPP (Dapat Dicicil)</h3>
                        <p className="text-[11px] text-slate-400">Infaq Pembangunan, Seragam, Perlengkapan, Outing, Ekskul &amp; Komite</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(() => {
                      const getFallbackNonSppInvoices = (student) => {
                        if (!student) return [];
                        const nonSppItems = [
                          { id: 2001, name: 'Infaq Pembangunan SDIT', nominal: 4500000, paid: 1500000, status: 'Sebagian' },
                          { id: 2002, name: 'Seragam & Atribut Sekolah', nominal: 1200000, paid: 0, status: 'Belum Dibayar' },
                          { id: 2003, name: 'Buku Paket & LKS (Tahunan)', nominal: 850000, paid: 0, status: 'Belum Dibayar' },
                          { id: 2004, name: 'Kegiatan Outing & Rihlah', nominal: 450000, paid: 0, status: 'Belum Dibayar' },
                          { id: 2005, name: 'Komite Sekolah & Majelis', nominal: 150000, paid: 0, status: 'Belum Dibayar' }
                        ];

                        return nonSppItems.map(item => ({
                          id: item.id,
                          invoice_number: `INV/${item.name.replace(/\s+/g, '')}/${student.nis}/2026`,
                          student_id: student.id,
                          post_name: item.name,
                          month_period: 'Tahunan',
                          nominal: item.nominal,
                          discount_amount: 0,
                          paid_amount: item.paid,
                          status: item.status
                        }));
                      };

                      const currentInvoices = invoices && invoices.length > 0 ? invoices : getFallbackNonSppInvoices(selectedStudent);
                      const nonSppList = currentInvoices.filter(inv => !((inv.post_name?.includes('SPP') || inv.post_name?.includes('Biaya Pendidikan')) && inv.month_period?.includes('-')));

                      return nonSppList.map((inv) => {
                        const isSelected = selectedInvoices.some(i => i.id === inv.id);
                        const isPaid = inv.status === 'Lunas';
                        const remaining = Math.max(0, inv.nominal - inv.discount_amount - inv.paid_amount);

                        return (
                          <div
                            key={inv.id}
                            onClick={() => !isPaid && handleToggleInvoiceSelection(inv)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                              isPaid
                                ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                                : isSelected
                                ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20'
                                : 'bg-white border-slate-200 hover:border-amber-300'
                            }`}
                          >
                          <div className="flex items-center justify-between">
                            <span className="bg-amber-100 text-amber-900 font-extrabold text-[10px] px-2 py-0.5 rounded uppercase">
                              {inv.post_name}
                            </span>
                            {isSelected ? (
                              <CheckCircle2 className="w-5 h-5 text-amber-600" />
                            ) : isPaid ? (
                              <Check className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-300" />
                            )}
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1">
                            <span className="text-slate-500">Nominal Tagihan:</span>
                            <span className="font-bold text-slate-800">Rp {inv.nominal.toLocaleString('id-ID')}</span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Sudah Dibayar:</span>
                            <span className="font-bold text-emerald-700">Rp {inv.paid_amount.toLocaleString('id-ID')}</span>
                          </div>

                          <div className="flex items-center justify-between text-xs font-extrabold border-t border-slate-100 pt-1.5">
                            <span className="text-slate-700">Sisa Piutang:</span>
                            <span className="text-slate-900 text-sm">Rp {remaining.toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
                </div>
              </div>

              {/* RIGHT COLUMN (1/3 width): STICKY CHECKOUT PANEL */}
              <div className="lg:col-span-1">
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 shadow-2xl border border-slate-700/60 font-medium space-y-5 sticky top-6">
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-emerald-400" />
                      <h3 className="font-bold text-white text-base">Ringkasan Pembayaran</h3>
                    </div>
                    <span className="bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30">
                      {selectedInvoices.length} Item
                    </span>
                  </div>

                  {/* Selected Items List */}
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {selectedInvoices.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">Pilih tagihan di sebelah kiri untuk membayar</p>
                    ) : (
                      selectedInvoices.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between text-xs bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                          <div>
                            <p className="font-bold text-white text-[11px]">{inv.post_name}</p>
                            <p className="text-[10px] text-slate-400">{inv.month_period ? monthLabels[inv.month_period] || inv.month_period : 'Non-SPP'}</p>
                          </div>
                          <span className="font-extrabold text-emerald-400">
                            Rp {Math.max(0, inv.nominal - inv.discount_amount - inv.paid_amount).toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Total Amount Display / Editable Installment Amount Input */}
                  {selectedInvoices.length === 1 && !selectedInvoices[0].month_period?.includes('-') ? (
                    <div className="p-3.5 bg-amber-950/50 rounded-2xl border border-amber-500/50 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                        <span>Nominal Pembayaran / Angsuran (Rp):</span>
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 uppercase">
                          Bisa Dicicil
                        </span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-extrabold text-amber-400 text-sm">Rp</span>
                        <input
                          type="number"
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                          onFocus={(e) => e.target.select()}
                          placeholder="Ketik jumlah angsuran yang ingin dibayar"
                          className="w-full pl-10 pr-3 py-2 bg-slate-900 border border-amber-400/60 rounded-xl font-extrabold text-white text-base focus:ring-2 focus:ring-amber-500/30"
                        />
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1 text-[10px]">
                        <span className="text-slate-400 font-medium">Preset Cepat:</span>
                        <button
                          type="button"
                          onClick={() => setPayAmount('1000000')}
                          className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold rounded border border-amber-500/30"
                        >
                          1 Juta
                        </button>
                        <button
                          type="button"
                          onClick={() => setPayAmount('2000000')}
                          className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold rounded border border-amber-500/30"
                        >
                          2 Juta
                        </button>
                        <button
                          type="button"
                          onClick={() => setPayAmount('2500000')}
                          className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold rounded border border-amber-500/30"
                        >
                          2,5 Juta
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const rem = Math.max(0, selectedInvoices[0].nominal - selectedInvoices[0].discount_amount - selectedInvoices[0].paid_amount);
                            setPayAmount(rem.toString());
                          }}
                          className="px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold rounded border border-emerald-500/30"
                        >
                          Lunas Sisa (Rp {Math.max(0, selectedInvoices[0].nominal - selectedInvoices[0].discount_amount - selectedInvoices[0].paid_amount).toLocaleString('id-ID')})
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-950/80 rounded-2xl border border-emerald-500/30 space-y-1">
                      <p className="text-[11px] text-emerald-300 font-bold uppercase tracking-wider">Total Yang Harus Dibayar</p>
                      <p className="text-2xl font-black text-emerald-400 tracking-tight">
                        Rp {parseFloat(payAmount || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                  )}

                  {/* Payment Form */}
                  <form onSubmit={handleProcessPayment} className="space-y-4">
                    {/* Method Selector */}
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1.5">Metode Pembayaran</label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {['Cash', 'Transfer Bank', 'QRIS', 'Virtual Account'].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setPayMethod(m)}
                            className={`py-2 px-3 rounded-xl font-bold border transition-all text-center ${
                              payMethod === m
                                ? 'bg-emerald-500 text-white border-emerald-400 shadow-md'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Cash Received Input */}
                    {payMethod === 'Cash' && (
                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">Uang Diterima (Rp)</label>
                        <input
                          type="number"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                          placeholder="Masukkan Uang Diterima"
                          className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl font-bold text-white focus:ring-2 focus:ring-emerald-500/30 text-sm"
                        />
                        {parseFloat(cashReceived) > parseFloat(payAmount) && (
                          <p className="text-xs font-bold text-emerald-300 mt-1">
                            Kembalian: Rp {(parseFloat(cashReceived) - parseFloat(payAmount)).toLocaleString('id-ID')}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Catatan Transaksi (Opsional)</label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Contoh: Pembayaran SPP Lunas"
                        className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                      />
                    </div>

                    {/* CTA Submit Button */}
                    <button
                      type="submit"
                      disabled={loading || selectedInvoices.length === 0}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-white font-black rounded-2xl shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <Zap className="w-5 h-5" />
                      <span>{loading ? 'Memproses Bayar...' : 'BAYAR & CETAK STRUK'}</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= VIEW 2: RIWAYAT TRANSAKSI KASIR ================= */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* History KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] text-slate-400 font-bold uppercase">Total Penerimaan</span>
              <p className="text-lg font-black text-slate-800">Rp {historySummary.totalAmount.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] text-slate-400 font-bold uppercase">Tunai (Cash)</span>
              <p className="text-lg font-black text-emerald-700">Rp {historySummary.totalCash.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] text-slate-400 font-bold uppercase">Non-Tunai (Transfer/QRIS)</span>
              <p className="text-lg font-black text-teal-700">Rp {historySummary.totalNonCash.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] text-slate-400 font-bold uppercase">Jumlah Transaksi</span>
              <p className="text-lg font-black text-slate-800">{historySummary.totalCount} Transaksi</p>
            </div>
          </div>

          {/* History Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
              {[
                { code: 'all', label: 'Semua Transaksi' },
                { code: 'harian', label: 'Hari Ini' },
                { code: 'pekanan', label: 'Pekan Ini' },
                { code: 'bulanan', label: 'Bulan Ini' }
              ].map(p => (
                <button
                  key={p.code}
                  onClick={() => setHistoryPeriod(p.code)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    historyPeriod === p.code ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <select
                value={historyMethod}
                onChange={(e) => setHistoryMethod(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="">Semua Metode</option>
                <option value="Cash">Cash / Tunai</option>
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="QRIS">QRIS</option>
              </select>

              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Cari No. Kuitansi / Siswa..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          {/* History Datatable */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {historyLoading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Memuat riwayat transaksi...</div>
            ) : paymentHistory.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">Tidak ada riwayat transaksi pada periode ini</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">No. Kuitansi</th>
                      <th className="py-3 px-4">Tanggal</th>
                      <th className="py-3 px-4">Nama Siswa</th>
                      <th className="py-3 px-4">Pos Tagihan</th>
                      <th className="py-3 px-4">Jumlah Pembayaran</th>
                      <th className="py-3 px-4">Metode</th>
                      <th className="py-3 px-4 text-center">Cetak Kuitansi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {paymentHistory.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{p.receipt_number}</td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(p.payment_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">{p.student_name}</td>
                        <td className="py-3.5 px-4">{p.post_name}</td>
                        <td className="py-3.5 px-4 font-extrabold text-emerald-700">Rp {p.amount.toLocaleString('id-ID')}</td>
                        <td className="py-3.5 px-4">
                          <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded text-[10px]">
                            {p.payment_method}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => navigate(`/kwitansi/${p.receipt_number}`)}
                            className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg border border-emerald-200 text-xs inline-flex items-center gap-1"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Cetak</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL SUKSES PEMBAYARAN & CETAK KUITANSI ================= */}
      {successModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">Pembayaran Berhasil!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Kuitansi <span className="font-bold text-slate-800">{successModal.receipt_number}</span> berhasil diterbitkan.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Siswa:</span>
                <span className="font-bold text-slate-800">{successModal.student_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Dibayar:</span>
                <span className="font-extrabold text-emerald-700 text-sm">
                  Rp {successModal.payment?.amount?.toLocaleString('id-ID')}
                </span>
              </div>
              {successModal.change > 0 && (
                <div className="flex justify-between border-t border-slate-200 pt-1.5">
                  <span className="text-slate-500">Kembalian:</span>
                  <span className="font-extrabold text-amber-700">
                    Rp {successModal.change.toLocaleString('id-ID')}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => navigate(`/kwitansi/${successModal.receipt_number}`)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Kuitansi (Thermal 80mm / A4)</span>
              </button>

              <button
                onClick={() => setSuccessModal(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Tutup &amp; Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
