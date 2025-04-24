// File: backend/src/customer/customer.controller.ts
// Version: 1.4.0 (Add assignRewardHandler function - FULL CODE)

import { Request, Response, NextFunction } from 'express';
// Importa el servicio (¡TODAS las funciones necesarias!)
import {
    findActiveRewardsForCustomer,
    getCustomersForBusiness,
    adjustPointsForCustomer,
    changeCustomerTier,
    assignRewardToCustomer // <-- Añadida esta importación
} from './customer.service';
import { User } from '@prisma/client'; // Importar tipo User si lo devuelve el servicio

/**
 * Handles fetching active rewards for the logged-in customer's business.
 * GET /api/customer/rewards (o similar)
 */
export const getCustomerRewardsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // @ts-ignore
  const businessId = req.user?.businessId;
  // @ts-ignore
  const userId = req.user?.id;

  console.log(
    `[CUSTOMER CTRL] User ${userId} requesting rewards for business ${businessId}`
  );

  if (!businessId || !userId) {
    console.error(
      '[CUSTOMER CTRL] Error: businessId or userId missing from req.user'
    );
    return res
      .status(401) // Unauthorized o 403 Forbidden si la autenticación falló antes
      .json({
        message:
          'Información de usuario o negocio no encontrada en la sesión.',
      });
  }

  try {
    const rewards = await findActiveRewardsForCustomer(businessId);
    res.status(200).json(rewards);
  } catch (error) {
    console.error(
      `[CUSTOMER CTRL] Error fetching rewards for business ${businessId}:`,
      error
    );
    // Pasamos al manejador de errores global si existe
    next(error);
    // O devolvemos error 500 directamente
    // res.status(500).json({ message: 'Error al obtener las recompensas.' });
  }
};


/**
 * Controlador para que el Admin obtenga la lista de clientes de su negocio.
 * GET /admin/customers (o similar)
 */
export const getAdminCustomers = async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const adminBusinessId = req.user?.businessId;
    if (!adminBusinessId) {
        console.error("[CUST CTRL] No businessId found in req.user for admin.");
        return res.status(403).json({ message: "No se pudo identificar el negocio del administrador." });
    }
    console.log(`[CUST CTRL] Request received for admin customers list for business: ${adminBusinessId}`);
    try {
        const customers = await getCustomersForBusiness(adminBusinessId);
        // Respuesta con paginación placeholder
        const responseData = {
            items: customers,
            currentPage: 1, // Fijo por ahora
            totalPages: 1,  // Fijo por ahora
            totalItems: customers.length
        };
        console.log(`[CUST CTRL] Sending ${customers.length} customers.`);
        res.status(200).json(responseData);
    } catch (error) {
         console.error("[CUST CTRL] Error in getAdminCustomers controller:", error);
         next(error);
    }
};

/**
 * Controlador para que un Admin ajuste manualmente los puntos de un cliente.
 * POST /api/admin/customers/:customerId/adjust-points
 */
export const adjustCustomerPoints = async (req: Request, res: Response, next: NextFunction) => {
    const { customerId } = req.params;
    const { amount, reason } = req.body;
    // @ts-ignore
    const adminUserId = req.user?.id;
    // @ts-ignore
    const adminBusinessId = req.user?.businessId;
    console.log(`[CUST CTRL] Request to adjust points for customer ${customerId} by admin ${adminUserId} from business ${adminBusinessId}`);
    if (!adminBusinessId || !adminUserId) { return res.status(403).json({ message: "Información de administrador no disponible." }); }
    if (!customerId) { return res.status(400).json({ message: "Falta el ID del cliente." }); }
    if (typeof amount !== 'number' || amount === 0) { return res.status(400).json({ message: "La cantidad ('amount') debe ser un número distinto de cero." }); }
    try {
        const updatedCustomer = await adjustPointsForCustomer( customerId, adminBusinessId, amount, reason );
        res.status(200).json({ message: `Puntos ajustados correctamente para ${updatedCustomer.email}.`, customer: { id: updatedCustomer.id, points: updatedCustomer.points } });
    } catch (error) {
        console.error(`[CUST CTRL] Failed to adjust points for customer ${customerId}:`, error);
        next(error);
    }
};


