import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CashierPOS from './pages/CashierPOS';
import InvoicesList from './pages/InvoicesList';
import StudentsList from './pages/StudentsList';
import PosPayment from './pages/PosPayment';
import AccountsChart from './pages/AccountsChart';
import Expenses from './pages/Expenses';
import ParentPortal from './pages/ParentPortal';
import KwitansiView from './pages/KwitansiView';
import GatewaySettings from './pages/GatewaySettings';
import Reports from './pages/Reports';
import AuditLogs from './pages/AuditLogs';

const ProtectedLayout = () => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Safe fallback to localStorage while React context state updates
  const currentUser = user || (() => {
    try {
      const saved = localStorage.getItem('cp_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  if (!currentUser) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] relative overflow-x-hidden">
      <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to={currentUser.role === 'ortu' ? '/parent-portal' : '/dashboard'} replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/kasir-pos" element={<CashierPOS />} />
            <Route path="/invoices" element={<InvoicesList />} />
            <Route path="/students" element={<StudentsList />} />
            <Route path="/pos-settings" element={<PosPayment />} />
            <Route path="/accounts" element={<AccountsChart />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/parent-portal" element={<ParentPortal />} />
            <Route path="/receipt/*" element={<KwitansiView />} />
            <Route path="/receipt" element={<KwitansiView />} />
            <Route path="/kwitansi/*" element={<KwitansiView />} />
            <Route path="/kwitansi" element={<KwitansiView />} />
            <Route path="/gateway" element={<GatewaySettings />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="*" element={<Navigate to={currentUser.role === 'ortu' ? '/parent-portal' : '/dashboard'} replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
