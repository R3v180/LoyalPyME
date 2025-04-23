// filename: frontend/src/routes/index.tsx
// --- INICIO DEL CÓDIGO COMPLETO ---
// File: frontend/src/routes/index.tsx
// Version: 1.6.0 (Implement MainLayout for protected routes)

import { Routes, Route, Navigate } from 'react-router-dom';

// Layout y Protección
import PrivateRoute from '../components/PrivateRoute';
import MainLayout from '../components/layout/MainLayout'; // <-- NUEVO: Importar MainLayout

// Páginas Públicas (Autenticación)
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';

// Página de Cliente
import CustomerDashboardPage from '../pages/CustomerDashboardPage';

// Páginas específicas de Admin (Contenido)
// Ya no necesitamos AdminDashboardPage como layout aquí
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
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      {/* Redirigir la raíz a login por defecto */}
      <Route path="/" element={<Navigate to="/login" replace />} />


      {/* --- Rutas PROTEGIDAS (Usan MainLayout) --- */}
      <Route
        element={
          // 1. PrivateRoute verifica si el usuario está logueado (cualquier rol permitido aquí)
          // 2. Si está logueado, renderiza MainLayout
          // 3. MainLayout contiene el <Outlet> donde se renderizarán las rutas hijas
          <PrivateRoute roles={['BUSINESS_ADMIN', 'CUSTOMER_FINAL']}>
            <MainLayout />
          </PrivateRoute>
        }
      >
        {/* Las siguientes rutas son hijas de MainLayout y se renderizarán en su <Outlet /> */}

        {/* --- Sección Admin --- */}
        {/* Ruta padre para agrupar, ya no necesita elemento porque MainLayout hace de layout */}
        <Route path="/admin/dashboard">
            {/* Cada ruta hija DEBE verificar el rol específico */}
            <Route
                index // Ruta por defecto /admin/dashboard
                element={
                    <PrivateRoute roles={['BUSINESS_ADMIN']}>
                        <AdminOverview />
                    </PrivateRoute>
                }
            />
            <Route
                path="rewards" // -> /admin/dashboard/rewards
                element={
                    <PrivateRoute roles={['BUSINESS_ADMIN']}>
                        <AdminRewardsManagement />
                    </PrivateRoute>
                }
            />
            <Route
                path="generate-qr" // -> /admin/dashboard/generate-qr
                element={
                    <PrivateRoute roles={['BUSINESS_ADMIN']}>
                        <AdminGenerateQr />
                    </PrivateRoute>
                }
            />
            <Route
                 path="tiers/settings" // -> /admin/dashboard/tiers/settings
                 element={
                     <PrivateRoute roles={['BUSINESS_ADMIN']}>
                         <TierSettingsPage />
                     </PrivateRoute>
                 }
             />
             <Route
                 path="tiers/manage" // -> /admin/dashboard/tiers/manage
                 element={
                     <PrivateRoute roles={['BUSINESS_ADMIN']}>
                         <TierManagementPage />
                     </PrivateRoute>
                 }
             />
             {/* Añadir más rutas de admin aquí si es necesario */}
        </Route> {/* Fin Sección Admin */}


        {/* --- Sección Cliente --- */}
        <Route
          path="/customer/dashboard"
          element={
            // Verificar rol específico de cliente
            <PrivateRoute roles={['CUSTOMER_FINAL']}>
              <CustomerDashboardPage />
            </PrivateRoute>
          }
        />
        {/* Añadir más rutas de cliente aquí si es necesario */}


      </Route> {/* Fin Rutas Protegidas con MainLayout */}


      {/* TODO: Añadir pagina 404 al final */}
      {/* <Route path="*" element={<NotFoundPage />} /> */}

    </Routes>
  );
}

export default AppRoutes;

// End of File: frontend/src/routes/index.tsx
// --- FIN DEL CÓDIGO COMPLETO ---