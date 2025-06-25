// frontend/src/modules/camarero/types/menu.types.ts (MODIFICADO)

// --- MENU CATEGORY (Existente) ---
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
  items?: MenuItemData[];
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

// --- MENU ITEM (Existente) ---
export interface MenuItemData {
  id: string;
  categoryId: string;
  businessId: string;
  name_es: string;
  name_en: string | null;
  description_es: string | null;
  description_en: string | null;
  price: number; 
  imageUrl: string | null;
  allergens: string[];
  tags: string[];
  isAvailable: boolean;
  position: number;
  preparationTime: number | null;
  calories: number | null;
  kdsDestination: string | null;
  sku: string | null;
  createdAt: string;
  updatedAt: string;
  modifierGroups?: ModifierGroupData[];
}

export interface MenuItemFormData {
  name_es: string;
  name_en: string | null;
  description_es: string | null;
  description_en: string | null;
  price: number; 
  imageUrl: string | null;
  allergens: string[];
  tags: string[];
  isAvailable: boolean;
  position: number;
  preparationTime?: number | null;
  calories?: number | null;
  kdsDestination?: string | null;
  sku?: string | null;
}

// --- MODIFIER GROUP (Existente) ---
export enum ModifierUiType {
    RADIO = 'RADIO',
    CHECKBOX = 'CHECKBOX',
}

export interface ModifierGroupData {
  id: string;
  menuItemId: string;
  businessId: string;
  name_es: string;
  name_en: string | null;
  uiType: ModifierUiType;
  minSelections: number;
  maxSelections: number;
  position: number;
  isRequired: boolean;
  options?: ModifierOptionData[];
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
}


// --- MODIFIER OPTION (Existente) ---
export interface ModifierOptionData {
  id: string;
  groupId: string;
  name_es: string;
  name_en: string | null;
  priceAdjustment: number;
  position: number;
  isDefault: boolean;
  isAvailable: boolean;
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
}

// --- Tipos para la Visualización Pública del Menú ---
export interface PublicMenuModifierOption {
    id: string;
    name_es: string | null;
    name_en: string | null;
    priceAdjustment: number;
    position: number;
    isDefault: boolean;
    isAvailable: boolean;
}

export interface PublicMenuModifierGroup {
    id: string;
    name_es: string | null;
    name_en: string | null;
    uiType: ModifierUiType;
    minSelections: number;
    maxSelections: number;
    isRequired: boolean;
    position: number;
    options: PublicMenuModifierOption[];
}

export interface PublicMenuItem {
    id: string;
    name_es: string | null;
    name_en: string | null;
    description_es: string | null;
    description_en: string | null;
    price: number; 
    imageUrl: string | null;
    allergens: string[];
    tags: string[];
    position: number;
    modifierGroups: PublicMenuModifierGroup[];
}

export interface PublicMenuCategory {
    id: string;
    name_es: string | null;
    name_en: string | null;
    description_es: string | null;
    description_en: string | null;
    imageUrl: string | null;
    position: number;
    items: PublicMenuItem[];
}

// --- CAMBIO AQUÍ ---
export interface PublicDigitalMenuData {
    businessName: string;
    businessSlug: string;
    businessLogoUrl: string | null;
    isLoyaltyCoreActive: boolean;
    isCamareroActive: boolean; // <-- CAMPO AÑADIDO
    categories: PublicMenuCategory[];
}
// --- FIN DEL CAMBIO ---