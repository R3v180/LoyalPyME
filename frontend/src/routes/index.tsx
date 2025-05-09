// frontend/src/routes/index.tsx
// --- MODIFICACIÓN: Añadir Outlet a la importación ---
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
// --- FIN MODIFICACIÓN ---

// Layouts y Protección
import PrivateRoute from '../components/PrivateRoute';
import MainLayout from '../components/layout/MainLayout';
import PublicLayout from '../components/layout/PublicLayout';

// Páginas Públicas
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import RegisterBusinessPage from '../pages/RegisterBusinessPage';

// Página de Cliente
import CustomerDashboardPage from '../pages/CustomerDashboardPage';

// Páginas Específicas de Admin (Business Admin)
import AdminOverview from '../pages/admin/AdminOverview';
import AdminRewardsManagement from '../pages/admin/AdminRewardsManagement';
import AdminGenerateQr from '../pages/admin/AdminGenerateQr';
import TierSettingsPage from '../pages/admin/tiers/TierSettingsPage';
import TierManagementPage from '../pages/admin/tiers/TierManagementPage';
import AdminCustomerManagementPage from '../pages/admin/AdminCustomerManagementPage';

import SuperAdminPage from '../pages/admin/SuperAdminPage';


function AppRoutes() {
  return (
    <Routes>
      {/* Rutas Públicas (usan PublicLayout) */}
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register-business" element={<RegisterBusinessPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Route>

      {/* Rutas Protegidas (usan MainLayout y PrivateRoute) */}
      <Route element={<MainLayout />}>

        {/* Rutas para SUPER_ADMIN */}
        <Route
            path="/superadmin"
            element={
                <PrivateRoute roles={['SUPER_ADMIN']}>
                    <SuperAdminPage />
                </PrivateRoute>
            }
        />

        {/* Rutas para BUSINESS_ADMIN */}
        <Route
            path="/admin/dashboard"
            element={
                <PrivateRoute roles={['BUSINESS_ADMIN']}>
                    <Outlet /> {/* Outlet aquí para renderizar las sub-rutas de admin */}
                </PrivateRoute>
            }
        >
            <Route index element={<AdminOverview />} />
            <Route path="rewards" element={<AdminRewardsManagement />} />
            <Route path="generate-qr" element={<AdminGenerateQr />} />
            <Route path="tiers/settings" element={<TierSettingsPage />} />
            <Route path="tiers/manage" element={<TierManagementPage />} />
            <Route path="customers" element={<AdminCustomerManagementPage />} />
        </Route>

        {/* Rutas para CUSTOMER_FINAL */}
        <Route
            path="/customer/dashboard"
            element={
                <PrivateRoute roles={['CUSTOMER_FINAL']}>
                    <CustomerDashboardPage />
                </PrivateRoute>
            }
        />

      </Route>

      {/* <Route path="*" element={<NotFoundPage />} /> */}

    </Routes>
  );
}

export default AppRoutes;