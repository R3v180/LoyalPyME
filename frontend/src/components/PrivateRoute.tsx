// File: frontend/src/components/PrivateRoute.tsx
// Version: 1.0.0

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom'; // Outlet para rutas anidadas, Navigate para redirigir

// Definimos los roles posibles, coincidiendo con el backend
type AppRole = 'SUPER_ADMIN' | 'BUSINESS_ADMIN' | 'CUSTOMER_FINAL';

// Props que espera este componente PrivateRoute
interface PrivateRouteProps {
  roles?: AppRole[]; // Array de roles permitidos para acceder a esta ruta (opcional)
  children?: React.ReactNode; // Los componentes hijos que se renderizaran (la pagina protegida)
}

function PrivateRoute({ roles, children }: PrivateRouteProps) {
  // 1. Verificar si el usuario esta autenticado (existe token en localStorage)
  const token = localStorage.getItem('token');
  // Opcional: verificar si el token es valido o ha expirado (mas complejo)

  // Si no hay token, redirigir al usuario a la pagina de login
  if (!token) {
    // console.log('PrivateRoute: No token found, redirecting to login.'); // Log para debugging
    return <Navigate to="/login" replace />; // 'replace' reemplaza la entrada en el historial
  }

  // 2. Verificar el rol del usuario autenticado (si se especificaron roles permitidos)
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null; // Parsear la informacion del usuario

  // Si no hay informacion del usuario (aunque haya token, situacion rara) o si se requieren roles y el usuario no tiene rol valido
  if (!user || (roles && roles.length > 0 && (!user.role || !roles.includes(user.role)))) {
    // console.log('PrivateRoute: User role not allowed or user info missing, redirecting.'); // Log para debugging
     // Opcional: Limpiar localStorage si el token existe pero el usuario/rol es invalido
     localStorage.removeItem('token');
     localStorage.removeItem('user');
    return <Navigate to="/login" replace />; // Redirigir al login
  }

  // 3. Si el usuario esta autenticado y su rol es permitido, renderizar los componentes hijos
  // Outlet se usa cuando este componente se usa para envolver rutas anidadas, children para un solo componente hijo
  // En nuestro caso, lo usaremos principalmente con 'element' en <Route>, por lo que 'children' es mas directo
  return <>{children || <Outlet />}</>; // Renderiza los hijos (la pagina protegida) si existen, de lo contrario usa Outlet
}

export default PrivateRoute; // Exporta el componente

// End of File: frontend/src/components/PrivateRoute.tsx