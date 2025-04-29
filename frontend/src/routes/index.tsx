// filename: frontend/src/routes/index.tsx
// Version: 1.6.5 (Fix encoding, remove meta-comments)

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
      {/* --- Rutas Públicas --- */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register-business" element={<RegisterBusinessPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      {/* Redirige la ruta raíz a login */}
      <Route path="/" element={<Navigate to="/login" replace />} />


      {/* --- Rutas Protegidas (envueltas por MainLayout) --- */}
      <Route
        element={
          // Requiere estar logueado y tener uno de los roles especificados
          <PrivateRoute roles={['BUSINESS_ADMIN', 'CUSTOMER_FINAL']}>
            <MainLayout />
          </PrivateRoute>
        }
      >
        {/* Las siguientes rutas son hijas de MainLayout y se renderizarán en su <Outlet /> */}

        {/* --- Sección Admin --- */}
        {/* Todas estas rutas anidadas requieren implícitamente el rol 'BUSINESS_ADMIN'
            porque PrivateRoute las envuelve, pero también se podría añadir el check de rol específico aquí si fuera necesario */}
        <Route path="/admin/dashboard">
            <Route index element={<AdminOverview />} /> {/* Ruta /admin/dashboard */}
            <Route path="rewards" element={<AdminRewardsManagement />} /> {/* /admin/dashboard/rewards */}
            <Route path="generate-qr" element={<AdminGenerateQr />} /> {/* /admin/dashboard/generate-qr */}
            <Route path="tiers/settings" element={<TierSettingsPage />} /> {/* /admin/dashboard/tiers/settings */}
            <Route path="tiers/manage" element={<TierManagementPage />} /> {/* /admin/dashboard/tiers/manage */}
            <Route path="customers" element={<AdminCustomerManagementPage />} /> {/* /admin/dashboard/customers */}
        </Route> {/* Fin Sección Admin */}


        {/* --- Sección Cliente --- */}
         {/* Requiere rol 'CUSTOMER_FINAL' */}
        <Route
          path="/customer/dashboard"
          element={
              // Podríamos añadir un PrivateRoute específico aquí si quisiéramos ser redundantes
              // o si MainLayout pudiera ser accedido por otros roles sin sub-rutas definidas
              <CustomerDashboardPage />
            }
        />

      </Route> {/* Fin Rutas Protegidas con MainLayout */}


      {/* TODO: Añadir pagina 404 al final */}
      {/* <Route path="*" element={<NotFoundPage />} /> */}

    </Routes>
  );
}

export default AppRoutes;

// End of File: frontend/src/routes/index.tsx