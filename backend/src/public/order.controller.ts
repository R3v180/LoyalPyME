// Copia Gemini/backend/src/public/order.controller.ts
// Versión con addItemsToExistingOrderHandler esperando businessSlug en header
import { Controller, Post, Body, Param, Get, Req, BadRequestException, UseGuards } from '@nestjs/common';
import { OrderService, CreateOrderPayloadInternalDto, PublicOrderStatusInfo } from './order.service';
import { CreateOrderDto, AddItemsToOrderDto } from './order.dto';
import { Request, Response, NextFunction } from 'express';
import { Order } from '@prisma/client';

const orderServiceInstance = new OrderService();

export const createPublicOrderHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const businessSlug = req.params.businessSlug;
        const createOrderDto: CreateOrderDto = req.body;

        if (!businessSlug) {
            return res.status(400).json({ message: 'Business slug es requerido en la ruta.' });
        }
        
        const servicePayload: CreateOrderPayloadInternalDto = {
            tableIdentifier: createOrderDto.tableIdentifier,
            orderNotes: createOrderDto.customerNotes,
            customerId: createOrderDto.customerId,
            items: createOrderDto.items.map(item => ({
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                notes: undefined, 
                selectedModifierOptions: item.selectedModifiers?.map(mod => ({ modifierOptionId: mod.modifierOptionId })) || []
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

// --- Handler MODIFICADO ---
export const addItemsToExistingOrderHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const orderId = req.params.orderId;
        const addItemsToOrderDto: AddItemsToOrderDto = req.body;
        
        // Leer businessSlug de la cabecera
        const businessSlugFromHeader = req.headers['x-loyalpyme-business-slug'] as string;

        if (!orderId) {
            return res.status(400).json({ message: 'Order ID es requerido.' });
        }
        if (!businessSlugFromHeader) {
            return res.status(400).json({ message: 'Contexto de Business Slug (x-loyalpyme-business-slug header) es requerido.' });
        }
        
        // const requestingCustomerId = req.user?.id; // Opcional, si tienes auth de Express

        const updatedOrder: Order = await orderServiceInstance.addItemsToOrder(
            orderId,
            addItemsToOrderDto,
            businessSlugFromHeader, // <--- CAMBIO: Pasar businessSlug
            // requestingCustomerId 
        );
        res.status(200).json(updatedOrder);
    } catch (error) {
        next(error);
    }
};


// --- Clase de Controlador NestJS (se mantiene para futura migración) ---
@Controller('public/orders')
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
      items: createOrderDto.items.map(item => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        notes: undefined, 
        selectedModifierOptions: item.selectedModifiers?.map((mod: { modifierOptionId: string }) => ({ 
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
    // En la versión NestJS pura, la obtención del businessSlug/Id sería a través de guardas o del contexto de la petición
    const businessSlugFromHeader = req.headers['x-loyalpyme-business-slug'] as string; // O la forma que uses en NestJS
    const user = req.user;

    if (!businessSlugFromHeader) {
      throw new BadRequestException('Business context (Slug) is required to add items to an order.');
    }
    
    return this.orderService.addItemsToOrder( // this.orderService sería la instancia inyectada
      orderId,
      addItemsToOrderDto,
      businessSlugFromHeader, 
      user?.id,
    );
  }
}