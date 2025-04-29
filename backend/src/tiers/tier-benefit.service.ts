// filename: backend/src/tiers/tier-benefit.service.ts
// Version: 1.0.1 (Fix character encoding)

import { PrismaClient, TierBenefit, Prisma } from '@prisma/client';
// Importar el enum BenefitType si se necesita para validaciones o lógica futura
import { BenefitType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Crea un nuevo beneficio y lo asocia a un Tier existente.
 * @param tierId - ID del Tier al que pertenece el beneficio.
 * @param benefitData - Datos del nuevo beneficio (type, value, etc.).
 * @returns El TierBenefit creado.
 */
export const createTierBenefit = async (
    tierId: string,
    benefitData: Omit<Prisma.TierBenefitCreateInput, 'tier'>
): Promise<TierBenefit> => {
    console.log(`[TierBenefit SVC] Creating benefit for tier ${tierId}:`, benefitData);
    // Se podría añadir verificación de que el tierId pertenece al businessId correcto si fuera necesario
    try {
        const newBenefit = await prisma.tierBenefit.create({
            data: {
                ...benefitData,
                tier: { // Conectar al Tier padre
                    connect: { id: tierId }
                }
            }
        });
        console.log(`[TierBenefit SVC] Benefit created successfully with ID: ${newBenefit.id}`);
        return newBenefit;
    } catch (error) {
        console.error(`[TierBenefit SVC] Error creating benefit for tier ${tierId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
             // Este error ocurre si el tierId no existe al intentar conectar
             throw new Error(`No se encontró el Nivel (Tier) con ID ${tierId} para asociar el beneficio.`); // Corregido: encontró
         }
        throw new Error('Error al crear el beneficio del nivel.');
    }
};

/**
 * Encuentra todos los beneficios asociados a un Tier específico.
 * @param tierId - ID del Tier.
 * @returns Lista de TierBenefits.
 */
export const findBenefitsByTier = async (tierId: string): Promise<TierBenefit[]> => {
    console.log(`[TierBenefit SVC] Finding benefits for tier: ${tierId}`);
    try {
        const benefits = await prisma.tierBenefit.findMany({
            where: { tierId: tierId },
             orderBy: { createdAt: 'asc' } // Opcional: ordenar
        });
        return benefits;
    } catch (error) {
        console.error(`[TierBenefit SVC] Error finding benefits for tier ${tierId}:`, error);
        throw new Error('Error al buscar los beneficios del nivel.');
    }
};

/**
 * Actualiza un beneficio de Tier existente.
 * @param benefitId - ID del beneficio a actualizar.
 * @param updateData - Datos a actualizar.
 * @returns El TierBenefit actualizado.
 * @throws Error si el beneficio no se encuentra.
 */
export const updateTierBenefit = async (
    benefitId: string,
    updateData: Partial<Omit<Prisma.TierBenefitUpdateInput, 'tier'>>
): Promise<TierBenefit> => {
    console.log(`[TierBenefit SVC] Updating benefit ID: ${benefitId}`, updateData);
    try {
        // Usamos update directamente, Prisma lanzará P2025 si no lo encuentra
        const updatedBenefit = await prisma.tierBenefit.update({
            where: { id: benefitId },
            data: updateData,
        });
        console.log(`[TierBenefit SVC] Benefit ${benefitId} updated successfully.`);
        return updatedBenefit;
    } catch (error) {
        console.error(`[TierBenefit SVC] Error updating benefit ${benefitId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
             throw new Error(`Beneficio con ID ${benefitId} no encontrado.`); // Corregido: encontró
         }
        throw new Error('Error al actualizar el beneficio del nivel.');
    }
};

/**
 * Elimina un beneficio de Tier existente.
 * @param benefitId - ID del beneficio a eliminar.
 * @returns El TierBenefit eliminado.
 * @throws Error si el beneficio no se encuentra.
 */
export const deleteTierBenefit = async (benefitId: string): Promise<TierBenefit> => {
    console.log(`[TierBenefit SVC] Deleting benefit ID: ${benefitId}`);
    try {
         // Usamos delete directamente
        const deletedBenefit = await prisma.tierBenefit.delete({
            where: { id: benefitId },
        });
        console.log(`[TierBenefit SVC] Benefit ${benefitId} deleted successfully.`);
        return deletedBenefit;
    } catch (error) {
         console.error(`[TierBenefit SVC] Error deleting benefit ${benefitId}:`, error);
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
             throw new Error(`Beneficio con ID ${benefitId} no encontrado.`); // Corregido: encontró
         }
         throw new Error('Error al eliminar el beneficio del nivel.');
       }
};

// End of File: backend/src/tiers/tier-benefit.service.ts