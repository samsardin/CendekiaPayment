import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { History, ShieldAlert, RefreshCw, Search, Filter, Clock, ShieldCheck, X } from 'lucide-react';

const formatTimestamp = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');

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
      console.error('Fetch audit logs error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((l) => {
    const term = search.toLowerCase();
    const matchSearch =
      !search ||
      (l.user_name && l.user_name.toLowerCase().includes(term)) ||
      (l.action && l.action.toLowerCase().includes(term)) ||
      (l.module && l.module.toLowerCase().includes(term)) ||
      (l.details && l.details.toLowerCase().includes(term)) ||
      (l.ip_address && l.ip_address.toLowerCase().includes(term));

    const matchModule = !moduleFilter || l.module === moduleFilter;

    return matchSearch && matchModule;
  });

  const uniqueModules = Array.from(new Set(logs.map((l) => l.module).filter(Boolean)));

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-600/20">
            <History className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Audit Trail System Logs</h1>
              <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-200 uppercase">
                Immutable
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pencatatan riwayat seluruh aktivitas login, perubahan nominal tagihan, transaksi kasir, import data &amp; keamanan sistem
            </p>
          </div>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
          <span>Segarkan Log</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari aktivitas, nama pengguna, modul, atau detail catatan..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/60 border border-slate-200 text-slate-800 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="">Semua Modul</option>
            {uniqueModules.map((m) => (
              <option key={m} value={m}>
                Modul: {m}
              </option>
            ))}
          </select>

          <span className="text-xs font-bold text-slate-400 px-2 py-1 bg-slate-100 rounded-xl whitespace-nowrap">
            {filteredLogs.length} Catatan
          </span>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Memuat data audit trail...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">
            Tidak ada catatan audit log yang sesuai dengan filter pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Waktu (Timestamp)</span>
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Pengguna</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Modul</th>
                  <th className="py-3.5 px-4">Aktivitas / Action</th>
                  <th className="py-3.5 px-4 min-w-[280px]">Detail Aktivitas</th>
                  <th className="py-3.5 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-600 font-semibold text-[11px] whitespace-nowrap">
                      {formatTimestamp(l.created_at || l.timestamp)}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 whitespace-nowrap">
                      {l.user_name || 'System'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-lg font-extrabold uppercase text-[10px] ${
                        l.user_role === 'superadmin' 
                          ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                          : l.user_role === 'admin'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {l.user_role || 'system'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-indigo-700 whitespace-nowrap">
                      <span className="bg-indigo-50/60 px-2 py-0.5 rounded border border-indigo-100">
                        {l.module}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800 text-[11px] whitespace-nowrap">
                      {l.action}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 leading-relaxed max-w-md">
                      {l.details}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {l.ip_address || '127.0.0.1'}
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
