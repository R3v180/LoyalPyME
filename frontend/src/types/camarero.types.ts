// frontend/src/types/camarero.types.ts
// Version: 1.1.0 (Add WaiterOrderListItemDto and import OrderType)

// Asegúrate de que OrderItemStatus, OrderStatus y OrderType se importan correctamente.
import { OrderItemStatus, OrderStatus, OrderType } from './customer'; // OrderType añadido al import

/**
 * DTO para la información de un modificador seleccionado que se muestra al camarero.
 */
export interface WaiterSelectedModifier { // Renombrado desde WaiterSelectedModifierDto para consistencia
  optionName_es: string | null;
  optionName_en: string | null;
}

/**
 * DTO para cada ítem de pedido que está listo para ser recogido y servido por el camarero.
 */
export interface ReadyPickupItem { // Renombrado desde ReadyPickupItemDto
  orderItemId: string;
  orderId: string;
  orderNumber: string;
  orderCreatedAt: Date; // Cambiado a Date, el servicio backend devuelve Date, la serialización JSON lo convierte
  tableIdentifier: string | null;
  itemNameSnapshot_es: string | null;
  itemNameSnapshot_en: string | null;
  quantity: number;
  itemNotes: string | null;
  kdsDestination: string | null;
  selectedModifiers: WaiterSelectedModifier[];
  currentOrderItemStatus: OrderItemStatus;
}

/**
 * DTO para la respuesta del backend al actualizar el estado de un OrderItem
 * desde la interfaz de camarero o KDS.
 */
export interface OrderItemStatusUpdateResponse { // Renombrado desde OrderItemStatusUpdateResponseDto
  message: string;
  orderItemId: string;
  newStatus: OrderItemStatus;
  orderStatus?: OrderStatus;
}

// ---- NUEVO DTO AÑADIDO ----
/**
 * DTO para representar un ítem en la lista de pedidos para la interfaz del camarero.
 * Usado en: GET /api/camarero/staff/orders (respuesta del backend)
 */
export interface WaiterOrderListItemDto {
  orderId: string;
  orderNumber: string;
  tableIdentifier: string | null;
  status: OrderStatus;
  finalAmount: number; // El servicio ya lo convierte a número
  itemCount: number;
  customerName?: string | null;
  createdAt: Date; // El servicio devuelve Date, la serialización JSON lo convierte
  isBillRequested?: boolean;
  orderType?: OrderType | null;
}
// ---- FIN NUEVO DTO ----