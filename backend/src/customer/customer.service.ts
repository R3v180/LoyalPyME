// File: backend/src/customer/customer.service.ts
// Version: 1.3.0 (Add changeCustomerTier function - FULL CODE)

import { PrismaClient, Reward, Prisma, UserRole, User } from '@prisma/client'; // Asegurarse que User está importado

const prisma = new PrismaClient();

// --- FUNCIÓN ORIGINAL (COMPLETA) ---
/**
 * Finds all active rewards for a specific business.
 * Used by customers to see available rewards.
 * @param businessId The ID of the business whose active rewards are to be fetched.
 * @returns A promise that resolves with an array of active reward objects.
 * @throws Error if there's a database error.
 */
export const findActiveRewardsForCustomer = async (
  businessId: string
): Promise<Reward[]> => {
  console.log(
    `[CUSTOMER SVC] Finding active rewards for business: ${businessId}`
  );
  try {
    const rewards = await prisma.reward.findMany({
      where: {
        businessId: businessId,
        isActive: true,
      },
      orderBy: {
        pointsCost: 'asc',
      },
    });
    console.log(
      `[CUSTOMER SVC] Found ${rewards.length} active rewards for business ${businessId}`
    );
    return rewards;
  } catch (error) {
    console.error(
      `[CUSTOMER SVC] Error fetching active rewards for business ${businessId}:`,
      error
    );
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Nota: Este tipo de error puede que no exista si la generación de Prisma falló antes,
      // pero lo dejamos por si acaso se arregló. Si da error aquí, hay que importar PrismaClientKnownRequestError
      throw new Error(`Error de base de datos al buscar recompensas: ${error.message}`);
    }
    throw new Error('Error inesperado al buscar recompensas activas.');
  }
};

// --- FUNCIÓN PREVIA (COMPLETA) ---
/**
 * Obtiene la lista de clientes para un negocio específico (Vista Admin).
 * @param businessId - El ID del negocio del admin logueado.
 * @returns Lista de clientes con datos básicos y tier.
 * @throws Error si ocurre un problema con la base de datos.
 */
export const getCustomersForBusiness = async (businessId: string) => {
    console.log(`[CUST SVC] Fetching customers for business ID: ${businessId}`);
    try {
        const customers = await prisma.user.findMany({
            where: {
                businessId: businessId,
                role: UserRole.CUSTOMER_FINAL
            },
            select: {
                id: true, name: true, email: true, points: true, createdAt: true,
                isActive: true, isFavorite: true,
                currentTier: { select: { name: true, id: true } } // Añadir ID por si acaso
            },
            orderBy: { createdAt: 'desc' }
            // TODO: Paginación y búsqueda
        });
        console.log(`[CUST SVC] Found ${customers.length} customers for business ${businessId}`);
        return customers;
    } catch (error) {
        console.error(`[CUST SVC] Error fetching customers for business ${businessId}:`, error);
        throw new Error('Error al obtener la lista de clientes desde la base de datos.');
    }
};

// --- FUNCIÓN PREVIA (COMPLETA) ---
/**
 * Ajusta los puntos de un cliente específico, asegurándose que pertenezca
 * al negocio del administrador que realiza la acción.
 * @param customerId - ID del cliente a modificar.
 * @param adminBusinessId - ID del negocio del administrador logueado.
 * @param amount - Cantidad de puntos a sumar (positivo) o restar (negativo).
 * @param reason - Motivo opcional para el ajuste (útil para auditoría).
 * @returns El objeto User del cliente actualizado.
 * @throws Error si el cliente no se encuentra, no pertenece al negocio, o falla la actualización.
 */
