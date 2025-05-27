// frontend/src/components/PrivateRoute.tsx
// Version: (nueva versión, ej: 1.1.0 - Use UserRole enum from types/customer)
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
// --- NUEVO: Importar UserRole desde types/customer ---
import { UserRole } from '../types/customer'; // Ajusta la ruta si es necesario
// --- FIN NUEVO ---

interface PrivateRouteProps {
  // --- CAMBIO: Usar el enum UserRole importado ---
  allowedRoles?: UserRole[]; // Antes era AppRole[]
  // --- FIN CAMBIO ---
  children?: React.ReactNode;
}

function PrivateRoute({ allowedRoles, children }: PrivateRouteProps) {
  const location = useLocation(); 
  // console.log(`[PrivateRoute] Checking route: ${location.pathname}. Required roles: ${allowedRoles?.join(', ')}`); 

  const token = localStorage.getItem('token');
  if (!token) {
    // console.log(`[PrivateRoute] No token for ${location.pathname}. Redirecting to login.`); 
    return <Navigate to="/login" state={{ from: location }} replace />; // Añadir state para posible redirección post-login
  }

  const userJson = localStorage.getItem('user');
  let user = null;
  try {
      if(userJson) user = JSON.parse(userJson);
  } catch (e) {
      console.error("[PrivateRoute] Failed to parse user from localStorage", e);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // console.log(`[PrivateRoute] User data for ${location.pathname}:`, user); 

  // --- CAMBIO: Lógica de verificación de roles ---
  if (!user || (allowedRoles && allowedRoles.length > 0 && (!user.role || !allowedRoles.includes(user.role as UserRole)))) {
  // --- FIN CAMBIO ---
    // console.log(`[PrivateRoute] Role/User check FAILED for ${location.pathname}. User role: ${user?.role}. Required: ${allowedRoles?.join(', ')}. Redirecting.`); 
    // No quitar token/user aquí necesariamente, podría ser un intento de acceso a ruta no permitida con sesión válida.
    // Dejar que el login maneje la invalidez del token si es el caso.
    // Si es solo problema de rol, redirigir a una página de "no autorizado" o a la raíz sería mejor que a /login.
    // Por ahora, para simplificar, redirigimos a una ruta base según el rol o a login si no hay rol.
    const fallbackPath = user?.role === UserRole.BUSINESS_ADMIN ? '/admin/dashboard' 
                       : user?.role === UserRole.CUSTOMER_FINAL ? '/customer/dashboard' 
                       : user?.role === UserRole.SUPER_ADMIN ? '/superadmin'
                       : '/login'; // Fallback si el rol no es ninguno de los esperados o no hay rol
    return <Navigate to={fallbackPath} replace />;
  }

  // console.log(`[PrivateRoute] Role/User check PASSED for ${location.pathname}. Rendering Outlet/children.`); 
  return <>{children || <Outlet />}</>;
}

export default PrivateRoute;