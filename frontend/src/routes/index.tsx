// filename: frontend/src/routes/index.tsx
// Version: 1.6.4 (Add route for AdminCustomerManagementPage)

import { Routes, Route, Navigate } from 'react-router-dom';

// Layout y Protección
import PrivateRoute from '../components/PrivateRoute';
import MainLayout from '../components/layout/MainLayout';

// Páginas Públicas
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import RegisterBusinessPage from '../pages/RegisterBusinessPage';

// Página de Cliente
import CustomerDashboardPage from '../pages/CustomerDashboardPage';

// Páginas específicas de Admin
import AdminOverview from '../pages/admin/AdminOverview';
import AdminRewardsManagement from '../pages/admin/AdminRewardsManagement';
import AdminGenerateQr from '../pages/admin/AdminGenerateQr';
import TierSettingsPage from '../pages/admin/tiers/TierSettingsPage';
import TierManagementPage from '../pages/admin/tiers/TierManagementPage';
import AdminCustomerManagementPage from '../pages/admin/AdminCustomerManagementPage'; // <-- IMPORTACIÓN AÑADIDA

function AppRoutes() {
  return (
    <Routes>
      {/* --- Rutas PUBLICAS --- */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register-business" element={<RegisterBusinessPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />


      {/* --- Rutas PROTEGIDAS (envueltas por MainLayout) --- */}
      <Route
        element={
          <PrivateRoute roles={['BUSINESS_ADMIN', 'CUSTOMER_FINAL']}>
            <MainLayout />
          </PrivateRoute>
        }
      >
        {/* Las siguientes rutas son hijas de MainLayout y se renderizarán en su <Outlet /> */}

        {/* --- Sección Admin --- */}
        <Route path="/admin/dashboard">
            <Route index element={<AdminOverview />} />
            <Route path="rewards" element={<AdminRewardsManagement />} />
            <Route path="generate-qr" element={<AdminGenerateQr />} />
            <Route path="tiers/settings" element={<TierSettingsPage />} />
            <Route path="tiers/manage" element={<TierManagementPage />} />
            {/* --- RUTA AÑADIDA --- */}
            <Route path="customers" element={<AdminCustomerManagementPage />} />
            {/* -------------------- */}
        </Route> {/* Fin Sección Admin */}


        {/* --- Sección Cliente --- */}
        <Route
          path="/customer/dashboard"
          element={<CustomerDashboardPage />}
        />

      </Route> {/* Fin Rutas Protegidas con MainLayout */}


      {/* TODO: Añadir pagina 404 al final */}
      {/* <Route path="*" element={<NotFoundPage />} /> */}

    </Routes>
  );
}

export default AppRoutes;

// End of File: frontend/src/routes/index.tsx