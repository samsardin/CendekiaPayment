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
  Coins,
  Printer,
  FileText,
  Download,
  CheckSquare,
  Square
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

  // Export Student Invoices PDF Modal State
  const [showExportPdfModal, setShowExportPdfModal] = useState(false);
  const [exportStep, setExportStep] = useState(1); // 1: Choose Student, 2: Select Posts & Print
  const [exportUnit, setExportUnit] = useState(null);
  const [exportClass, setExportClass] = useState(null);
  const [exportClassesList, setExportClassesList] = useState([]);
  const [exportStudent, setExportStudent] = useState(null);
  const [exportStudentsList, setExportStudentsList] = useState([]);
  const [exportStudentSearch, setExportStudentSearch] = useState('');
  const [exportInvoices, setExportInvoices] = useState([]);
  const [exportSelectedInvoiceIds, setExportSelectedInvoiceIds] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);

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

  // ================= EXPORT TAGIHAN SISWA PDF HANDLERS =================
  const handleOpenExportPdfModal = async () => {
    setShowExportPdfModal(true);
    setExportStep(1);
    setExportUnit(null);
    setExportClass(null);
    setExportStudent(null);
    setExportStudentSearch('');
    setExportInvoices([]);
    setExportSelectedInvoiceIds([]);
    try {
      const res = await api.get('/master/students');
      if (res.data && res.data.success) {
        setExportStudentsList(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportSelectUnit = async (unit) => {
    setExportUnit(unit);
    setExportClass(null);
    setExportStudent(null);
    try {
      const res = await api.get(`/master/classes?unit_id=${unit.id}`);
      if (res.data.success) setExportClassesList(res.data.data);
      const sRes = await api.get(`/master/students?unit_id=${unit.id}`);
      if (sRes.data.success) setExportStudentsList(sRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportSelectClass = async (cls) => {
    setExportClass(cls);
    setExportStudent(null);
    try {
      const res = await api.get(`/master/students?class_id=${cls.id}`);
      if (res.data.success) setExportStudentsList(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportSelectStudent = async (student) => {
    setExportStudent(student);
    setExportLoading(true);
    try {
      const res = await api.get(`/invoices?student_id=${student.id}`);
      if (res.data && res.data.success) {
        const invData = res.data.data || [];
        setExportInvoices(invData);
        setExportSelectedInvoiceIds(invData.map(i => i.id));
        setExportStep(2);
      }
    } catch (err) {
      console.error('Fetch student invoices error:', err);
      alert('Gagal memuat rincian tagihan siswa');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDirectExportStudentPdf = async (inv) => {
    const studentObj = {
      id: inv.student_id,
      name: inv.student_name,
      nis: inv.nis,
      class_name: inv.class_name,
      unit_name: inv.unit_name
    };
    setShowExportPdfModal(true);
    setExportStudent(studentObj);
    setExportLoading(true);
    try {
      const res = await api.get(`/invoices?student_id=${inv.student_id}`);
      if (res.data && res.data.success) {
        const invData = res.data.data || [];
        setExportInvoices(invData);
        setExportSelectedInvoiceIds(invData.map(i => i.id));
        setExportStep(2);
      }
    } catch (err) {
      console.error('Fetch student invoices error:', err);
    } finally {
      setExportLoading(false);
    }
  };

  const toggleSelectAllExportInvoices = () => {
    if (exportSelectedInvoiceIds.length === exportInvoices.length) {
      setExportSelectedInvoiceIds([]);
    } else {
      setExportSelectedInvoiceIds(exportInvoices.map(i => i.id));
    }
  };

  const toggleSelectExportInvoice = (invoiceId) => {
    if (exportSelectedInvoiceIds.includes(invoiceId)) {
      setExportSelectedInvoiceIds(exportSelectedInvoiceIds.filter(id => id !== invoiceId));
    } else {
      setExportSelectedInvoiceIds([...exportSelectedInvoiceIds, invoiceId]);
    }
  };

  const handlePrintOrDownloadPdf = () => {
    const student = exportStudent;
    const invList = exportInvoices.filter(i => exportSelectedInvoiceIds.includes(i.id));

    if (!student || invList.length === 0) {
      alert('Mohon pilih minimal 1 pos tagihan untuk dicetak.');
      return;
    }

    const printWin = window.open('', '_blank', 'width=950,height=850');
    if (!printWin) {
      alert('Mohon izinkan pop-up pada browser untuk mencetak atau menyimpan lembar tagihan PDF.');
      return;
    }

    const totalNominal = invList.reduce((sum, i) => sum + Number(i.nominal || 0), 0);
    const totalDiscount = invList.reduce((sum, i) => sum + Number(i.discount_amount || 0), 0);
    const totalPaid = invList.reduce((sum, i) => sum + Number(i.paid_amount || 0), 0);
    const totalRemaining = Math.max(0, totalNominal - totalDiscount - totalPaid);

    const sppInvoices = invList.filter(i => 
      (i.post_name && i.post_name.includes('SPP')) || 
      (i.post_code && i.post_code.includes('SPP')) || 
      (i.month_period && (i.month_period.includes('2026-') || i.month_period.includes('2027-')))
    );
    const nonSppInvoices = invList.filter(i => !sppInvoices.includes(i));

    const dateStamp = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

    const sppSem1 = sppInvoices.slice(0, 6);
    const sppSem2 = sppInvoices.slice(6, 12);

    const renderSppRow = (inv, idx, offset = 0) => {
      if (!inv) return '<tr><td colspan="6" style="padding: 3px; border: 1px solid #cbd5e1; color: #94a3b8; text-align: center;">-</td></tr>';
      const remaining = Math.max(0, Number(inv.nominal || 0) - Number(inv.discount_amount || 0) - Number(inv.paid_amount || 0));
      const statusBg = inv.status === 'Lunas' ? '#dcfce7; color: #166534;' : remaining > 0 ? '#fee2e2; color: #991b1b;' : '#fef3c7; color: #92400e;';
      const monthShort = inv.month_period ? inv.month_period : (inv.post_name || '-');
      return `
        <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="text-align: center; padding: 2.5px 3px; border: 1px solid #cbd5e1; font-weight: bold; width: 18px;">${idx + 1 + offset}</td>
          <td style="padding: 2.5px 5px; border: 1px solid #cbd5e1; font-weight: 700;">${monthShort}</td>
          <td style="text-align: right; padding: 2.5px 5px; border: 1px solid #cbd5e1; font-weight: 600;">Rp ${Number(inv.nominal || 0).toLocaleString('id-ID')}</td>
          <td style="text-align: right; padding: 2.5px 5px; border: 1px solid #cbd5e1; color: #047857; font-weight: 600;">Rp ${Number(inv.paid_amount || 0).toLocaleString('id-ID')}</td>
          <td style="text-align: right; padding: 2.5px 5px; border: 1px solid #cbd5e1; font-weight: 800; color: ${remaining > 0 ? '#b91c1c' : '#047857'};">Rp ${remaining.toLocaleString('id-ID')}</td>
          <td style="text-align: center; padding: 2.5px 3px; border: 1px solid #cbd5e1; width: 55px;">
            <span style="background: ${statusBg} padding: 1.5px 5px; border-radius: 3px; font-weight: bold; font-size: 8px; display: inline-block;">${inv.status}</span>
          </td>
        </tr>
      `;
    };

    const sppSem1Html = sppSem1.map((inv, idx) => renderSppRow(inv, idx, 0)).join('');
    const sppSem2Html = sppSem2.map((inv, idx) => renderSppRow(inv, idx, 6)).join('');

    const nonSppRowsHtml = nonSppInvoices.map((inv, idx) => {
      const remaining = Math.max(0, Number(inv.nominal || 0) - Number(inv.discount_amount || 0) - Number(inv.paid_amount || 0));
      const statusBg = inv.status === 'Lunas' ? '#dcfce7; color: #166534;' : remaining > 0 ? '#fee2e2; color: #991b1b;' : '#fef3c7; color: #92400e;';
      return `
        <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="text-align: center; padding: 3px 4px; border: 1px solid #cbd5e1; font-weight: bold; width: 22px;">${idx + 1}</td>
          <td style="font-weight: 700; padding: 3px 6px; border: 1px solid #cbd5e1;">${inv.post_name}</td>
          <td style="padding: 3px 6px; border: 1px solid #cbd5e1; color: #64748b; font-size: 8.5px;">${inv.post_type || 'Pos Khusus'}</td>
          <td style="text-align: right; padding: 3px 6px; border: 1px solid #cbd5e1; font-weight: bold;">Rp ${Number(inv.nominal || 0).toLocaleString('id-ID')}</td>
          <td style="text-align: right; padding: 3px 6px; border: 1px solid #cbd5e1; color: #059669;">${Number(inv.discount_amount || 0) > 0 ? '-Rp ' + Number(inv.discount_amount).toLocaleString('id-ID') : '-'}</td>
          <td style="text-align: right; padding: 3px 6px; border: 1px solid #cbd5e1; color: #047857; font-weight: 600;">Rp ${Number(inv.paid_amount || 0).toLocaleString('id-ID')}</td>
          <td style="text-align: right; padding: 3px 6px; border: 1px solid #cbd5e1; font-weight: 800; color: ${remaining > 0 ? '#b91c1c' : '#047857'};">Rp ${remaining.toLocaleString('id-ID')}</td>
          <td style="text-align: center; padding: 3px 4px; border: 1px solid #cbd5e1; width: 70px;">
            <span style="background: ${statusBg} padding: 1.5px 5px; border-radius: 3px; font-weight: bold; font-size: 8px; display: inline-block;">${inv.status}</span>
          </td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tagihan_${student.nis}_${(student.name || 'Siswa').replace(/\\s+/g, '_')}</title>
        <meta charset="utf-8" />
        <style>
          @page { size: A4 portrait; margin: 6mm 8mm; }
          * { box-sizing: border-box; }
          html, body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
            color: #0f172a; 
            margin: 0; 
            padding: 0; 
            font-size: 9.5px;
            line-height: 1.25;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .page-container {
            padding: 8px 12px;
            width: 100%;
            max-width: 100%;
          }
          .btn-container { text-align: right; margin-bottom: 8px; }
          .btn-print { 
            background: #059669; 
            color: white; 
            border: none; 
            padding: 8px 18px; 
            font-size: 12px; 
            font-weight: bold; 
            border-radius: 8px; 
            cursor: pointer; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 3px; margin-bottom: 6px; }
          .header h1 { margin: 0; font-size: 14.5px; font-weight: 900; letter-spacing: 0.3px; color: #0f172a; }
          .header p { margin: 1px 0 0 0; font-size: 9px; color: #475569; }
          .badge { display: inline-block; margin-top: 3px; background: #0f172a; color: white; padding: 2px 10px; border-radius: 9999px; font-weight: bold; font-size: 8.5px; letter-spacing: 0.3px; }
          
          .student-card { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 5px 8px; border-radius: 6px; margin-bottom: 6px; font-size: 9px; }
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 6px; text-align: center; }
          .summary-card { padding: 4px 6px; border-radius: 6px; border: 1px solid #cbd5e1; background: #f8fafc; }
          .summary-card.red { background: #fef2f2; border-color: #fca5a5; color: #991b1b; }
          .summary-card.green { background: #ecfdf5; border-color: #6ee7b7; color: #065f46; }

          .section-title { font-size: 9.5px; font-weight: 800; text-transform: uppercase; margin: 6px 0 3px 0; color: #1e293b; border-left: 3px solid #059669; padding-left: 5px; }
          
          .table-container { width: 100%; border-collapse: collapse; margin-bottom: 4px; font-size: 8.5px; }
          .table-container th { background: #f1f5f9; padding: 3px 4px; border: 1px solid #cbd5e1; font-weight: bold; text-transform: uppercase; font-size: 8px; }
          .table-container td { padding: 2.5px 4px; border: 1px solid #cbd5e1; }

          .spp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; width: 100%; }

          .footer-grid { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-top: 6px; width: 100%; }
          .notice-box { flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 6px 8px; border-radius: 6px; font-size: 8px; color: #166534; line-height: 1.25; }
          .signatures { flex: 0 0 280px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; text-align: center; font-size: 8.5px; }
          .sig-line { margin-top: 32px; border-top: 1px solid #475569; display: inline-block; width: 110px; padding-top: 2px; font-weight: bold; font-size: 8px; }
          
          @media print {
            .btn-container { display: none !important; }
            .page-container { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="page-container">
          <div class="btn-container">
            <button class="btn-print" onclick="window.print()">🖨️ Cetak / Simpan PDF Sekarang (1 Halaman)</button>
          </div>

          <div class="header">
            <h1>SEKOLAH ISLAM TERPADU CENDEKIA LAMONGAN</h1>
            <p>KBTK-IT &amp; SDIT Cendekia • Jl. Veteran No. 45 Lamongan, Jawa Timur • Telp: (0322) 321890</p>
            <div class="badge">SURAT PEMBERITAHUAN RINCIAN TAGIHAN BIAYA PENDIDIKAN (TA 2026/2027)</div>
          </div>

          <div class="student-card">
            <div><strong style="color: #64748b; text-transform: uppercase; font-size: 7.5px; display: block;">Nama Siswa:</strong><span style="font-weight: 800; font-size: 10px;">${student.name}</span></div>
            <div><strong style="color: #64748b; text-transform: uppercase; font-size: 7.5px; display: block;">NIS / NISN:</strong>${student.nis || '-'}</div>
            <div><strong style="color: #64748b; text-transform: uppercase; font-size: 7.5px; display: block;">Kelas / Jenjang:</strong>${student.class_name || '-'} (${student.unit_name || 'Cendekia'})</div>
            <div><strong style="color: #64748b; text-transform: uppercase; font-size: 7.5px; display: block;">Waktu Cetak:</strong>${dateStamp}</div>
          </div>

          <div class="summary-grid">
            <div class="summary-card">
              <div style="font-size: 7.5px; text-transform: uppercase; font-weight: bold; color: #475569;">Total Kewajiban Biaya</div>
              <div style="font-size: 12px; font-weight: 900; color: #0f172a;">Rp ${totalNominal.toLocaleString('id-ID')}</div>
            </div>
            <div class="summary-card green">
              <div style="font-size: 7.5px; text-transform: uppercase; font-weight: bold;">Total Terbayar (Lunas)</div>
              <div style="font-size: 12px; font-weight: 900;">Rp ${totalPaid.toLocaleString('id-ID')}</div>
            </div>
            <div class="summary-card red">
              <div style="font-size: 7.5px; text-transform: uppercase; font-weight: bold;">Sisa Kewajiban / Piutang</div>
              <div style="font-size: 12px; font-weight: 900;">Rp ${totalRemaining.toLocaleString('id-ID')}</div>
            </div>
          </div>

          <!-- SECTION 1: 12 SPP MONTHS (2 Semester Columns Side-by-Side) -->
          <div class="section-title">1. Rincian SPP Bulanan (12 Bulan / TA 2026/2027)</div>
          <div class="spp-grid">
            <div>
              <table class="table-container">
                <thead>
                  <tr>
                    <th style="width: 18px;">No</th>
                    <th>Semester 1 (Ganjil)</th>
                    <th>Tagihan</th>
                    <th>Bayar</th>
                    <th>Sisa</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${sppSem1Html || '<tr><td colspan="6" style="text-align:center; padding:5px;">-</td></tr>'}
                </tbody>
              </table>
            </div>

            <div>
              <table class="table-container">
                <thead>
                  <tr>
                    <th style="width: 18px;">No</th>
                    <th>Semester 2 (Genap)</th>
                    <th>Tagihan</th>
                    <th>Bayar</th>
                    <th>Sisa</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${sppSem2Html || '<tr><td colspan="6" style="text-align:center; padding:5px;">-</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>

          <!-- SECTION 2: NON-SPP POSTS (PLACED UNDERNEATH SPP, FULL WIDTH) -->
          <div class="section-title">2. Rincian Pos Tagihan Non-SPP (Uang Masuk, Gedung, Seragam, Kegiatan, dll.)</div>
          <table class="table-container">
            <thead>
              <tr>
                <th style="width: 22px;">No</th>
                <th>Pos Pembayaran</th>
                <th>Kategori</th>
                <th>Tagihan</th>
                <th>Potongan</th>
                <th>Sudah Bayar</th>
                <th>Sisa Tagihan</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${nonSppRowsHtml.length > 0 ? nonSppRowsHtml : '<tr><td colspan="8" style="text-align:center; padding:6px; color:#94a3b8;">Tidak ada tagihan non-SPP untuk siswa ini</td></tr>'}
            </tbody>
          </table>

          <!-- FOOTER: NOTICE & SIGNATURES (SIDE-BY-SIDE) -->
          <div class="footer-grid">
            <div class="notice-box">
              <strong>ℹ️ Rekening &amp; Informasi Pembayaran:</strong><br/>
              • <strong>BSI (Bank Syariah Indonesia) No. 7188-2991-01</strong> a.n. <em>SIT Cendekia Lamongan</em>.<br/>
              • Loket Kasir Sekolah Buka: Senin - Sabtu (07.30 - 15.00 WIB) • WA Keuangan: 0812-3456-7890.
            </div>

            <div class="signatures">
              <div>
                <p style="margin: 0; color: #475569;">Wali Murid,</p>
                <div class="sig-line">( Orang Tua / Wali )</div>
              </div>
              <div>
                <p style="margin: 0; color: #475569;">Lamongan, ${dateStamp}<br/>Bagian Kasir / Keuangan,</p>
                <div class="sig-line">( Petugas Loket Kasir )</div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(htmlContent);
    printWin.document.close();
  };

  const filteredExportStudents = exportStudentsList.filter(s => 
    (s.name || '').toLowerCase().includes(exportStudentSearch.toLowerCase()) ||
    (s.nis || '').toLowerCase().includes(exportStudentSearch.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Daftar Tagihan & Piutang Siswa</h1>
          <p className="text-xs text-slate-500">Kelola tagihan SPP bulanan, biaya masuk, seragam & atur tarif khusus/beasiswa per siswa</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* EXPORT TAGIHAN SISWA PDF BUTTON (AVAILABLE FOR KASIR, ADMIN & SUPERADMIN) */}
          <button
            onClick={() => handleOpenExportPdfModal()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            title="Export dan Cetak Lembar Rincian Tagihan Siswa (Semua Pos) ke format PDF"
          >
            <FileText className="w-4 h-4" />
            <span>📄 Export Tagihan Siswa (PDF)</span>
          </button>

          {isAdminOrSuperAdmin && (
            <>
              <button
                onClick={handleOpenCustomSppWizard}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>⚡ Set Tarif Khusus Semua Pos / SPP Per-Bulan</span>
              </button>

              <button
                onClick={() => setShowGenerateModal(true)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Generate Tagihan Baru</span>
              </button>
            </>
          )}
        </div>
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
                          {/* Cetak Lembar Tagihan Siswa PDF Action */}
                          <button
                            onClick={() => handleDirectExportStudentPdf(inv)}
                            title="Export & Cetak Lembar Rincian Tagihan Siswa Ini (PDF)"
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-300 transition-all text-xs font-bold inline-flex items-center gap-1 cursor-pointer active:scale-95"
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Cetak PDF</span>
                          </button>

                          {isAdminOrSuperAdmin && inv.status !== 'Lunas' && (
                            <button
                              onClick={() => handleOpenEditModal(inv)}
                              title="Custom Nominal / Potongan Khusus Siswa Ini"
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg border border-amber-300 transition-all text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5 text-amber-600" />
                              <span>Custom Nominal</span>
                            </button>
                          )}

                          {inv.status !== 'Lunas' && (
                            <button
                              onClick={() => handleSendWAReminder(inv.id)}
                              title="Kirim Pengingat WhatsApp"
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition-all text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
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

      {/* ================= MODAL: EXPORT & CETAK LEMBAR TAGIHAN SISWA (PDF) ================= */}
      {showExportPdfModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-4xl lg:max-w-5xl w-full p-6 lg:p-8 space-y-5 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Export &amp; Cetak Lembar Tagihan Siswa (PDF)</h3>
                  <p className="text-xs text-slate-500">Cetak surat tagihan resmi per siswa dari seluruh pos pembayaran (SPP &amp; Non-SPP)</p>
                </div>
              </div>
              <button
                onClick={() => setShowExportPdfModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper */}
            <div className="grid grid-cols-2 gap-3 text-center text-xs font-bold">
              <div className={`p-2.5 rounded-xl border transition-all ${exportStep === 1 ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
                1. Pilih Siswa Cendekia
              </div>
              <div className={`p-2.5 rounded-xl border transition-all ${exportStep === 2 ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                2. Pilih Pos Tagihan &amp; Cetak PDF
              </div>
            </div>

            {/* ================= STEP 1: PILIH SISWA ================= */}
            {exportStep === 1 && (
              <div className="space-y-4 py-1">
                {/* Filter Unit & Class Tabs */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Jenjang:</span>
                  <button
                    onClick={() => {
                      setExportUnit(null);
                      setExportClass(null);
                      api.get('/master/students').then(res => setExportStudentsList(res.data?.data || []));
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      !exportUnit ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Semua Jenjang
                  </button>
                  {units.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleExportSelectUnit(u)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        exportUnit?.id === u.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {u.name}
                    </button>
                  ))}
                </div>

                {exportClassesList.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Kelas:</span>
                    <button
                      onClick={() => {
                        setExportClass(null);
                        api.get(`/master/students?unit_id=${exportUnit?.id}`).then(res => setExportStudentsList(res.data?.data || []));
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        !exportClass ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Semua Kelas
                    </button>
                    {exportClassesList.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleExportSelectClass(c)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          exportClass?.id === c.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Instant Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={exportStudentSearch}
                    onChange={(e) => setExportStudentSearch(e.target.value)}
                    placeholder="Cari berdasarkan Nama Siswa atau NIS..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                {/* Student Cards List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[45vh] overflow-y-auto p-1">
                  {filteredExportStudents.length === 0 ? (
                    <div className="col-span-full p-8 text-center text-slate-400 text-xs">
                      Tidak ada data siswa yang cocok
                    </div>
                  ) : (
                    filteredExportStudents.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => handleExportSelectStudent(st)}
                        className="p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all group space-y-1.5 cursor-pointer shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-slate-400 font-bold">NIS: {st.nis}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">{st.unit_name || st.class_name || 'Cendekia'}</span>
                        </div>
                        <h4 className="font-extrabold text-slate-800 text-sm group-hover:text-emerald-700 transition-colors leading-tight">{st.name}</h4>
                        <p className="text-[11px] text-slate-500 font-medium">Kelas: {st.class_name || '-'}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ================= STEP 2: PILIH POS & CETAK PDF ================= */}
            {exportStep === 2 && exportStudent && (
              <div className="space-y-5 py-1">
                {/* Student Selected Header */}
                <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base">{exportStudent.name}</h4>
                      <p className="text-xs text-slate-600 font-medium">
                        NIS: <span className="font-mono font-bold">{exportStudent.nis}</span> • Kelas: {exportStudent.class_name || '-'} ({exportStudent.unit_name || 'Cendekia'})
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setExportStep(1)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
                  >
                    Ganti Siswa
                  </button>
                </div>

                {/* Selection Action & Totals */}
                {exportLoading ? (
                  <div className="p-8 text-center text-slate-400 text-xs">Memuat daftar tagihan siswa...</div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={toggleSelectAllExportInvoices}
                          className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 cursor-pointer"
                        >
                          {exportSelectedInvoiceIds.length === exportInvoices.length ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                          <span>Pilih Semua Pos ({exportSelectedInvoiceIds.length}/{exportInvoices.length} Pos Terpilih)</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Kewajiban</span>
                          <span className="font-extrabold text-slate-800">
                            Rp {exportInvoices.filter(i => exportSelectedInvoiceIds.includes(i.id)).reduce((s, i) => s + Number(i.nominal || 0), 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Terbayar</span>
                          <span className="font-extrabold text-emerald-700">
                            Rp {exportInvoices.filter(i => exportSelectedInvoiceIds.includes(i.id)).reduce((s, i) => s + Number(i.paid_amount || 0), 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Sisa Piutang</span>
                          <span className="font-extrabold text-rose-700">
                            Rp {Math.max(0, exportInvoices.filter(i => exportSelectedInvoiceIds.includes(i.id)).reduce((s, i) => s + (Number(i.nominal || 0) - Number(i.discount_amount || 0) - Number(i.paid_amount || 0)), 0)).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Invoices List to toggle */}
                    <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                        {exportInvoices.map((inv) => {
                          const isSelected = exportSelectedInvoiceIds.includes(inv.id);
                          const remaining = Math.max(0, Number(inv.nominal || 0) - Number(inv.discount_amount || 0) - Number(inv.paid_amount || 0));

                          return (
                            <div
                              key={inv.id}
                              onClick={() => toggleSelectExportInvoice(inv.id)}
                              className={`p-3 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer text-xs ${
                                isSelected ? 'bg-emerald-50/30' : 'opacity-60 bg-slate-50/40'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-300 shrink-0" />
                                )}
                                <div>
                                  <span className="font-bold text-slate-800 block">
                                    {inv.post_name} {inv.month_period ? `(${inv.month_period})` : ''}
                                  </span>
                                  <span className="text-[10px] text-slate-400">Jatuh Tempo: {inv.due_date || '10 Tiap Bulan'}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 text-right">
                                <div>
                                  <span className="font-extrabold text-slate-800 block">Rp {Number(inv.nominal || 0).toLocaleString('id-ID')}</span>
                                  {Number(inv.discount_amount || 0) > 0 && (
                                    <span className="text-[10px] text-emerald-600 font-bold block">Diskon: -Rp {Number(inv.discount_amount).toLocaleString('id-ID')}</span>
                                  )}
                                </div>

                                <div className="min-w-[80px]">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                    inv.status === 'Lunas'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : inv.status === 'Sebagian'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {inv.status}
                                  </span>
                                  {remaining > 0 && (
                                    <span className="text-[10px] text-rose-700 font-bold block mt-0.5">Sisa: Rp {remaining.toLocaleString('id-ID')}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* Footer Modal Actions */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowExportPdfModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Tutup
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintOrDownloadPdf}
                    disabled={exportSelectedInvoiceIds.length === 0}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
                  >
                    <Printer className="w-4 h-4" />
                    <span>🖨️ Cetak / Simpan PDF Lembar Tagihan Sekarang</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
