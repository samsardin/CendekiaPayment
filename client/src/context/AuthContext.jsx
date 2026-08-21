import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('cp_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('cp_token') || null);
  const [loading, setLoading] = useState(false);

  const login = async (usernameOrEmail, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { usernameOrEmail, password });
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('cp_token', res.data.token);
        localStorage.setItem('cp_user', JSON.stringify(res.data.user));
        return { success: true, user: res.data.user };
      }
      return { success: false, error: res.data.error || 'Login gagal' };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Login gagal' };
    } finally {
      setLoading(false);
    }
  };

  // Switch role shortcut for easy demo testing
  const switchRoleDemo = async (roleEmail) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { usernameOrEmail: roleEmail, password: 'password123' });
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('cp_token', res.data.token);
        localStorage.setItem('cp_user', JSON.stringify(res.data.user));
        return { success: true, user: res.data.user };
      }
      return { success: false, error: res.data.error || 'Demo login gagal' };
    } catch (err) {
      console.error('Demo switch failed:', err);
      return { success: false, error: err.response?.data?.error || 'Demo login gagal' };
    } finally {
      setLoading(false);
    }
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
