import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('invotrack_token'));
  const [loading, setLoading] = useState(true);

  const api = axios.create({
    baseURL: '/api',
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  api.interceptors.request.use((config) => {
    const currentToken = localStorage.getItem('invotrack_token');
    if (currentToken) {
      config.headers.Authorization = `Bearer ${currentToken}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      // Only auto-logout on 401 (invalid/expired token).
      // 403 means the user IS authenticated but lacks permissions
      // (e.g. pending approval, deactivated) — do NOT logout here.
      if (error.response?.status === 401) {
        logout();
      }
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
    } catch (err) {
      console.error('Fetch user error:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('invotrack_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    localStorage.setItem('invotrack_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const googleLogin = async (credential, inviteToken) => {
    const res = await api.post('/auth/google', { credential, inviteToken });
    localStorage.setItem('invotrack_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('invotrack_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, api, login, register, googleLogin, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
