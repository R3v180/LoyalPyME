// frontend/src/shared/components/PrivateRoute.tsx (CORREGIDO)
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

// --- RUTA Y NOMBRE CORREGIDOS ---
import { UserRole } from '../types/user.types';
// --- FIN CORRECCIÓN ---


interface PrivateRouteProps {
  allowedRoles?: UserRole[];
  children?: React.ReactNode;
}

function PrivateRoute({ allowedRoles, children }: PrivateRouteProps) {
  const location = useLocation();

  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
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

  if (!user || (allowedRoles && allowedRoles.length > 0 && (!user.role || !allowedRoles.includes(user.role as UserRole)))) {
    const fallbackPath = user?.role === UserRole.BUSINESS_ADMIN ? '/admin/dashboard'
                       : user?.role === UserRole.CUSTOMER_FINAL ? '/customer/dashboard'
                       : user?.role === UserRole.SUPER_ADMIN ? '/superadmin'
                       // --- AÑADIDO: Redirección para roles de staff ---
                       : user?.role === UserRole.WAITER ? '/admin/camarero/pickup'
                       : user?.role === UserRole.KITCHEN_STAFF || user.role === UserRole.BAR_STAFF ? '/admin/kds'
                       // --- FIN AÑADIDO ---
                       : '/login';
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children || <Outlet />}</>;
}

export default PrivateRoute;