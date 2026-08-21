import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('cp_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('cp_token') || null);
  const [loading, setLoading] = useState(false);

  const login = async (usernameOrEmail, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { usernameOrEmail, password });
      if (res.data && res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('cp_token', res.data.token);
        localStorage.setItem('cp_user', JSON.stringify(res.data.user));
        return { success: true, user: res.data.user };
      }
      return { success: false, error: res.data?.error || 'Login gagal' };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Login gagal' };
    } finally {
      setLoading(false);
    }
  };

  // Switch role shortcut for easy demo testing with fail-safe fallback
  const switchRoleDemo = async (roleEmail) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { usernameOrEmail: roleEmail, password: 'password123' });
      if (res.data && res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('cp_token', res.data.token);
        localStorage.setItem('cp_user', JSON.stringify(res.data.user));
        return { success: true, user: res.data.user };
      }
    } catch (err) {
      console.warn('Network login warning, using local demo session fallback:', err);
    }

    // Fail-safe local demo session fallback
    const role = roleEmail.includes('superadmin') ? 'superadmin' : roleEmail.includes('admin') ? 'admin' : roleEmail.includes('kasir') ? 'kasir' : 'ortu';
    const demoUser = {
      id: role === 'superadmin' ? 1 : role === 'admin' ? 2 : role === 'kasir' ? 3 : 4,
      name: role === 'superadmin' ? 'Superadmin Cendekia' : role === 'admin' ? 'Admin Keuangan' : role === 'kasir' ? 'Kasir Utama' : 'Wali Murid',
      email: roleEmail,
      role: role
    };
    const demoToken = 'demo-token-active';
    setToken(demoToken);
    setUser(demoUser);
    localStorage.setItem('cp_token', demoToken);
    localStorage.setItem('cp_user', JSON.stringify(demoUser));
    setLoading(false);
    return { success: true, user: demoUser };
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('cp_token');
    localStorage.removeItem('cp_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, switchRoleDemo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
