// backend/src/superadmin/superadmin.service.ts
import { PrismaClient, Business, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// --- NUEVO TIPO: Para los datos que realmente devuelve getAllBusinesses ---
export type SuperAdminBusinessListItem = Pick<
    Business,
    'id' | 'name' | 'slug' | 'isActive' | 'isLoyaltyCoreActive' | 'isCamareroActive' | 'createdAt'
>;
// Podríamos añadir más campos aquí si el panel Super Admin los necesita, como _count.users


/**
 * Obtiene todos los negocios registrados, con campos seleccionados para el panel Super Admin.
 */
// --- CAMBIO: Tipo de retorno actualizado ---
export const getAllBusinesses = async (): Promise<SuperAdminBusinessListItem[]> => {
    console.log("[SuperAdminService] Fetching all businesses for Super Admin panel...");
    try {
        return await prisma.business.findMany({
            orderBy: { name: 'asc' },
            select: { // Los campos seleccionados ahora coinciden con SuperAdminBusinessListItem
                id: true,
                name: true,
                slug: true,
                isActive: true,
                isLoyaltyCoreActive: true,
                isCamareroActive: true,
                createdAt: true,
            }
        });
    } catch (error) {
        console.error("[SuperAdminService] Error fetching all businesses:", error);
        throw new Error("Error al obtener la lista de negocios desde la base de datos.");
    }
};

/**
 * Cambia el estado 'isActive' general de un negocio.
 * Devuelve el objeto Business completo después de la actualización.
 */
export const toggleBusinessStatus = async (businessId: string, isActive: boolean): Promise<Business> => {
    console.log(`[SuperAdminService] Toggling general isActive status for business ${businessId} to ${isActive}`);
    try {
        const business = await prisma.business.findUnique({ where: { id: businessId }, select: { id: true } });
        if (!business) {
            throw new Error(`Negocio con ID ${businessId} no encontrado.`);
        }
        return await prisma.business.update({
            where: { id: businessId },
            data: { isActive },
        });
    } catch (error) {
        console.error(`[SuperAdminService] Error toggling general status for business ${businessId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            throw new Error(`Negocio con ID ${businessId} no encontrado al intentar actualizar.`);
        }
        if (error instanceof Error && error.message.startsWith('Negocio con ID')) {
            throw error;
        }
        throw new Error("Error al cambiar el estado general del negocio.");
    }
};

/**
 * Tipo para los campos de módulo que podemos activar/desactivar en el modelo Business.
 */
type ModuleFieldInBusiness = 'isLoyaltyCoreActive' | 'isCamareroActive';

/**
 * Cambia el estado de un módulo específico (isLoyaltyCoreActive o isCamareroActive) para un negocio.
 * Devuelve el objeto Business completo después de la actualización.
 */
export const toggleModule = async (
    businessId: string,
    moduleField: ModuleFieldInBusiness,
    isActiveModule: boolean
): Promise<Business> => {
    console.log(`[SuperAdminService] Toggling module '${moduleField}' for business ${businessId} to ${isActiveModule}`);
    try {
        const business = await prisma.business.findUnique({ where: { id: businessId }, select: { id: true } });
        if (!business) {
            throw new Error(`Negocio con ID ${businessId} no encontrado.`);
        }

        const dataToUpdate: Prisma.BusinessUpdateInput = {};
        dataToUpdate[moduleField] = isActiveModule;

        return await prisma.business.update({
            where: { id: businessId },
            data: dataToUpdate,
        });
    } catch (error) {
        console.error(`[SuperAdminService] Error toggling module ${moduleField} for business ${businessId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            throw new Error(`Negocio con ID ${businessId} no encontrado al intentar actualizar módulo.`);
        }
        if (error instanceof Error && error.message.startsWith('Negocio con ID')) {
            throw error;
        }
        throw new Error(`Error al cambiar el estado del módulo ${moduleField}.`);
    }
};