// filename: backend/src/admin/admin-stats.controller.ts
// Version: 1.0.0

import { Request, Response, NextFunction } from 'express';
// Importamos la función del servicio que acabamos de crear
import { getOverviewStats, AdminOverviewStatsData } from './admin-stats.service';

/**
 * Handler para obtener las estadísticas del overview para el dashboard del admin.
 * GET /api/admin/stats/overview
 */
export const handleGetOverviewStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // El middleware 'authenticateToken' ya debería haber añadido req.user
  // El middleware 'checkRole' ya debería haber verificado que es BUSINESS_ADMIN
  const businessId = req.user?.businessId;

  console.log(`[AdminStatsController] Solicitud de overview stats para businessId: ${businessId}`);

  // Comprobación de seguridad adicional (aunque el middleware debería cubrirlo)
  if (!businessId) {
    console.warn('[AdminStatsController] No se encontró businessId en req.user. Acceso denegado.');
    // Usamos 403 Forbidden ya que el rol es correcto pero falta asociación clave
    res.status(403).json({ message: 'El usuario administrador no está asociado a ningún negocio.' });
    return; 
  }

  try {
    // Llamamos a la función del servicio para obtener los datos
    const stats: AdminOverviewStatsData = await getOverviewStats(businessId);

    // Enviamos la respuesta exitosa con los datos
    res.status(200).json(stats);
    console.log(`[AdminStatsController] Stats enviadas correctamente para businessId: ${businessId}`);

  } catch (error) {
    // Si el servicio lanza un error, lo pasamos al manejador de errores global
    console.error(`[AdminStatsController] Error al obtener stats para business ${businessId}:`, error);
    next(error); // Pasamos el error al siguiente middleware (manejador de errores global)
  }
};

// Podrían añadirse aquí más handlers para otras estadísticas si fueran necesarias.

// End of file: backend/src/admin/admin-stats.controller.ts