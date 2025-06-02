// backend/src/camarero/camarero.dto.ts
// Version: 1.0.1 (Corrected enum usage for TS2702 and TS2304 errors)

// --- MODIFICADO: Añadir OrderStatus a la importación ---
import { OrderItemStatus, OrderStatus } from '@prisma/client';
// --- FIN MODIFICADO ---

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
  /**
   * El nuevo estado al que se actualizará el OrderItem.
   * Para esta acción específica del camarero, siempre debe ser OrderItemStatus.SERVED.
   */
  // --- MODIFICADO: Usar typeof para referirse al tipo del valor del enum ---
  newStatus: typeof OrderItemStatus.SERVED;
  // --- FIN MODIFICADO ---
}

/**
 * DTO para la respuesta estándar al actualizar el estado de un OrderItem
 * desde la interfaz de camarero.
 */
export interface OrderItemStatusUpdateResponseDto {
  message: string;
  orderItemId: string;
  newStatus: OrderItemStatus;
  orderStatus?: OrderStatus; // Correcto: OrderStatus (el tipo enum) es importado y usado aquí
}