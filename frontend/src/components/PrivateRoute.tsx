// frontend/src/components/PrivateRoute.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom'; // Añadir useLocation

type AppRole = 'SUPER_ADMIN' | 'BUSINESS_ADMIN' | 'CUSTOMER_FINAL';

interface PrivateRouteProps {
  roles?: AppRole[];
  children?: React.ReactNode;
}

function PrivateRoute({ roles, children }: PrivateRouteProps) {
  const location = useLocation(); // Hook para obtener la ruta actual
  console.log(`[PrivateRoute] Checking route: ${location.pathname}. Required roles: ${roles?.join(', ')}`); // <--- LOG 1

  const token = localStorage.getItem('token');
  if (!token) {
    console.log(`[PrivateRoute] No token for ${location.pathname}. Redirecting to login.`); // <--- LOG 2
    return <Navigate to="/login" replace />;
  }

  const userJson = localStorage.getItem('user');
  let user = null;
  try {
      if(userJson) user = JSON.parse(userJson);
  } catch (e) {
      console.error("[PrivateRoute] Failed to parse user from localStorage", e);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return <Navigate to="/login" replace />;
  }

  console.log(`[PrivateRoute] User data for ${location.pathname}:`, user); // <--- LOG 3

  if (!user || (roles && roles.length > 0 && (!user.role || !roles.includes(user.role)))) {
    console.log(`[PrivateRoute] Role/User check FAILED for ${location.pathname}. User role: ${user?.role}. Required: ${roles?.join(', ')}. Redirecting.`); // <--- LOG 4
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }

  console.log(`[PrivateRoute] Role/User check PASSED for ${location.pathname}. Rendering Outlet/children.`); // <--- LOG 5
  return <>{children || <Outlet />}</>;
}

export default PrivateRoute;