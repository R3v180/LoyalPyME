// File: frontend/src/routes/index.tsx
// Version: 1.5.1 (Add route for TierManagementPage)

import { Routes, Route, Navigate } from 'react-router-dom';

import PrivateRoute from '../components/PrivateRoute';
import LoginPage from '../pages/LoginPage';
import AdminDashboardPage from '../pages/AdminDashboardPage'; // Admin Layout/Dashboard
import CustomerDashboardPage from '../pages/CustomerDashboardPage';

// Admin child page components
import AdminOverview from '../pages/admin/AdminOverview';
import AdminRewardsManagement from '../pages/admin/AdminRewardsManagement';
import AdminGenerateQr from '../pages/admin/AdminGenerateQr';
import TierSettingsPage from '../components/admin/tiers/TierSettingsPage';
// --- NUEVO: Importar TierManagementPage ---
import TierManagementPage from '../pages/admin/tiers/TierManagementPage';
// --- FIN NUEVO ---


// Auth page components
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';


function AppRoutes() {
  return (
    <Routes>
      {/* --- Rutas PUBLICAS --- */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* --- Rutas PROTEGIDAS --- */}
      {/* Ruta Admin Principal (Layout con rutas anidadas) */}
      <Route
        path="/admin/dashboard"
        element={
          <PrivateRoute roles={['BUSINESS_ADMIN']}>
            <AdminDashboardPage />
          </PrivateRoute>
        }
      >
        {/* Rutas anidadas */}
        <Route index element={<AdminOverview />} />
        <Route path="rewards" element={<AdminRewardsManagement />} />
        <Route path="generate-qr" element={<AdminGenerateQr />} />
        <Route path="tiers/settings" element={<TierSettingsPage />} />
        {/* --- NUEVO: Añadir ruta para gestión de Tiers --- */}
        <Route path="tiers/manage" element={<TierManagementPage />} /> {/* /admin/dashboard/tiers/manage */}
        {/* --- FIN NUEVO --- */}

        {/* Aquí podrías añadir más rutas anidadas para admin, ej: gestión de Beneficios */}
        {/* <Route path="tiers/:tierId/benefits" element={<TierBenefitsPage />} /> */}

      </Route> {/* Fin de rutas anidadas de Admin */}


        {/* Ruta Cliente */}
        <Route
         path="/customer/dashboard"
         element={
           <PrivateRoute roles={['CUSTOMER_FINAL']}>
             <CustomerDashboardPage />
           </PrivateRoute>
         }
       />

      {/* TODO: Añadir pagina 404 */}
      {/* <Route path="*" element={<NotFoundPage />} /> */}
    </Routes>
  );
}

export default AppRoutes;

// End of File: frontend/src/routes/index.tsx