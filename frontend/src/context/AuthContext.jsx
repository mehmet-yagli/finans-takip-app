import { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

// ESLint uyarısını susturuyoruz (Fast Refresh kuralı için)
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserLoggedIn = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
        } catch (error) {
          // Hatayı konsola yazdırıyoruz ki "unused variable" uyarısı gitsin
          console.error("Oturum kontrol hatası:", error);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkUserLoggedIn();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      toast.success('Giriş başarılı! Hoş geldin.');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Giriş başarısız');
      return false;
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await api.post('/auth/register', { name, email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      toast.success('Kayıt başarılı! Aramıza hoş geldin.');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Kayıt başarısız');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.success('Çıkış yapıldı');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};