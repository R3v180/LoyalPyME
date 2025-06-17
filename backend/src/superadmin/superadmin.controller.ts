// backend/src/superadmin/superadmin.controller.ts
import { Request, Response, NextFunction } from 'express';
import * as superAdminService from './superadmin.service';

/**
 * Handler para obtener la lista de todos los negocios con su estado de suscripción.
 */
export const getAllBusinessesHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const businesses = await superAdminService.getAllBusinesses();
        res.status(200).json(businesses);
    } catch (error) {
        console.error("[SA_CTRL] Error in getAllBusinessesHandler:", error);
        next(error);
    }
};

/**
 * Handler para cambiar el estado general (activo/inactivo) de un negocio.
 */
export const toggleBusinessStatusHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { businessId } = req.params;
    const { isActive } = req.body;
    const adminId = req.user?.id;

    if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: 'El campo "isActive" es requerido y debe ser un booleano.' });
    }
    if (!adminId) {
        return res.status(403).json({ message: 'No se pudo identificar al administrador.' });
    }

    try {
        const updatedBusiness = await superAdminService.toggleBusinessStatus(businessId, isActive, adminId);
        res.status(200).json(updatedBusiness);
    } catch (error: any) {
        console.error(`[SA_CTRL] Error in toggleBusinessStatusHandler for business ${businessId}:`, error);
        if (error.message && error.message.includes('no encontrado')) {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};

/**
 * Handler para activar/desactivar el módulo LoyaltyCore para un negocio.
 */
export const toggleLoyaltyCoreModuleHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { businessId } = req.params;
    const { isActive } = req.body;
    const adminId = req.user?.id;

    if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: 'El campo "isActive" es requerido y debe ser un booleano para el módulo.' });
    }
    if (!adminId) {
        return res.status(403).json({ message: 'No se pudo identificar al administrador.' });
    }

    try {
        const updatedBusiness = await superAdminService.toggleModule(businessId, 'isLoyaltyCoreActive', isActive, adminId);
        res.status(200).json(updatedBusiness);
    } catch (error: any) {
        console.error(`[SA_CTRL] Error in toggleLoyaltyCoreModuleHandler for business ${businessId}:`, error);
        if (error.message && error.message.includes('no encontrado')) {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};

/**
 * Handler para activar/desactivar el módulo Camarero para un negocio.
 */
export const toggleCamareroModuleHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { businessId } = req.params;
    const { isActive } = req.body;
    const adminId = req.user?.id;

    if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: 'El campo "isActive" es requerido y debe ser un booleano para el módulo.' });
    }
    if (!adminId) {
        return res.status(403).json({ message: 'No se pudo identificar al administrador.' });
    }

    try {
        const updatedBusiness = await superAdminService.toggleModule(businessId, 'isCamareroActive', isActive, adminId);
        res.status(200).json(updatedBusiness);
    } catch (error: any) {
        console.error(`[SA_CTRL] Error in toggleCamareroModuleHandler for business ${businessId}:`, error);
        if (error.message && error.message.includes('no encontrado')) {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};

/**
 * Handler para actualizar el precio de la suscripción de un negocio.
 */
export const setSubscriptionPriceHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { businessId } = req.params;
    const { price, currency } = req.body;
    const adminId = req.user?.id;

    if (typeof price !== 'number' || price < 0) {
        return res.status(400).json({ message: 'El campo "price" es requerido y debe ser un número no negativo.' });
    }
    if (!currency || typeof currency !== 'string' || currency.length !== 3) {
        return res.status(400).json({ message: 'El campo "currency" es requerido y debe ser un código de 3 letras.' });
    }
    if (!adminId) {
        return res.status(403).json({ message: 'No se pudo identificar al administrador.' });
    }

    try {
        const updatedBusiness = await superAdminService.setBusinessSubscriptionPrice(businessId, price, currency, adminId);
        res.status(200).json(updatedBusiness);
    } catch (error) {
        next(error);
    }
};

/**
 * Handler para registrar un pago manual.
 */
export const recordPaymentHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { businessId } = req.params;
    const paymentData = req.body;
    const adminId = req.user?.id;

    if (!adminId) return res.status(403).json({ message: 'No se pudo identificar al administrador.' });
    if (!paymentData || typeof paymentData.amountPaid !== 'number' || typeof paymentData.month !== 'number' || typeof paymentData.year !== 'number') {
        return res.status(400).json({ message: "Los campos 'amountPaid', 'month' y 'year' son requeridos y deben ser números." });
    }

    try {
        const newPayment = await superAdminService.recordManualPayment(businessId, adminId, paymentData);
        res.status(201).json(newPayment);
    } catch (error) {
        next(error);
    }
};

/**
 * Handler para obtener el historial de pagos de un negocio.
 */
export const getPaymentHistoryHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { businessId } = req.params;
    try {
        const payments = await superAdminService.getBusinessPaymentHistory(businessId);
        res.status(200).json(payments);
    } catch (error) {
        next(error);
    }
};

// --- NUEVO HANDLER AÑADIDO ---
/**
 * Handler para obtener los periodos de pago pendientes de un negocio.
 */
export const getPendingPeriodsHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { businessId } = req.params;
    try {
        const pendingPeriods = await superAdminService.getPendingPaymentPeriods(businessId);
        res.status(200).json(pendingPeriods);
    } catch (error) {
        next(error);
    }
};

/**
 * Handler para suplantar la identidad de un BUSINESS_ADMIN.
 */
export const impersonationHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { userId: targetUserId } = req.params;
    const adminId = req.user?.id;

    if (!adminId) return res.status(403).json({ message: 'No se pudo identificar al administrador.' });
    if (!targetUserId) return res.status(400).json({ message: "Se requiere el ID del usuario a suplantar." });

    try {
        const token = await superAdminService.getImpersonationToken(targetUserId, adminId);
        res.status(200).json({ token });
    } catch (error) {
        next(error);
    }
};