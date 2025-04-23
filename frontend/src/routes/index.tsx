// File: frontend/src/routes/index.tsx
// Version: 1.2.0 (Use real components for nested admin routes)

import { Routes, Route, Navigate } from 'react-router-dom';

import PrivateRoute from '../components/PrivateRoute';
import LoginPage from '../pages/LoginPage';
import AdminDashboardPage from '../pages/AdminDashboardPage'; // Layout Admin
import CustomerDashboardPage from '../pages/CustomerDashboardPage';

// --- CAMBIO: Importar componentes hijos reales ---
import AdminOverview from '../pages/admin/AdminOverview';
import AdminRewardsManagement from '../pages/admin/AdminRewardsManagement';
import AdminGenerateQr from '../pages/admin/AdminGenerateQr';
// --- FIN CAMBIO ---

// --- CAMBIO: Eliminar componentes Placeholder ---
// const AdminOverviewPlaceholder: React.FC = () => ...; // ELIMINADO
// const AdminRewardsPlaceholder: React.FC = () => ...; // ELIMINADO
// const AdminGenerateQrPlaceholder: React.FC = () => ...; // ELIMINADO
// --- FIN CAMBIO ---


function AppRoutes() {
  return (
    <Routes>
      {/* Ruta PUBLICA */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* --- Ruta Admin Principal (Layout con rutas anidadas) --- */}
      <Route
        path="/admin/dashboard"
        element={
          <PrivateRoute roles={['BUSINESS_ADMIN']}>
             <AdminDashboardPage />
          </PrivateRoute>
        }
      >
        {/* --- CAMBIO: Usar componentes hijos reales --- */}
        <Route index element={<AdminOverview />} /> {/* Ruta '/admin/dashboard' */}
        <Route path="rewards" element={<AdminRewardsManagement />} /> {/* Ruta '/admin/dashboard/rewards' */}
        <Route path="generate-qr" element={<AdminGenerateQr />} /> {/* Ruta '/admin/dashboard/generate-qr' */}
        {/* --- FIN CAMBIO --- */}
      </Route>
      {/* --- Fin Ruta Admin --- */}


       {/* Ruta Cliente (sin cambios) */}
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