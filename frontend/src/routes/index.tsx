// filename: frontend/src/routes/index.tsx
// Version: 1.6.3 (Use MainLayout for all authenticated routes)

import { Routes, Route, Navigate } from 'react-router-dom';

// Layout y Protección
import PrivateRoute from '../components/PrivateRoute';
import MainLayout from '../components/layout/MainLayout'; // <-- Usaremos este layout principal
// Ya NO necesitamos importar AdminDashboardPage aquí, MainLayout lo gestiona

// Páginas Públicas
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import RegisterBusinessPage from '../pages/RegisterBusinessPage';

// Página de Cliente (se renderizará dentro de MainLayout)
import CustomerDashboardPage from '../pages/CustomerDashboardPage';

// Páginas específicas de Admin (se renderizarán dentro de MainLayout)
import AdminOverview from '../pages/admin/AdminOverview';
import AdminRewardsManagement from '../pages/admin/AdminRewardsManagement';
import AdminGenerateQr from '../pages/admin/AdminGenerateQr';
import TierSettingsPage from '../pages/admin/tiers/TierSettingsPage';
import TierManagementPage from '../pages/admin/tiers/TierManagementPage';


function AppRoutes() {
  return (
    <Routes>
      {/* --- Rutas PUBLICAS (sin cambios) --- */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register-business" element={<RegisterBusinessPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />


      {/* --- Rutas PROTEGIDAS --- */}
      {/* AHORA MainLayout envuelve TODAS las rutas que requieren login */}
      <Route
        element={
          <PrivateRoute roles={['BUSINESS_ADMIN', 'CUSTOMER_FINAL']}>
            <MainLayout /> {/* <- El layout principal con Header y Outlet */}
          </PrivateRoute>
        }
      >
        {/* Las siguientes rutas son hijas de MainLayout y se renderizarán en su <Outlet /> */}

        {/* --- Sección Admin --- */}
        {/* La ruta padre ya NO necesita 'element', solo define el path */}
        <Route path="/admin/dashboard">
            {/* MainLayout mostrará la Navbar de admin aquí porque la ruta empieza con /admin/dashboard */}
            <Route index element={<AdminOverview />} />
            <Route path="rewards" element={<AdminRewardsManagement />} />
            <Route path="generate-qr" element={<AdminGenerateQr />} />
            <Route path="tiers/settings" element={<TierSettingsPage />} />
            <Route path="tiers/manage" element={<TierManagementPage />} />
            {/* Otras sub-rutas de admin */}
        </Route> {/* Fin Sección Admin */}


        {/* --- Sección Cliente --- */}
        {/* MainLayout NO mostrará la Navbar de admin aquí */}
        <Route
          path="/customer/dashboard"
          element={<CustomerDashboardPage />} // Renderiza directamente la página del cliente en el Outlet de MainLayout
        />

        {/* Si hubiera más rutas protegidas generales, irían aquí */}

      </Route> {/* Fin Rutas Protegidas con MainLayout */}


      {/* TODO: Añadir pagina 404 al final */}
      {/* <Route path="*" element={<NotFoundPage />} /> */}

    </Routes>
  );
}

export default AppRoutes;

// End of File: frontend/src/routes/index.tsx