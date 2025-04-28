// filename: backend/src/businesses/businesses.controller.ts
// Version: 1.0.0

import { Request, Response, NextFunction } from 'express';
// Importamos la función del servicio que acabamos de crear
import { findPublicBusinesses, PublicBusinessInfo } from './businesses.service'; // Usamos ruta relativa './'

/**
 * Handler para obtener la lista pública de negocios (ID y Nombre).
 * GET /api/businesses/public-list (o la ruta que definamos)
 * No requiere autenticación.
 */
export const handleGetPublicBusinesses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  console.log('[BusinessController] Solicitud de lista pública de negocios...');

  try {
    // Llamamos a la función del servicio para obtener los datos
    const businesses: PublicBusinessInfo[] = await findPublicBusinesses();

    // Enviamos la respuesta exitosa con la lista de negocios
    res.status(200).json(businesses);
    console.log('[BusinessController] Lista pública de negocios enviada.');

  } catch (error) {
    // Si el servicio lanza un error, lo pasamos al manejador de errores global
    console.error('[BusinessController] Error al obtener lista pública de negocios:', error);
    next(error);
  }
};

// Aquí podrían ir otros handlers del controlador relacionados con Business en el futuro
// (ej: getBusinessDetails, updateBusinessSettings - que sí requerirían autenticación/rol)

// End of file: backend/src/businesses/businesses.controller.ts