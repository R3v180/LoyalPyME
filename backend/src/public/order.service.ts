// Copia Gemini/backend/src/public/order.service.ts
// Versión CORREGIDA para usar 'groupId' según tu schema.prisma
import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { 
    PrismaClient,
    Prisma, 
    Order, 
    OrderStatus, 
    OrderItemStatus, 
    ModifierGroup,
    Table
} from '@prisma/client';
import { AddItemsToOrderDto } from './order.dto'; 

// --- DTOs para la creación de Pedidos (Interfaces internas del servicio, usadas por createOrder) ---
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

// --- ESTRUCTURAS DE DATOS PARA LA RESPUESTA DEL ESTADO DEL PEDIDO (Existente) ---
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
}
// --- FIN ESTRUCTURAS DE DATOS PARA ESTADO ---

// Interfaz para la forma seleccionada de ModifierOption
interface SelectedModifierOptionShape {
    id: string;
    name_es: string;
    priceAdjustment: Prisma.Decimal;
    isAvailable: boolean;
    groupId: string; // <-- CORREGIDO: Volvemos a usar groupId
}

// Tipo para ModifierGroup cuando incluye las opciones seleccionadas
type ModifierGroupWithSelectedOptions = ModifierGroup & { 
    options: SelectedModifierOptionShape[]; 
};


@Injectable()
export class OrderService {
  private prisma: PrismaClient;

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

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let calculatedTotalAmount = new Prisma.Decimal(0);
      const orderItemsToCreate: Prisma.OrderItemCreateWithoutOrderInput[] = [];

