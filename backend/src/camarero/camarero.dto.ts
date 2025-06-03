// backend/src/camarero/camarero.dto.ts
// Version: 1.1.0 (Add MarkOrderAsPaidPayloadDto and RequestBillPayloadDto)

import { OrderItemStatus, OrderStatus } from '@prisma/client';

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
  orderCreatedAt: Date; // El servicio devuelve Date, el controlador/JSON lo serializará a string
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
  /**
   * El nuevo estado al que se actualizará el OrderItem.
   * Para esta acción específica del camarero, siempre debe ser OrderItemStatus.SERVED.
   */
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
  orderStatus?: OrderStatus; // El estado general del pedido si cambió
}

// ---- NUEVO DTO ----
/**
 * DTO para el payload del endpoint que permite al personal solicitar la cuenta.
 * Usado en: POST /api/camarero/staff/order/:orderId/request-bill
 */
export interface RequestBillPayloadDto {
  paymentPreference?: string; // Ej: "EFECTIVO", "TARJETA"
  // Otros campos que el staff podría querer enviar, como payAmountInput
}
// ---- FIN NUEVO DTO ----


// ---- NUEVO DTO ----
/**
 * DTO para el payload del endpoint que permite al camarero marcar un pedido como PAGADO.
 * Usado en: POST /api/camarero/staff/order/:orderId/mark-as-paid
 */
export interface MarkOrderAsPaidPayloadDto {
  method?: string; // Método de pago usado (ej. "EFECTIVO", "TARJETA_VISA")
  notes?: string;  // Notas adicionales sobre el pago
  // Podrías añadir amountPaid si hubiera gestión de caja o pagos parciales
}
// ---- FIN NUEVO DTO ----