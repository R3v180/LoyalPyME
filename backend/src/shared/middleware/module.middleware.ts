// backend/src/middleware/module.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Definimos los códigos de módulo que usaremos.
// Podrías expandir esto o usar un Enum de Prisma si los módulos se vuelven más complejos.
export type ModuleCode = 'LOYALTY_CORE' | 'CAMARERO';

/**
 * Middleware factory para verificar si un módulo específico está activo para el negocio
 * del usuario autenticado.
 *
 * @param moduleCode El código del módulo a verificar.
 * @returns Una función middleware de Express.
 */
export const checkModuleActive = (moduleCode: ModuleCode) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Asumimos que authenticateToken ya se ejecutó y req.user y req.user.businessId existen.
    // El rol ya debería haber sido verificado por checkRole si es necesario para la ruta.
    if (!req.user || !req.user.businessId) {
      console.warn('[ModuleMiddleware] User or businessId missing from request. Is authenticateToken running first?');
      return res.status(403).json({ message: 'Acceso denegado. No se pudo identificar el negocio para la verificación del módulo.' });
    }

    const businessId = req.user.businessId;

    try {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: {
          isLoyaltyCoreActive: true,
          isCamareroActive: true,
          // Podríamos seleccionar también business.isActive aquí si quisiéramos
          // que un módulo no funcione si el negocio entero está inactivo,
          // pero eso se puede manejar en checkRole o un middleware de estado de negocio.
        }
      });

      if (!business) {
        // Esto sería raro si el token es válido y tiene un businessId.
        console.warn(`[ModuleMiddleware] Business with ID ${businessId} not found during module check.`);
        return res.status(404).json({ message: 'Negocio asociado no encontrado.' });
      }

      let moduleIsCurrentlyActive = false;
      if (moduleCode === 'LOYALTY_CORE') {
        moduleIsCurrentlyActive = business.isLoyaltyCoreActive;
      } else if (moduleCode === 'CAMARERO') {
        moduleIsCurrentlyActive = business.isCamareroActive;
      } else {
        // Código de módulo desconocido, por seguridad denegar.
        console.error(`[ModuleMiddleware] Unknown moduleCode specified: ${moduleCode}`);
        return res.status(500).json({ message: 'Error interno: Código de módulo no reconocido.' });
      }

      if (moduleIsCurrentlyActive) {
        next(); // El módulo está activo, continuar.
      } else {
        console.log(`[ModuleMiddleware] Access denied. Module '${moduleCode}' is not active for business ${businessId}.`);
        return res.status(403).json({ message: `Acceso denegado. El módulo ${moduleCode} no está activo para este negocio.` });
      }
    } catch (error) {
      console.error(`[ModuleMiddleware] Error checking module '${moduleCode}' for business ${businessId}:`, error);
      return res.status(500).json({ message: 'Error interno al verificar el estado del módulo.' });
    }
  };
};