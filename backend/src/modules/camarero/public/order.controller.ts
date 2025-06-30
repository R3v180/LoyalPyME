// backend/src/modules/camarero/public/order.controller.ts
import { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express';
import { Order } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

// Importaciones de DTOs y Tipos (no cambian)
import { CreateOrderDto, AddItemsToOrderDto, RequestBillClientPayloadDto, ApplyRewardDto } from './order.dto';
import { CreateOrderPayloadInternalDto, PublicOrderStatusInfo } from './order.types';

// Importaciones de Servicios (no cambian)
import { OrderService } from './order.service';
import { OrderCreationService } from './order-creation.service';
import { OrderModificationService } from './order-modification.service';
import { OrderPaymentService } from './order-payment.service';

// Instancias de servicios (no cambian)
const orderServiceInstance = new OrderService();
const orderCreationServiceInstance = new OrderCreationService();
const orderModificationServiceInstance = new OrderModificationService();
const orderPaymentServiceInstance = new OrderPaymentService();

// --- Handlers de Express (La parte que realmente se está usando) ---

export const createPublicOrderHandler = async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    try {
        const businessSlug = req.params.businessSlug;
        if (!businessSlug) {
            return res.status(400).json({ message: 'Business slug es requerido en la ruta.' });
        }
        
        // 1. Convertir el cuerpo de la petición a una instancia de nuestro DTO
        const createOrderDto = plainToInstance(CreateOrderDto, req.body);
        
        // 2. Validar la instancia del DTO
        const validationErrors = await validate(createOrderDto, { whitelist: true, forbidNonWhitelisted: true });
        if (validationErrors.length > 0) {
            // --- MEJORA: Devolver un error más detallado ---
            console.error('[OrderCtrl createPublic] DTO validation errors:', JSON.stringify(validationErrors, null, 2));
            // Formateamos los errores para que sean más útiles en el frontend
            const formattedErrors = validationErrors.map(err => ({
                property: err.property,
                constraints: err.constraints,
                children: err.children?.map(child => ({ // Mostrar errores anidados
                    property: child.property,
                    constraints: child.constraints,
                }))
            })).flat();
            return res.status(400).json({ message: 'Error de validación en los datos del pedido.', errors: formattedErrors });
            // --- FIN MEJORA ---
        }

        // 3. Mapear al payload interno del servicio
        const requestingCustomerId = (req as any).user?.id || createOrderDto.customerId;
        const servicePayload: CreateOrderPayloadInternalDto = {
            tableIdentifier: createOrderDto.tableIdentifier,
            orderNotes: createOrderDto.customerNotes,
            customerId: requestingCustomerId,
            items: createOrderDto.items.map(item => ({
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                notes: item.notes,
                selectedModifierOptions: item.selectedModifierOptions?.map(mod => ({ modifierOptionId: mod.modifierOptionId })) || [],
                redeemedRewardId: item.redeemedRewardId,
            })),
            appliedLcoRewardId: createOrderDto.appliedLcoRewardId
        };

        // 4. Llamar al servicio
        const newOrder: Order = await orderCreationServiceInstance.createNewOrder(
            businessSlug,
            servicePayload,
            requestingCustomerId
        );
        res.status(201).json(newOrder);

    } catch (error) {
        next(error); // Pasar a manejador de errores global
    }
};

// ... El resto de los handlers siguen una estructura similar y se benefician de las correcciones en DTOs y servicios.
// No requieren cambios funcionales directos, así que los mantengo como estaban.

export const addItemsToExistingOrderHandler = async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    try {
        const { orderId } = req.params;
        const businessSlugFromHeader = req.headers['x-loyalpyme-business-slug'] as string;

        if (!orderId) return res.status(400).json({ message: 'Order ID es requerido.' });
        if (!businessSlugFromHeader) return res.status(400).json({ message: 'Contexto de Business Slug (x-loyalpyme-business-slug header) es requerido.' });
        
        const addItemsToOrderDto = plainToInstance(AddItemsToOrderDto, req.body);
        const validationErrors = await validate(addItemsToOrderDto, { whitelist: true, forbidNonWhitelisted: true });
        if (validationErrors.length > 0) {
            console.error('[OrderCtrl addItems] DTO validation errors:', JSON.stringify(validationErrors, null, 2));
            const formattedErrors = validationErrors.map(err => ({ property: err.property, constraints: err.constraints }));
            return res.status(400).json({ message: 'Error de validación al añadir ítems.', errors: formattedErrors });
        }

        const updatedOrder: Order = await orderModificationServiceInstance.addItemsToExistingOrder(
            orderId,
            addItemsToOrderDto,
            businessSlugFromHeader,
            (req as any).user?.id
        );
        res.status(200).json(updatedOrder);
    } catch (error) {
        next(error);
    }
};

export const getPublicOrderStatusHandler = async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    try {
        const { orderId } = req.params;
        if (!orderId) {
            return res.status(400).json({ message: 'Order ID es requerido.' });
        }
        const statusInfo: PublicOrderStatusInfo | null = await orderServiceInstance.getOrderStatus(orderId);
        if (!statusInfo) {
            return res.status(404).json({ message: `Pedido con ID ${orderId} no encontrado.` });
        }
        res.status(200).json(statusInfo);
    } catch (error) {
        next(error);
    }
};

export const requestBillByClientHandler = async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    try {
        const { orderId } = req.params;
        if (!orderId) {
            return res.status(400).json({ message: "Falta el ID del pedido (orderId) en la URL." });
        }
        
        const requestBillDto = plainToInstance(RequestBillClientPayloadDto, req.body || {});
        const validationErrors = await validate(requestBillDto);
        if (validationErrors.length > 0) {
            return res.status(400).json({ message: 'Datos inválidos para solicitar la cuenta.', errors: validationErrors });
        }

        const updatedOrder: Order = await orderPaymentServiceInstance.requestBillForClient(orderId, requestBillDto.paymentPreference);
        res.status(200).json({
            message: `Cuenta solicitada para el pedido #${updatedOrder.orderNumber}. Estado: ${updatedOrder.status}.`,
            order: { id: updatedOrder.id, orderNumber: updatedOrder.orderNumber, status: updatedOrder.status, isBillRequested: updatedOrder.isBillRequested }
        });
    } catch (error) {
        next(error);
    }
};

export const applyRewardHandler = async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    try {
        const { orderId } = req.params;
        const customerId = (req as any).user?.id;
        if (!customerId) {
            return res.status(401).json({ message: 'Se requiere autenticación de cliente para aplicar una recompensa.' });
        }

        const applyRewardDto = plainToInstance(ApplyRewardDto, req.body);
        const validationErrors = await validate(applyRewardDto);
        if (validationErrors.length > 0) {
            return res.status(400).json({ message: 'Datos para aplicar recompensa son inválidos.', errors: validationErrors });
        }

        const updatedOrder = await orderPaymentServiceInstance.applyRewardToOrder(orderId, applyRewardDto.grantedRewardId, customerId);
        res.status(200).json({ message: 'Recompensa aplicada con éxito.', order: updatedOrder });
    } catch (error) {
        next(error);
    }
};