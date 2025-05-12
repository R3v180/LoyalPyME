// frontend/src/types/menu.types.ts

// --- MENU CATEGORY (ya debería estar similar a esto) ---
export interface MenuCategoryData {
  id: string;
  businessId: string; 
  name_es: string;
  name_en: string | null;
  description_es?: string | null;
  description_en?: string | null;
  imageUrl?: string | null;
  position: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // _count?: { items?: number }; // Opcional si el backend lo envía
  items?: MenuItemData[]; // Opcional para cargas anidadas
}

export interface MenuCategoryFormData {
  name_es: string;
  name_en: string | null;
  description_es?: string | null;
  description_en?: string | null;
  imageUrl?: string | null;
  position: number;
  isActive: boolean;
}

// --- MENU ITEM (Actualizado y Detallado) ---
export interface MenuItemData {
  id: string;
  categoryId: string;
  businessId: string;
  name_es: string;
  name_en: string | null;
  description_es: string | null;
  description_en: string | null;
  price: number; // Prisma usa Decimal, pero en frontend a menudo se maneja como number
  imageUrl: string | null;
  allergens: string[]; // Array de strings, ej: ["GLUTEN", "LACTOSE"]
  tags: string[];      // Array de strings, ej: ["VEGAN", "SPICY"]
  isAvailable: boolean;
  position: number;
  preparationTime: number | null; // en minutos, por ejemplo
  calories: number | null;
  kdsDestination: string | null;  // ej: "COCINA_PRINCIPAL", "BARRA"
  sku: string | null;             // Stock Keeping Unit
  createdAt: string;
  updatedAt: string;
  // modifierGroups?: ModifierGroupData[]; // Opcional para cargas anidadas
}

export interface MenuItemFormData {
  name_es: string;
  name_en: string | null;
  description_es: string | null;
  description_en: string | null;
  price: number; // El formulario manejará number, el servicio backend convertirá a Decimal si es necesario
  imageUrl: string | null;
  allergens: string[];
  tags: string[];
  isAvailable: boolean;
  position: number;
  preparationTime?: number | null; // Los opcionales aquí también como opcionales
  calories?: number | null;
  kdsDestination?: string | null;
  sku?: string | null;
  // categoryId no es parte del form data del ítem en sí, se pasa por separado al crear/asociar
}

// --- MODIFIER GROUP (Actualizado y Detallado) ---
export enum ModifierUiType { // Enum para los tipos de UI
    RADIO = 'RADIO',
    CHECKBOX = 'CHECKBOX',
    // Potenciales futuros: QUANTITY, TEXT_INPUT etc.
}

export interface ModifierGroupData {
  id: string;
  menuItemId: string;
  businessId: string;
  name_es: string;
  name_en: string | null;
  uiType: ModifierUiType; // Usar el Enum
  minSelections: number;
  maxSelections: number; // Podría ser null para "sin límite" si uiType es CHECKBOX
  position: number;
  isRequired: boolean; // Si el cliente DEBE hacer una selección en este grupo
  options?: ModifierOptionData[]; // Opcional para cargas anidadas
  createdAt: string;
  updatedAt: string;
}

export interface ModifierGroupFormData {
  name_es: string;
  name_en: string | null;
  uiType: ModifierUiType;
  minSelections: number;
  maxSelections: number;
  position: number;
  isRequired: boolean;
  // menuItemId se pasa por separado
}


// --- MODIFIER OPTION (Actualizado y Detallado) ---
export interface ModifierOptionData {
  id: string;
  groupId: string;
  name_es: string;
  name_en: string | null;
  priceAdjustment: number; // Prisma usa Decimal, en frontend number
  position: number;
  isDefault: boolean; // Si esta opción viene preseleccionada
  isAvailable: boolean; // Si la opción está disponible para ser seleccionada
  createdAt: string;
  updatedAt: string;
}

export interface ModifierOptionFormData {
  name_es: string;
  name_en: string | null;
  priceAdjustment: number;
  position: number;
  isDefault: boolean;
  isAvailable: boolean;
  // groupId se pasa por separado
}