import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { History, ShieldAlert, RefreshCw } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit');
      if (res.data.success) {
        setLogs(res.data.data);
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
            <History className="w-7 h-7 text-emerald-600" />
            Audit Trail System Logs
          </h1>
          <p className="text-xs text-slate-500">Pencatatan immutable seluruh aktivitas login, perubahan nominal, void transaksi & audit keamanan</p>
        </div>
        <button
          onClick={fetchLogs}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Audit Trail
        </button>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Memuat audit log...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">Belum ada catatan audit trail</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Waktu (Timestamp)</th>
                  <th className="py-3 px-4">Pengguna</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Modul</th>
                  <th className="py-3 px-4">Aktivitas / Action</th>
                  <th className="py-3 px-4">Detail Aktivitas</th>
                  <th className="py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">{l.timestamp}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{l.user_name || 'System'}</td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold uppercase text-[10px]">
                        {l.user_role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-700">{l.module}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{l.action}</td>
                    <td className="py-3 px-4 max-w-md truncate text-slate-600">{l.details}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{l.ip_address}</td>
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
