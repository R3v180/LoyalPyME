// frontend/src/modules/camarero/types/camarero.types.ts
// Version 1.1.1 - Corrected type import path

// --- CORRECCIÓN: Apuntar a la ruta correcta de tipos compartidos ---
import { OrderItemStatus, OrderStatus, OrderType } from '../../../shared/types/user.types';

/**
 * DTO para la información de un modificador seleccionado que se muestra al camarero.
 */
export interface WaiterSelectedModifier {
  optionName_es: string | null;
  optionName_en: string | null;
}

/**
 * DTO para cada ítem de pedido que está listo para ser recogido y servido por el camarero.
 */
export interface ReadyPickupItem {
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
  selectedModifiers: WaiterSelectedModifier[];
  currentOrderItemStatus: OrderItemStatus;
}

/**
 * DTO para la respuesta del backend al actualizar el estado de un OrderItem
 * desde la interfaz de camarero o KDS.
 */
export interface OrderItemStatusUpdateResponse {
  message: string;
  orderItemId: string;
  newStatus: OrderItemStatus;
  orderStatus?: OrderStatus;
}

/**
 * DTO para representar un ítem en la lista de pedidos para la interfaz del camarero.
 * Usado en: GET /api/camarero/staff/orders (respuesta del backend)
 */
export interface WaiterOrderListItemDto {
  orderId: string;
  orderNumber: string;
  tableIdentifier: string | null;
  status: OrderStatus;
  finalAmount: number;
  itemCount: number;
  customerName?: string | null;
  createdAt: Date;
  isBillRequested?: boolean;
  orderType?: OrderType | null;
}