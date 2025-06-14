import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import DashboardLayout from './components/DashboardLayout';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  
  return user ? <DashboardLayout /> : <LoginPage />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;