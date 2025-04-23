// File: frontend/src/routes/index.tsx
// Version: 1.4.0 (Add route for ResetPasswordPage)

import { Routes, Route, Navigate } from 'react-router-dom';

import PrivateRoute from '../components/PrivateRoute';
import LoginPage from '../pages/LoginPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import CustomerDashboardPage from '../pages/CustomerDashboardPage';

// Admin child components
import AdminOverview from '../pages/admin/AdminOverview';
import AdminRewardsManagement from '../pages/admin/AdminRewardsManagement';
import AdminGenerateQr from '../pages/admin/AdminGenerateQr';

// Auth page components
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage'; // Importamos la página que creamos
// --- CAMBIO: Importar ResetPasswordPage ---
import ResetPasswordPage from '../pages/ResetPasswordPage';
// --- FIN CAMBIO ---


function AppRoutes() {
  return (
    <Routes>
      {/* --- Rutas PUBLICAS --- */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} /> {/* Ruta añadida antes */}
      {/* --- CAMBIO: Añadir ruta de reseteo con token --- */}
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      {/* --- FIN CAMBIO --- */}
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
        <Route index element={<AdminOverview />} />
        <Route path="rewards" element={<AdminRewardsManagement />} />
        <Route path="generate-qr" element={<AdminGenerateQr />} />
      </Route>

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