/**
 * Controlador para que un Admin cambie manualmente el Tier de un cliente.
 * PUT /api/admin/customers/:customerId/tier
 */
export const changeCustomerTierHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { customerId } = req.params; // ID del cliente desde la URL
    const { tierId } = req.body;      // ID del nuevo Tier desde el cuerpo (puede ser null)
    // @ts-ignore
    const adminBusinessId = req.user?.businessId; // ID del negocio del admin (para validación)

    console.log(`[CUST CTRL] Request to change tier for customer ${customerId} to tier ${tierId} by admin from business ${adminBusinessId}`);

    // Validación básica
    if (!adminBusinessId) {
        return res.status(403).json({ message: "Información de administrador no disponible." });
    }
     if (!customerId) {
        return res.status(400).json({ message: "Falta el ID del cliente." });
    }
    // tierId puede ser string o null, la validación fina se hace en el servicio

    try {
        // Llamamos a la función del servicio que creamos antes
        const updatedCustomer = await changeCustomerTier(
            customerId,
            adminBusinessId,
            tierId // Pasamos el ID del tier (puede ser null)
        );

        // Enviamos respuesta de éxito
        res.status(200).json({
            message: `Nivel cambiado correctamente para ${updatedCustomer.email}.`,
            customer: { // Devolvemos info útil
                id: updatedCustomer.id,
                currentTierId: updatedCustomer.currentTierId,
                tierAchievedAt: updatedCustomer.tierAchievedAt
            }
        });

    } catch (error) {
        console.error(`[CUST CTRL] Failed to change tier for customer ${customerId} to ${tierId}:`, error);
        // Pasamos el error al manejador global
        next(error);
    }
};

// --- NUEVA FUNCIÓN AÑADIDA ---
/**
 * Controlador para que un Admin asigne directamente una recompensa a un cliente.
 * POST /api/admin/customers/:customerId/assign-reward
 */
export const assignRewardHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { customerId } = req.params;   // ID del cliente desde la URL
    const { rewardId } = req.body;       // ID de la recompensa desde el cuerpo
    // @ts-ignore
    const adminUserId = req.user?.id;    // ID del admin que hace la acción
    // @ts-ignore
    const adminBusinessId = req.user?.businessId; // ID del negocio del admin

    console.log(`[CUST CTRL] Request to assign reward ${rewardId} to customer ${customerId} by admin ${adminUserId} from business ${adminBusinessId}`);

    // Validaciones básicas de entrada
    if (!adminBusinessId || !adminUserId) {
        return res.status(403).json({ message: "Información de administrador no disponible." });
    }
    if (!customerId) {
        return res.status(400).json({ message: "Falta el ID del cliente." });
    }
    if (!rewardId || typeof rewardId !== 'string') {
        return res.status(400).json({ message: "Falta el ID de la recompensa ('rewardId') o no es válido." });
    }

    try {
        // Llamamos a la función del servicio que creamos en el paso anterior
        const grantedReward = await assignRewardToCustomer(
            customerId,
            adminBusinessId,
            rewardId,
            adminUserId
        );

        // Enviamos respuesta de éxito (201 Created es apropiado aquí)
        res.status(201).json({
            message: `Recompensa asignada correctamente al cliente.`,
            grantedRewardId: grantedReward.id // Devolvemos el ID del registro creado
        });

    } catch (error) {
        console.error(`[CUST CTRL] Failed to assign reward ${rewardId} to customer ${customerId}:`, error);
        // Pasamos el error al manejador global
        next(error);
    }
};
// --- FIN NUEVA FUNCIÓN ---


// End of File: backend/src/customer/customer.controller.ts