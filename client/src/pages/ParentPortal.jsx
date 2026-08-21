import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserCheck, QrCode, CreditCard, Download, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ParentPortal() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [children, setChildren] = useState(user?.children || []);
  const [selectedChild, setSelectedChild] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Online Payment Simulator Modal
  const [payModalInv, setPayModalInv] = useState(null);
  const [payMethod, setPayMethod] = useState('QRIS');
  const [pgResult, setPgResult] = useState(null);
  const [pgLoading, setPgLoading] = useState(false);

  useEffect(() => {
    fetchParentData();
  }, [user]);

  const fetchParentData = async () => {
    setLoading(true);
    try {
      const meRes = await api.get('/auth/me');
      if (meRes.data.success) {
        const kidList = meRes.data.user.children || [];
        setChildren(kidList);
        if (kidList.length > 0) {
          handleSelectChild(kidList[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChild = async (child) => {
    setSelectedChild(child);
    try {
      const res = await api.get(`/invoices?student_id=${child.id}`);
      if (res.data.success) {
        setInvoices(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleInitiateOnlinePayment = async (inv) => {
    setPayModalInv(inv);
    setPgResult(null);
  };

  const handleProcessCharge = async () => {
    if (!payModalInv) return;
    setPgLoading(true);
    try {
      const res = await api.post('/gateway/charge', {
        invoice_id: payModalInv.id,
        payment_method: payMethod
      });
      if (res.data.success) {
        setPgResult(res.data);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal memproses Payment Gateway');
    } finally {
      setPgLoading(false);
    }
  };

  const handleSimulateInstantPay = async () => {
    if (!pgResult) return;
    setPgLoading(true);
    try {
      const res = await api.post('/gateway/callback', {
        order_id: pgResult.order_id,
        invoice_id: pgResult.invoice_id,
        amount: pgResult.amount,
        payment_method: pgResult.payment_method,
        status: 'PAID'
      });

      if (res.data.success) {
        alert('✅ Pembayaran Online Berhasil Terkonfirmasi!');
        setPayModalInv(null);
        setPgResult(null);
        handleSelectChild(selectedChild);
      }
    } catch (err) {
      alert('Gagal konfirmasi callback');
    } finally {
      setPgLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-700 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="bg-white/20 text-emerald-100 text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-md">
              PORTAL WALI MURID
            </span>
            <h1 className="text-2xl font-bold mt-2">Selamat Datang, {user?.name}</h1>
            <p className="text-xs text-emerald-100 mt-1">Pantau tagihan & bayar online aman via Payment Gateway Cendekia</p>
          </div>

          {/* Child Tabs */}
          {children.length > 1 && (
            <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md p-1.5 rounded-2xl">
              {children.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => handleSelectChild(ch)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                    selectedChild?.id === ch.id
                      ? 'bg-white text-emerald-900 shadow-sm'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {ch.name.split(' ')[0]} ({ch.class_name})
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selected Child Details */}
      {selectedChild && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Profil Ananda</span>
            <h3 className="font-bold text-slate-800 text-base">{selectedChild.name}</h3>
            <p className="text-xs text-slate-500">NIS: {selectedChild.nis} • Gender: {selectedChild.gender}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Unit & Kelas</span>
            <h3 className="font-bold text-emerald-700 text-base">{selectedChild.class_name}</h3>
            <p className="text-xs text-slate-500">{selectedChild.unit_name}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Status Keuangan</span>
            <h3 className="font-bold text-slate-800 text-base">
              {invoices.filter(i => i.status !== 'Lunas').length} Tagihan Belum Lunas
            </h3>
            <p className="text-xs text-emerald-600 font-semibold">Aktif Semester Ini</p>
          </div>
        </div>
      )}

      {/* Invoices & History Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-600" />
          Rincian Tagihan & Riwayat Pembayaran
        </h3>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Memuat data tagihan...</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">Belum ada tagihan untuk ananda</div>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv) => {
              const remaining = Math.max(0, inv.nominal - inv.discount_amount - inv.paid_amount);

              return (
                <div
                  key={inv.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded">
                        {inv.post_name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          inv.status === 'Lunas'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'Sebagian'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm mt-1.5">{inv.invoice_number}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Jatuh Tempo: {inv.due_date} ({inv.month_period})</p>
                  </div>

                  <div className="flex items-center gap-4 self-end md:self-auto">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Sisa Tagihan:</p>
                      <p className="text-base font-extrabold text-slate-800">
                        Rp {remaining.toLocaleString('id-ID')}
                      </p>
                    </div>

                    {inv.status !== 'Lunas' ? (
                      <button
                        onClick={() => handleInitiateOnlinePayment(inv)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
                      >
                        <QrCode className="w-4 h-4" />
                        Bayar Online
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/receipt/1`)}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5"
                      >
                        <Download className="w-4 h-4" />
                        Kwitansi
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Online Payment Simulator Modal */}
      {payModalInv && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in text-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              Simulasi Payment Gateway (Online)
            </h3>

            {!pgResult ? (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-slate-800 space-y-1">
                  <p className="font-bold">{payModalInv.post_name}</p>
                  <p className="text-slate-500">Nominal: <span className="font-bold text-slate-900">Rp {(payModalInv.nominal - payModalInv.discount_amount - payModalInv.paid_amount).toLocaleString('id-ID')}</span></p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Pilih Channel Pembayaran Online</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['QRIS', 'Virtual Account', 'E-Wallet'].map((m) => (
                      <button
                        type="button"
                        key={m}
                        onClick={() => setPayMethod(m)}
                        className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                          payMethod === m
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setPayModalInv(null)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl">Batal</button>
                  <button type="button" onClick={handleProcessCharge} disabled={pgLoading} className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-md">
                    {pgLoading ? 'Memproses...' : 'Lanjutkan Bayar'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
                  <p className="text-xs text-slate-400 uppercase font-bold">Instruksi Pembayaran {pgResult.payment_method}</p>
                  {pgResult.payment_method === 'QRIS' ? (
                    <div className="p-3 bg-white text-slate-800 rounded-lg inline-block my-2">
                      <div className="w-32 h-32 bg-slate-800 text-white flex items-center justify-center font-mono font-bold text-xs mx-auto rounded">
                        [ DYNAMIC QRIS ]
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Scan via BCA / GoPay / OVO / ShopeePay</p>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-800 rounded-lg">
                      <p className="text-xs text-slate-400">Nomor Virtual Account:</p>
                      <p className="text-lg font-mono font-bold text-emerald-400 tracking-wider mt-1">{pgResult.va_number}</p>
                    </div>
                  )}
                  <p className="text-sm font-bold text-emerald-400">Total: Rp {pgResult.amount.toLocaleString('id-ID')}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPayModalInv(null)}
                    className="flex-1 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSimulateInstantPay}
                    disabled={pgLoading}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Simulasi Bayar Sekarang
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
