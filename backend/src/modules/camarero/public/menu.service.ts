// backend/src/public/menu.service.ts
// Version: 1.0.0 (Initial functional version for public menu display)

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Definición local de ModifierUiType (como en seed.ts y como se usa en tus otros servicios)
const ModifierUiTypeEnum = {
    RADIO: 'RADIO',
    CHECKBOX: 'CHECKBOX',
} as const;
type LocalModifierUiType = typeof ModifierUiTypeEnum[keyof typeof ModifierUiTypeEnum];


// --- Definición de Tipos de Salida ---
interface PublicMenuCategoryItemModifierOption {
    id: string;
    name_es: string | null;
    name_en: string | null;
    priceAdjustment: Prisma.Decimal;
    position: number;
    isDefault: boolean;
}

interface PublicMenuCategoryItemModifierGroup {
    id: string;
    name_es: string | null;
    name_en: string | null;
    uiType: LocalModifierUiType; // Usar el tipo LocalModifierUiType
    minSelections: number;
    maxSelections: number;
    isRequired: boolean;
    position: number;
    options: PublicMenuCategoryItemModifierOption[];
}

interface PublicMenuCategoryItem {
    id: string;
    name_es: string | null;
    name_en: string | null;
    description_es: string | null;
    description_en: string | null;
    price: Prisma.Decimal;
    imageUrl: string | null;
    allergens: string[];
    tags: string[];
    position: number;
    modifierGroups: PublicMenuCategoryItemModifierGroup[];
}

interface PublicMenuCategory {
    id: string;
    name_es: string | null;
    name_en: string | null;
    description_es: string | null;
    description_en: string | null;
    imageUrl: string | null;
    position: number;
    items: PublicMenuCategoryItem[];
}

interface PublicDigitalMenu {
    businessName: string;
    businessSlug: string;
    businessLogoUrl: string | null;
    categories: PublicMenuCategory[];
}
// --- Fin Definición de Tipos de Salida ---


export const getPublicDigitalMenuBySlug = async (businessSlug: string): Promise<PublicDigitalMenu | null> => {
    console.log(`[PublicMenu SVC] Fetching public digital menu for business slug: ${businessSlug}`);

    try {
        const businessWithMenu = await prisma.business.findUnique({
            where: { slug: businessSlug },
            select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
                isCamareroActive: true,
                isActive: true,
                menuCategories: {
                    where: { isActive: true },
                    orderBy: { position: 'asc' },
                    select: {
                        id: true,
                        name_es: true,
                        name_en: true,
                        description_es: true,
                        description_en: true,
                        imageUrl: true,
                        position: true,
                        items: {
                            where: {
                                // Asumiendo que MenuItem usa 'isAvailable' para la vista pública
                                // y 'isActive' para la habilitación general del ítem.
                                // Si solo 'isAvailable' controla la vista pública, quitar 'isActive: true'.
                                // Si el schema de MenuItem NO tiene 'isActive', esta línea dará error.
                                // Basado en el último error, comentaremos 'isActive' para MenuItem.
                                // isActive: true, 
                                isAvailable: true
                            },
                            orderBy: { position: 'asc' },
                            select: {
                                id: true,
                                name_es: true,
                                name_en: true,
                                description_es: true,
                                description_en: true,
                                price: true,
                                imageUrl: true,
                                allergens: true,
                                tags: true,
                                position: true,
                                modifierGroups: {
                                    // Asumiendo que ModifierGroup usa 'isActive'
                                    // Si no tiene 'isActive' filtrable, esta línea debe comentarse o ajustarse.
                                    // Basado en el último error, comentaremos 'isActive' para ModifierGroup.
                                    // where: { isActive: true }, 
                                    orderBy: { position: 'asc' },
                                    select: {
                                        id: true,
                                        name_es: true,
                                        name_en: true,
                                        uiType: true,
                                        minSelections: true,
                                        maxSelections: true,
                                        isRequired: true,
                                        position: true,
                                        options: {
                                            where: { isAvailable: true }, // ModifierOption usa isAvailable
                                            orderBy: { position: 'asc' },
                                            select: {
                                                id: true,
                                                name_es: true,
                                                name_en: true,
                                                priceAdjustment: true,
                                                position: true,
                                                isDefault: true,
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!businessWithMenu) {
            console.log(`[PublicMenu SVC] Business not found for slug: ${businessSlug}`);
            return null;
        }

        if (!businessWithMenu.isActive) {
            console.log(`[PublicMenu SVC] Business ${businessSlug} (ID: ${businessWithMenu.id}) is not active. Menu not available.`);
            return null;
        }

        if (!businessWithMenu.isCamareroActive) {
            console.log(`[PublicMenu SVC] Camarero module is not active for business ${businessSlug} (ID: ${businessWithMenu.id}). Menu not available.`);
            return null;
        }
        
        type CategoryFromPrisma = typeof businessWithMenu.menuCategories[0];
        type ItemFromPrisma = CategoryFromPrisma['items'][0];
        type GroupFromPrisma = ItemFromPrisma['modifierGroups'][0];
        type OptionFromPrisma = GroupFromPrisma['options'][0];

        const mapCategory = (category: CategoryFromPrisma): PublicMenuCategory => ({
            id: category.id,
            name_es: category.name_es,
            name_en: category.name_en,
            description_es: category.description_es,
            description_en: category.description_en,
            imageUrl: category.imageUrl,
            position: category.position,
            items: category.items.map(mapItem),
        });

        const mapItem = (item: ItemFromPrisma): PublicMenuCategoryItem => ({
            id: item.id,
            name_es: item.name_es,
            name_en: item.name_en,
            description_es: item.description_es,
            description_en: item.description_en,
            price: item.price,
            imageUrl: item.imageUrl,
            allergens: item.allergens,
            tags: item.tags,
            position: item.position,
            modifierGroups: item.modifierGroups.map(mapGroup),
        });

        const mapGroup = (group: GroupFromPrisma): PublicMenuCategoryItemModifierGroup => ({
            id: group.id,
            name_es: group.name_es,
            name_en: group.name_en,
            uiType: group.uiType as LocalModifierUiType,
            minSelections: group.minSelections,
            maxSelections: group.maxSelections,
            isRequired: group.isRequired,
            position: group.position,
            options: group.options.map(mapOption),
        });

        const mapOption = (option: OptionFromPrisma): PublicMenuCategoryItemModifierOption => ({
            id: option.id,
            name_es: option.name_es,
            name_en: option.name_en,
            priceAdjustment: option.priceAdjustment,
            position: option.position,
            isDefault: option.isDefault,
        });

        const categoriesTyped: PublicMenuCategory[] = businessWithMenu.menuCategories.map(mapCategory);

        const menuToReturn: PublicDigitalMenu = {
            businessName: businessWithMenu.name,
            businessSlug: businessWithMenu.slug,
            businessLogoUrl: businessWithMenu.logoUrl,
            categories: categoriesTyped,
        };

        return menuToReturn;

    } catch (error) {
        console.error(`[PublicMenu SVC] Error fetching public menu for slug ${businessSlug}:`, error);
        throw new Error('Error al obtener los datos del menú desde la base de datos.');
    }
};