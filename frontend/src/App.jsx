import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Customer Pages
import TableSelection from './pages/customer/TableSelection';
import MenuCatalog from './pages/customer/MenuCatalog';
import Checkout from './pages/customer/Checkout';
import OrderStatus from './pages/customer/OrderStatus';

// Employee Layout & Pages
import EmployeeLayout from './components/employee/EmployeeLayout';
import EmployeeLogin from './pages/employee/EmployeeLogin';
import CashierOrders from './pages/employee/CashierOrders';
import CashierHistory from './pages/employee/CashierHistory';
import AdminDashboard from './pages/employee/AdminDashboard';
import AdminMenus from './pages/employee/AdminMenus';
import AdminReports from './pages/employee/AdminReports';
import AdminTargets from './pages/employee/AdminTargets';
import AdminTables from './pages/employee/AdminTables';

export default function App() {
  return (
    <BrowserRouter>
      {/* Toast Notification Provider */}
      <Toaster 
        position="top-right" 
        gutter={12}
        containerStyle={{
          top: 24,
          right: 24,
          zIndex: 99999,
        }}
        toastOptions={{ 
          duration: 3500,
          style: {
            background: 'rgba(28, 26, 24, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.7)',
            color: '#F4F3ED',
            padding: '12px 18px',
            borderRadius: '1rem',
            fontSize: '0.85rem',
            fontWeight: '600',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#1c1a18',
            },
            style: {
              border: '1px solid rgba(16, 185, 129, 0.3)',
            },
          },
          error: {
            iconTheme: {
              primary: '#f43f5e',
              secondary: '#1c1a18',
            },
            style: {
              border: '1px solid rgba(244, 63, 94, 0.3)',
            },
          },
        }} 
      />

      <Routes>
        {/* Customer Self-Ordering Flow */}
        <Route path="/" element={<Navigate to="/table-selection" replace />} />
        <Route path="/table-selection" element={<TableSelection />} />
        <Route path="/menu" element={<MenuCatalog />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-status/:id" element={<OrderStatus />} />

        {/* Employee Portal Login */}
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<EmployeeLogin />} />

        {/* Employee Authenticated Pages */}
        <Route element={<EmployeeLayout />}>
          {/* Admin Specific */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/menus" element={<AdminMenus />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/targets" element={<AdminTargets />} />
          <Route path="/admin/tables" element={<AdminTables />} />

          {/* Cashier & Admin Shared */}
          <Route path="/cashier/orders" element={<CashierOrders />} />
          <Route path="/cashier/history" element={<CashierHistory />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/table-selection" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
