import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layout
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cashier from './pages/Cashier';
import Inventory from './pages/Inventory';
import Kasbon from './pages/Kasbon';
import TransactionHistory from './pages/TransactionHistory';
import ExpensePage from './pages/ExpensePage';

// Pelindung Halaman Private: Redirect jika tidak ada token
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      {/* Provider Toast Notification 3D Glassmorphism */}
      <Toaster 
        position="top-right" 
        gutter={12}
        containerStyle={{
          top: 24,
          right: 24,
          zIndex: 99999,
        }}
        toastOptions={{ 
          duration: 4000,
          style: {
            background: 'rgba(28, 26, 24, 0.88)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
            color: '#F4F3ED',
            padding: '14px 20px',
            borderRadius: '1.25rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            letterSpacing: '0.01em',
          },
          success: {
            iconTheme: {
              primary: '#4ade80',
              secondary: '#1a1816',
            },
            style: {
              border: '1px solid rgba(74, 222, 128, 0.3)',
              boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(74, 222, 128, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.15)',
            },
          },
          error: {
            iconTheme: {
              primary: '#f87171',
              secondary: '#1a1816',
            },
            style: {
              border: '1px solid rgba(248, 113, 113, 0.3)',
              boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(248, 113, 113, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.15)',
            },
          },
          loading: {
            iconTheme: {
              primary: '#F4F3ED',
              secondary: '#1a1816',
            },
            style: {
              border: '1px solid rgba(244, 243, 237, 0.2)',
            },
          },
        }} 
      />

      <Routes>
        {/* Route Login */}
        <Route path="/login" element={<Login />} />

        {/* Route Panel Utama yang Dilindungi */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="cashier" element={<Cashier />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="kasbon" element={<Kasbon />} />
          <Route path="history" element={<TransactionHistory />} />
          <Route path="expenses" element={<ExpensePage />} />
        </Route>

        {/* Arahkan Rute Tak Dikenal ke Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
