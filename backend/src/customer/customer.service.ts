// File: backend/src/customer/customer.service.ts
// Version: 1.2.0 (Add adjustPointsForCustomer function)

import { PrismaClient, Reward, Prisma, UserRole, User } from '@prisma/client'; // <-- Añadido User

const prisma = new PrismaClient();

// --- Función Original ---
export const findActiveRewardsForCustomer = async (
  businessId: string
): Promise<Reward[]> => {
  console.log(
    `[CUSTOMER SVC] Finding active rewards for business: ${businessId}`
  );
  try {
    const rewards = await prisma.reward.findMany({
      where: { businessId: businessId, isActive: true, },
      orderBy: { pointsCost: 'asc', },
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
      throw new Error(`Error de base de datos al buscar recompensas: ${error.message}`);
    }
    throw new Error('Error inesperado al buscar recompensas activas.');
  }
};

// --- Función Previa ---
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
                currentTier: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        console.log(`[CUST SVC] Found ${customers.length} customers for business ${businessId}`);
        return customers;
    } catch (error) {
        console.error(`[CUST SVC] Error fetching customers for business ${businessId}:`, error);
        throw new Error('Error al obtener la lista de clientes desde la base de datos.');
    }
};

// --- NUEVA FUNCIÓN AÑADIDA ---
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
        // Usamos una transacción para asegurar consistencia si añadimos logs en el futuro
        const updatedUser = await prisma.$transaction(async (tx) => {
            // 1. Verificar que el cliente existe Y pertenece al negocio del admin
            const customer = await tx.user.findUnique({
                where: { id: customerId },
                select: { businessId: true, id: true } // Seleccionar solo lo necesario para validación
            });

            if (!customer) {
                throw new Error(`Cliente con ID ${customerId} no encontrado.`);
            }
            if (customer.businessId !== adminBusinessId) {
                console.warn(`[CUST SVC] SECURITY ALERT: Admin from business ${adminBusinessId} attempted to modify customer ${customerId} from business ${customer.businessId}.`);
                throw new Error("No tienes permiso para modificar este cliente.");
            }

            // 2. Actualizar los puntos del cliente verificado
            const userAfterUpdate = await tx.user.update({
                where: {
                    id: customerId,
                    // Doble check por si acaso, aunque ya validamos arriba
                    businessId: adminBusinessId,
                },
                data: {
                    points: {
                        increment: amount // 'increment' maneja tanto suma como resta (si amount es negativo)
                    },
                    // Opcional: Actualizar 'updatedAt' si no se hace automáticamente
                    // updatedAt: new Date()
                }
                // Seleccionar los datos actualizados que quieras devolver
                // select: { id: true, email: true, points: true } // Ejemplo
            });

            // TODO: 3. (Opcional pero recomendado) Registrar esta acción manual en una tabla de Auditoría/Log
            // await tx.auditLog.create({ data: { userId: adminUserId, action: 'ADJUST_POINTS', targetUserId: customerId, details: `Amount: ${amount}, Reason: ${reason}` }});

            console.log(`[CUST SVC] Points adjusted successfully for customer ${customerId}. New balance potentially: ${userAfterUpdate.points}`);
            return userAfterUpdate; // Devuelve el usuario completo actualizado
        });

        return updatedUser;

    } catch (error) {
        console.error(`[CUST SVC] Error adjusting points for customer ${customerId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Manejar errores específicos de Prisma si es necesario
            if (error.code === 'P2025') { // Record not found (si findUnique falla de forma inesperada)
                 throw new Error(`No se encontró el cliente especificado.`);
            }
             throw new Error(`Error de base de datos al ajustar puntos: ${error.message}`);
        }
        // Relanzar otros errores (como los lanzados dentro de la transacción)
        if (error instanceof Error) {
             throw error;
        }
        throw new Error('Error inesperado al ajustar los puntos.');
    }
};
// --- FIN NUEVA FUNCIÓN ---