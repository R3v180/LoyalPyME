// File: backend/src/tiers/tier.service.ts
// Version: 1.0.0 (Contains CRUD operations for Tier model)

import { PrismaClient, Tier, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Crea un nuevo Tier para un negocio.
 * @param businessId - ID del negocio.
 * @param tierData - Datos del nuevo Tier.
 * @returns El Tier creado.
 */
export const createTier = async (
    businessId: string,
    tierData: Omit<Prisma.TierCreateInput, 'business' | 'users' | 'benefits'>
): Promise<Tier> => {
    console.log(`[Tier SVC] Creating tier for business ${businessId}:`, tierData);
    try {
        const newTier = await prisma.tier.create({
             data: {
                 ...tierData,
                 business: {
                    connect: { id: businessId }
                 }
             },
        });
        console.log(`[Tier SVC] Tier created successfully with ID: ${newTier.id}`);
        return newTier;
     } catch (error) {
        console.error(`[Tier SVC] Error creating tier for business ${businessId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
             const target = error.meta?.target as string[];
             if (target?.includes('level')) {
                 throw new Error(`Ya existe un Tier con el nivel '${tierData.level}' para este negocio.`);
             } else if (target?.includes('name')) {
                 throw new Error(`Ya existe un Tier con el nombre '${tierData.name}' para este negocio.`);
             }
             throw new Error('Conflicto de unicidad al crear el Tier (nivel o nombre ya existen).');
        }
        throw new Error('Error al crear el nivel de fidelización.');
     }
};

/**
 * Encuentra todos los Tiers de un negocio específico, opcionalmente incluyendo sus beneficios.
 * @param businessId ID del negocio.
 * @param includeBenefits Si es true, incluye los beneficios asociados.
 * @returns Lista de Tiers.
 */
export const findTiersByBusiness = async (businessId: string, includeBenefits: boolean = false): Promise<Tier[]> => {
    console.log(`[Tier SVC] Finding tiers for business: ${businessId}, includeBenefits: ${includeBenefits}`);
    try {
        const tiers = await prisma.tier.findMany({
            where: { businessId: businessId },
            orderBy: { level: 'asc' },
            include: {
                benefits: includeBenefits,
            }
        });
        return tiers;
    } catch (error) {
         console.error(`[Tier SVC] Error finding tiers for business ${businessId}:`, error);
         throw new Error('Error al buscar los niveles de fidelización.');
    }
};

/**
 * Encuentra un Tier específico por su ID, asegurando que pertenece al negocio dado.
 * @param tierId ID del Tier.
 * @param businessId ID del negocio propietario.
 * @param includeBenefits Si es true, incluye los beneficios asociados.
 * @returns El Tier encontrado o null.
 */
export const findTierById = async (tierId: string, businessId: string, includeBenefits: boolean = false): Promise<Tier | null> => {
     console.log(`[Tier SVC] Finding tier by ID: ${tierId} for business: ${businessId}, includeBenefits: ${includeBenefits}`);
     try {
         const tier = await prisma.tier.findFirst({
             where: {
                 id: tierId,
                 businessId: businessId
             },
             include: {
                 benefits: includeBenefits,
             }
         });
         return tier;
     } catch (error) {
         console.error(`[Tier SVC] Error finding tier ${tierId}:`, error);
         throw new Error('Error al buscar el nivel de fidelización por ID.');
     }
};

/**
 * Actualiza un Tier existente.
 * @param tierId ID del Tier a actualizar.
 * @param businessId ID del negocio propietario (para verificación).
 * @param updateData Datos a actualizar.
 * @returns El Tier actualizado.
 * @throws Error si el Tier no se encuentra o no pertenece al negocio.
 */
export const updateTier = async (
    tierId: string,
    businessId: string,
    updateData: Partial<Omit<Prisma.TierUpdateInput, 'business' | 'users' | 'benefits'>>
): Promise<Tier> => {
    console.log(`[Tier SVC] Updating tier ID: ${tierId} for business: ${businessId}`, updateData);
    try {
        const existingTier = await prisma.tier.findFirst({
            where: { id: tierId, businessId: businessId },
            select: { id: true }
        });
        if (!existingTier) {
            throw new Error(`Nivel (Tier) con ID ${tierId} no encontrado o no pertenece a este negocio.`);
        }
        const updatedTier = await prisma.tier.update({
            where: { id: tierId },
            data: updateData,
        });
        console.log(`[Tier SVC] Tier ${tierId} updated successfully.`);
        return updatedTier;
    } catch (error) {
        console.error(`[Tier SVC] Error updating tier ${tierId}:`, error);
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
             throw new Error('Conflicto de unicidad al actualizar el Tier (nivel o nombre ya existen).');
         }
        if (error instanceof Error && error.message.startsWith('Nivel (Tier) con ID')) {
             throw error;
         }
        throw new Error('Error al actualizar el nivel de fidelización.');
    }
};

/**
 * Elimina un Tier existente.
 * @param tierId ID del Tier a eliminar.
 * @param businessId ID del negocio propietario (para verificación).
 * @returns El Tier eliminado.
 * @throws Error si el Tier no se encuentra o no pertenece al negocio, o si tiene usuarios asignados.
 */
export const deleteTier = async (tierId: string, businessId: string): Promise<Tier> => {
    console.log(`[Tier SVC] Deleting tier ID: ${tierId} for business: ${businessId}`);
    try {
        const existingTier = await prisma.tier.findFirst({
            where: { id: tierId, businessId: businessId },
             select: { id: true, _count: { select: { users: true } } }
        });
        if (!existingTier) {
            throw new Error(`Nivel (Tier) con ID ${tierId} no encontrado o no pertenece a este negocio.`);
        }
        if (existingTier._count.users > 0) {
             console.warn(`[Tiers SVC] Attempted to delete tier ${tierId} which has ${existingTier._count.users} users assigned.`);
             throw new Error(`No se puede eliminar el Nivel ${tierId} porque tiene usuarios asignados. Reasígnelos primero.`);
         }
        const deletedTier = await prisma.tier.delete({
            where: { id: tierId },
        });
        console.log(`[Tier SVC] Tier ${tierId} deleted successfully.`);
        return deletedTier;
     } catch (error) {
         console.error(`[Tier SVC] Error deleting tier ${tierId}:`, error);
        if (error instanceof Error && (error.message.startsWith('Nivel (Tier) con ID') || error.message.includes('usuarios asignados'))) {
             throw error;
         }
        throw new Error('Error al eliminar el nivel de fidelización.');
     }
};

// End of File: backend/src/tiers/tier.service.ts