      for (const itemDto of payload.items) {
        const menuItem = await tx.menuItem.findUnique({
          where: { id: itemDto.menuItemId },
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
                            groupId: true // <-- CORREGIDO: Seleccionar 'groupId'
                        } 
                    } 
                } 
            }
          }
        });

        if (!menuItem || menuItem.businessId !== businessId || !menuItem.isAvailable) {
          throw new BadRequestException(`Ítem ID '${itemDto.menuItemId}' no válido/disponible o no del negocio.`);
        }
        
        const typedModifierGroups = menuItem.modifierGroups as ModifierGroupWithSelectedOptions[];

        let itemBasePrice = menuItem.price;
        let currentItemTotalModifierPrice = new Prisma.Decimal(0);
        const orderItemModifierOptionsData: Prisma.OrderItemModifierOptionCreateManyOrderItemInput[] = [];

        if (itemDto.selectedModifierOptions && itemDto.selectedModifierOptions.length > 0) {
          const selectedOptionsByGroup: Record<string, string[]> = {};
          for (const selectedOpt of itemDto.selectedModifierOptions) {
            const optionFull = typedModifierGroups
              .flatMap((g: ModifierGroupWithSelectedOptions) => g.options) 
              .find((opt: SelectedModifierOptionShape) => opt.id === selectedOpt.modifierOptionId);

            if (!optionFull || !optionFull.isAvailable) { 
              throw new BadRequestException(`Opción mod ID '${selectedOpt.modifierOptionId}' no válida/disponible para '${menuItem.name_es}'.`);
            }
            
            // La comparación ahora usa optionFull.groupId
            const parentGroup = typedModifierGroups.find((g: ModifierGroupWithSelectedOptions) => g.id === optionFull.groupId);
            if (!parentGroup) throw new InternalServerErrorException(`Grupo padre no hallado para opción ${optionFull.id} (buscando con groupId ${optionFull.groupId} vs group.id).`);

            if (!selectedOptionsByGroup[parentGroup.id]) selectedOptionsByGroup[parentGroup.id] = [];
            selectedOptionsByGroup[parentGroup.id].push(optionFull.id);
            
            currentItemTotalModifierPrice = currentItemTotalModifierPrice.add(optionFull.priceAdjustment);
            orderItemModifierOptionsData.push({
              modifierOptionId: optionFull.id,
              optionNameSnapshot: optionFull.name_es, 
              optionPriceAdjustmentSnapshot: optionFull.priceAdjustment,
            });
          }

          for (const group of typedModifierGroups) { 
            const selectedCount = selectedOptionsByGroup[group.id]?.length || 0;
            if (group.isRequired && selectedCount < group.minSelections) {
              throw new BadRequestException(`Grupo '${group.name_es}': requiere min ${group.minSelections}. Seleccionadas: ${selectedCount}.`);
            }
            if (selectedCount > group.maxSelections) {
              throw new BadRequestException(`Grupo '${group.name_es}': máx ${group.maxSelections}. Seleccionadas: ${selectedCount}.`);
            }
          }
        }
        
        for (const group of typedModifierGroups) { 
            if (group.isRequired && group.minSelections > 0) {
                const hasSelectionInGroup = itemDto.selectedModifierOptions?.some(smo => 
                    // La comparación ahora usa opt.groupId
                    group.options.find((opt: SelectedModifierOptionShape) => opt.id === smo.modifierOptionId && opt.groupId === group.id)
                );
                if (!hasSelectionInGroup) {
                    throw new BadRequestException(`Grupo '${group.name_es || 'Modificador'}' es obligatorio.`);
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
          itemNameSnapshot: menuItem.name_es, 
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
        items: { create: orderItemsToCreate }
      };

      if (payload.tableIdentifier) {
        const tableRecord = await tx.table.findUnique({
          where: { businessId_identifier: { businessId: businessId, identifier: payload.tableIdentifier } },
          select: { id: true }
        });
        if (tableRecord) orderCreateData.table = { connect: { id: tableRecord.id } };
        else console.warn(`[OrderService] Table '${payload.tableIdentifier}' no hallada para business ${businessId}.`);
      }

      const finalCustomerId = payload.customerId || requestingCustomerId;
      if (finalCustomerId) {
        orderCreateData.customerLCo = { connect: { id: finalCustomerId } };
      }

      const newOrder = await tx.order.create({ data: orderCreateData, include: { items: true }});
      console.log(`[OrderService] Order ${newOrder.id} (Number: ${newOrder.orderNumber}) created successfully.`);
      return newOrder;
    });
  }

  async getOrderStatus(orderId: string): Promise<PublicOrderStatusInfo> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true, orderNumber: true, status: true, notes: true, createdAt: true,
        table: { select: { identifier: true } },
        items: {
          select: { id: true, itemNameSnapshot: true, quantity: true, status: true },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!order) {
      throw new NotFoundException(`Pedido con ID ${orderId} no encontrado.`);
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
    };
    
    return orderStatusInfo;
  }

  async addItemsToOrder(
    orderId: string,
    addItemsDto: AddItemsToOrderDto,
    businessSlug: string, 
    requestingCustomerId?: string, 
  ): Promise<Order> {
    console.log(`[OrderService] Attempting to add items to order ${orderId} for business slug: ${businessSlug}`);

    const business = await this.prisma.business.findUnique({
      where: { slug: businessSlug },
      select: { id: true, isActive: true, isCamareroActive: true }
    });

    if (!business) throw new NotFoundException(`Negocio con slug '${businessSlug}' no encontrado.`);
    if (!business.isActive) throw new BadRequestException(`El negocio '${businessSlug}' no está activo.`);
    if (!business.isCamareroActive) throw new BadRequestException(`Módulo de pedidos no activo para el negocio '${businessSlug}'.`);
    
    const actualBusinessId = business.id;

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
        OrderStatus.COMPLETED,
      ];

      if (!validStatusToAddItems.includes(order.status)) {
        throw new BadRequestException(`No se pueden añadir ítems a un pedido en estado '${order.status}'.`);
      }

      const originalOrderStatus = order.status;
      const newOrderItemsToCreateInput: Prisma.OrderItemCreateWithoutOrderInput[] = [];
      let additionalAmountCalculated = new Prisma.Decimal(0);

      for (const itemDto of addItemsDto.items) {
        const menuItem = await tx.menuItem.findUnique({
          where: { id: itemDto.menuItemId },
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
                            groupId: true // <-- CORREGIDO: Seleccionar 'groupId'
                        } 
                    } 
                } 
            }
          }
        });

        if (!menuItem || menuItem.businessId !== actualBusinessId || !menuItem.isAvailable) {
          throw new BadRequestException(`(Add) Ítem ID '${itemDto.menuItemId}' no válido/disp. o no del negocio.`);
        }
        
        const typedModifierGroups = menuItem.modifierGroups as ModifierGroupWithSelectedOptions[];
        let itemBasePrice = menuItem.price;
        let currentItemTotalModifierPrice = new Prisma.Decimal(0);
        const orderItemModifierOptionsDataToCreate: Prisma.OrderItemModifierOptionCreateManyOrderItemInput[] = [];

        if (itemDto.selectedModifiers && itemDto.selectedModifiers.length > 0) {
          const selectedOptionsByGroup: Record<string, string[]> = {};
          for (const selectedOpt of itemDto.selectedModifiers as Array<{ modifierOptionId: string }>) { 
            const optionFull = typedModifierGroups
              .flatMap((g: ModifierGroupWithSelectedOptions) => g.options) 
              .find((opt: SelectedModifierOptionShape) => opt.id === selectedOpt.modifierOptionId);

            if (!optionFull || !optionFull.isAvailable) { 
              throw new BadRequestException(`(Add) Opción mod ID '${selectedOpt.modifierOptionId}' no válida/disp. para '${menuItem.name_es}'.`);
            }
            
            // La comparación ahora usa optionFull.groupId
            const parentGroup = typedModifierGroups.find((g: ModifierGroupWithSelectedOptions) => g.id === optionFull.groupId);
            if (!parentGroup) throw new InternalServerErrorException(`(Add) Grupo padre no hallado para opción ${optionFull.id} (buscando con groupId ${optionFull.groupId} vs group.id).`);

            if (!selectedOptionsByGroup[parentGroup.id]) selectedOptionsByGroup[parentGroup.id] = [];
            selectedOptionsByGroup[parentGroup.id].push(optionFull.id);
            
            currentItemTotalModifierPrice = currentItemTotalModifierPrice.add(optionFull.priceAdjustment);
            orderItemModifierOptionsDataToCreate.push({
              modifierOptionId: optionFull.id,
              optionNameSnapshot: optionFull.name_es, 
              optionPriceAdjustmentSnapshot: optionFull.priceAdjustment,
            });
          }

          for (const group of typedModifierGroups) { 
            const selectedCount = selectedOptionsByGroup[group.id]?.length || 0;
            if (group.isRequired && selectedCount < group.minSelections) {
              throw new BadRequestException(`(Add) Grupo '${group.name_es}': requiere min ${group.minSelections}. Sel: ${selectedCount}.`);
            }
            if (selectedCount > group.maxSelections) {
              throw new BadRequestException(`(Add) Grupo '${group.name_es}': máx ${group.maxSelections}. Sel: ${selectedCount}.`);
            }
          }
        }
        
        const currentItemDtoModifiers = (itemDto.selectedModifiers || []) as Array<{ modifierOptionId: string }>;
        for (const group of typedModifierGroups) { 
            if (group.isRequired && group.minSelections > 0) {
                const hasSelectionInGroup = currentItemDtoModifiers.some(smo => 
                    // La comparación ahora usa opt.groupId
                    group.options.find((opt: SelectedModifierOptionShape) => opt.id === smo.modifierOptionId && opt.groupId === group.id)
                );
                if (!hasSelectionInGroup) {
                    throw new BadRequestException(`(Add) Grupo '${group.name_es || 'Modificador'}' es obligatorio.`);
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
          itemNameSnapshot: menuItem.name_es, 
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
      if (originalOrderStatus === OrderStatus.COMPLETED && newOrderItemsToCreateInput.length > 0) {
        finalOrderStatus = OrderStatus.IN_PROGRESS;
        console.log(`[OrderService] Order ${orderId} was COMPLETED, new items added. Changing status to IN_PROGRESS.`);
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          items: {
            create: newOrderItemsToCreateInput,
          },
          totalAmount: newTotalAmount,
          finalAmount: newTotalAmount, 
          notes: newOrderNotes,
          status: finalOrderStatus,
        },
        include: {
          items: true, 
          table: { select: { identifier: true }}
        },
      });

      console.log(`[OrderService] Items added to order ${orderId}. New total: ${updatedOrder.totalAmount}. New status: ${updatedOrder.status}`);
      return updatedOrder;
    });
  }
}