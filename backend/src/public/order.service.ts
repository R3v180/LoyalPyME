// backend/src/public/order.service.ts
// Versión 1.7.1 (Función markOrderAsPaid completa)
import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Logger, ForbiddenException } from '@nestjs/common';
import {
    PrismaClient,
    Prisma,
    Order,
    OrderStatus,
    OrderItemStatus,
    ModifierGroup,
    ActivityType,
    TableStatus,
} from '@prisma/client';
import { AddItemsToOrderDto } from './order.dto';
import { updateUserTier } from '../tiers/tier-logic.service';


// --- DTOs internos ---
interface SelectedModifierOptionInternalDto {
  modifierOptionId: string;
}

interface OrderItemInternalDto {
  menuItemId: string;
  quantity: number;
  notes?: string | null;
  selectedModifierOptions?: SelectedModifierOptionInternalDto[] | null;
}

export interface CreateOrderPayloadInternalDto {
  tableIdentifier?: string | null;
  customerId?: string | null;
  orderNotes?: string | null;
  items: OrderItemInternalDto[];
}
// --- Fin DTOs internos ---

// --- Estructuras para estado ---
export interface PublicOrderItemStatusInfo {
  id: string;
  menuItemName_es: string | null;
  menuItemName_en: string | null;
  quantity: number;
  status: OrderItemStatus;
}

export interface PublicOrderStatusInfo {
  orderId: string;
  orderNumber: string;
  orderStatus: OrderStatus;
  items: PublicOrderItemStatusInfo[];
  tableIdentifier?: string | null;
  orderNotes?: string | null;
  createdAt: Date;
  isBillRequested?: boolean; // Asegúrate de que el backend envíe esto si el frontend lo necesita
}
// --- Fin Estructuras para estado ---

interface SelectedModifierOptionShape {
    id: string;
    name_es: string | null;
    priceAdjustment: Prisma.Decimal;
    isAvailable: boolean;
    groupId: string;
}

type ModifierGroupWithSelectedOptions = ModifierGroup & {
    options: SelectedModifierOptionShape[];
};

const menuItemWithFullModifiersArgs = Prisma.validator<Prisma.MenuItemDefaultArgs>()({
  include: {
    modifierGroups: {
      include: {
        options: {
          where: { isAvailable: true },
          select: {
            id: true,
            name_es: true,
            priceAdjustment: true,
            isAvailable: true,
            groupId: true,
          },
        },
      },
    },
  },
});
type MenuItemWithFullModifiers = Prisma.MenuItemGetPayload<typeof menuItemWithFullModifiersArgs>;


