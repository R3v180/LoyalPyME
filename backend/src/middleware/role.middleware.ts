// filename: backend/src/middleware/role.middleware.ts
// Version: 1.0.1 (Remove verbose log and inline comments)

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

/**
 * Middleware factory para verificar si el rol del usuario autenticado
 * está incluido en la lista de roles permitidos.
 *
 * @param allowedRoles Un array de UserRole permitidos para la ruta.
 * @returns Una función middleware de Express.
 */
export const checkRole = (allowedRoles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Verifica que authenticateToken haya adjuntado un usuario con rol
        if (!req.user || !req.user.role) {
            console.warn('[Role Middleware] User or user role not found on request. Is authenticateToken running first?');
            return res.status(403).json({ message: 'Acceso denegado: Autenticación requerida o rol no disponible.' });
        }

        const userRole = req.user.role;
        // console.log(`[Role Middleware] Checking role: User has '${userRole}', Allowed: [${allowedRoles.join(', ')}] for route ${req.originalUrl}`); // Log eliminado por verbosidad

        // Comprueba si el rol está permitido
        if (allowedRoles.includes(userRole)) {
            next(); // Rol permitido, continuar
        } else {
            // Rol no permitido
            console.warn(`[Role Middleware] Access Forbidden for role '${userRole}' on route ${req.originalUrl}. Allowed: [${allowedRoles.join(', ')}]`);
            res.status(403).json({ message: 'Acceso denegado: Permisos insuficientes.' });
        }
    };
};

// End of File: backend/src/middleware/role.middleware.ts