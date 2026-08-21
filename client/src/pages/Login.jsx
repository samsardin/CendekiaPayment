import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { School, ShieldCheck, ArrowRight, KeyRound, Sparkles } from 'lucide-react';

export default function Login() {
  const { login, switchRoleDemo, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  const presets = [
    { name: 'Superadmin Cendekia', email: 'superadmin@cendekia.sch.id', role: 'Superadmin', bg: 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200' },
    { name: 'Admin Keuangan', email: 'admin@cendekia.sch.id', role: 'Admin', bg: 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200' },
    { name: 'Kasir Utama', email: 'kasir@cendekia.sch.id', role: 'Kasir', bg: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200' },
    { name: 'Wali Murid (Ortu)', email: 'ortu.ahmad@gmail.com', role: 'Orang Tua', bg: 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = await login(email, password);
    if (res?.success) {
      const targetPath = res.user?.role === 'ortu' ? '/parent-portal' : '/dashboard';
      window.location.href = targetPath;
    } else {
      setErrorMsg(res?.error || 'Email / Password salah');
    }
  };

  const handleQuickDemo = async (presetEmail) => {
    setErrorMsg(null);
    const res = await switchRoleDemo(presetEmail);
    if (res?.success) {
      const targetPath = (presetEmail.includes('ortu') || res.user?.role === 'ortu') ? '/parent-portal' : '/dashboard';
      window.location.href = targetPath;
    } else {
      setErrorMsg(res?.error || 'Gagal login ke akun demo');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6 relative overflow-hidden border border-slate-200">
        {/* Top Brand Banner */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30">
            <School className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Cendekia SFMS</h1>
          <p className="text-xs text-slate-500 font-medium">Aplikasi Keuangan &amp; Pembayaran Sekolah Cendekia Lamongan</p>
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
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <span>{loading ? 'Memproses Masuk...' : 'Masuk Ke Aplikasi'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Quick Preset Logins */}
        <div className="pt-4 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center justify-center gap-1.5 text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <p className="text-[11px] font-extrabold uppercase tracking-wider">
              Quick Login Demo (1-Click)
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-2.5">
            {presets.map((p) => (
              <button
                key={p.email}
                type="button"
                onClick={() => handleQuickDemo(p.email)}
                disabled={loading}
                className={`p-3 rounded-xl border text-left transition-all space-y-0.5 shadow-xs ${p.bg}`}
              >
                <p className="font-extrabold text-xs leading-tight">{p.role}</p>
                <p className="text-[10px] opacity-80 truncate">{p.name}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
