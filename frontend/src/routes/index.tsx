// filename: frontend/src/routes/index.tsx
// --- INICIO DEL CÓDIGO COMPLETO ---
// File: frontend/src/routes/index.tsx
// Version: 1.6.1 (Add route for RegisterBusinessPage)

import { Routes, Route, Navigate } from 'react-router-dom';

// Layout y Protección
import PrivateRoute from '../components/PrivateRoute';
import MainLayout from '../components/layout/MainLayout';

// Páginas Públicas (Autenticación y Registro)
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage'; // Registro de Cliente
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
// *** NUEVO: Importar la página de registro de negocio ***
import RegisterBusinessPage from '../pages/RegisterBusinessPage';

// Página de Cliente
import CustomerDashboardPage from '../pages/CustomerDashboardPage';

// Páginas específicas de Admin (Contenido)
import AdminOverview from '../pages/admin/AdminOverview';
import AdminRewardsManagement from '../pages/admin/AdminRewardsManagement';
import AdminGenerateQr from '../pages/admin/AdminGenerateQr';
import TierSettingsPage from '../pages/admin/tiers/TierSettingsPage';
import TierManagementPage from '../pages/admin/tiers/TierManagementPage';


function AppRoutes() {
  return (
    <Routes>
      {/* --- Rutas PUBLICAS --- */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} /> {/* Registro Cliente */}
      {/* *** NUEVO: Ruta para Registro de Negocio *** */}
      <Route path="/register-business" element={<RegisterBusinessPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      {/* Redirigir la raíz a login por defecto */}
      <Route path="/" element={<Navigate to="/login" replace />} />


      {/* --- Rutas PROTEGIDAS (Usan MainLayout) --- */}
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
            <Route
                index
                element={
                    <PrivateRoute roles={['BUSINESS_ADMIN']}>
                        <AdminOverview />
                    </PrivateRoute>
                }
            />
            <Route
                path="rewards"
                element={
                    <PrivateRoute roles={['BUSINESS_ADMIN']}>
                        <AdminRewardsManagement />
                    </PrivateRoute>
                }
            />
            <Route
                path="generate-qr"
                element={
                    <PrivateRoute roles={['BUSINESS_ADMIN']}>
                        <AdminGenerateQr />
                    </PrivateRoute>
                }
            />
            <Route
                 path="tiers/settings"
                 element={
                     <PrivateRoute roles={['BUSINESS_ADMIN']}>
                         <TierSettingsPage />
                     </PrivateRoute>
                 }
             />
             <Route
                 path="tiers/manage"
                 element={
                     <PrivateRoute roles={['BUSINESS_ADMIN']}>
                         <TierManagementPage />
                     </PrivateRoute>
                 }
             />
        </Route> {/* Fin Sección Admin */}


        {/* --- Sección Cliente --- */}
        <Route
          path="/customer/dashboard"
          element={
            <PrivateRoute roles={['CUSTOMER_FINAL']}>
              <CustomerDashboardPage />
            </PrivateRoute>
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
// --- FIN DEL CÓDIGO COMPLETO ---