// filename: backend/src/tiers/tier-config.service.ts
// Version: 1.0.1 (Fix character encoding)

import { PrismaClient, Business, Prisma } from '@prisma/client';
// Importar los Enums relevantes si se usan en los tipos de datos
import { TierCalculationBasis, TierDowngradePolicy } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Obtiene la configuración del sistema de Tiers para un negocio específico.
 * @param businessId - ID del negocio.
 * @returns Un objeto con la configuración de Tiers o null si el negocio no se encuentra.
 */
export const getBusinessTierConfig = async (businessId: string): Promise<Pick<Business, 'tierSystemEnabled' | 'tierCalculationBasis' | 'tierCalculationPeriodMonths' | 'tierDowngradePolicy' | 'inactivityPeriodMonths'> | null> => {
    console.log(`[TierConfig SVC] Getting tier config for business: ${businessId}`);
    try {
        const business = await prisma.business.findUnique({
            where: { id: businessId },
            // Seleccionar solo los campos de configuración de Tiers
            select: {
                tierSystemEnabled: true,
                tierCalculationBasis: true,
                tierCalculationPeriodMonths: true,
                tierDowngradePolicy: true,
                inactivityPeriodMonths: true,
            }
        });
        // findUnique devuelve null si no lo encuentra, lo cual es correcto aquí.
        return business;
    } catch (error) {
        console.error(`[TierConfig SVC] Error fetching tier config for business ${businessId}:`, error);
        // Lanzamos un error genérico para que lo maneje el controlador
        throw new Error('Error al obtener la configuración de tiers del negocio.'); // Corregido: configuración, genérico
    }
};

/**
 * Actualiza la configuración del sistema de Tiers para un negocio.
 * @param businessId - ID del negocio.
 * @param configData - Datos de configuración a actualizar.
 * @returns El objeto Business completo actualizado (o solo los campos de config si se prefiere).
 */
export const updateBusinessTierConfig = async (
    businessId: string,
    // Tipado para aceptar un subconjunto de los campos de configuración
    configData: Partial<Pick<Business, 'tierSystemEnabled' | 'tierCalculationBasis' | 'tierCalculationPeriodMonths' | 'tierDowngradePolicy' | 'inactivityPeriodMonths'>>
): Promise<Business> => { // Devuelve Business completo por defecto
    console.log(`[TierConfig SVC] Updating tier config for business: ${businessId}`, configData);
    try {
        // Usamos update, que arrojará error si businessId no existe // Corregido: arrojará
        const updatedBusiness = await prisma.business.update({
            where: { id: businessId },
            data: configData, // Prisma solo actualiza los campos presentes en configData
        });
        console.log(`[TierConfig SVC] Tier config updated successfully for business ${businessId}.`);
        return updatedBusiness;
    } catch (error) {
        console.error(`[TierConfig SVC] Error updating tier config for business ${businessId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            // Error específico si el businessId no existe
             throw new Error(`Negocio con ID ${businessId} no encontrado.`); // Corregido: específico
         }
        // Otros posibles errores (ej: tipo de dato incorrecto para enums si no se valida antes)
        throw new Error('Error al actualizar la configuración de tiers del negocio.'); // Corregido: configuración
    }
};

// End of File: backend/src/tiers/tier-config.service.ts