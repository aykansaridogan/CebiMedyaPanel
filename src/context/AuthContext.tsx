// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContextType, User } from '../types';
import { loginUser as apiLoginUser } from '../services/api'; // Yeni api servisinden import et

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('dashboard_user');
    const savedToken = localStorage.getItem('jwt_token'); // Token'ı da kontrol et
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        // Eğer token süresi dolmuşsa veya geçersizse backend 401 döndürecek,
        // o zaman fetchApi fonksiyonumuz logout işlemini tetikleyecek.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        localStorage.removeItem('dashboard_user');
        localStorage.removeItem('jwt_token');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Mock data yerine gerçek API çağrısını kullan
      const data = await apiLoginUser(email, password);
      
      if (data) {
        setUser(data.user);
        localStorage.setItem('dashboard_user', JSON.stringify(data.user));
        localStorage.setItem('jwt_token', data.token); // JWT token'ı kaydet
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('dashboard_user');
    localStorage.removeItem('jwt_token'); // Çıkış yaparken token'ı da sil
    // Opsiyonel: Backend'e de logout isteği gönderebilirsin
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};