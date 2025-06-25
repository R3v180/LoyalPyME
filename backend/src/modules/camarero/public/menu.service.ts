// backend/src/modules/camarero/public/menu.service.ts (MODIFICADO Y COMPLETO)
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Definición local de ModifierUiType
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
    uiType: LocalModifierUiType;
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

// --- CAMBIO: Añadido `isCamareroActive` a la interfaz ---
interface PublicDigitalMenu {
    businessName: string;
    businessSlug: string;
    businessLogoUrl: string | null;
    isLoyaltyCoreActive: boolean;
    isCamareroActive: boolean; // <--- CAMPO AÑADIDO
    categories: PublicMenuCategory[];
}
// --- Fin Definición de Tipos de Salida ---


export const getPublicDigitalMenuBySlug = async (businessSlug: string): Promise<PublicDigitalMenu | null> => {
    console.log(`[PublicMenu SVC] Fetching public data for business slug: ${businessSlug}`);

    try {
        // --- CAMBIO: La consulta ahora pide siempre el menú, pero la lógica lo usará o no ---
        const businessWithMenu = await prisma.business.findUnique({
            where: { slug: businessSlug },
            select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
                isCamareroActive: true,
                isActive: true,
                isLoyaltyCoreActive: true, // <-- CAMPO YA INCLUIDO
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
                            where: { isAvailable: true },
                            orderBy: { position: 'asc' },
                            select: {
                                id: true, name_es: true, name_en: true,
                                description_es: true, description_en: true,
                                price: true, imageUrl: true, allergens: true, tags: true,
                                position: true,
                                modifierGroups: {
                                    orderBy: { position: 'asc' },
                                    select: {
                                        id: true, name_es: true, name_en: true,
                                        uiType: true, minSelections: true, maxSelections: true,
                                        isRequired: true, position: true,
                                        options: {
                                            where: { isAvailable: true },
                                            orderBy: { position: 'asc' },
                                            select: {
                                                id: true, name_es: true, name_en: true,
                                                priceAdjustment: true, position: true, isDefault: true,
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

        if (!businessWithMenu || !businessWithMenu.isActive) {
            console.log(`[PublicMenu SVC] Business not found or is inactive for slug: ${businessSlug}`);
            return null;
        }
        
        // --- CAMBIO PRINCIPAL EN LA LÓGICA DE RETORNO ---
        // Ya no devolvemos 'null' si isCamareroActive es false.
        // Construimos el objeto de respuesta y solo procesamos las categorías si es necesario.

        let categoriesTyped: PublicMenuCategory[] = [];

        if (businessWithMenu.isCamareroActive) {
            // Si el módulo Camarero está activo, procesamos las categorías como antes.
            type CategoryFromPrisma = typeof businessWithMenu.menuCategories[0];
            type ItemFromPrisma = CategoryFromPrisma['items'][0];
            type GroupFromPrisma = ItemFromPrisma['modifierGroups'][0];
            type OptionFromPrisma = GroupFromPrisma['options'][0];

            const mapCategory = (category: CategoryFromPrisma): PublicMenuCategory => ({
                id: category.id,
                name_es: category.name_es, name_en: category.name_en,
                description_es: category.description_es, description_en: category.description_en,
                imageUrl: category.imageUrl, position: category.position,
                items: category.items.map(mapItem),
            });

            const mapItem = (item: ItemFromPrisma): PublicMenuCategoryItem => ({
                id: item.id,
                name_es: item.name_es, name_en: item.name_en,
                description_es: item.description_es, description_en: item.description_en,
                price: item.price, imageUrl: item.imageUrl,
                allergens: item.allergens, tags: item.tags,
                position: item.position,
                modifierGroups: item.modifierGroups.map(mapGroup),
            });

            const mapGroup = (group: GroupFromPrisma): PublicMenuCategoryItemModifierGroup => ({
                id: group.id,
                name_es: group.name_es, name_en: group.name_en,
                uiType: group.uiType as LocalModifierUiType,
                minSelections: group.minSelections, maxSelections: group.maxSelections,
                isRequired: group.isRequired, position: group.position,
                options: group.options.map(mapOption),
            });

            const mapOption = (option: OptionFromPrisma): PublicMenuCategoryItemModifierOption => ({
                id: option.id,
                name_es: option.name_es, name_en: option.name_en,
                priceAdjustment: option.priceAdjustment,
                position: option.position, isDefault: option.isDefault,
            });

            categoriesTyped = businessWithMenu.menuCategories.map(mapCategory);
        }
        
        const menuToReturn: PublicDigitalMenu = {
            businessName: businessWithMenu.name,
            businessSlug: businessWithMenu.slug,
            businessLogoUrl: businessWithMenu.logoUrl,
            isLoyaltyCoreActive: businessWithMenu.isLoyaltyCoreActive,
            isCamareroActive: businessWithMenu.isCamareroActive, // <-- Añadido al objeto final
            categories: categoriesTyped, // Será un array vacío si Camarero está inactivo
        };
        // --- FIN DEL CAMBIO ---

        return menuToReturn;

    } catch (error) {
        console.error(`[PublicMenu SVC] Error fetching public menu for slug ${businessSlug}:`, error);
        throw new Error('Error al obtener los datos del menú desde la base de datos.');
    }
};