export const adjustPointsForCustomer = async (
    customerId: string,
    adminBusinessId: string,
    amount: number,
    reason?: string | null
): Promise<User> => {
    console.log(`[CUST SVC] Attempting to adjust points for customer ${customerId} by ${amount}. Reason: ${reason || 'N/A'}. Admin Business: ${adminBusinessId}`);

    if (amount === 0) {
        throw new Error("La cantidad de puntos a ajustar no puede ser cero.");
    }

    try {
        const updatedUser = await prisma.$transaction(async (tx) => {
            // 1. Verificar que el cliente existe Y pertenece al negocio del admin
            const customer = await tx.user.findUnique({
                where: { id: customerId },
                select: { businessId: true, id: true }
            });

            if (!customer) { throw new Error(`Cliente con ID ${customerId} no encontrado.`); }
            if (customer.businessId !== adminBusinessId) {
                console.warn(`[CUST SVC] SECURITY ALERT: Admin from business ${adminBusinessId} attempted to modify customer ${customerId} from business ${customer.businessId}.`);
                throw new Error("No tienes permiso para modificar este cliente.");
            }

            // 2. Actualizar los puntos
            const userAfterUpdate = await tx.user.update({
                where: { id: customerId, businessId: adminBusinessId, },
                data: { points: { increment: amount } }
            });

            // TODO: 3. Registrar acción en Auditoría/Log

            console.log(`[CUST SVC] Points adjusted successfully for customer ${customerId}. New balance potentially: ${userAfterUpdate.points}`);
            return userAfterUpdate;
        });
        return updatedUser;

    } catch (error) {
        console.error(`[CUST SVC] Error adjusting points for customer ${customerId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
             if (error.code === 'P2025') { throw new Error(`No se encontró el cliente especificado.`); }
             throw new Error(`Error de base de datos al ajustar puntos: ${error.message}`);
        }
        if (error instanceof Error) { throw error; }
        throw new Error('Error inesperado al ajustar los puntos.');
    }
};


// --- NUEVA FUNCIÓN AÑADIDA (COMPLETA) ---
/**
 * Cambia manualmente el nivel (Tier) de un cliente específico.
 * Verifica que tanto el cliente como el nuevo tier (si se proporciona)
 * pertenezcan al negocio del administrador.
 *
 * @param customerId El ID del cliente a modificar.
 * @param adminBusinessId El ID del negocio del admin que realiza la acción.
 * @param newTierId El ID del nuevo nivel a asignar, o null para quitar el nivel.
 * @returns El objeto User del cliente actualizado.
 * @throws Error si el cliente o el tier no se encuentran, no pertenecen al negocio, o falla la actualización.
 */
export const changeCustomerTier = async (
    customerId: string,
    adminBusinessId: string,
    newTierId: string | null // Puede ser null para quitar el tier
): Promise<User> => {
    console.log(`[CUST SVC] Attempting to change tier for customer ${customerId} to tier ${newTierId || 'NULL'}. Admin Business: ${adminBusinessId}`);

    try {
        // Usar transacción por si necesitamos más pasos o logs en el futuro
        const updatedUser = await prisma.$transaction(async (tx) => {
            // 1. Validar que el cliente existe y pertenece al negocio del admin
            const customer = await tx.user.findUnique({
                where: { id: customerId, businessId: adminBusinessId },
                select: { id: true } // Solo necesitamos saber si existe y pertenece
            });
            if (!customer) {
                throw new Error(`Cliente con ID ${customerId} no encontrado o no pertenece a tu negocio.`);
            }

            // 2. Si se está asignando un nuevo nivel (no quitándolo), validar que ese nivel existe y pertenece al negocio
            if (newTierId !== null) {
                const tierExists = await tx.tier.findUnique({
                    where: { id: newTierId, businessId: adminBusinessId },
                    select: { id: true } // Solo necesitamos saber si existe y pertenece
                });
                if (!tierExists) {
                    throw new Error(`El nivel seleccionado (ID: ${newTierId}) no es válido o no pertenece a tu negocio.`);
                }
            }

            // 3. Actualizar el usuario
            const userAfterUpdate = await tx.user.update({
                where: {
                    id: customerId
                },
                data: {
                    currentTierId: newTierId, // Asignar el nuevo ID (o null)
                    tierAchievedAt: newTierId ? new Date() : null // Actualizar fecha o ponerla a null
                }
            });

            console.log(`[CUST SVC] Tier changed successfully for customer ${customerId} to ${newTierId || 'NULL'}`);
            return userAfterUpdate;
        });

        return updatedUser;

    } catch (error) {
        console.error(`[CUST SVC] Error changing tier for customer ${customerId} to ${newTierId}:`, error);
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
             // Puedes añadir manejo específico de errores de Prisma si es necesario
             throw new Error(`Error de base de datos al cambiar nivel: ${error.message}`);
         }
         if (error instanceof Error) { // Capturar errores lanzados desde la transacción
              throw error;
         }
         throw new Error('Error inesperado al cambiar el nivel del cliente.');
    }
};
// --- FIN NUEVA FUNCIÓN ---

// End of File: backend/src/customer/customer.service.ts