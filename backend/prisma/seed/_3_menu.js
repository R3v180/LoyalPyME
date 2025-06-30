"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedMenu = seedMenu;
// Enum local para tipos de UI de modificadores, para evitar errores de importación en el script
var SeedModifierUiType;
(function (SeedModifierUiType) {
    SeedModifierUiType["RADIO"] = "RADIO";
    SeedModifierUiType["CHECKBOX"] = "CHECKBOX";
})(SeedModifierUiType || (SeedModifierUiType = {}));
/**
 * Función que crea la carta digital completa, incluyendo categorías, ítems y modificadores complejos.
 * @param prisma - Instancia del PrismaClient.
 * @param businessId - El ID del negocio para asociar el menú.
 * @returns Un objeto con las entidades de menú clave creadas.
 */
async function seedMenu(prisma, businessId) {
    console.log('--- Seeding [3]: Menu Categories, Items and Modifiers ---');
    // 1. CREAR CATEGORÍAS
    const categories = {
        entrantes: await prisma.menuCategory.upsert({ where: { businessId_name_es: { businessId, name_es: 'Entrantes para Compartir' } }, update: {}, create: { name_es: 'Entrantes para Compartir', name_en: 'Starters to Share', businessId, position: 1, imageUrl: 'https://images.unsplash.com/photo-1572441713135-c70a27b8a53c?q=80&w=800' } }),
        principales: await prisma.menuCategory.upsert({ where: { businessId_name_es: { businessId, name_es: 'Platos Principales' } }, update: {}, create: { name_es: 'Platos Principales', name_en: 'Main Courses', businessId, position: 2, imageUrl: 'https://images.unsplash.com/photo-1559847844-5315695d9e16?q=80&w=800' } }),
        postres: await prisma.menuCategory.upsert({ where: { businessId_name_es: { businessId, name_es: 'Postres Caseros' } }, update: {}, create: { name_es: 'Postres Caseros', name_en: 'Homemade Desserts', businessId, position: 3, imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=800' } }),
        bebidas: await prisma.menuCategory.upsert({ where: { businessId_name_es: { businessId, name_es: 'Bebidas y Refrescos' } }, update: {}, create: { name_es: 'Bebidas y Refrescos', name_en: 'Drinks & Beverages', businessId, position: 4, imageUrl: 'https://images.unsplash.com/photo-1573245929259-693680407254?q=80&w=800' } }),
    };
    console.log(`[SEED] Upserted Menu Categories.`);
    // 2. CREAR ÍTEMS DE MENÚ
    const gazpacho = await prisma.menuItem.upsert({ where: { categoryId_name_es: { categoryId: categories.entrantes.id, name_es: "Gazpacho Andaluz Fresco" } }, update: {}, create: { name_es: "Gazpacho Andaluz Fresco", name_en: "Fresh Andalusian Gazpacho", price: 7.50, kdsDestination: "COCINA", categoryId: categories.entrantes.id, businessId, allergens: ['GLUTEN'], tags: ['VEGAN', 'VEGETARIAN'] } });
    const hamburguesa = await prisma.menuItem.upsert({ where: { categoryId_name_es: { categoryId: categories.principales.id, name_es: "Hamburguesa 'La Jefa'" } }, update: {}, create: { name_es: "Hamburguesa 'La Jefa'", name_en: "'The Boss' Burger", price: 13.50, description_es: "200gr de ternera, pan brioche, lechuga, tomate, cheddar y nuestra salsa especial.", kdsDestination: "COCINA", categoryId: categories.principales.id, businessId, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800' } });
    const salmon = await prisma.menuItem.upsert({ where: { categoryId_name_es: { categoryId: categories.principales.id, name_es: "Salmón Fresco (No Disponible)" } }, update: {}, create: { name_es: "Salmón Fresco (No Disponible)", name_en: "Fresh Salmon (Unavailable)", price: 18.00, kdsDestination: "COCINA", categoryId: categories.principales.id, businessId, isAvailable: false } });
    const tarta = await prisma.menuItem.upsert({ where: { categoryId_name_es: { categoryId: categories.postres.id, name_es: "Tarta de Queso Cremosa" } }, update: {}, create: { name_es: "Tarta de Queso Cremosa", name_en: "Creamy Cheesecake", price: 6.50, kdsDestination: "COCINA", categoryId: categories.postres.id, businessId, imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=800' } });
    const cafe = await prisma.menuItem.upsert({ where: { categoryId_name_es: { categoryId: categories.bebidas.id, name_es: "Café Espresso" } }, update: {}, create: { name_es: "Café Espresso", name_en: "Espresso Coffee", price: 1.80, kdsDestination: "BARRA", sku: "COFF-ESP", categoryId: categories.bebidas.id, businessId, imageUrl: 'https://images.unsplash.com/photo-1599399125934-e4a4c62648e2?q=80&w=800' } });
    const refresco = await prisma.menuItem.upsert({ where: { categoryId_name_es: { categoryId: categories.bebidas.id, name_es: "Refresco de Cola" } }, update: {}, create: { name_es: "Refresco de Cola", name_en: "Cola Drink", price: 2.50, kdsDestination: "BARRA", sku: "COKE-330", categoryId: categories.bebidas.id, businessId } });
    console.log(`[SEED] Upserted Menu Items.`);
    // 3. CREAR MODIFICADORES PARA LA HAMBURGUESA
    await prisma.modifierGroup.deleteMany({ where: { menuItemId: hamburguesa.id } }); // Limpiar modificadores viejos para este ítem
    // Grupo "Punto de la Carne"
    const puntoCarneGroup = await prisma.modifierGroup.create({ data: { name_es: 'Punto de la Carne', name_en: 'Meat Doneness', uiType: SeedModifierUiType.RADIO, isRequired: true, minSelections: 1, maxSelections: 1, position: 1, menuItemId: hamburguesa.id, businessId } });
    await prisma.modifierOption.createMany({ data: [
            { name_es: 'Poco Hecha', name_en: 'Rare', groupId: puntoCarneGroup.id, position: 1 },
            { name_es: 'Al Punto', name_en: 'Medium', groupId: puntoCarneGroup.id, position: 2, isDefault: true },
            { name_es: 'Muy Hecha', name_en: 'Well-done', groupId: puntoCarneGroup.id, position: 3 }
        ] });
    // Grupo "Extras"
    const extrasGroup = await prisma.modifierGroup.create({ data: { name_es: 'Añade Extras', name_en: 'Add Extras', uiType: SeedModifierUiType.CHECKBOX, isRequired: false, minSelections: 0, maxSelections: 3, position: 2, menuItemId: hamburguesa.id, businessId } });
    await prisma.modifierOption.createMany({ data: [
            { name_es: 'Queso Extra', name_en: 'Extra Cheese', priceAdjustment: 1.20, groupId: extrasGroup.id, position: 1 },
            { name_es: 'Bacon Extra', name_en: 'Extra Bacon', priceAdjustment: 1.50, groupId: extrasGroup.id, position: 2 },
            { name_es: 'Huevo Frito', name_en: 'Fried Egg', priceAdjustment: 1.80, groupId: extrasGroup.id, position: 3 }
        ] });
    console.log(`[SEED] Created Modifiers for Hamburger.`);
    return { hamburguesa, tarta, cafe, refresco, puntoCarneGroup, extrasGroup };
}
