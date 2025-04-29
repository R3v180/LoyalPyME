// filename: frontend/src/components/PrivateRoute.tsx
// Version: 1.0.1 (Remove commented logs)

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// Definimos los roles posibles, coincidiendo con el backend
// TODO: Considerar mover AppRole a un archivo de tipos compartido
type AppRole = 'SUPER_ADMIN' | 'BUSINESS_ADMIN' | 'CUSTOMER_FINAL';

// Props que espera este componente PrivateRoute
interface PrivateRouteProps {
  roles?: AppRole[]; // Array de roles permitidos para acceder a esta ruta (opcional)
  children?: React.ReactNode; // Componente a renderizar si está autorizado
}

function PrivateRoute({ roles, children }: PrivateRouteProps) {
  // 1. Verificar si el usuario está autenticado (existe token en localStorage)
  const token = localStorage.getItem('token');
  // Opcional: verificar si el token es válido o ha expirado (más complejo, requeriría decodificarlo o una llamada API)

  // Si no hay token, redirigir al usuario a la página de login
  if (!token) {
    // console.log('PrivateRoute: No token found, redirecting to login.'); // Log eliminado
    return <Navigate to="/login" replace />; // 'replace' evita añadir la ruta protegida al historial
  }

  // 2. Verificar el rol del usuario autenticado (si se especificaron roles permitidos)
  const userJson = localStorage.getItem('user');
  let user = null;
  try {
      if(userJson) user = JSON.parse(userJson);
  } catch (e) {
      console.error("Failed to parse user from localStorage", e);
      // Si el usuario está corrupto, limpiar y redirigir
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return <Navigate to="/login" replace />;
  }


  // Si no hay información del usuario O si se requieren roles y el usuario no tiene un rol válido
  if (!user || (roles && roles.length > 0 && (!user.role || !roles.includes(user.role)))) {
    // console.log('PrivateRoute: User role not allowed or user info missing, redirecting.'); // Log eliminado
     // Limpiar localStorage por si el token existe pero el usuario/rol es inválido
     localStorage.removeItem('token');
     localStorage.removeItem('user');
    return <Navigate to="/login" replace />; // Redirigir al login
  }

  // 3. Si el usuario está autenticado y su rol es permitido, renderizar el contenido
  // Si 'children' se proporciona explícitamente (como en <PrivateRoute><MiPagina /></PrivateRoute>), se renderiza.
  // Si no, se usa <Outlet /> para renderizar rutas anidadas (como en nuestro AppRoutes).
  return <>{children || <Outlet />}</>;
}

export default PrivateRoute;

// End of File: frontend/src/components/PrivateRoute.tsx