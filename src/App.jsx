import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Layout from './components/Layout';
import { useState } from 'react';
import './App.css';

function PrivateRoute({ children }) {
  const { admin, loading } = useAuth();
  if (loading) return <div className="loading-full">در حال بارگذاری...</div>;
  return admin ? children : <Navigate to="/login" />;
}

function AppContent() {
  const [activeTab, setActiveTab] = useState('users');
  return (
    <PrivateRoute>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab} />
    </PrivateRoute>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<AppContent />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;