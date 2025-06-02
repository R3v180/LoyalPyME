// frontend/src/types/camarero.types.ts
// Version: 1.0.0 (Initial types for Waiter Interface - Pickup Item, Update Response)

// Asegúrate de que OrderItemStatus se importa correctamente.
// Si está en 'customer.ts':
import { OrderItemStatus, OrderStatus } from './customer'; 
// Si está en otro sitio, ajusta la ruta de importación.

/**
 * DTO para la información de un modificador seleccionado que se muestra al camarero.
 */
export interface WaiterSelectedModifier {
  optionName_es: string | null;
  optionName_en: string | null;
  // priceAdjustment no es crítico para la vista de "recoger".
}

/**
 * DTO para cada ítem de pedido que está listo para ser recogido y servido por el camarero.
 * Esta es la estructura que el frontend espera recibir de la API.
 */
export interface ReadyPickupItem {
  orderItemId: string;
  orderId: string;
  orderNumber: string;
  orderCreatedAt: string; // El backend enviará string (ISO Date), el frontend puede convertirlo a Date si es necesario.
  tableIdentifier: string | null;
  
  itemNameSnapshot_es: string | null;
  itemNameSnapshot_en: string | null;
  quantity: number;
  itemNotes: string | null;
  
  kdsDestination: string | null;
  
  selectedModifiers: WaiterSelectedModifier[];

  currentOrderItemStatus: OrderItemStatus; // Debería ser 'READY'
}

/**
 * DTO para la respuesta del backend al actualizar el estado de un OrderItem
 * desde la interfaz de camarero.
 */
export interface OrderItemStatusUpdateResponse {
  message: string;
  orderItemId: string;
  newStatus: OrderItemStatus;
  orderStatus?: OrderStatus; // El nuevo estado general del pedido, si cambió (opcional)
}