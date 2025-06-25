// backend/src/public/order.types.ts
import { OrderStatus, OrderItemStatus, Prisma } from '@prisma/client';

// --- DTOs y Tipos para la Lógica Interna de los Servicios de Pedidos ---

/**
 * Representa una opción de modificador seleccionada, usado internamente por los servicios
 * al procesar los payloads de entrada.
 */
export interface SelectedModifierOptionInternalDto {
    modifierOptionId: string;
}

/**
 * Representa un ítem de pedido en su forma interna, tal como lo esperan los servicios
 * de procesamiento y creación antes de la validación completa y el cálculo de precios.
 */
export interface OrderItemInternalDto {
    menuItemId: string;
    quantity: number;
    notes?: string | null;
    selectedModifierOptions?: SelectedModifierOptionInternalDto[] | null; // Array de IDs de opciones
}

/**
 * Payload interno que usan OrderCreationService y OrderModificationService,
 * derivado de lo que envían los DTOs del frontend/controlador.
 */
export interface CreateOrderPayloadInternalDto {
    tableIdentifier?: string | null;
    customerId?: string | null; // Cliente LCo
    orderNotes?: string | null; // Notas generales del pedido
    items: OrderItemInternalDto[];
}

/**
 * Estructura de datos que devuelve OrderItemProcessorService para cada ítem procesado.
 * Contiene toda la información validada y calculada lista para la creación en BD.
 */
export interface ProcessedOrderItemData {
    menuItemId: string;
    quantity: number;
    priceAtPurchase: Prisma.Decimal; // Precio unitario del ítem CON modificadores
    totalItemPrice: Prisma.Decimal;  // priceAtPurchase * quantity
    notes?: string | null;           // Notas específicas del ítem
    kdsDestination: string | null;
    itemNameSnapshot: string;         // Snapshot del nombre del ítem (ej. en ES)
    itemDescriptionSnapshot: string | null; // Snapshot de la descripción (ej. en ES)
    status: OrderItemStatus;         // Estado inicial (ej. PENDING_KDS)
    // Datos para crear los OrderItemModifierOption asociados
    modifierOptionsToCreate: Prisma.OrderItemModifierOptionCreateManyOrderItemInput[];
}


// --- Estructuras para la Respuesta Pública del Estado del Pedido ---

/**
 * Información de un ítem de pedido para la vista pública de estado.
 */
export interface PublicOrderItemStatusInfo {
    id: string;                     // ID del OrderItem
    menuItemName_es: string | null; // Snapshot del nombre en español
    menuItemName_en: string | null; // Snapshot del nombre en inglés (o el idioma secundario)
    quantity: number;
    status: OrderItemStatus;
}

/**
 * Información completa del estado de un pedido para la vista pública.
 */
export interface PublicOrderStatusInfo {
    orderId: string;
    orderNumber: string;
    orderStatus: OrderStatus;
    items: PublicOrderItemStatusInfo[];
    tableIdentifier?: string | null;
    orderNotes?: string | null;
    createdAt: Date;
    isBillRequested?: boolean; // Indica si el cliente/personal ya solicitó la cuenta
    // Podrías añadir más campos si el cliente los necesita en esta vista,
    // como finalAmount, paymentMethodPreference, etc.
    // finalAmount?: Prisma.Decimal;
}


// --- DTOs que representan los payloads esperados desde el Frontend/Controlador ---
// Estos son los que se validarían con class-validator en el controlador (order.dto.ts).
// Los replicamos aquí (o los importaríamos desde order.dto.ts) para claridad en los servicios.

/**
 * DTO para una opción de modificador seleccionada dentro de un ítem, tal como viene del frontend.
 */
export interface FrontendSelectedOrderModifierOptionDto {
    modifierOptionId: string;
}

/**
 * DTO para un ítem de pedido individual al crear un nuevo pedido, tal como viene del frontend.
 */
export interface FrontendCreateOrderItemDto {
    menuItemId: string;
    quantity: number;
    notes?: string | null;
    selectedModifierOptions?: FrontendSelectedOrderModifierOptionDto[] | null;
}

/**
 * DTO principal para crear un nuevo pedido, tal como viene del frontend.
 */
export interface FrontendCreateOrderDto {
    tableIdentifier?: string | null;
    customerNotes?: string | null; // Notas generales del pedido
    customerId?: string | null;    // ID del cliente LCo (opcional)
    items: FrontendCreateOrderItemDto[];
    // businessId o businessSlug no vienen en el body para la creación pública, van en la URL del endpoint.
}

/**
 * DTO para un ítem individual al añadir ítems a un pedido existente, tal como viene del frontend.
 */
export interface FrontendAddItemsOrderItemDto {
    menuItemId: string;
    quantity: number;
    notes?: string | null;                                       // Notas específicas para este ítem
    selectedModifierOptions?: Array<{ modifierOptionId: string }>; // Consistente con CreateOrderItemDto
}

/**
 * DTO principal para añadir ítems a un pedido existente, tal como viene del frontend.
 */
export interface FrontendAddItemsToOrderDto {
    items: FrontendAddItemsOrderItemDto[];
    customerNotes?: string; // Notas generales para ESTA ADICIÓN de ítems (podrían concatenarse a las existentes)
}

/**
 * DTO para el payload opcional que el cliente puede enviar al solicitar la cuenta.
 */
export interface FrontendRequestBillClientPayloadDto {
  paymentPreference?: string | null; // Ej: "EFECTIVO", "TARJETA"
}

/**
 * DTO para el payload que el personal puede enviar al solicitar la cuenta (desde WaiterController).
 */
export interface FrontendRequestBillStaffPayloadDto {
  paymentPreference?: string | null;
  // Podría incluir más campos si es necesario, como payAmountInput del Development Plan
}

/**
 * DTO para el payload que el personal envía al marcar un pedido como pagado (desde WaiterController).
 */
export interface FrontendMarkOrderAsPaidPayloadDto {
  method?: string; // Ej: "EFECTIVO_CAJA", "TARJETA_VISA_XXXX"
  notes?: string | null; // Notas adicionales sobre el pago
  // Podría incluir amountPaid si se maneja cambio, etc.
}