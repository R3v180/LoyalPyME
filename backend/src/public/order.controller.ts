// backend/src/public/order.controller.ts
// Version 1.1.1 (Fix TypeScript errors for requestBillByClientHandler)
import { Controller, Post, Body, Param, Get, Req, BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderService, CreateOrderPayloadInternalDto, PublicOrderStatusInfo } from './order.service';
// ---- MODIFICADO: Añadir RequestBillClientPayloadDto a la importación ----
import { CreateOrderDto, AddItemsToOrderDto, CreateOrderItemDto as CreateOrderItemControllerDto, RequestBillClientPayloadDto } from './order.dto';
import { Request, Response, NextFunction } from 'express';
import { Order } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

const orderServiceInstance = new OrderService();

export const createPublicOrderHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const businessSlug = req.params.businessSlug;
        const createOrderDto = plainToInstance(CreateOrderDto, req.body as Record<string, any>);
        const validationErrors = await validate(createOrderDto, { whitelist: true });

        if (validationErrors.length > 0) {
            console.error('[createPublicOrderHandler] Errores de validación del DTO:', JSON.stringify(validationErrors, null, 2));
            const formattedErrors = validationErrors.map(err => ({
                property: err.property,
                constraints: err.constraints
            }));
            return res.status(400).json({
                message: 'Error de validación en los datos del pedido.',
                errors: formattedErrors
            });
        }

        if (!businessSlug) {
            return res.status(400).json({ message: 'Business slug es requerido en la ruta.' });
        }

        const servicePayload: CreateOrderPayloadInternalDto = {
            tableIdentifier: createOrderDto.tableIdentifier,
            orderNotes: createOrderDto.customerNotes,
            customerId: createOrderDto.customerId,
            items: createOrderDto.items.map((item: CreateOrderItemControllerDto) => ({
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                notes: item.notes,
                selectedModifierOptions: item.selectedModifierOptions?.map(mod => ({ modifierOptionId: mod.modifierOptionId })) || []
            })),
        };

        const newOrder: Order = await orderServiceInstance.createOrder(
            businessSlug,
            servicePayload,
            createOrderDto.customerId
        );
        res.status(201).json(newOrder);
    } catch (error) {
        next(error);
    }
};

export const addItemsToExistingOrderHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const orderId = req.params.orderId;
        const addItemsToOrderDto = plainToInstance(AddItemsToOrderDto, req.body as Record<string, any>);
        const validationErrors = await validate(addItemsToOrderDto, { whitelist: true });

        if (validationErrors.length > 0) {
            console.error('[addItemsToExistingOrderHandler] Errores de validación del DTO:', JSON.stringify(validationErrors, null, 2));
            const formattedErrors = validationErrors.map(err => ({
                property: err.property,
                constraints: err.constraints
            }));
            return res.status(400).json({ message: 'Error de validación al añadir ítems.', errors: formattedErrors });
        }

        const businessSlugFromHeader = req.headers['x-loyalpyme-business-slug'] as string;

        if (!orderId) return res.status(400).json({ message: 'Order ID es requerido.' });
        if (!businessSlugFromHeader) return res.status(400).json({ message: 'Contexto de Business Slug (x-loyalpyme-business-slug header) es requerido.' });

        const updatedOrder: Order = await orderServiceInstance.addItemsToOrder(
            orderId,
            addItemsToOrderDto,
            businessSlugFromHeader,
        );
        res.status(200).json(updatedOrder);
    } catch (error) {
        next(error);
    }
};

export const getPublicOrderStatusHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const orderId = req.params.orderId;
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

