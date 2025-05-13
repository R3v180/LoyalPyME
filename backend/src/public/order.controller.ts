// backend/src/public/order.controller.ts
// Version: 1.0.0 (Initial controller for public order creation)

import { Request, Response, NextFunction } from 'express';
// Importaremos el servicio y los DTOs cuando los tengamos.
// Por ahora, definimos la estructura del DTO aquí para referencia.
// En un paso posterior, moveríamos estos DTOs a un archivo dedicado (ej. src/public/order.dto.ts o src/camarero/order.dto.ts)

interface SelectedModifierOptionDto {
    modifierOptionId: string;
}

interface OrderItemDto {
    menuItemId: string;
    quantity: number;
    notes?: string | null;
    selectedModifierOptions?: SelectedModifierOptionDto[] | null;
}

interface CreateOrderPayloadDto { // Payload que esperamos en el body
    tableIdentifier?: string | null;
    customerId?: string | null;
    orderNotes?: string | null;
    items: OrderItemDto[];
}

// Importaremos el servicio de pedidos
import * as publicOrderService from './order.service'; // Asumiendo que el servicio estará en la misma carpeta

export const createPublicOrderHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { businessSlug } = req.params;
    const orderPayload: CreateOrderPayloadDto = req.body;

    // Validación básica del businessSlug
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
        // Pasamos el businessSlug y el payload completo al servicio
        const createdOrder = await publicOrderService.createPublicOrder(businessSlug.trim(), orderPayload);

        // El servicio debería devolver los detalles del pedido creado o una confirmación.
        // Por ahora, asumimos que devuelve el objeto del pedido creado.
        res.status(201).json(createdOrder);
    } catch (error) {
        // El servicio lanzará errores específicos (ej. negocio no encontrado, ítem no válido, etc.)
        // que podrían tener un código de estado específico (400, 404).
        // Si no, el manejador de errores global lo tomará.
        console.error(`[PublicOrder CTRL] Error creating public order for slug ${businessSlug}:`, error);
        next(error); // Pasamos el error al manejador global
    }
};