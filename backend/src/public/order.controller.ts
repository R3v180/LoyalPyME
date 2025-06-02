// backend/src/public/order.controller.ts
// VERSIÓN CON plainToInstance PARA LOS HANDLERS DE EXPRESS
import { Controller, Post, Body, Param, Get, Req, BadRequestException } from '@nestjs/common';
import { OrderService, CreateOrderPayloadInternalDto, PublicOrderStatusInfo } from './order.service';
import { CreateOrderDto, AddItemsToOrderDto, CreateOrderItemDto as CreateOrderItemControllerDto } from './order.dto'; 
import { Request, Response, NextFunction } from 'express';
import { Order } from '@prisma/client';
import { plainToInstance } from 'class-transformer'; // ¡¡IMPORTANTE!!
import { validate } from 'class-validator';       // ¡¡IMPORTANTE!!

const orderServiceInstance = new OrderService(); // Instancia global para handlers de Express

export const createPublicOrderHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const businessSlug = req.params.businessSlug;
        
        // 1. Transformar req.body a una instancia de CreateOrderDto usando class-transformer
        // Se usa 'req.body as Record<string, any>' para asegurar compatibilidad con plainToInstance
        const createOrderDto = plainToInstance(CreateOrderDto, req.body as Record<string, any>);

        // 2. Validar la instancia (opcional aquí si tu ValidationPipe global de NestJS NO se aplica a estas rutas Express)
        const validationErrors = await validate(createOrderDto, { 
            whitelist: true, 
            // forbidNonWhitelisted: true, // Opción más estricta
        });

        if (validationErrors.length > 0) {
            console.error('[createPublicOrderHandler] Errores de validación del DTO:', JSON.stringify(validationErrors, null, 2));
            const formattedErrors = validationErrors.map(err => ({ /* ... formateo de errores ... */ })); // Puedes mejorar este formateo
            return res.status(400).json({ 
                message: 'Error de validación en los datos del pedido.', 
                errors: formattedErrors 
            });
        }

        // A partir de aquí, createOrderDto es una instancia de la clase CreateOrderDto
        // y sus propiedades anidadas (items, selectedModifierOptions) deberían estar
        // también transformadas en instancias de sus respectivas clases DTO gracias a @Type() en order.dto.ts

        if (!businessSlug) {
            return res.status(400).json({ message: 'Business slug es requerido en la ruta.' });
        }
        
        const servicePayload: CreateOrderPayloadInternalDto = {
            tableIdentifier: createOrderDto.tableIdentifier,
            orderNotes: createOrderDto.customerNotes, 
            customerId: createOrderDto.customerId,
            items: createOrderDto.items.map((item: CreateOrderItemControllerDto) => ({ // item es CreateOrderItemControllerDto (alias de CreateOrderItemDto)
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                notes: item.notes, 
                // Ahora item.selectedModifierOptions debería tener los datos
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

// Aplica la misma lógica de plainToInstance y validate a addItemsToExistingOrderHandler
export const addItemsToExistingOrderHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const orderId = req.params.orderId;
        
        const addItemsToOrderDto = plainToInstance(AddItemsToOrderDto, req.body as Record<string, any>);
        const validationErrors = await validate(addItemsToOrderDto, { whitelist: true });

        if (validationErrors.length > 0) {
            console.error('[addItemsToExistingOrderHandler] Errores de validación del DTO:', JSON.stringify(validationErrors, null, 2));
            const formattedErrors = validationErrors.map(err => ({ /* ... formateo ... */}));
            return res.status(400).json({ message: 'Error de validación al añadir ítems.', errors: formattedErrors });
        }
        
        const businessSlugFromHeader = req.headers['x-loyalpyme-business-slug'] as string;

        if (!orderId) return res.status(400).json({ message: 'Order ID es requerido.' });
        if (!businessSlugFromHeader) return res.status(400).json({ message: 'Contexto de Business Slug (x-loyalpyme-business-slug header) es requerido.' });
        
        const updatedOrder: Order = await orderServiceInstance.addItemsToOrder(
            orderId,
            addItemsToOrderDto, // Ya es una instancia transformada
            businessSlugFromHeader,
        );
        res.status(200).json(updatedOrder);
    } catch (error) {
        next(error);
    }
};

export const getPublicOrderStatusHandler = async (req: Request, res: Response, next: NextFunction) => {
    // ... (sin cambios si no maneja DTOs complejos en el body) ...
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


// --- Clase de Controlador NestJS ---
// (Esta parte funcionaría correctamente si tu app fuera NestJS pura y tuvieras ValidationPipe global)
@Controller('public/orders_nest') 
export class OrderController {
  constructor(
    private readonly orderService: OrderService 
  ) {}

  @Post()
  async createOrderNest(
    @Body() createOrderDto: CreateOrderDto, // Aquí el ValidationPipe global de NestJS haría la magia
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