import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CreditCard, 
  Receipt, 
  GraduationCap, 
  BookOpenCheck, 
  Building2, 
  TrendingDown, 
  Smartphone, 
  FilePieChart, 
  History, 
  UserCheck,
  School,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ mobileMenuOpen, setMobileMenuOpen }) {
  const { user } = useAuth();
  const role = user?.role || 'kasir';

  const menuItems = [
    {
      title: 'UTAMA',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['superadmin', 'admin', 'kasir'] },
        { name: 'Kasir & Pembayaran', path: '/kasir-pos', icon: CreditCard, roles: ['superadmin', 'admin', 'kasir'] },
        { name: 'Riwayat Transaksi', path: '/history-transaksi', icon: History, roles: ['superadmin', 'admin', 'kasir'] },
        { name: 'Portal Orang Tua', path: '/parent-portal', icon: UserCheck, roles: ['ortu', 'superadmin', 'admin'] }
      ]
    },
    {
      title: 'TRANSAKSI & TAGIHAN',
      items: [
        { name: 'Daftar Tagihan', path: '/invoices', icon: Receipt, roles: ['superadmin', 'admin', 'kasir'] },
        { name: 'Pengeluaran (Expense)', path: '/expenses', icon: TrendingDown, roles: ['superadmin', 'admin'] }
      ]
    },
    {
      title: 'MASTER DATA',
      items: [
        { name: 'Data Siswa & Mutasi', path: '/students', icon: GraduationCap, roles: ['superadmin', 'admin', 'kasir'] },
        { name: 'Master Pos Pembayaran', path: '/pos-settings', icon: BookOpenCheck, roles: ['superadmin', 'admin'] },
        { name: 'Akun Keuangan (GL)', path: '/accounts', icon: Building2, roles: ['superadmin', 'admin'] }
      ]
    },
    {
      title: 'INTEGRASI & LAPORAN',
      items: [
        { name: 'Payment & WA Gateway', path: '/gateway', icon: Smartphone, roles: ['superadmin', 'admin'] },
        { name: 'Laporan Keuangan', path: '/reports', icon: FilePieChart, roles: ['superadmin', 'admin'] },
        { name: 'Audit Trail (Logs)', path: '/audit-logs', icon: History, roles: ['superadmin', 'admin'] }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden animate-in fade-in"
        ></div>
      )}

      {/* Sidebar Drawer */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 lg:w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20">
              <School className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-white tracking-wide leading-none text-base">Cendekia SFMS</h1>
              <p className="text-xs text-slate-400 mt-1 font-medium">Lamongan - East Java</p>
            </div>
          </div>
          {/* Close button on mobile */}
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg lg:hidden"
            title="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Menu */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {menuItems.map((group, idx) => {
            const visibleItems = group.items.filter(item => item.roles.includes(role));
            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1">
                <h2 className="text-[11px] font-bold text-slate-500 tracking-wider px-3 uppercase mb-2">
                  {group.title}
                </h2>
                {visibleItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen && setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-600/30'
                            : 'hover:bg-slate-800/80 hover:text-white text-slate-400'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer / Active Unit Info */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-400 bg-slate-950/40">
          <div className="flex items-center justify-between text-slate-300 font-medium mb-1">
            <span>Tahun Ajaran:</span>
            <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-semibold text-[11px]">2026/2027</span>
          </div>
          <p className="text-[11px] text-slate-500">Unit: KBTK-IT & SDIT Cendekia</p>
        </div>
      </aside>
    </>
  );
}
