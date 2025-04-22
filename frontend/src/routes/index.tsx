// File: frontend/src/routes/index.tsx
// Version: 1.0.5 (Re-integrating Customer Page)

import { Routes, Route, Navigate } from 'react-router-dom';

import PrivateRoute from '../components/PrivateRoute';
import LoginPage from '../pages/LoginPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import CustomerDashboardPage from '../pages/CustomerDashboardPage'; // Importamos la página del cliente


function AppRoutes() {
  return (
    <Routes>
      {/* Ruta PUBLICA */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* --- Rutas PROTEGIDAS --- */}
      <Route
        path="/admin/dashboard"
        element={
          <PrivateRoute roles={['BUSINESS_ADMIN']}>
            <AdminDashboardPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/customer/dashboard"
        element={
          <PrivateRoute roles={['CUSTOMER_FINAL']}>
            {/* Ahora renderiza el componente CustomerDashboardPage real */}
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