// File: frontend/src/routes/index.tsx
// Version: 1.3.0 (Add route for RegisterPage)

import { Routes, Route, Navigate } from 'react-router-dom';

import PrivateRoute from '../components/PrivateRoute';
import LoginPage from '../pages/LoginPage';
import AdminDashboardPage from '../pages/AdminDashboardPage'; // Layout Admin
import CustomerDashboardPage from '../pages/CustomerDashboardPage';

// Importar componentes hijos del admin
import AdminOverview from '../pages/admin/AdminOverview';
import AdminRewardsManagement from '../pages/admin/AdminRewardsManagement';
import AdminGenerateQr from '../pages/admin/AdminGenerateQr';

// --- CAMBIO: Importar RegisterPage ---
import RegisterPage from '../pages/RegisterPage';
// --- FIN CAMBIO ---


function AppRoutes() {
  return (
    <Routes>
      {/* --- Rutas PUBLICAS --- */}
      <Route path="/login" element={<LoginPage />} />
      {/* --- CAMBIO: Añadir ruta de registro --- */}
      <Route path="/register" element={<RegisterPage />} />
      {/* --- FIN CAMBIO --- */}
      {/* Ruta raíz redirige a login si no está autenticado, o podría redirigir a dashboards */}
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