@Injectable()
export class OrderService {
  private prisma: PrismaClient;
  private readonly logger = new Logger(OrderService.name);

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createOrder(
    businessSlug: string,
    payload: CreateOrderPayloadInternalDto,
    requestingCustomerId?: string
  ): Promise<Order> {
    const business = await this.prisma.business.findUnique({
      where: { slug: businessSlug },
      select: { id: true, isActive: true, isCamareroActive: true }
    });

    if (!business) throw new NotFoundException(`Negocio con slug '${businessSlug}' no encontrado.`);
    if (!business.isActive) throw new BadRequestException(`El negocio '${businessSlug}' no está activo.`);
    if (!business.isCamareroActive) throw new BadRequestException(`Módulo de pedidos no activo para '${businessSlug}'.`);

    const businessId = business.id;

    return this.prisma.$transaction(async (tx) => {
      let calculatedTotalAmount = new Prisma.Decimal(0);
      const orderItemsToCreate: Prisma.OrderItemCreateWithoutOrderInput[] = [];

      for (const itemDto of payload.items) {
        this.logger.debug(`[OrderService createOrder] Procesando itemDto. MenuItemId: ${itemDto.menuItemId}. selectedModifierOptions ANTES del IF: ${JSON.stringify(itemDto.selectedModifierOptions)}`);
        if (itemDto.selectedModifierOptions) {
            this.logger.debug(`[OrderService createOrder] itemDto.selectedModifierOptions.length: ${itemDto.selectedModifierOptions.length}`);
        } else {
            this.logger.debug(`[OrderService createOrder] itemDto.selectedModifierOptions es null o undefined.`);
        }

        const menuItem: MenuItemWithFullModifiers | null = await tx.menuItem.findUnique({
          where: { id: itemDto.menuItemId },
          ...menuItemWithFullModifiersArgs
        });

        if (!menuItem || menuItem.businessId !== businessId || !menuItem.isAvailable) {
          throw new BadRequestException(`Ítem ID '${itemDto.menuItemId}' no válido/disponible o no del negocio.`);
        }

        const typedModifierGroups = menuItem.modifierGroups as ModifierGroupWithSelectedOptions[];

        let itemBasePrice = menuItem.price;
        let currentItemTotalModifierPrice = new Prisma.Decimal(0);
        const orderItemModifierOptionsData: Prisma.OrderItemModifierOptionCreateManyOrderItemInput[] = [];

        if (itemDto.selectedModifierOptions && itemDto.selectedModifierOptions.length > 0) {
          this.logger.debug(`[OrderService createOrder] ENTRANDO al bloque IF para procesar selectedModifierOptions para el item ${itemDto.menuItemId}.`);
          const selectedOptionsByGroup: Record<string, string[]> = {};

          for (const selectedOpt of itemDto.selectedModifierOptions) {
            const optionFull = typedModifierGroups
              .flatMap(g => g.options)
              .find(opt => opt.id === selectedOpt.modifierOptionId);

            if (!optionFull || !optionFull.isAvailable) {
              throw new BadRequestException(`Opción mod ID '${selectedOpt.modifierOptionId}' no válida/disponible para '${menuItem.name_es}'.`);
            }
            if (optionFull.groupId === null || optionFull.groupId === undefined) {
                this.logger.error(`[OrderService Error Crítico] Opción ${optionFull.id} ('${optionFull.name_es}') no tiene groupId válido después de la consulta. OptionFull: ${JSON.stringify(optionFull)}`);
                throw new InternalServerErrorException(`Configuración de datos inválida: Opción ${optionFull.id} no tiene grupo asignado correctamente (groupId es null/undefined).`);
            }

            const parentGroup = typedModifierGroups.find(g => g.id === optionFull.groupId);
            if (!parentGroup) {
                this.logger.error(`[OrderService Error Crítico] Grupo padre con ID ${optionFull.groupId} no hallado para opción ${optionFull.id}.`);
                throw new InternalServerErrorException(`Grupo padre no hallado para opción ${optionFull.id}.`);
            }

            if (!selectedOptionsByGroup[parentGroup.id]) selectedOptionsByGroup[parentGroup.id] = [];
            selectedOptionsByGroup[parentGroup.id].push(optionFull.id);

            currentItemTotalModifierPrice = currentItemTotalModifierPrice.add(optionFull.priceAdjustment);
            orderItemModifierOptionsData.push({
              modifierOptionId: optionFull.id,
              optionNameSnapshot: optionFull.name_es || 'Opción sin nombre',
              optionPriceAdjustmentSnapshot: optionFull.priceAdjustment,
            });
          }

          for (const group of typedModifierGroups) {
            const selectedCount = selectedOptionsByGroup[group.id]?.length || 0;
            if (group.isRequired && selectedCount < group.minSelections) {
              throw new BadRequestException(`Grupo '${group.name_es || group.id}': requiere min ${group.minSelections}. Seleccionadas: ${selectedCount}.`);
            }
            if (selectedCount > group.maxSelections) {
              throw new BadRequestException(`Grupo '${group.name_es || group.id}': máx ${group.maxSelections}. Seleccionadas: ${selectedCount}.`);
            }
          }
        } else {
            this.logger.warn(`[OrderService createOrder] ENTRANDO al bloque ELSE porque selectedModifierOptions está vacío o no se proporcionó para el item ${itemDto.menuItemId} (ItemID: ${menuItem.id}).`);
            for (const group of typedModifierGroups) {
                if (group.isRequired && group.minSelections > 0) {
                    this.logger.error(
                        `FALLO VALIDACIÓN (porque se entró al ELSE - selectedModifierOptions vacío/nulo para el servicio): Item ID: ${menuItem.id}, Grupo ID: ${group.id} ('${group.name_es || group.name_en || group.id}'). ` +
                        `Es requerido (min ${group.minSelections}) pero el servicio considera que no se enviaron opciones para este ítem.`
                      );
                    throw new BadRequestException(`Grupo '${group.name_es || 'Modificador'}' es obligatorio y parece que no se proporcionaron opciones para el ítem '${menuItem.name_es || menuItem.id}'.`);
                }
            }
        }

        for (const group of typedModifierGroups) {
            if (group.isRequired && group.minSelections > 0) {
                const hasSelectionInGroup = itemDto.selectedModifierOptions?.some((smo: SelectedModifierOptionInternalDto) =>
                    group.options.find(opt => opt.id === smo.modifierOptionId && opt.groupId === group.id)
                );
                if (!hasSelectionInGroup) {
                    const selectionsInThisGroupCount = itemDto.selectedModifierOptions?.filter((smo: SelectedModifierOptionInternalDto) =>
                        group.options.some(opt => opt.id === smo.modifierOptionId && opt.groupId === group.id)
                      ).length || 0;

                    this.logger.error(
                        `FALLO VALIDACIÓN MODIFICADOR OBLIGATORIO (createOrder - validación final por grupo): Item ID: ${menuItem.id} ('${menuItem.name_es || menuItem.id}'), Grupo ID: ${group.id} ('${group.name_es || group.name_en || group.id}'). ` +
                        `Min requerido: ${group.minSelections}, Se encontró (conteo directo en esta validación): ${selectionsInThisGroupCount}. ` +
                        `(Booleano hasSelectionInGroup fue: ${hasSelectionInGroup}). ` +
                        `IDs de opciones VÁLIDAS para este grupo según BD y filtro 'isAvailable': [${group.options.map(opt => opt.id).join(', ')}]. ` +
                        `IDs de opciones RECIBIDAS en payload para este ítem (según itemDto DENTRO DEL SERVICIO): [${itemDto.selectedModifierOptions?.map(smo => smo.modifierOptionId).join(', ') || 'NINGUNA (undefined/vacío)'}]`
                      );
                    throw new BadRequestException(`Grupo '${group.name_es || 'Modificador'}' es obligatorio (check final) para el ítem '${menuItem.name_es || menuItem.id}'.`);
                }
            }
        }

        const priceAtPurchaseValue = itemBasePrice.add(currentItemTotalModifierPrice);
        const totalItemPriceValue = priceAtPurchaseValue.mul(itemDto.quantity);
        calculatedTotalAmount = calculatedTotalAmount.add(totalItemPriceValue);

        orderItemsToCreate.push({
          menuItem: { connect: { id: menuItem.id } },
          quantity: itemDto.quantity,
          priceAtPurchase: priceAtPurchaseValue,
          totalItemPrice: totalItemPriceValue,
          notes: itemDto.notes,
          kdsDestination: menuItem.kdsDestination,
          itemNameSnapshot: menuItem.name_es || 'Ítem sin nombre',
          itemDescriptionSnapshot: menuItem.description_es,
          status: OrderItemStatus.PENDING_KDS,
          ...(orderItemModifierOptionsData.length > 0 && {
            selectedModifiers: { createMany: { data: orderItemModifierOptionsData } }
          })
        });
      }

      const orderCount = await tx.order.count({ where: { businessId: businessId } });
      const orderNumber = `P-${String(orderCount + 1).padStart(6, '0')}`;

      const orderCreateData: Prisma.OrderCreateInput = {
        business: { connect: { id: businessId } },
        notes: payload.orderNotes,
        totalAmount: calculatedTotalAmount,
        finalAmount: calculatedTotalAmount,
        status: OrderStatus.RECEIVED,
        orderNumber: orderNumber,
        items: { create: orderItemsToCreate },
        isBillRequested: false,
      };

      if (payload.tableIdentifier) {
        const tableRecord = await tx.table.findUnique({
          where: { businessId_identifier: { businessId: businessId, identifier: payload.tableIdentifier } },
          select: { id: true }
        });
        if (tableRecord) {
             orderCreateData.table = { connect: { id: tableRecord.id } };
             await tx.table.update({
                 where: { id: tableRecord.id },
                 data: { status: TableStatus.OCCUPIED }
             });
             this.logger.log(`[OrderService] Table ${payload.tableIdentifier} status set to OCCUPIED.`);
        } else {
            this.logger.warn(`[OrderService] Table '${payload.tableIdentifier}' no hallada para business ${businessId}.`);
        }
      }

      const finalCustomerId = payload.customerId || requestingCustomerId;
      if (finalCustomerId) {
        orderCreateData.customerLCo = { connect: { id: finalCustomerId } };
      }

      const newOrder = await tx.order.create({ data: orderCreateData, include: { items: true }});
      this.logger.log(`[OrderService] Order ${newOrder.id} (Number: ${newOrder.orderNumber}) created successfully.`);
      return newOrder;
    });
  }

