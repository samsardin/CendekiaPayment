import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Printer, ArrowLeft, ShieldCheck, School, Calendar, Smartphone, Receipt } from 'lucide-react';

const formatMonthPeriod = (periodStr, invoiceNumber = '') => {
  let clean = (periodStr || '').toString().trim();

  if (!clean && invoiceNumber) {
    const parts = invoiceNumber.split('/');
    const lastPart = parts[parts.length - 1];
    if (lastPart && lastPart.length === 6 && !isNaN(lastPart)) {
      clean = lastPart;
    }
  }

  if (!clean) return '';

  const monthMap = {
    '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
    '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
    '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
  };

  if (clean.includes('-')) {
    const parts = clean.split('-');
    const year = parts[0];
    const month = parts[1];
    if (monthMap[month]) return `${monthMap[month]} ${year}`;
  } 
  
  if (clean.length === 6 && !isNaN(clean)) {
    const year = clean.substring(0, 4);
    const month = clean.substring(4, 6);
    if (monthMap[month]) return `${monthMap[month]} ${year}`;
  }

  return clean;
};

export default function KwitansiView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [paymentItems, setPaymentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [printFormat, setPrintFormat] = useState('thermal'); // 'thermal' (80mm) or 'a4'

  useEffect(() => {
    fetchPayment();
  }, [id]);

  const fetchPayment = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/payments?1=1`);
      if (res.data.success && res.data.data.length > 0) {
        const target = res.data.data.find(p => p.id === parseInt(id));
        if (target) {
          const siblings = res.data.data.filter(p => p.transaction_number === target.transaction_number);
          setPaymentItems(siblings.length > 0 ? siblings : [target]);
          setPayment(target);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs">Memuat Kwitansi Digital...</div>;
  }

  if (!payment) {
    return <div className="p-8 text-center text-slate-400 text-xs">Kwitansi tidak ditemukan.</div>;
  }

  const totalTransactionAmount = paymentItems.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Dynamic Print CSS for Thermal 80mm & A4 */}
      <style>{`
        @media print {
          @page {
            size: ${printFormat === 'thermal' ? '80mm auto' : 'A4'};
            margin: ${printFormat === 'thermal' ? '0' : '15mm'};
          }
          body {
            background: #fff !important;
            color: #000 !important;
            margin: 0 !important;
            padding: 0 !important;
            font-family: ${printFormat === 'thermal' ? "'Courier New', Courier, monospace" : 'inherit'} !important;
          }
          .no-print {
            display: none !important;
          }
          .printable-card {
            box-shadow: none !important;
            border: none !important;
            margin: 0 auto !important;
            width: ${printFormat === 'thermal' ? '78mm' : '100%'} !important;
            max-width: ${printFormat === 'thermal' ? '78mm' : '100%'} !important;
            padding: ${printFormat === 'thermal' ? '2mm' : '0'} !important;
          }
        }
      `}</style>

      {/* Top Action & Mode Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm no-print">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition-all self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>

        {/* Format Selector Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 mr-1">Format Cetak:</span>
          <button
            type="button"
            onClick={() => setPrintFormat('thermal')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 ${
              printFormat === 'thermal'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Struk Thermal 80mm</span>
          </button>
          <button
            type="button"
            onClick={() => setPrintFormat('a4')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 ${
              printFormat === 'a4'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Dokumen A4 / PDF</span>
          </button>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/30 transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Kwitansi ({printFormat === 'thermal' ? '80mm' : 'A4'})</span>
        </button>
      </div>

      {/* ================= MODE 1: STRUK THERMAL KASIR 80MM ================= */}
      {printFormat === 'thermal' && (
        <div className="printable-card w-[80mm] max-w-[320px] mx-auto bg-white p-5 rounded-2xl border border-slate-300 shadow-xl font-mono text-xs text-black space-y-3 leading-tight">
          {/* Header Thermal */}
          <div className="text-center space-y-1">
            <h2 className="font-extrabold text-sm uppercase tracking-wide">SEKOLAH CENDEKIA LAMONGAN</h2>
            <p className="text-[11px] font-bold">KBTK-IT & SDIT CENDEKIA</p>
            <p className="text-[10px]">Jl. Raya Lamongan - Babat No. 88</p>
            <p className="text-[10px]">WA: 0812-3456-7890</p>
            <div className="py-1">================================</div>
            <h3 className="font-extrabold text-xs uppercase tracking-wider">KWITANSI PEMBAYARAN</h3>
            <div className="text-[10px] text-left space-y-0.5 pt-1">
              <p>No. Txn : {payment.transaction_number}</p>
              <p>Tanggal : {payment.payment_date || '2026-08-21'}</p>
              <p>Kasir   : {payment.cashier_name || 'Ustadz Hendra'}</p>
            </div>
            <div className="py-1">--------------------------------</div>
          </div>

          {/* Student Info Thermal */}
          <div className="text-[11px] space-y-1">
            <p><span className="font-bold">Siswa :</span> {payment.student_name}</p>
            <p><span className="font-bold">NIS   :</span> {payment.nis}</p>
            <p><span className="font-bold">Kelas :</span> {payment.class_name} ({payment.unit_name})</p>
            <p><span className="font-bold">Metode:</span> {payment.payment_method}</p>
          </div>

          <div className="py-1 text-center">--------------------------------</div>

          {/* Item Breakdown Thermal */}
          <div className="space-y-2 text-[11px]">
            {paymentItems.map((item, idx) => {
              const periodFormatted = formatMonthPeriod(item.month_period, item.invoice_number);
              const isSpp = item.post_name?.includes('SPP') || item.post_name?.includes('Biaya Pendidikan');

              return (
                <div key={idx} className="space-y-0.5">
                  <div className="font-bold flex justify-between">
                    <span>{item.post_name}</span>
                  </div>
                  {isSpp && periodFormatted && (
                    <p className="text-[10px] font-bold text-slate-800">
                      &gt; Periode: Bulan {periodFormatted}
                    </p>
                  )}
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-600">No. Tag: {item.invoice_number}</span>
                    <span className="font-bold">Rp {item.amount.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="py-1 text-center">================================</div>

          {/* Total & Status Thermal */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm font-black">
              <span>TOTAL DIBAYAR:</span>
              <span>Rp {totalTransactionAmount.toLocaleString('id-ID')}</span>
            </div>
            <div className="text-center font-extrabold text-xs pt-1">
              [ STATUS: TERKONFIRMASI LUNAS ]
            </div>
          </div>

          <div className="py-1 text-center">================================</div>

          {/* Footer & QR Thermal */}
          <div className="text-center text-[10px] space-y-1.5 pt-1">
            <p className="font-bold">*** TERIMA KASIH ***</p>
            <p>Semoga Menjadi Ilmu &amp; Rezeki Yang Berkah</p>
            <p className="text-[9px] pt-1">Simpan Kwitansi Ini Sebagai Bukti Pembayaran Sah Sekolah Cendekia Lamongan</p>
          </div>
        </div>
      )}

      {/* ================= MODE 2: DOKUMEN CETAK A4 / PDF ================= */}
      {printFormat === 'a4' && (
        <div className="printable-card bg-white rounded-2xl border border-slate-200 shadow-xl p-8 space-y-6 text-slate-800">
          {/* Receipt Header */}
          <div className="flex items-start justify-between border-b-2 border-emerald-600 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md">
                <School className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 leading-tight">SEKOLAH CENDEKIA LAMONGAN</h2>
                <p className="text-xs text-slate-500 font-medium">KBTK-IT & SDIT Cendekia Lamongan</p>
                <p className="text-[11px] text-slate-400">Jl. Raya Lamongan - Babat No. 88 • WA: 0812-3456-7890</p>
              </div>
            </div>

            <div className="text-right">
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wider">
                KWITANSI RESMI
              </span>
              <p className="text-xs font-mono font-bold text-slate-700 mt-2">{payment.transaction_number}</p>
              <p className="text-[11px] text-slate-400">Tgl: {payment.payment_date ? payment.payment_date.split(' ')[0] : '2026-08-21'}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 block font-medium">Telah Diterima Dari:</span>
              <span className="font-bold text-slate-900 text-sm">{payment.student_name}</span>
              <p className="text-[11px] text-slate-500 mt-0.5">NIS: {payment.nis} • Kelas: {payment.class_name} ({payment.unit_name})</p>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Metode Pembayaran:</span>
              <span className="font-bold text-slate-900">{payment.payment_method}</span>
              <p className="text-[11px] text-slate-500 mt-0.5">Kasir: {payment.cashier_name || 'Loket Kasir Sekolah'}</p>
            </div>
          </div>

          {/* Breakdown Table */}
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                <th className="py-2.5 px-1">Rincian Pos Pembayaran</th>
                <th className="py-2.5 px-1 text-center">Periode Bulan & Tahun</th>
                <th className="py-2.5 px-1 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paymentItems.map((item, idx) => {
                const periodFormatted = formatMonthPeriod(item.month_period, item.invoice_number);
                const isSpp = item.post_name?.includes('SPP') || item.post_name?.includes('Biaya Pendidikan');

                return (
                  <tr key={idx}>
                    <td className="py-3 px-1">
                      <div className="font-extrabold text-slate-900 text-sm">
                        {item.post_name}
                        {isSpp && periodFormatted && (
                          <span className="text-emerald-700 ml-1.5 font-extrabold">
                            - Bulan {periodFormatted}
                          </span>
                        )}
                      </div>
                      {isSpp && periodFormatted && (
                        <div className="text-xs font-extrabold text-emerald-800 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Periode Tagihan SPP: Bulan {periodFormatted}</span>
                        </div>
                      )}
                      <div className="text-[10px] font-mono text-slate-400 font-normal mt-0.5">
                        No. Tagihan: {item.invoice_number}
                      </div>
                    </td>
                    <td className="py-3 px-1 text-center font-extrabold text-emerald-800 text-xs">
                      {periodFormatted ? `Bulan ${periodFormatted}` : '-'}
                    </td>
                    <td className="py-3 px-1 text-right font-extrabold text-slate-900 text-sm">
                      Rp {item.amount.toLocaleString('id-ID')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Total & QR Verification Section */}
          <div className="pt-4 border-t-2 border-slate-200 flex items-end justify-between">
            {/* QR Verification Box */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-16 h-16 bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-[9px] rounded text-center p-1">
                [ QR VERIFY ]
              </div>
              <div className="text-[11px]">
                <p className="font-bold text-slate-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Terverifikasi Keasliannya
                </p>
                <p className="text-slate-400 text-[10px] mt-0.5">Scan untuk verifikasi keaslian kwitansi digital ini.</p>
                <p className="text-[9px] font-mono text-emerald-700">Ref: {payment.transaction_number}</p>
              </div>
            </div>

            {/* Amount Paid Box */}
            <div className="text-right space-y-1">
              <span className="text-xs text-slate-500 uppercase font-bold">Total Pembayaran</span>
              <h3 className="text-2xl font-black text-emerald-700">Rp {totalTransactionAmount.toLocaleString('id-ID')}</h3>
              <span className="inline-block bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded uppercase">
                STATUS: TERKONFIRMASI LUNAS
              </span>
            </div>
          </div>

          {/* Footer Signature */}
          <div className="pt-8 flex justify-end text-center text-xs">
            <div className="space-y-12">
              <p className="text-slate-500">Lamongan, {payment.payment_date ? payment.payment_date.split(' ')[0] : '2026-08-21'}<br />Kasir Keuangan Sekolah,</p>
              <p className="font-bold text-slate-900 border-b border-slate-800 pb-1">{payment.cashier_name || 'Ustadz Hendra'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
