// filename: frontend/src/routes/index.tsx
// Version: 1.7.0 (Introduce PublicLayout for public routes)

import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts y Protección
import PrivateRoute from '../components/PrivateRoute';
import MainLayout from '../components/layout/MainLayout';
import PublicLayout from '../components/layout/PublicLayout'; // <-- Importar nuevo layout

// Páginas Públicas
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import RegisterBusinessPage from '../pages/RegisterBusinessPage';

// Página de Cliente
import CustomerDashboardPage from '../pages/CustomerDashboardPage';

// Páginas Específicas de Admin
import AdminOverview from '../pages/admin/AdminOverview';
import AdminRewardsManagement from '../pages/admin/AdminRewardsManagement';
import AdminGenerateQr from '../pages/admin/AdminGenerateQr';
import TierSettingsPage from '../pages/admin/tiers/TierSettingsPage';
import TierManagementPage from '../pages/admin/tiers/TierManagementPage';
import AdminCustomerManagementPage from '../pages/admin/AdminCustomerManagementPage';


function AppRoutes() {
  return (
    <Routes>
      {/* --- Rutas Públicas (AHORA usan PublicLayout) --- */}
      <Route element={<PublicLayout />}> {/* Envuelve rutas públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register-business" element={<RegisterBusinessPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        {/* Redirige la ruta raíz a login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Route>
      {/* --- Fin Rutas Públicas --- */}


      {/* --- Rutas Protegidas (Siguen usando MainLayout) --- */}
      <Route
        element={
          <PrivateRoute roles={['BUSINESS_ADMIN', 'CUSTOMER_FINAL']}>
            <MainLayout />
          </PrivateRoute>
        }
      >
        {/* Las rutas hijas se renderizan en el <Outlet /> de MainLayout */}

        {/* Sección Admin */}
        <Route path="/admin/dashboard">
            <Route index element={<AdminOverview />} />
            <Route path="rewards" element={<AdminRewardsManagement />} />
            <Route path="generate-qr" element={<AdminGenerateQr />} />
            <Route path="tiers/settings" element={<TierSettingsPage />} />
            <Route path="tiers/manage" element={<TierManagementPage />} />
            <Route path="customers" element={<AdminCustomerManagementPage />} />
        </Route>

        {/* Sección Cliente */}
        <Route
          path="/customer/dashboard"
          element={<CustomerDashboardPage />}
        />

      </Route>
      {/* --- Fin Rutas Protegidas --- */}

      {/* TODO: Pagina 404 */}
      {/* <Route path="*" element={<NotFoundPage />} /> */}

    </Routes>
  );
}

export default AppRoutes;

// End of File: frontend/src/routes/index.tsx