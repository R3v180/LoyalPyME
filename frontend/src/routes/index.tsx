// File: frontend/src/routes/index.tsx
// Version: 1.0.3

// CORRECCIÓN: No es necesario importar React explícitamente aquí
// import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import PrivateRoute from '../components/PrivateRoute';
import LoginPage from '../pages/LoginPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';

// import CustomerPortalPage from '../pages/CustomerPortalPage';


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
            <p>Customer Portal - Esta ruta está protegida y requiere rol CUSTOMER_FINAL</p>
            {/* <CustomerPortalPage /> */}
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