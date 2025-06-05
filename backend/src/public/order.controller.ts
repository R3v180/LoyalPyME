// backend/src/public/order.controller.ts
// Version 1.2.1 (Fix private logger access in NestJS controller part)
import { Controller, Post, Body, Param, Get, Req, BadRequestException, NotFoundException } from '@nestjs/common';
import { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express';
import { Order } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateOrderDto, AddItemsToOrderDto, RequestBillClientPayloadDto } from './order.dto';
import { CreateOrderPayloadInternalDto, PublicOrderStatusInfo } from './order.types';

import { OrderService } from './order.service';
import { OrderCreationService } from './order-creation.service';
import { OrderModificationService } from './order-modification.service';
import { OrderPaymentService } from './order-payment.service';

const orderServiceInstance = new OrderService();
const orderCreationServiceInstance = new OrderCreationService();
const orderModificationServiceInstance = new OrderModificationService();
const orderPaymentServiceInstance = new OrderPaymentService();

// --- Handlers Express (sin cambios respecto a la versión anterior que te pasé) ---

export const createPublicOrderHandler = async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    try {
        const businessSlug = req.params.businessSlug;
        const createOrderDto = plainToInstance(CreateOrderDto, req.body as Record<string, any>);
        const validationErrors = await validate(createOrderDto, { whitelist: true, forbidNonWhitelisted: true });

        if (validationErrors.length > 0) {
            console.error('[OrderCtrl createPublic] DTO validation errors:', JSON.stringify(validationErrors, null, 2));
            const formattedErrors = validationErrors.map(err => ({ property: err.property, constraints: err.constraints }));
            return res.status(400).json({ message: 'Error de validación en los datos del pedido.', errors: formattedErrors });
        }

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
                notes: item.notes,
                selectedModifierOptions: item.selectedModifierOptions?.map(mod => ({ modifierOptionId: mod.modifierOptionId })) || [],
            })),
        };

        const newOrder: Order = await orderCreationServiceInstance.createNewOrder(
            businessSlug,
            servicePayload,
            createOrderDto.customerId
        );
        res.status(201).json(newOrder);
    } catch (error) {
        next(error);
    }
};

export const addItemsToExistingOrderHandler = async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    try {
        const orderId = req.params.orderId;
        const addItemsToOrderDto = plainToInstance(AddItemsToOrderDto, req.body as Record<string, any>);
        const validationErrors = await validate(addItemsToOrderDto, { whitelist: true, forbidNonWhitelisted: true });

        if (validationErrors.length > 0) {
            console.error('[OrderCtrl addItems] DTO validation errors:', JSON.stringify(validationErrors, null, 2));
            const formattedErrors = validationErrors.map(err => ({ property: err.property, constraints: err.constraints }));
            return res.status(400).json({ message: 'Error de validación al añadir ítems.', errors: formattedErrors });
        }

        const businessSlugFromHeader = req.headers['x-loyalpyme-business-slug'] as string;

        if (!orderId) return res.status(400).json({ message: 'Order ID es requerido.' });
        if (!businessSlugFromHeader) return res.status(400).json({ message: 'Contexto de Business Slug (x-loyalpyme-business-slug header) es requerido.' });

        const updatedOrder: Order = await orderModificationServiceInstance.addItemsToExistingOrder(
            orderId,
            addItemsToOrderDto,
            businessSlugFromHeader,
        );
        res.status(200).json(updatedOrder);
    } catch (error) {
        next(error);
    }
};

export const getPublicOrderStatusHandler = async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
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

export const requestBillByClientHandler = async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    const { orderId } = req.params;
    const requestBillDto = plainToInstance(RequestBillClientPayloadDto, (req.body || {}) as Record<string, any>);
    const validationErrors = await validate(requestBillDto);

    if (validationErrors.length > 0) {
        const formattedErrors = validationErrors.map(err => ({ property: err.property, constraints: err.constraints }));
        return res.status(400).json({ message: 'Datos inválidos para solicitar la cuenta.', errors: formattedErrors });
    }

    if (!orderId) {
        return res.status(400).json({ message: "Falta el ID del pedido (orderId) en la URL." });
    }

    console.log(`[OrderCtrl requestBillClient] Client requesting bill for order ${orderId}. Preference: ${requestBillDto.paymentPreference || 'N/A'}`);

    try {
        const updatedOrder: Order = await orderPaymentServiceInstance.requestBillForClient(
            orderId,
            requestBillDto.paymentPreference
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
    } catch (error) {
        next(error);
    }
};

// --- Clase de Controlador NestJS (DEPRECADA o para futura migración completa a NestJS) ---
@Controller('public/orders_nest')
export class OrderController {
  constructor(
    private readonly creationService: OrderCreationService,
    private readonly modificationService: OrderModificationService,
    private readonly paymentService: OrderPaymentService,
    private readonly statusService: OrderService
  ) {}

  @Post(':businessSlug')
  async createOrderNest(
    @Param('businessSlug') businessSlug: string,
    @Body() createOrderDto: CreateOrderDto,
    @Req() req: any,
  ) {
    const user = req.user;
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
    return this.creationService.createNewOrder(
        businessSlug,
        servicePayload,
        createOrderDto.customerId || user?.id
    );
  }

  @Get(':orderId/status')
  async getOrderStatusNest(@Param('orderId') orderId: string) {
    const statusInfo = await this.statusService.getOrderStatus(orderId);
    if (!statusInfo) {
        throw new NotFoundException(`Pedido con ID ${orderId} no encontrado.`);
    }
    return statusInfo;
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
      throw new BadRequestException('Contexto de Business Slug (x-loyalpyme-business-slug header) es requerido.');
    }
    return this.modificationService.addItemsToExistingOrder(
      orderId,
      addItemsToOrderDto,
      businessSlugFromHeader,
      user?.id,
    );
  }

  @Post(':orderId/request-bill')
  async requestBillByClientNest(
      @Param('orderId') orderId: string,
      @Body() requestBillDto: RequestBillClientPayloadDto
  ) {
      if (!orderId) {
          throw new BadRequestException("Falta el ID del pedido (orderId) en la URL.");
      }
      // --- CORRECCIÓN: Quitar el log que accede a logger privado ---
      // this.paymentService.logger.log(`[NestCtrl requestBillClient] Client requesting bill for order ${orderId}. Preference: ${requestBillDto.paymentPreference || 'N/A'}`);
      // El OrderPaymentService ya loguea esto internamente.
      // --- FIN CORRECCIÓN ---
      const updatedOrder = await this.paymentService.requestBillForClient(
          orderId,
          requestBillDto.paymentPreference
      );
      return {
          message: `Cuenta solicitada para el pedido #${updatedOrder.orderNumber}. Estado: ${updatedOrder.status}.`,
          order: {
              id: updatedOrder.id,
              orderNumber: updatedOrder.orderNumber,
              status: updatedOrder.status,
              isBillRequested: updatedOrder.isBillRequested,
          }
      };
  }
}