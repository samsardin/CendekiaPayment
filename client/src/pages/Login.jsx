import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { School, ShieldCheck, ArrowRight, KeyRound } from 'lucide-react';

export default function Login() {
  const { login, switchRoleDemo, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  const presets = [
    { name: 'Superadmin Cendekia', email: 'superadmin@cendekia.sch.id', role: 'Superadmin', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
    { name: 'Admin Keuangan', email: 'admin@cendekia.sch.id', role: 'Admin', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    { name: 'Kasir Utama', email: 'kasir@cendekia.sch.id', role: 'Kasir', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { name: 'Wali Murid (Ortu)', email: 'ortu.ahmad@gmail.com', role: 'Orang Tua', bg: 'bg-amber-50 text-amber-700 border-amber-200' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = await login(email, password);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setErrorMsg(res.error);
    }
  };

  const handleQuickDemo = async (presetEmail) => {
    setErrorMsg(null);
    const res = await switchRoleDemo(presetEmail);
    if (res?.success) {
      if (presetEmail.includes('ortu')) {
        navigate('/parent-portal');
      } else {
        navigate('/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6 relative overflow-hidden">
        {/* Top Brand Banner */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30">
            <School className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Cendekia SFMS</h1>
          <p className="text-xs text-slate-500 font-medium">Aplikasi Keuangan & Pembayaran Sekolah Cendekia Lamongan</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Email / Nomor WhatsApp</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Contoh: superadmin@cendekia.sch.id"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 text-sm"
          >
            {loading ? 'Masuk...' : 'Masuk Ke Aplikasi'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Quick Preset Logins */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
            ⚡ Quick Login Demo (1-Click)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((p) => (
              <button
                key={p.email}
                onClick={() => handleQuickDemo(p.email)}
                className={`p-2.5 rounded-xl border text-left hover:scale-[1.02] transition-all ${p.bg}`}
              >
                <p className="font-bold text-xs leading-tight">{p.role}</p>
                <p className="text-[10px] opacity-75 truncate">{p.name}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
