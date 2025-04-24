// File: backend/src/customer/customer.controller.ts
// Version: 1.2.1 (Fix service function call inside adjustCustomerPoints)

import { Request, Response, NextFunction } from 'express';
// Importa el servicio (las funciones directamente)
import {
    findActiveRewardsForCustomer,
    getCustomersForBusiness,
    adjustPointsForCustomer // <-- Importada por nombre
} from './customer.service';

/**
 * Handles fetching active rewards for the logged-in customer's business.
 * GET /api/customer/rewards (o similar)
 */
export const getCustomerRewardsHandler = async ( // SIN CAMBIOS
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
      .status(401)
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
    next(error);
  }
};


/**
 * Controlador para que el Admin obtenga la lista de clientes de su negocio.
 * GET /admin/customers (o similar)
 */
export const getAdminCustomers = async (req: Request, res: Response, next: NextFunction) => { // SIN CAMBIOS
    // @ts-ignore
    const adminBusinessId = req.user?.businessId;

    if (!adminBusinessId) {
        console.error("[CUST CTRL] No businessId found in req.user for admin.");
        return res.status(403).json({ message: "No se pudo identificar el negocio del administrador." });
    }

    console.log(`[CUST CTRL] Request received for admin customers list for business: ${adminBusinessId}`);

    try {
        const customers = await getCustomersForBusiness(adminBusinessId);

        const responseData = {
            items: customers,
            currentPage: 1,
            totalPages: 1,
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

    if (!adminBusinessId || !adminUserId) {
        return res.status(403).json({ message: "Información de administrador no disponible." });
    }
    if (!customerId) {
        return res.status(400).json({ message: "Falta el ID del cliente." });
    }
    if (typeof amount !== 'number' || amount === 0) {
        return res.status(400).json({ message: "La cantidad ('amount') debe ser un número distinto de cero." });
    }

    try {
        // --- LÍNEA CORREGIDA: Llamamos a la función directamente ---
        const updatedCustomer = await adjustPointsForCustomer(
            customerId,
            adminBusinessId,
            amount,
            reason
        );
        // --------------------------------------------------------

        res.status(200).json({
             message: `Puntos ajustados correctamente para ${updatedCustomer.email}.`,
             customer: {
                 id: updatedCustomer.id,
                 points: updatedCustomer.points
             }
        });

    } catch (error) {
        console.error(`[CUST CTRL] Failed to adjust points for customer ${customerId}:`, error);
        next(error);
    }
};

// End of File: backend/src/customer/customer.controller.ts