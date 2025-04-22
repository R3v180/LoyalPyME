// File: frontend/src/routes/index.tsx
// Version: 1.0.0

import React from 'react';
// Importa los componentes de rutas de react-router-dom
import { Routes, Route, Navigate } from 'react-router-dom';

// Importa las paginas (componentes de pagina completa)
import LoginPage from '../pages/LoginPage'; // Importa la pagina de Login

// TODO: Importar otras paginas cuando las creemos (AdminDashboardPage, CustomerPortalPage, etc.)
// import AdminDashboardPage from '../pages/AdminDashboardPage';
// import CustomerPortalPage from '../pages/pages/CustomerPortalPage';


function AppRoutes() {
  // Componente que define todas las rutas de la aplicacion
  return (
    <Routes>
      {/* Ruta para la pagina de Login */}
      <Route path="/login" element={<LoginPage />} />

      {/* Ruta de redireccion: si alguien va a la raiz '/', lo redirigimos al login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* TODO: Añadir rutas protegidas para el Panel Admin y el Portal Cliente en el futuro */}
      {/* Ejemplo de ruta protegida (Admin): */}
      {/* <Route
            path="/admin/dashboard"
            element={
              // Aqui pondriamos un componente que verifica si el usuario es admin y autenticado
              // <PrivateRoute roles={['BUSINESS_ADMIN']}>
                 <AdminDashboardPage />
              // </PrivateRoute>
            }
          /> */}

      {/* Ejemplo de ruta protegida (Cliente): */}
      {/* <Route
            path="/customer/dashboard"
            element={
              // Aqui pondriamos un componente que verifica si el usuario es cliente y autenticado
              // <PrivateRoute roles={['CUSTOMER_FINAL']}>
                 <CustomerPortalPage />
              // </PrivateRoute>
            }
          /> */}

      {/* TODO: Añadir una pagina 404 Not Found */}
      {/* <Route path="*" element={<NotFoundPage />} /> */}

    </Routes>
  );
}

export default AppRoutes; // Exporta el componente que define las rutas

// End of File: frontend/src/routes/index.tsx