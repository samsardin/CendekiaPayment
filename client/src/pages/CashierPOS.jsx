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
  FileText,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';

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

export default function CashierPOS({ initialTab }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const isHistoryPath = location.pathname.includes('history');
  const tabParam = searchParams.get('tab');

  // Active View Tab: 'pos' (Form Transaksi Kasir) or 'history' (Riwayat Pembayaran Kasir)
  const [activeTab, setActiveTab] = useState(
    initialTab || (isHistoryPath || tabParam === 'history' ? 'history' : 'pos')
  );

  useEffect(() => {
    if (initialTab === 'history' || isHistoryPath || tabParam === 'history') {
      setActiveTab('history');
    } else if (tabParam === 'pos') {
      setActiveTab('pos');
    }
  }, [initialTab, isHistoryPath, tabParam]);

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
  const [invoicesLoading, setInvoicesLoading] = useState(false);

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
  const [printRekapModal, setPrintRekapModal] = useState(false);

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
        const nominal = Number(inv.nominal || 500000);
        const discount = Number(inv.discount_amount || 0);
        const paid = Number(inv.paid_amount || 0);
        const rem = Math.max(0, nominal - discount - paid);
        return acc + (rem > 0 ? rem : nominal);
      }, 0);
      const safeAmount = totalRemaining > 0 ? totalRemaining : 500000;
      setPayAmount(safeAmount.toString());
      setCashReceived(safeAmount.toString());
    } else {
      setPayAmount('');
      setCashReceived('');
    }
  }, [selectedInvoices]);

  // Export History to PDF & Cetak Rekapitulasi
  const handleExportPDF = () => {
    if (!paymentHistory || paymentHistory.length === 0) {
      alert('Tidak ada data riwayat transaksi untuk diexport pada filter saat ini.');
      return;
    }

    const printWin = window.open('', '_blank', 'width=950,height=800');
    if (!printWin) {
      alert('Mohon izinkan pop-up pada browser untuk mencetak atau menyimpan PDF.');
      return;
    }

    const periodLabel = historyPeriod === 'all' ? 'Semua Periode' : historyPeriod === 'harian' ? 'Hari Ini' : historyPeriod === 'pekanan' ? 'Pekan Ini (7 Hari)' : 'Bulan Ini';
    const methodLabel = historyMethod || 'Semua Metode';
    const dateStamp = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const rowsHtml = paymentHistory.map((p, idx) => {
      const recNum = p.receipt_number || p.transaction_number || '-';
      const d = p.payment_date ? new Date(p.payment_date) : new Date();
      const dateStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const amount = Number(p.amount || 0).toLocaleString('id-ID');

      return `
        <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="text-align: center; padding: 6px 8px; border: 1px solid #cbd5e1;">${idx + 1}</td>
          <td style="font-weight: bold; padding: 6px 8px; border: 1px solid #cbd5e1; font-family: monospace;">${recNum}</td>
          <td style="padding: 6px 8px; border: 1px solid #cbd5e1; color: #475569; font-size: 10.5px;">${dateStr}</td>
          <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">${p.nis || '-'}</td>
          <td style="font-weight: bold; padding: 6px 8px; border: 1px solid #cbd5e1;">${p.student_name || 'Siswa'}</td>
          <td style="padding: 6px 8px; border: 1px solid #cbd5e1; color: #334155;">${p.class_name || p.unit_name || '-'}</td>
          <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">${p.post_name || 'Biaya Pendidikan'}</td>
          <td style="text-align: right; font-weight: 800; padding: 6px 8px; border: 1px solid #cbd5e1; color: #047857;">Rp ${amount}</td>
          <td style="text-align: center; padding: 6px 8px; border: 1px solid #cbd5e1;">
            <span style="background: #e2e8f0; color: #1e293b; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px;">${p.payment_method || 'Cash'}</span>
          </td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rekap_Transaksi_Kasir_Cendekia_${historyPeriod}_${new Date().toISOString().slice(0, 10)}</title>
        <meta charset="utf-8" />
        <style>
          @page { size: A4 portrait; margin: 12mm 10mm; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
            color: #0f172a; 
            margin: 0; 
            padding: 24px; 
            font-size: 11.5px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .btn-container { text-align: right; margin-bottom: 16px; }
          .btn-print { 
            background: #059669; 
            color: white; 
            border: none; 
            padding: 10px 22px; 
            font-size: 13px; 
            font-weight: bold; 
            border-radius: 10px; 
            cursor: pointer; 
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); 
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }
          .header { text-align: center; border-bottom: 2.5px solid #0f172a; padding-bottom: 10px; margin-bottom: 14px; }
          .header h1 { margin: 0; font-size: 17px; font-weight: 900; letter-spacing: 0.5px; color: #0f172a; }
          .header p { margin: 3px 0 0 0; font-size: 11px; color: #475569; }
          .badge { display: inline-block; margin-top: 8px; background: #0f172a; color: white; padding: 4px 14px; border-radius: 9999px; font-weight: bold; font-size: 10.5px; letter-spacing: 0.5px; }
          .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; border-radius: 8px; margin-bottom: 14px; font-size: 11px; }
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; text-align: center; }
          .summary-card { padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1; background: #f8fafc; }
          .summary-card.green { background: #ecfdf5; border-color: #6ee7b7; color: #065f46; }
          .table-container { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
          .table-container th { background: #f1f5f9; padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; text-transform: uppercase; font-size: 10px; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; margin-top: 24px; font-size: 11px; page-break-inside: avoid; }
          .sig-line { margin-top: 55px; border-top: 1px solid #475569; display: inline-block; width: 220px; padding-top: 4px; font-weight: bold; }
          @media print {
            .btn-container { display: none !important; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="btn-container">
          <button class="btn-print" onclick="window.print()">🖨️ Cetak / Simpan PDF Sekarang</button>
        </div>

        <div class="header">
          <h1>SEKOLAH ISLAM TERPADU CENDEKIA LAMONGAN</h1>
          <p>KBTK-IT &amp; SDIT Cendekia Lamongan • Jl. Veteran No. 45 Lamongan, Jawa Timur</p>
          <div class="badge">LAPORAN REKAPITULASI PENERIMAAN KASIR / LOKET PEMBAYARAN</div>
        </div>

        <div class="meta-grid">
          <div><strong style="color: #64748b; text-transform: uppercase; font-size: 9px; display: block;">Periode:</strong>${periodLabel}</div>
          <div><strong style="color: #64748b; text-transform: uppercase; font-size: 9px; display: block;">Metode:</strong>${methodLabel}</div>
          <div><strong style="color: #64748b; text-transform: uppercase; font-size: 9px; display: block;">Waktu Cetak:</strong>${dateStamp}</div>
          <div><strong style="color: #64748b; text-transform: uppercase; font-size: 9px; display: block;">Total Transaksi:</strong>${historySummary.totalCount} Transaksi</div>
        </div>

        <div class="summary-grid">
          <div class="summary-card green">
            <div style="font-size: 9.5px; text-transform: uppercase; font-weight: bold;">Total Penerimaan</div>
            <div style="font-size: 16px; font-weight: 900;">Rp ${historySummary.totalAmount.toLocaleString('id-ID')}</div>
          </div>
          <div class="summary-card">
            <div style="font-size: 9.5px; text-transform: uppercase; font-weight: bold; color: #475569;">Penerimaan Tunai (Cash)</div>
            <div style="font-size: 15px; font-weight: 900; color: #047857;">Rp ${historySummary.totalCash.toLocaleString('id-ID')}</div>
          </div>
          <div class="summary-card">
            <div style="font-size: 9.5px; text-transform: uppercase; font-weight: bold; color: #475569;">Penerimaan Non-Tunai</div>
            <div style="font-size: 15px; font-weight: 900; color: #0f766e;">Rp ${historySummary.totalNonCash.toLocaleString('id-ID')}</div>
          </div>
        </div>

        <table class="table-container">
          <thead>
            <tr>
              <th style="width: 25px; text-align: center;">No</th>
              <th>No. Kuitansi</th>
              <th>Tanggal &amp; Waktu</th>
              <th>NIS</th>
              <th>Nama Siswa</th>
              <th>Kelas / Unit</th>
              <th>Pos Tagihan</th>
              <th style="text-align: right;">Jumlah (Rp)</th>
              <th style="text-align: center;">Metode</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          <tfoot>
            <tr style="background: #f1f5f9; font-weight: 900;">
              <td colspan="7" style="text-align: right; padding: 8px; border: 1px solid #cbd5e1; text-transform: uppercase;">Total Penerimaan:</td>
              <td style="text-align: right; padding: 8px; border: 1px solid #cbd5e1; color: #065f46; font-size: 12px;">Rp ${historySummary.totalAmount.toLocaleString('id-ID')}</td>
              <td style="border: 1px solid #cbd5e1;"></td>
            </tr>
          </tfoot>
        </table>

        <div class="signatures">
          <div>
            <p style="margin: 0; color: #64748b;">Mengetahui,</p>
            <p style="margin: 2px 0 0 0; font-weight: bold;">Kepala Sekolah / Bendahara Yayasan</p>
            <div class="sig-line">( .................................................. )</div>
          </div>
          <div>
            <p style="margin: 0; color: #64748b;">Lamongan, ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            <p style="margin: 2px 0 0 0; font-weight: bold;">Petugas Kasir Loket</p>
            <div class="sig-line">( Petugas Kasir Cendekia )</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 600);
          };
        </script>
      </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(htmlContent);
    printWin.document.close();
  };

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
      if (res.data && res.data.success) {
        setStudents(res.data.data || []);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error('Fetch students error:', err);
      setStudents([]);
    }
  };

  const fetchInvoices = async (studentId) => {
    setInvoicesLoading(true);
    try {
      const res = await api.get(`/invoices?student_id=${studentId}`);
      if (res.data && res.data.success) {
        setInvoices(res.data.data || []);
      } else {
        setInvoices([]);
      }
    } catch (err) {
      console.error('Fetch invoices error:', err);
      setInvoices([]);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const fetchPaymentHistory = async () => {
    setHistoryLoading(true);
    try {
      let url = `/payments?period=${historyPeriod}`;
      if (historyMethod) url += `&payment_method=${historyMethod}`;
      if (historySearch) url += `&search=${historySearch}`;

      const res = await api.get(url);
      if (res.data && res.data.success) {
        const historyData = res.data.data || [];
        setPaymentHistory(historyData);

        // Compute summary metrics with safe Number parsing
        let totalAmount = 0;
        let totalCash = 0;
        let totalNonCash = 0;
        historyData.forEach(p => {
          const amt = Number(p.amount) || 0;
          totalAmount += amt;
          if (p.payment_method === 'Cash' || p.payment_method === 'Tunai') {
            totalCash += amt;
          } else {
            totalNonCash += amt;
          }
        });
        setHistorySummary({
          totalAmount,
          totalCash,
          totalNonCash,
          totalCount: historyData.length
        });
      }
    } catch (err) {
      console.error('Fetch payment history error:', err);
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
    setInvoices([]);
    fetchClasses(unit.id);
    setStep(2);
  };

  const handleSelectClass = (cls) => {
    setSelectedClass(cls);
    setSelectedStudent(null);
    setSelectedInvoices([]);
    setInvoices([]);
    fetchStudents(cls.id);
    setStep(3);
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setSelectedInvoices([]);
    setInvoices([]);
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

  // Toggle invoice checkbox selection with duplicate prevention
  const handleToggleInvoiceSelection = (inv) => {
    const isSelected = selectedInvoices.some(i => 
      i.id === inv.id || 
      (inv.month_period && inv.month_period !== 'Tahunan' && i.month_period === inv.month_period && i.post_name === inv.post_name)
    );
    if (isSelected) {
      setSelectedInvoices(prev => prev.filter(i => 
        i.id !== inv.id && 
        !(inv.month_period && inv.month_period !== 'Tahunan' && i.month_period === inv.month_period && i.post_name === inv.post_name)
      ));
    } else {
      setSelectedInvoices(prev => [...prev, inv]);
    }
  };

  const handleSelectAllSppInvoices = () => {
    const unpaidSppInvoices = invoices.filter(inv => {
      const isSpp = (inv.post_name?.includes('SPP') || inv.post_name?.includes('Biaya Pendidikan')) && inv.month_period?.includes('-');
      const remaining = Math.max(0, Number(inv.nominal || 0) - Number(inv.discount_amount || 0) - Number(inv.paid_amount || 0));
      return isSpp && remaining > 0 && inv.status !== 'Lunas';
    });

    if (selectedInvoices.length >= unpaidSppInvoices.length && unpaidSppInvoices.length > 0) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(unpaidSppInvoices);
    }
  };

  // Process POS Checkout Submission
  const handleProcessPayment = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (selectedInvoices.length === 0) {
      alert('Pilih minimal 1 tagihan atau bulan yang ingin dibayar!');
      return;
    }

    let amountNum = parseFloat(payAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      amountNum = selectedInvoices.reduce((acc, inv) => {
        const nominal = Number(inv.nominal || 500000);
        const discount = Number(inv.discount_amount || 0);
        const paid = Number(inv.paid_amount || 0);
        const rem = Math.max(0, nominal - discount - paid);
        return acc + (rem > 0 ? rem : nominal);
      }, 0) || 500000;
      setPayAmount(amountNum.toString());
    }

    let cashNum = parseFloat(cashReceived);
    if (isNaN(cashNum) || cashNum < amountNum) {
      cashNum = amountNum;
      setCashReceived(cashNum.toString());
    }
    const changeAmount = payMethod === 'Cash' ? Math.max(0, cashNum - amountNum) : 0;
    const defaultReceiptNum = `KW/2026/08/${(Date.now() % 100000).toString().padStart(5, '0')}`;

    setLoading(true);
    try {
      const invoiceIds = selectedInvoices.map(i => i.id);

      const res = await api.post('/payments', {
        invoice_ids: invoiceIds,
        amount: amountNum,
        payment_method: payMethod,
        notes: notes || `Pembayaran ${selectedInvoices.length} Tagihan oleh Kasir POS`
      });

      if (!res.data || !res.data.success) {
        throw new Error(res.data?.error || 'Pembayaran gagal diproses ke database');
      }

      const actualReceiptNum = res.data?.receipt_number || res.data?.data?.receipt_number || res.data?.transaction_number || defaultReceiptNum;

      // Immediately refresh real payment history from DB
      fetchPaymentHistory();

      setSuccessModal({
        payment: { amount: amountNum },
        receipt_number: actualReceiptNum,
        change: changeAmount,
        itemsCount: selectedInvoices.length,
        student_name: selectedStudent?.name || 'Muhammad Ali Rayyan',
        class_name: selectedClass?.name || 'Kelas 1 Abu Bakar',
        unit_name: selectedUnit?.name || 'SDIT Cendekia'
      });

      if (selectedStudent?.id) fetchInvoices(selectedStudent.id);
      setSelectedInvoices([]);
      setPayAmount('');
      setCashReceived('');
      setNotes('');
    } catch (err) {
      console.error('POS Payment Error:', err);
      const errMsg = err.response?.data?.error || err.message || 'Pembayaran gagal diproses ke database';
      alert('⚠️ Gagal Memproses Pembayaran: ' + errMsg);
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

                  const activeStudentList = students || [];
                  const q = (studentSearch || '').trim().toLowerCase();
                  const displayList = activeStudentList.filter(s => {
                    if (!q) return true;
                    const name = (s.name || '').toLowerCase();
                    const nis = (s.nis || '').toLowerCase();
                    return name.includes(q) || nis.includes(q);
                  });

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

                  {invoicesLoading ? (
                    <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-bold">Memuat Tagihan Siswa dari Database...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {(() => {
                        const sppList = (invoices || []).filter(inv => (inv.post_name?.includes('SPP') || inv.post_name?.includes('Biaya Pendidikan')) && inv.month_period?.includes('-'));

                        if (sppList.length === 0) {
                          return (
                            <div className="col-span-full py-6 text-center text-slate-400 text-xs">
                              Tidak ada tagihan SPP untuk siswa ini.
                            </div>
                          );
                        }

                        return sppList.map((inv) => {
                          const isSelected = selectedInvoices.some(i => i.id === inv.id || (inv.month_period && i.month_period === inv.month_period && i.post_name === inv.post_name));
                          const statusStr = String(inv.status || 'Belum Dibayar');
                          const isPaid = statusStr === 'Lunas';
                          const nominal = Number(inv.nominal || 500000);
                          const discount = Number(inv.discount_amount || 0);
                          const paid = Number(inv.paid_amount || 0);
                          const remaining = Math.max(0, nominal - discount - paid);

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
                                {discount > 0 && (
                                  <p className={`text-[9px] ${isSelected ? 'text-emerald-100' : 'text-emerald-600'}`}>
                                    Disc: -Rp {discount.toLocaleString('id-ID')}
                                  </p>
                                )}
                              </div>

                              <div className="text-[9px] font-bold">
                                <span className={isPaid ? 'text-emerald-700' : isSelected ? 'text-emerald-100' : 'text-rose-600'}>
                                  {isPaid ? '✓ LUNAS' : `STATUS: ${statusStr.toUpperCase()}`}
                                </span>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
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

                  {invoicesLoading ? (
                    <div className="py-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Memuat Pos Non-SPP...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(() => {
                        const nonSppList = (invoices || []).filter(inv => !((inv.post_name?.includes('SPP') || inv.post_name?.includes('Biaya Pendidikan')) && inv.month_period?.includes('-')));

                        if (nonSppList.length === 0) {
                          return (
                            <div className="col-span-full py-6 text-center text-slate-400 text-xs">
                              Tidak ada tagihan Non-SPP untuk siswa ini.
                            </div>
                          );
                        }

                        return nonSppList.map((inv) => {
                          const isSelected = selectedInvoices.some(i => i.id === inv.id || (inv.month_period && inv.month_period !== 'Tahunan' && i.month_period === inv.month_period && i.post_name === inv.post_name));
                          const statusStr = String(inv.status || 'Belum Dibayar');
                          const isPaid = statusStr === 'Lunas';
                          const nominal = Number(inv.nominal || 0);
                          const discount = Number(inv.discount_amount || 0);
                          const paid = Number(inv.paid_amount || 0);
                          const remaining = Math.max(0, nominal - discount - paid);

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
                                  <Check className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Square className="w-5 h-5 text-slate-300" />
                                )}
                              </div>

                              <div className="flex items-center justify-between text-xs pt-1">
                                <span className="text-slate-500">Nominal Tagihan:</span>
                                <span className="font-bold text-slate-800">Rp {nominal.toLocaleString('id-ID')}</span>
                              </div>

                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">Sudah Dibayar:</span>
                                <span className="font-bold text-emerald-700">Rp {paid.toLocaleString('id-ID')}</span>
                              </div>

                              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                                <span className="text-slate-500 font-bold">Sisa Tagihan:</span>
                                <span className="font-black text-amber-700 text-sm">Rp {remaining.toLocaleString('id-ID')}</span>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
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

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
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

              <div className="relative w-full md:w-56">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Cari Kuitansi / Siswa..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {/* ACTION EXPORT PDF & CETAK REKAP BUTTONS */}
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                title="Export dan Download Laporan Transaksi Kasir ke format PDF"
              >
                <FileText className="w-4 h-4" />
                <span>Export Laporan PDF</span>
              </button>

              <button
                onClick={() => setPrintRekapModal(true)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                title="Pratinjau Dokumen Rekapitulasi Kasir"
              >
                <Printer className="w-4 h-4" />
                <span>Pratinjau / Cetak</span>
              </button>
            </div>
          </div>

          {/* History Datatable */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {historyLoading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Memuat riwayat transaksi...</div>
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
                    {paymentHistory.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-slate-400 font-medium">
                          Belum ada data riwayat transaksi pembayaran pada periode/filter ini.
                        </td>
                      </tr>
                    ) : (
                      paymentHistory.map((p) => {
                        const recNum = p.receipt_number || p.transaction_number || '-';
                        const pAmount = Number(p.amount || 0);
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-900">{recNum}</td>
                            <td className="py-3.5 px-4 text-slate-500">
                              {p.payment_date ? new Date(p.payment_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-800">{p.student_name || 'Siswa'}</td>
                            <td className="py-3.5 px-4">{p.post_name || 'Biaya Pendidikan'}</td>
                            <td className="py-3.5 px-4 font-extrabold text-emerald-700">Rp {pAmount.toLocaleString('id-ID')}</td>
                            <td className="py-3.5 px-4">
                              <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded text-[10px]">
                                {p.payment_method || 'Cash'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => navigate(`/kwitansi/${recNum}`)}
                                className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg border border-emerald-200 text-xs inline-flex items-center gap-1"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Cetak</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL CETAK REKAPITULASI TRANSAKSI KASIR ================= */}
      {printRekapModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 space-y-6 shadow-2xl border border-slate-200 my-8">
            {/* Header Dialog Controls (Hidden on Print) */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-emerald-600" />
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Pratinjau Rekapitulasi Transaksi Kasir</h3>
                  <p className="text-xs text-slate-500">Siap dicetak atau disimpan langsung ke format dokumen PDF</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPDF}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Simpan PDF Sekarang</span>
                </button>
                <button
                  onClick={() => setPrintRekapModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PRINTABLE CONTENT AREA */}
            <div className="printable-report space-y-5 text-slate-800">
              {/* School Official Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4">
                <h2 className="text-lg md:text-xl font-black uppercase tracking-wider text-slate-900">
                  SEKOLAH ISLAM TERPADU CENDEKIA LAMONGAN
                </h2>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">
                  KBTK-IT &amp; SDIT Cendekia Lamongan • Jl. Veteran No. 45 Lamongan, Jawa Timur
                </p>
                <div className="mt-2 inline-block bg-slate-900 text-white px-3.5 py-1 rounded-full border border-slate-800 shadow-xs">
                  <span className="text-xs font-black uppercase tracking-wide">
                    LAPORAN REKAPITULASI PENERIMAAN KASIR / LOKET PEMBAYARAN
                  </span>
                </div>
              </div>

              {/* Meta Info Filter */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Filter Periode</span>
                  <span className="font-bold text-slate-800 capitalize">
                    {historyPeriod === 'all' ? 'Semua Periode' : historyPeriod === 'harian' ? 'Hari Ini' : historyPeriod === 'pekanan' ? 'Pekan Ini' : 'Bulan Ini'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Metode Bayar</span>
                  <span className="font-bold text-slate-800">{historyMethod || 'Semua Metode'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Waktu Cetak</span>
                  <span className="font-bold text-slate-800">
                    {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Total Transaksi</span>
                  <span className="font-bold text-emerald-700">{historySummary.totalCount} Transaksi</span>
                </div>
              </div>

              {/* Summary Totals Table */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase block">Total Penerimaan</span>
                  <span className="text-sm md:text-base font-black text-emerald-900">
                    Rp {historySummary.totalAmount.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="p-3 bg-teal-50 rounded-xl border border-teal-200">
                  <span className="text-[10px] text-teal-800 font-bold uppercase block">Penerimaan Tunai</span>
                  <span className="text-sm md:text-base font-black text-teal-900">
                    Rp {historySummary.totalCash.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <span className="text-[10px] text-blue-800 font-bold uppercase block">Penerimaan Non-Tunai</span>
                  <span className="text-sm md:text-base font-black text-blue-900">
                    Rp {historySummary.totalNonCash.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Detail Items Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase">
                      <th className="py-2 px-3 text-center w-10">No</th>
                      <th className="py-2 px-3">No. Kuitansi</th>
                      <th className="py-2 px-3">Tanggal &amp; Waktu</th>
                      <th className="py-2 px-3">NIS</th>
                      <th className="py-2 px-3">Nama Siswa</th>
                      <th className="py-2 px-3">Kelas / Unit</th>
                      <th className="py-2 px-3">Pos Tagihan</th>
                      <th className="py-2 px-3 text-right">Jumlah (Rp)</th>
                      <th className="py-2 px-3 text-center">Metode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {paymentHistory.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="py-6 text-center text-slate-400">
                          Tidak ada data transaksi.
                        </td>
                      </tr>
                    ) : (
                      paymentHistory.map((p, idx) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-center">{idx + 1}</td>
                          <td className="py-2 px-3 font-bold">{p.receipt_number || p.transaction_number || '-'}</td>
                          <td className="py-2 px-3 text-slate-500">
                            {p.payment_date ? new Date(p.payment_date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                          <td className="py-2 px-3 text-slate-500">{p.nis || '-'}</td>
                          <td className="py-2 px-3 font-bold">{p.student_name || 'Siswa'}</td>
                          <td className="py-2 px-3 text-slate-600">{p.class_name || p.unit_name || '-'}</td>
                          <td className="py-2 px-3">{p.post_name || 'Biaya Pendidikan'}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            Rp {Number(p.amount || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold text-[10px]">
                              {p.payment_method || 'Cash'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-black border-t-2 border-slate-300">
                      <td colSpan="7" className="py-2.5 px-3 text-right uppercase">Total Penerimaan:</td>
                      <td className="py-2.5 px-3 text-right text-emerald-800 text-xs">
                        Rp {historySummary.totalAmount.toLocaleString('id-ID')}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Official Signature Section */}
              <div className="grid grid-cols-2 gap-8 pt-6 text-center text-xs">
                <div>
                  <p className="text-slate-500">Mengetahui,</p>
                  <p className="font-bold text-slate-800">Kepala Sekolah / Bendahara Yayasan</p>
                  <div className="h-16"></div>
                  <p className="font-bold border-t border-slate-400 inline-block px-8 pt-1">
                    ( .................................................. )
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Lamongan, {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  <p className="font-bold text-slate-800">Petugas Kasir Loket</p>
                  <div className="h-16"></div>
                  <p className="font-bold border-t border-slate-400 inline-block px-8 pt-1">
                    ( Ustadz Hendra / Kasir Loket )
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Modal Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
              <button
                onClick={() => setPrintRekapModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Tutup Pratinjau
              </button>
              <button
                onClick={handleExportPDF}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>🖨️ Cetak / Simpan PDF Sekarang</span>
              </button>
            </div>
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
