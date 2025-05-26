// backend/src/public/order.controller.ts
// Version: 1.1.0 (Add getPublicOrderStatusHandler)

import { Request, Response, NextFunction } from 'express';

// Importar los servicios y tipos de DTO/respuesta del servicio
import * as publicOrderService from './order.service'; 
// CreateOrderPayloadDto se importa del servicio si está exportado allí,
// o se define localmente si no. Asumiré que está exportado desde el servicio.
// import { CreateOrderPayloadDto } from './order.service'; // Si está exportado

/**
 * Handler para POST /public/order/:businessSlug
 * Crea un nuevo pedido público.
 * (Función existente, sin cambios lógicos internos respecto a la V1.0.0 que te pasé,
 *  pero la incluyo completa para que el archivo esté autocontenido y use tipos correctos)
 */
export const createPublicOrderHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { businessSlug } = req.params;
    // Usamos el tipo exportado desde el servicio si está disponible, o el local si no.
    const orderPayload: publicOrderService.CreateOrderPayloadDto = req.body; 

    if (!businessSlug || typeof businessSlug !== 'string' || businessSlug.trim() === '') {
        return res.status(400).json({ message: 'Se requiere el slug del negocio en la URL.' });
    }

    // Validación básica del payload (Zod sería mejor aquí a futuro)
    if (!orderPayload || !Array.isArray(orderPayload.items) || orderPayload.items.length === 0) {
        return res.status(400).json({ message: 'El pedido debe contener al menos un ítem.' });
    }
    for (const item of orderPayload.items) {
        if (!item.menuItemId || typeof item.menuItemId !== 'string' ||
            !item.quantity || typeof item.quantity !== 'number' || item.quantity < 1) {
            return res.status(400).json({ message: 'Cada ítem del pedido debe tener un menuItemId y una cantidad válida (>=1).' });
        }
        if (item.selectedModifierOptions) {
            if (!Array.isArray(item.selectedModifierOptions)) {
                return res.status(400).json({ message: 'El campo selectedModifierOptions debe ser un array si se proporciona.' });
            }
            for (const mod of item.selectedModifierOptions) {
                if (!mod.modifierOptionId || typeof mod.modifierOptionId !== 'string') {
                    return res.status(400).json({ message: 'Cada opción de modificador seleccionada debe tener un modifierOptionId válido.' });
                }
            }
        }
    }

    console.log(`[PublicOrder CTRL] Received order creation request for business slug: ${businessSlug}. Items: ${orderPayload.items.length}`);

    try {
        const createdOrder = await publicOrderService.createPublicOrder(businessSlug.trim(), orderPayload);
        // El servicio devuelve el objeto Order completo.
        res.status(201).json(createdOrder);
    } catch (error: any) { // Asegurar que 'error' se maneje como 'any' o 'Error'
        console.error(`[PublicOrder CTRL] Error creating public order for slug ${businessSlug}:`, error);
        // Si el servicio lanza errores con mensajes específicos, el manejador global los tomará.
        // Aquí podríamos añadir lógica para códigos de estado específicos si el servicio los diferencia.
        if (error.message && (error.message.includes('no encontrado') || error.message.includes('no es válido'))) {
             return res.status(404).json({ message: error.message });
        }
        if (error.message && (error.message.includes('no está activo') || error.message.includes('módulo de pedidos no está activo'))) {
             return res.status(403).json({ message: error.message }); // Forbidden
        }
        if (error.message && (error.message.includes('requiere al menos') || error.message.includes('se pueden seleccionar como máximo') || error.message.includes('selección única'))) {
            return res.status(400).json({message: error.message }); // Bad Request por reglas de negocio
        }
        next(error); 
    }
};

// --- NUEVO HANDLER PARA OBTENER ESTADO DEL PEDIDO ---
/**
 * Handler para GET /public/order/:orderId/status
 * Obtiene el estado de un pedido específico por su ID.
 * @param req - Express Request object, :orderId debe estar en params.
 * @param res - Express Response object.
 * @param next - Express NextFunction.
 */
export const getPublicOrderStatusHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { orderId } = req.params; // orderId es el UUID del pedido

    if (!orderId || typeof orderId !== 'string' || orderId.trim() === '') {
        return res.status(400).json({ message: 'Se requiere el ID del pedido en la URL.' });
    }

    console.log(`[PublicOrder CTRL] Requesting status for order ID: ${orderId}`);

    try {
        // Llamar al servicio para obtener la información del estado del pedido
        const orderStatusInfo = await publicOrderService.getOrderStatusById(orderId.trim());

        if (!orderStatusInfo) {
            // Si el servicio devuelve null, el pedido no se encontró
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }

        // Enviar la información del estado del pedido como respuesta
        res.status(200).json(orderStatusInfo);
    } catch (error) {
        // Si ocurre un error en el servicio (ej. error de base de datos)
        console.error(`[PublicOrder CTRL] Error fetching status for order ID ${orderId}:`, error);
        next(error); // Pasar el error al manejador de errores global
    }
};
// --- FIN NUEVO HANDLER ---