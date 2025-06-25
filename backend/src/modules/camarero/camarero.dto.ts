// backend/src/camarero/camarero.dto.ts
// Version: 1.2.0 (Add WaiterOrderListItemDto)

import { OrderItemStatus, OrderStatus, OrderType } from '@prisma/client'; // Añadido OrderType

/**
 * DTO para la información de un modificador seleccionado que se muestra al camarero
 * como parte de un ítem listo para recoger.
 */
export interface WaiterSelectedModifierDto {
  optionName_es: string | null;
  optionName_en: string | null;
}

/**
 * DTO para cada ítem de pedido que está listo para ser recogido y servido por el personal de camareros.
 * Esta es la estructura de datos que el endpoint GET /api/camarero/staff/ready-for-pickup devolverá.
 */
export interface ReadyPickupItemDto {
  orderItemId: string;
  orderId: string;
  orderNumber: string;
  orderCreatedAt: Date;
  tableIdentifier: string | null;
  itemNameSnapshot_es: string | null;
  itemNameSnapshot_en: string | null;
  quantity: number;
  itemNotes: string | null;
  kdsDestination: string | null;
  selectedModifiers: WaiterSelectedModifierDto[];
  currentOrderItemStatus: OrderItemStatus;
}

/**
 * DTO para el payload del endpoint que permite al camarero marcar un OrderItem como SERVED.
 * Usado en: PATCH /api/camarero/staff/order-items/:orderItemId/status
 */
export interface MarkOrderItemServedPayloadDto {
  newStatus: typeof OrderItemStatus.SERVED;
}

/**
 * DTO para la respuesta estándar al actualizar el estado de un OrderItem
 * desde la interfaz de camarero o KDS.
 */
export interface OrderItemStatusUpdateResponseDto {
  message: string;
  orderItemId: string;
  newStatus: OrderItemStatus;
  orderStatus?: OrderStatus;
}

/**
 * DTO para el payload del endpoint que permite al personal solicitar la cuenta.
 * Usado en: POST /api/camarero/staff/order/:orderId/request-bill
 */
export interface RequestBillPayloadDto {
  paymentPreference?: string;
}

/**
 * DTO para el payload del endpoint que permite al camarero marcar un pedido como PAGADO.
 * Usado en: POST /api/camarero/staff/order/:orderId/mark-as-paid
 */
export interface MarkOrderAsPaidPayloadDto {
  method?: string;
  notes?: string;
}

// ---- NUEVO DTO ----
/**
 * DTO para representar un ítem en la lista de pedidos para la interfaz del camarero.
 * Usado en: GET /api/camarero/staff/orders
 */
export interface WaiterOrderListItemDto {
  orderId: string;
  orderNumber: string;
  tableIdentifier: string | null;
  status: OrderStatus;
  finalAmount: number; // O string si prefieres manejarlo como string en el frontend inicialmente
  itemCount: number; // Número total de ítems (no cancelados) en el pedido
  customerName?: string | null; // Nombre del cliente LCo si está asociado
  createdAt: Date; // Fecha de creación del pedido
  isBillRequested?: boolean; // Para saber si la cuenta ya fue solicitada
  orderType?: OrderType | null; // Tipo de pedido
}
// ---- FIN NUEVO DTO ----