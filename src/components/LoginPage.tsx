import React, { useState } from 'react';
import { Mail, Lock, MessageSquare, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showDemo, setShowDemo] = useState(false);
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Lütfen e-posta ve şifrenizi girin');
      return;
    }

    const success = await login(email, password);
    if (!success) {
      setError('Geçersiz e-posta veya şifre');
    }
  };

  const demoCredentials = [
    { email: 'demo@company.com', password: 'demo123', name: 'Demo Şirket' },
    { email: 'client1@example.com', password: 'password123', name: 'Müşteri 1' },
    { email: 'client2@example.com', password: 'password123', name: 'Müşteri 2' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tekrar Hoş Geldiniz</h1>
          <p className="text-gray-600">Mesajlaşma panelinize giriş yapın</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              E-posta Adresi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="E-posta adresinizi girin"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Şifre
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Şifrenizi girin"
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Giriş Yapılıyor...
              </>
            ) : (
              'Giriş Yap'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={() => setShowDemo(!showDemo)}
            className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            {showDemo ? 'Demo Bilgilerini Gizle' : 'Demo Bilgilerini Göster'}
          </button>
          
          {showDemo && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-gray-500 mb-3">Bilgileri doldurmak için tıklayın:</p>
              {demoCredentials.map((cred, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setEmail(cred.email);
                    setPassword(cred.password);
                  }}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                >
                  <div className="font-medium text-gray-900">{cred.name}</div>
                  <div className="text-gray-600">{cred.email}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;