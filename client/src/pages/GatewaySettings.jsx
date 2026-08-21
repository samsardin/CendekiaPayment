import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Smartphone, CheckCircle, RefreshCw, Send, MessageSquare } from 'lucide-react';

export default function GatewaySettings() {
  const [waLogs, setWaLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWaLogs();
  }, []);

  const fetchWaLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/gateway/wa-logs');
      if (res.data.success) {
        setWaLogs(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <Smartphone className="w-7 h-7 text-emerald-600" />
            Integrasi Payment Gateway & WhatsApp Gateway
          </h1>
          <p className="text-xs text-slate-500">Konfigurasi webhook payment gateway, template pesan WhatsApp & audit log notifikasi terkirim</p>
        </div>
        <button
          onClick={fetchWaLogs}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Log WA
        </button>
      </div>

      {/* Gateway Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Gateway Config */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-base">Payment Gateway Config</h3>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded">CONNECTED</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-500 font-medium block">Webhook / Callback URL</label>
              <input
                type="text"
                readOnly
                value="http://localhost:5000/api/gateway/callback"
                className="w-full px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-lg font-mono text-[11px]"
              />
            </div>
            <div>
              <label className="text-slate-500 font-medium block">Supported Payment Channels</label>
              <p className="font-semibold text-slate-800 mt-1">QRIS, BCA VA, Mandiri VA, BSI VA, ShopeePay, GoPay, Indomaret</p>
            </div>
          </div>
        </div>

        {/* WhatsApp Gateway Config */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-base">WhatsApp Gateway Config</h3>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded">ACTIVE</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-500 font-medium block">Template Pesan Otomatis (FR-014)</label>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 font-mono text-[11px] space-y-1">
                <p>Assalamu'alaikum Yth. {"{nama_ortu}"},</p>
                <p>Pembayaran *{"{pos_pembayaran}"}* an. *{"{nama_siswa}"}* sebesar *Rp {"{nominal}"}* via *{"{metode}"}* telah BERHASIL.</p>
                <p>Link Kwitansi: {"{link_kwitansi}"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WA Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-3 p-5">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-emerald-600" />
          Log Notifikasi WhatsApp Terkirim (FR-014)
        </h3>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Memuat log WA...</div>
        ) : waLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">Belum ada notifikasi WhatsApp terkirim</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <th className="py-2.5 px-3">Waktu Send</th>
                  <th className="py-2.5 px-3">Penerima</th>
                  <th className="py-2.5 px-3">No. WA</th>
                  <th className="py-2.5 px-3">Pesan WhatsApp</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {waLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 whitespace-nowrap text-[11px] text-slate-400">{log.sent_at}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">{log.recipient_name}</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-700">{log.recipient_phone}</td>
                    <td className="py-2.5 px-3 max-w-md truncate font-mono text-[11px]">{log.message}</td>
                    <td className="py-2.5 px-3">
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
