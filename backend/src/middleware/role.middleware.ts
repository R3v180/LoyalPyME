// File: backend/src/middleware/role.middleware.ts
// Version: 1.0.0 (Initial Role Checking Middleware)

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client'; // Importamos el Enum de roles

/**
 * Middleware factory para verificar si el rol del usuario autenticado
 * está incluido en la lista de roles permitidos.
 *
 * @param allowedRoles Un array de UserRole permitidos para la ruta.
 * @returns Una función middleware de Express.
 */
export const checkRole = (allowedRoles: UserRole[]) => {
  // Devolvemos la función middleware real que Express usará
  return (req: Request, res: Response, next: NextFunction) => {
    // Primero, verificamos que el usuario esté autenticado y su rol esté disponible
    // (authenticateToken debería haberse ejecutado antes)
    if (!req.user || !req.user.role) {
      console.warn('[Role Middleware] User or user role not found on request. Is authenticateToken running first?');
      // Si no hay usuario/rol, algo falló antes, devolvemos 401 o 403
      return res.status(403).json({ message: 'Acceso denegado: Autenticación requerida o rol no disponible.' });
    }

    const userRole = req.user.role;
    console.log(`[Role Middleware] Checking role: User has '${userRole}', Allowed: [${allowedRoles.join(', ')}] for route ${req.originalUrl}`);

    // Comprobamos si el rol del usuario está en la lista de roles permitidos
    if (allowedRoles.includes(userRole)) {
      // El rol es permitido, continuar con el siguiente middleware o handler
      next();
    } else {
      // El rol no es permitido, devolver error 403 Forbidden
      console.warn(`[Role Middleware] Access Forbidden for role '${userRole}' on route ${req.originalUrl}. Allowed: [${allowedRoles.join(', ')}]`);
      res.status(403).json({ message: 'Acceso denegado: Permisos insuficientes.' });
    }
  };
};

// End of File: backend/src/middleware/role.middleware.ts