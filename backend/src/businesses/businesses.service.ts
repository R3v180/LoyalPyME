// filename: backend/src/businesses/businesses.service.ts
// Version: 1.0.2 (Remove obsolete comments)

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Define la estructura de datos devuelta para la lista pública de negocios.
 */
export interface PublicBusinessInfo {
  id: string;
  name: string;
}

/**
 * Busca y devuelve una lista de negocios (solo ID y Nombre) para mostrar públicamente.
 * Por ahora, devuelve todos los negocios ordenados por nombre.
 * En el futuro, se podría filtrar por negocios activos o verificados si fuera necesario.
 *
 * @returns Una promesa que resuelve con un array de objetos PublicBusinessInfo.
 * @throws Error si ocurre un problema al consultar la base de datos.
 */
export const findPublicBusinesses = async (): Promise<PublicBusinessInfo[]> => {
  console.log('[BusinessService] Buscando lista pública de negocios...');
  try {
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    console.log(`[BusinessService] Encontrados ${businesses.length} negocios.`);
    return businesses;
  } catch (error) {
    console.error('[BusinessService] Error al buscar negocios públicos:', error);
    throw new Error('No se pudo obtener la lista de negocios.');
  }
};

// End of file: backend/src/businesses/businesses.service.ts