  async getOrderStatus(orderId: string): Promise<PublicOrderStatusInfo | null> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true, orderNumber: true, status: true, notes: true, createdAt: true,
        isBillRequested: true, // Incluir isBillRequested
        table: { select: { identifier: true } },
        items: {
          select: { id: true, itemNameSnapshot: true, quantity: true, status: true },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!order) {
      this.logger.warn(`[OrderService getOrderStatus] Pedido con ID ${orderId} no encontrado.`);
      return null;
    }

    const itemsInfo: PublicOrderItemStatusInfo[] = order.items.map(item => ({
      id: item.id,
      menuItemName_es: item.itemNameSnapshot,
      menuItemName_en: null,
      quantity: item.quantity,
      status: item.status,
    }));

    const orderStatusInfo: PublicOrderStatusInfo = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderStatus: order.status,
      items: itemsInfo,
      tableIdentifier: order.table?.identifier || null,
      orderNotes: order.notes,
      createdAt: order.createdAt,
      isBillRequested: order.isBillRequested, // Añadir al DTO de respuesta
    };

    return orderStatusInfo;
  }

  async addItemsToOrder(
    orderId: string,
    addItemsDto: AddItemsToOrderDto,
    businessSlug: string,
    requestingCustomerId?: string,
  ): Promise<Order> {
    this.logger.log(`[OrderService] Attempting to add items to order ${orderId} for business slug: ${businessSlug}`);

    const business = await this.prisma.business.findUnique({
      where: { slug: businessSlug },
      select: { id: true, isActive: true, isCamareroActive: true }
    });

    if (!business) throw new NotFoundException(`Negocio con slug '${businessSlug}' no encontrado.`);
    if (!business.isActive) throw new BadRequestException(`El negocio '${businessSlug}' no está activo.`);
    if (!business.isCamareroActive) throw new BadRequestException(`Módulo de pedidos no activo para el negocio '${businessSlug}'.`);

    const actualBusinessId = business.id;

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      });

      if (!order) {
        throw new NotFoundException(`Pedido con ID ${orderId} no encontrado.`);
      }
      if (order.businessId !== actualBusinessId) {
        throw new BadRequestException(`El pedido no pertenece al negocio especificado por el slug.`);
      }

      const validStatusToAddItems: OrderStatus[] = [
        OrderStatus.RECEIVED, OrderStatus.IN_PROGRESS,
        OrderStatus.PARTIALLY_READY, OrderStatus.ALL_ITEMS_READY,
        OrderStatus.COMPLETED, OrderStatus.PENDING_PAYMENT
      ];

      if (!validStatusToAddItems.includes(order.status)) {
        throw new BadRequestException(`No se pueden añadir ítems a un pedido en estado '${order.status}'.`);
      }

      const originalOrderStatus = order.status;
      const newOrderItemsToCreateInput: Prisma.OrderItemCreateWithoutOrderInput[] = [];
      let additionalAmountCalculated = new Prisma.Decimal(0);

      for (const itemDto of addItemsDto.items) {
        this.logger.debug(`[OrderService addItemsToOrder] Procesando itemDto. MenuItemId: ${itemDto.menuItemId}. selectedModifierOptions ANTES del IF: ${JSON.stringify(itemDto.selectedModifierOptions)}`);
        if (itemDto.selectedModifierOptions) {
            this.logger.debug(`[OrderService addItemsToOrder] itemDto.selectedModifierOptions.length: ${itemDto.selectedModifierOptions.length}`);
        } else {
            this.logger.debug(`[OrderService addItemsToOrder] itemDto.selectedModifierOptions es null o undefined.`);
        }

        const menuItem: MenuItemWithFullModifiers | null = await tx.menuItem.findUnique({
          where: { id: itemDto.menuItemId },
          ...menuItemWithFullModifiersArgs
        });

        if (!menuItem || menuItem.businessId !== actualBusinessId || !menuItem.isAvailable) {
          throw new BadRequestException(`(Add) Ítem ID '${itemDto.menuItemId}' no válido/disp. o no del negocio.`);
        }

        const typedModifierGroups = menuItem.modifierGroups as ModifierGroupWithSelectedOptions[];

        let itemBasePrice = menuItem.price;
        let currentItemTotalModifierPrice = new Prisma.Decimal(0);
        const orderItemModifierOptionsDataToCreate: Prisma.OrderItemModifierOptionCreateManyOrderItemInput[] = [];

        if (itemDto.selectedModifierOptions && itemDto.selectedModifierOptions.length > 0) {
          this.logger.debug(`[OrderService addItemsToOrder] ENTRANDO al bloque IF para procesar selectedModifierOptions para el item ${itemDto.menuItemId}.`);
          const selectedOptionsByGroup: Record<string, string[]> = {};
          for (const selectedOpt of itemDto.selectedModifierOptions) {
            const optionFull = typedModifierGroups
              .flatMap(g => g.options)
              .find(opt => opt.id === selectedOpt.modifierOptionId);

            if (!optionFull || !optionFull.isAvailable) {
              throw new BadRequestException(`(Add) Opción mod ID '${selectedOpt.modifierOptionId}' no válida/disp. para '${menuItem.name_es}'.`);
            }
            if (optionFull.groupId === null || optionFull.groupId === undefined) {
                this.logger.error(`[OrderService Error Crítico V2] (Add) Opción ${optionFull.id} ('${optionFull.name_es}') no tiene groupId válido. OptionFull: ${JSON.stringify(optionFull)}`);
                throw new InternalServerErrorException(`(Add) Configuración de datos inválida: Opción ${optionFull.id} no tiene grupo asignado correctamente (groupId es null/undefined).`);
            }

            const parentGroup = typedModifierGroups.find(g => g.id === optionFull.groupId);
            if (!parentGroup) {
                 this.logger.error(`[OrderService Error Crítico V2] (Add) Grupo padre con ID ${optionFull.groupId} no hallado para opción ${optionFull.id}.`);
                throw new InternalServerErrorException(`(Add) Grupo padre no hallado para opción ${optionFull.id}.`);
            }

            if (!selectedOptionsByGroup[parentGroup.id]) selectedOptionsByGroup[parentGroup.id] = [];
            selectedOptionsByGroup[parentGroup.id].push(optionFull.id);

            currentItemTotalModifierPrice = currentItemTotalModifierPrice.add(optionFull.priceAdjustment);
            orderItemModifierOptionsDataToCreate.push({
              modifierOptionId: optionFull.id,
              optionNameSnapshot: optionFull.name_es || 'Opción sin nombre',
              optionPriceAdjustmentSnapshot: optionFull.priceAdjustment,
            });
          }

          for (const group of typedModifierGroups) {
            const selectedCount = selectedOptionsByGroup[group.id]?.length || 0;
            if (group.isRequired && selectedCount < group.minSelections) {
              throw new BadRequestException(`(Add) Grupo '${group.name_es || group.id}': requiere min ${group.minSelections}. Sel: ${selectedCount}.`);
            }
            if (selectedCount > group.maxSelections) {
              throw new BadRequestException(`(Add) Grupo '${group.name_es || group.id}': máx ${group.maxSelections}. Sel: ${selectedCount}.`);
            }
          }
        } else {
             this.logger.warn(`[OrderService addItemsToOrder] ENTRANDO al bloque ELSE porque selectedModifierOptions está vacío o no se proporcionó para el item ${itemDto.menuItemId} (ItemID: ${menuItem.id}).`);
             for (const group of typedModifierGroups) {
                if (group.isRequired && group.minSelections > 0) {
                    this.logger.error(
                        `FALLO VALIDACIÓN (AddItems, porque se entró al ELSE - selectedModifierOptions vacío/nulo para el servicio): Item ID: ${menuItem.id}, Grupo ID: ${group.id} ('${group.name_es || group.name_en || group.id}'). ` +
                        `Es requerido (min ${group.minSelections}) pero el servicio considera que no se enviaron opciones para este ítem.`
                      );
                    throw new BadRequestException(`(Add) Grupo '${group.name_es || 'Modificador'}' es obligatorio y parece que no se proporcionaron opciones válidas para el ítem '${menuItem.name_es || menuItem.id}'.`);
                }
            }
        }

        for (const group of typedModifierGroups) {
            if (group.isRequired && group.minSelections > 0) {
                const hasSelectionInGroup = itemDto.selectedModifierOptions?.some((smo: SelectedModifierOptionInternalDto) =>
                    group.options.find(opt => opt.id === smo.modifierOptionId && opt.groupId === group.id)
                );
                if (!hasSelectionInGroup) {
                     const selectionsInThisGroupCount = itemDto.selectedModifierOptions?.filter((smo: SelectedModifierOptionInternalDto) =>
                        group.options.some(opt => opt.id === smo.modifierOptionId && opt.groupId === group.id)
                      ).length || 0;
                    this.logger.error(
                        `FALLO VALIDACIÓN MODIFICADOR OBLIGATORIO (addItemsToOrder - validación final por grupo): Item ID: ${menuItem.id} ('${menuItem.name_es || menuItem.id}'), Grupo ID: ${group.id} ('${group.name_es || group.name_en || group.id}'). ` +
                        `Min requerido: ${group.minSelections}, Se encontró (conteo directo en esta validación): ${selectionsInThisGroupCount}. ` +
                        `(Booleano hasSelectionInGroup fue: ${hasSelectionInGroup}). ` +
                        `IDs de opciones VÁLIDAS para este grupo según BD y filtro 'isAvailable': [${group.options.map(opt => opt.id).join(', ')}]. ` +
                        `IDs de opciones RECIBIDAS en payload para este ítem (según itemDto DENTRO DEL SERVICIO): [${itemDto.selectedModifierOptions?.map(smo => smo.modifierOptionId).join(', ') || 'NINGUNA (undefined/vacío)'}]`
                      );
                    throw new BadRequestException(`(Add) Grupo '${group.name_es || 'Modificador'}' es obligatorio (check final) para el ítem '${menuItem.name_es || menuItem.id}'.`);
                }
            }
        }

        const priceAtPurchaseValue = itemBasePrice.add(currentItemTotalModifierPrice);
        const totalItemPriceValue = priceAtPurchaseValue.mul(itemDto.quantity);
        additionalAmountCalculated = additionalAmountCalculated.add(totalItemPriceValue);

        newOrderItemsToCreateInput.push({
          menuItem: { connect: { id: menuItem.id } },
          quantity: itemDto.quantity,
          priceAtPurchase: priceAtPurchaseValue,
          totalItemPrice: totalItemPriceValue,
          kdsDestination: menuItem.kdsDestination,
          itemNameSnapshot: menuItem.name_es || 'Ítem sin nombre',
          itemDescriptionSnapshot: menuItem.description_es,
          status: OrderItemStatus.PENDING_KDS,
          ...(orderItemModifierOptionsDataToCreate.length > 0 && {
            selectedModifiers: { createMany: { data: orderItemModifierOptionsDataToCreate } }
          })
        });
      }

      const newTotalAmount = new Prisma.Decimal(order.totalAmount).add(additionalAmountCalculated);

      let newOrderNotes = order.notes;
      if (addItemsDto.customerNotes) {
        newOrderNotes = order.notes ? `${order.notes}\n---\nAdición: ${addItemsDto.customerNotes}` : `Adición: ${addItemsDto.customerNotes}`;
      }

      let finalOrderStatus = order.status;
      if ((originalOrderStatus === OrderStatus.COMPLETED || originalOrderStatus === OrderStatus.PENDING_PAYMENT) && newOrderItemsToCreateInput.length > 0) {
        finalOrderStatus = OrderStatus.IN_PROGRESS;
        this.logger.log(`[OrderService] Order ${orderId} was ${originalOrderStatus}, new items added. Changing status to IN_PROGRESS.`);
      }

      const dataForUpdate: Prisma.OrderUpdateInput = {
        items: { create: newOrderItemsToCreateInput, },
        totalAmount: newTotalAmount,
        finalAmount: newTotalAmount,
        notes: newOrderNotes,
        status: finalOrderStatus,
      };

      if (originalOrderStatus === OrderStatus.PENDING_PAYMENT && newOrderItemsToCreateInput.length > 0) {
          dataForUpdate.isBillRequested = false;
      }


      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: dataForUpdate,
        include: { items: true, table: { select: { identifier: true }} },
      });

      this.logger.log(`[OrderService] Items added to order ${orderId}. New total: ${updatedOrder.totalAmount}. New status: ${updatedOrder.status}`);
      return updatedOrder;
    });
  }

  async requestBillForClient(orderId: string, paymentPreference?: string): Promise<Order> {
    this.logger.log(`[OrderService] Client requesting bill for order ${orderId}. Preference: ${paymentPreference || 'N/A'}`);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true, businessId: true, tableId: true }
    });

    if (!order) {
      throw new NotFoundException(`Pedido con ID ${orderId} no encontrado.`);
    }

    const allowedStatesToRequestBill: OrderStatus[] = [
      OrderStatus.RECEIVED,
      OrderStatus.IN_PROGRESS,
      OrderStatus.PARTIALLY_READY,
      OrderStatus.ALL_ITEMS_READY,
      OrderStatus.COMPLETED,
    ];

    if (!allowedStatesToRequestBill.includes(order.status)) {
      throw new BadRequestException(`No se puede solicitar la cuenta para un pedido en estado '${order.status}'.`);
    }

    // Modificar el objeto de actualización para incluir paymentMethodPreference
    const updateData: Prisma.OrderUpdateInput = {
        status: OrderStatus.PENDING_PAYMENT,
        isBillRequested: true,
    };
    if (paymentPreference !== undefined) { // Solo añadir si se proporcionó
        updateData.paymentMethodPreference = paymentPreference;
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    this.logger.log(`[OrderService] Bill requested for order ${orderId}. Status set to PENDING_PAYMENT.`);

    // Opcional: Notificación de mesa (mantenida como estaba)
    // if (order.tableId && order.businessId) {
    //   try {
    //     await this.prisma.tableNotification.create({
    //       data: {
    //         businessId: order.businessId,
    //         tableId: order.tableId,
    //         type: 'REQUEST_BILL',
    //         message: `Cliente solicitó la cuenta. Preferencia: ${paymentPreference || 'N/A'}`,
    //         paymentPreference: paymentPreference,
    //       }
    //     });
    //     this.logger.log(`[OrderService] TableNotification created for table ${order.tableId} (REQUEST_BILL).`);
    //   } catch (notificationError) {
    //     this.logger.error(`[OrderService] Failed to create TableNotification for order ${orderId}, table ${order.tableId}:`, notificationError);
    //   }
    // }

    return updatedOrder;
  }

  async markOrderAsPaid(
    orderId: string,
    paidByStaffId: string,
    businessId: string,
    paymentDetails?: { method?: string; notes?: string }
  ): Promise<Order> {
    this.logger.log(`[OrderService] Staff ${paidByStaffId} attempting to mark order ${orderId} as PAID for business ${businessId}. Payment Details: ${JSON.stringify(paymentDetails)}`);

    return this.prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
            where: { id: orderId },
            include: {
                business: { select: { id: true, isLoyaltyCoreActive: true, pointsPerEuro: true }},
                table: { select: { id: true, status: true }}
            }
        });

        if (!order) {
            throw new NotFoundException(`Pedido con ID ${orderId} no encontrado.`);
        }
        if (order.businessId !== businessId) {
            throw new ForbiddenException("El pedido no pertenece al negocio del staff.");
        }

        if (order.status !== OrderStatus.PENDING_PAYMENT && order.status !== OrderStatus.COMPLETED) {
            throw new BadRequestException(`Solo se pueden marcar como pagados pedidos en estado 'PENDING_PAYMENT' o 'COMPLETED'. Estado actual: ${order.status}`);
        }

        const updatedOrder = await tx.order.update({
            where: { id: orderId },
            data: {
                status: OrderStatus.PAID,
                paidAt: new Date(),
                paidByUserId: paidByStaffId,
                paymentMethodUsed: paymentDetails?.method,
                // Podrías añadir notas del pago al campo 'notes' del pedido si es relevante:
                // notes: paymentDetails?.notes ? (order.notes ? `${order.notes}\n\nNota de Pago: ${paymentDetails.notes}` : `Nota de Pago: ${paymentDetails.notes}`) : order.notes,
            },
        });
        this.logger.log(`[OrderService TX] Order ${orderId} status updated to PAID.`);

        if (order.tableId && order.table && order.table.status !== TableStatus.AVAILABLE) {
            await tx.table.update({
                where: { id: order.tableId },
                data: { status: TableStatus.AVAILABLE }
            });
            this.logger.log(`[OrderService TX] Table ${order.tableId} status updated to AVAILABLE.`);
        }

        if (order.customerLCoId && order.business?.isLoyaltyCoreActive) {
            this.logger.log(`[OrderService TX] Processing LCo points for customer ${order.customerLCoId} on order ${orderId}.`);
            const customer = await tx.user.findUnique({
                where: { id: order.customerLCoId },
                include: { currentTier: { include: { benefits: { where: { isActive: true, type: 'POINTS_MULTIPLIER' }}}}}
            });

            if (customer) {
                let pointsToEarn = new Prisma.Decimal(order.finalAmount ?? order.totalAmount).mul(order.business.pointsPerEuro ?? 1);
                const multiplierBenefit = customer.currentTier?.benefits.find(b => b.type === 'POINTS_MULTIPLIER'); // El enum BenefitType tiene POINTS_MULTIPLIER
                if (multiplierBenefit && multiplierBenefit.value) { // Verificar que value no sea null/undefined
                    const multiplier = parseFloat(multiplierBenefit.value);
                    if (!isNaN(multiplier) && multiplier > 0) {
                        pointsToEarn = pointsToEarn.mul(multiplier);
                        this.logger.log(`[OrderService TX] Applied tier multiplier ${multiplier} for LCo points.`);
                    } else {
                         this.logger.warn(`[OrderService TX] Invalid LCo tier multiplier value '${multiplierBenefit.value}' for user ${customer.id}.`);
                    }
                }
                const finalPointsEarned = Math.floor(pointsToEarn.toNumber());

                if (finalPointsEarned > 0) {
                    await tx.user.update({
                        where: { id: customer.id },
                        data: {
                            points: { increment: finalPointsEarned },
                            totalSpend: { increment: order.finalAmount?.toNumber() ?? order.totalAmount.toNumber() },
                            totalVisits: { increment: 1 },
                            lastActivityAt: new Date(),
                        }
                    });
                    await tx.activityLog.create({
                        data: {
                            userId: customer.id,
                            businessId: order.businessId,
                            type: ActivityType.POINTS_EARNED_ORDER_LC,
                            pointsChanged: finalPointsEarned,
                            description: `Puntos por pedido LC #${order.orderNumber}`,
                            relatedOrderId: order.id,
                        }
                    });
                    this.logger.log(`[OrderService TX] Awarded ${finalPointsEarned} LCo points to customer ${customer.id}.`);
                    updateUserTier(customer.id).catch((tierError: any) => {
                        this.logger.error(`[OrderService TX] Background tier update failed for customer ${customer.id} after LCo points:`, tierError);
                    });
                } else {
                    this.logger.log(`[OrderService TX] No LCo points to award (calculated <= 0) for customer ${customer.id} on order ${order.id}.`);
                }
            } else {
                this.logger.warn(`[OrderService TX] LCo Customer ${order.customerLCoId} not found. Points not awarded for order ${order.id}.`);
            }
        } else {
            if (order.customerLCoId) { // Solo loguear si había un customerLCoId pero el módulo no estaba activo
                 this.logger.log(`[OrderService TX] LCo module not active for business ${order.businessId}. Skipping LCo points for order ${order.id}.`);
            }
        }
        return updatedOrder;
    });
  }

}