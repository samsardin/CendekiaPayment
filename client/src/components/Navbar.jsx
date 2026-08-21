import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, ShieldCheck, ChevronDown, Bell, Search, Menu } from 'lucide-react';

export default function Navbar({ onToggleMobileMenu }) {
  const { user, logout, switchRoleDemo } = useAuth();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const rolesPreset = [
    { role: 'superadmin', name: 'Superadmin Cendekia', email: 'superadmin@cendekia.sch.id', badgeBg: 'bg-purple-100 text-purple-700' },
    { role: 'admin', name: 'Admin Keuangan (Ustdz Rahma)', email: 'admin@cendekia.sch.id', badgeBg: 'bg-blue-100 text-blue-700' },
    { role: 'kasir', name: 'Kasir Utama (Ustd Hendra)', email: 'kasir@cendekia.sch.id', badgeBg: 'bg-emerald-100 text-emerald-700' },
    { role: 'ortu', name: 'Wali Murid (Bpk. Ahmad)', email: 'ortu.ahmad@gmail.com', badgeBg: 'bg-amber-100 text-amber-700' }
  ];

  const getRoleBadge = (roleName) => {
    switch (roleName) {
      case 'superadmin':
        return <span className="bg-purple-100 text-purple-800 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded border border-purple-200">SUPERADMIN</span>;
      case 'admin':
        return <span className="bg-blue-100 text-blue-800 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded border border-blue-200">ADMIN</span>;
      case 'kasir':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded border border-emerald-200">KASIR</span>;
      case 'ortu':
        return <span className="bg-amber-100 text-amber-800 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded border border-amber-200">ORANG TUA</span>;
      default:
        return null;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Mobile Hamburger Button & Search */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl lg:hidden transition-colors"
          title="Buka Menu Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-36 sm:w-64 md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Siswa / Tagihan..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Quick Demo Role Switcher Button */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] sm:text-xs font-semibold rounded-lg border border-slate-300 transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="hidden sm:inline">Switch Role Demo</span>
            <span className="sm:hidden">Role</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                Pilih Role Penguji (Instant Switch)
              </div>
              {rolesPreset.map((r) => (
                <button
                  key={r.email}
                  onClick={async () => {
                    await switchRoleDemo(r.email);
                    setShowRoleDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    user?.email === r.email ? 'bg-slate-100 font-semibold' : ''
                  }`}
                >
                  <div>
                    <p className="font-medium text-slate-800">{r.name}</p>
                    <p className="text-[10px] text-slate-400">{r.email}</p>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${r.badgeBg}`}>
                    {r.role}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Icon */}
        <div className="relative p-2 text-slate-500 hover:text-slate-700 cursor-pointer rounded-lg hover:bg-slate-100">
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white"></span>
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-300 shrink-0">
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          <div className="text-left hidden md:block">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-slate-800 leading-tight">{user?.name || 'Pengguna'}</p>
              {getRoleBadge(user?.role)}
            </div>
            <p className="text-[11px] text-slate-400">{user?.email}</p>
          </div>

          <button
            onClick={logout}
            title="Keluar / Logout"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-0.5"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