export const requestBillByClientHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { orderId } = req.params;
    // ---- CORRECCIÓN: Tipar explícitamente el resultado de plainToInstance ----
    // Y asegurar que el body se trate como objeto, incluso si es vacío.
    const requestBillDto: RequestBillClientPayloadDto = plainToInstance(
        RequestBillClientPayloadDto,
        (req.body || {}) as Record<string, any> // Si req.body es undefined, usar {}
    );

    const validationErrors = await validate(requestBillDto); // No es necesario pasar { whitelist: true } si no hay propiedades extra que quitar
    if (validationErrors.length > 0) {
        const formattedErrors = validationErrors.map(err => ({ property: err.property, constraints: err.constraints }));
        return res.status(400).json({ message: 'Datos inválidos para solicitar la cuenta.', errors: formattedErrors });
    }

    if (!orderId) {
        return res.status(400).json({ message: "Falta el ID del pedido (orderId) en la URL." });
    }

    console.log(`[PublicOrderCtrl] Client requesting bill for order ${orderId}. Preference: ${requestBillDto.paymentPreference || 'N/A'}`);

    try {
        const updatedOrder: Order = await orderServiceInstance.requestBillForClient(
            orderId,
            requestBillDto.paymentPreference // Ahora requestBillDto está correctamente tipado
        );

        res.status(200).json({
            message: `Cuenta solicitada para el pedido #${updatedOrder.orderNumber}. Estado: ${updatedOrder.status}.`,
            order: {
                id: updatedOrder.id,
                orderNumber: updatedOrder.orderNumber,
                status: updatedOrder.status,
                isBillRequested: updatedOrder.isBillRequested,
            }
        });

    } catch (error: any) {
        console.error(`[PublicOrderCtrl] Error requesting bill for order ${orderId} by client:`, error);
        if (error instanceof NotFoundException) { // Comprobar tipo de error si el servicio lanza excepciones específicas de NestJS
            return res.status(404).json({ message: error.message });
        }
        if (error instanceof BadRequestException) { // Comprobar tipo de error
            return res.status(400).json({ message: error.message });
        }
        // Manejo genérico si no es una de las excepciones conocidas
        if (error.message) {
            if (error.message.includes('no encontrado')) return res.status(404).json({ message: error.message });
            if (error.message.includes('No se puede solicitar la cuenta')) return res.status(400).json({ message: error.message });
        }
        next(error);
    }
};


// --- Clase de Controlador NestJS (sin cambios) ---
@Controller('public/orders_nest')
export class OrderController {
  constructor(
    private readonly orderService: OrderService
  ) {}

  @Post()
  async createOrderNest(
    @Body() createOrderDto: CreateOrderDto,
    @Req() req: any,
  ) {
    const businessSlugOrIdFromRequest = req.headers['x-loyalpyme-business-slug'] || req.query.businessSlug || createOrderDto.businessId;
    const user = req.user;

    if (!businessSlugOrIdFromRequest) {
        throw new BadRequestException('Business context (slug or ID) is required to create an order.');
    }

    const servicePayload: CreateOrderPayloadInternalDto = {
      tableIdentifier: createOrderDto.tableIdentifier,
      orderNotes: createOrderDto.customerNotes,
      customerId: createOrderDto.customerId || user?.id,
      items: createOrderDto.items.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        notes: item.notes,
        selectedModifierOptions: item.selectedModifierOptions?.map(mod => ({
            modifierOptionId: mod.modifierOptionId
        })) || []
      })),
    };

    return this.orderService.createOrder(
        businessSlugOrIdFromRequest,
        servicePayload,
        user?.id
    );
  }

  @Get(':orderId/status')
  async getOrderStatusNest(@Param('orderId') orderId: string, @Req() req: any) {
    return this.orderService.getOrderStatus(orderId);
  }

  @Post(':orderId/items')
  async addItemsToExistingOrderNest(
    @Param('orderId') orderId: string,
    @Body() addItemsToOrderDto: AddItemsToOrderDto,
    @Req() req: any,
  ) {
    const businessSlugFromHeader = req.headers['x-loyalpyme-business-slug'] as string;
    const user = req.user;

    if (!businessSlugFromHeader) {
      throw new BadRequestException('Business context (Slug) is required to add items to an order.');
    }

    return this.orderService.addItemsToOrder(
      orderId,
      addItemsToOrderDto,
      businessSlugFromHeader,
      user?.id,
    );
  }
}