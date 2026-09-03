import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RestaurantProvider } from './contexts/RestaurantContext';
import ToastProvider from './components/ui/Toast';
import LoginPage from './pages/auth/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import MenuPage from './pages/dashboard/MenuPage';
import QRCodePage from './pages/dashboard/QRCodePage';
import PrintMenuPage from './pages/dashboard/PrintMenuPage';
import CustomerMenuPage from './pages/public/CustomerMenuPage';
import AddItemPage from './pages/dashboard/AddItemPage';
import DashboardHome from './pages/dashboard/DashboardHome';
import OrdersPage from './pages/dashboard/OrdersPage';
import { CartProvider } from './contexts/CartContext';
import type { ReactNode } from 'react';
import { motion } from 'motion/react';

/* ─── Protected Route ─────────────────────────────────── */
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/admin/login" replace />;
}

/* ─── App ─────────────────────────────────────────────── */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RestaurantProvider>
          <CartProvider>
            <ToastProvider />
            <Routes>
              <Route path="/" element={<CustomerMenuPage />} />
              <Route path="/menu/:slug" element={<CustomerMenuPage />} />
              <Route path="/admin/login" element={<LoginPage />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardHome />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="add-item" element={<AddItemPage />} />
                <Route path="menu" element={<MenuPage />} />
              <Route path="qr-menu" element={<QRCodePage />} />
              <Route path="qr" element={<Navigate to="/admin/qr-menu" replace />} />
              <Route path="print-menu" element={<PrintMenuPage />} />
              {/* Legacy redirects — keep old bookmarks working */}
              <Route path="settings" element={<Navigate to="/admin/menu" replace />} />
              <Route path="export" element={<Navigate to="/admin/menu" replace />} />
              <Route path="designer" element={<Navigate to="/admin/menu" replace />} />
              <Route path="pdf" element={<Navigate to="/admin/menu" replace />} />
            </Route>
            <Route path="/menu" element={<Navigate to="/" replace />} />
            <Route path="/login" element={<Navigate to="/admin/login" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </CartProvider>
        </RestaurantProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
