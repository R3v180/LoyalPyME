// backend/src/camarero/admin-menu-item.controller.ts
import { Request, Response, NextFunction } from 'express';
import * as menuItemAdminService from './admin-menu-item.service';
import { Prisma } from '@prisma/client'; // Para tipos de error

// --- Handlers del Controlador ---

// POST /api/camarero/admin/menu/categories/:categoryId/items
export const createMenuItemHandler = async (req: Request, res: Response, next: NextFunction) => {
    const businessId = req.user?.businessId;
    const { categoryId } = req.params;

    if (!businessId) return res.status(403).json({ message: "Identificador de negocio no encontrado." });
    if (!categoryId) return res.status(400).json({ message: "Se requiere ID de la categoría." });

    const {
        name_es, name_en, description_es, description_en, price, imageUrl,
        allergens, tags, isAvailable, position, preparationTime, calories, kdsDestination, sku
    } = req.body;

    // Validación básica (mejorar con Zod)
    if (!name_es || typeof name_es !== 'string' || name_es.trim() === '') {
        return res.status(400).json({ message: "El campo 'name_es' (nombre en español) es obligatorio." });
    }
    if (price === undefined || typeof price !== 'number' || price < 0) {
        return res.status(400).json({ message: "El campo 'price' es obligatorio y debe ser un número positivo." });
    }
    // Aquí podrías añadir más validaciones para los otros campos (tipos, formatos)

    try {
        const menuItemData: Omit<menuItemAdminService.CreateMenuItemData, 'businessId' | 'categoryId'> = {
            name_es: name_es.trim(),
            name_en: name_en?.trim() || null,
            description_es: description_es?.trim() || null,
            description_en: description_en?.trim() || null,
            price: new Prisma.Decimal(price), // Convertir a Decimal para Prisma
            imageUrl: imageUrl || null,
            allergens: Array.isArray(allergens) ? allergens.filter(a => typeof a === 'string') : [],
            tags: Array.isArray(tags) ? tags.filter(t => typeof t === 'string') : [],
            isAvailable: typeof isAvailable === 'boolean' ? isAvailable : true,
            position: typeof position === 'number' ? position : 0,
            preparationTime: typeof preparationTime === 'number' ? preparationTime : null,
            calories: typeof calories === 'number' ? calories : null,
            kdsDestination: kdsDestination || null,
            sku: sku?.trim() || null
        };
        const newItem = await menuItemAdminService.createMenuItem(businessId, categoryId, menuItemData);
        res.status(201).json(newItem);
    } catch (error: any) {
        if (error.message && (error.message.includes('Ya existe un ítem') || error.message.includes('Conflicto de unicidad'))) {
            return res.status(409).json({ message: error.message });
        }
        if (error.message && error.message.startsWith('Categoría con ID')) { // Error del servicio si la categoría no es válida
            return res.status(400).json({ message: error.message });
        }
        next(error);
    }
};

// GET /api/camarero/admin/menu/categories/:categoryId/items
export const getMenuItemsByCategoryHandler = async (req: Request, res: Response, next: NextFunction) => {
    const businessId = req.user?.businessId;
    const { categoryId } = req.params;
    const { isAvailable } = req.query; // Filtro opcional

    if (!businessId) return res.status(403).json({ message: "Identificador de negocio no encontrado." });
    if (!categoryId) return res.status(400).json({ message: "Se requiere ID de la categoría." });

    try {
        const filter: { isAvailable?: boolean } = {};
        if (isAvailable !== undefined) {
            filter.isAvailable = String(isAvailable).toLowerCase() === 'true';
        }
        const items = await menuItemAdminService.getMenuItemsByCategory(categoryId, businessId, filter);
        res.status(200).json(items);
    } catch (error: any) {
        if (error.message && error.message.startsWith('Categoría con ID')) {
            return res.status(404).json({ message: error.message }); // Si la categoría no existe
        }
        next(error);
    }
};

// GET /api/camarero/admin/menu/items/:itemId
export const getMenuItemByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
    const businessId = req.user?.businessId;
    const { itemId } = req.params;

    if (!businessId) return res.status(403).json({ message: "Identificador de negocio no encontrado." });
    if (!itemId) return res.status(400).json({ message: "Se requiere ID del ítem de menú." });

    try {
        const item = await menuItemAdminService.getMenuItemById(itemId, businessId);
        if (!item) {
            return res.status(404).json({ message: "Ítem de menú no encontrado o no pertenece a este negocio." });
        }
        res.status(200).json(item);
    } catch (error) {
        next(error);
    }
};

// PUT o PATCH /api/camarero/admin/menu/items/:itemId
export const updateMenuItemHandler = async (req: Request, res: Response, next: NextFunction) => {
    const businessId = req.user?.businessId;
    const { itemId } = req.params;

    if (!businessId) return res.status(403).json({ message: "Identificador de negocio no encontrado." });
    if (!itemId) return res.status(400).json({ message: "Se requiere ID del ítem de menú." });

    const updateDataFromRequest = req.body;
    if (Object.keys(updateDataFromRequest).length === 0) {
        return res.status(400).json({ message: "Se requiere al menos un campo para actualizar." });
    }

    try {
        // Construir el objeto de datos para el servicio, procesando cada campo
        const serviceUpdateData: menuItemAdminService.UpdateMenuItemData = {};

        // Campos string opcionales
        if (updateDataFromRequest.name_es !== undefined) serviceUpdateData.name_es = String(updateDataFromRequest.name_es).trim();
        if (updateDataFromRequest.name_en !== undefined) serviceUpdateData.name_en = updateDataFromRequest.name_en === null ? null : String(updateDataFromRequest.name_en).trim() || null;
        if (updateDataFromRequest.description_es !== undefined) serviceUpdateData.description_es = updateDataFromRequest.description_es === null ? null : String(updateDataFromRequest.description_es).trim() || null;
        if (updateDataFromRequest.description_en !== undefined) serviceUpdateData.description_en = updateDataFromRequest.description_en === null ? null : String(updateDataFromRequest.description_en).trim() || null;
        if (updateDataFromRequest.imageUrl !== undefined) serviceUpdateData.imageUrl = updateDataFromRequest.imageUrl === null ? null : String(updateDataFromRequest.imageUrl) || null;
        if (updateDataFromRequest.kdsDestination !== undefined) serviceUpdateData.kdsDestination = updateDataFromRequest.kdsDestination === null ? null : String(updateDataFromRequest.kdsDestination).trim() || null;
        if (updateDataFromRequest.sku !== undefined) serviceUpdateData.sku = updateDataFromRequest.sku === null ? null : String(updateDataFromRequest.sku).trim() || null;
        
        // Campos numéricos
        if (updateDataFromRequest.price !== undefined) {
            const priceNum = parseFloat(updateDataFromRequest.price);
            if (isNaN(priceNum) || priceNum < 0) return res.status(400).json({ message: "El precio debe ser un número positivo." });
            serviceUpdateData.price = new Prisma.Decimal(priceNum);
        }
        if (updateDataFromRequest.position !== undefined) {
            const posNum = parseInt(updateDataFromRequest.position, 10);
            if (isNaN(posNum)) return res.status(400).json({ message: "La posición debe ser un número." });
            serviceUpdateData.position = posNum;
        }
        if (updateDataFromRequest.preparationTime !== undefined) {
            serviceUpdateData.preparationTime = updateDataFromRequest.preparationTime === null ? null : parseInt(updateDataFromRequest.preparationTime, 10);
            if (serviceUpdateData.preparationTime !== null && isNaN(serviceUpdateData.preparationTime)) return res.status(400).json({ message: "El tiempo de preparación debe ser un número o nulo." });
        }
        if (updateDataFromRequest.calories !== undefined) {
            serviceUpdateData.calories = updateDataFromRequest.calories === null ? null : parseInt(updateDataFromRequest.calories, 10);
            if (serviceUpdateData.calories !== null && isNaN(serviceUpdateData.calories)) return res.status(400).json({ message: "Las calorías deben ser un número o nulo." });
        }

        // Campos booleanos
        if (updateDataFromRequest.isAvailable !== undefined) {
            if (typeof updateDataFromRequest.isAvailable !== 'boolean') return res.status(400).json({ message: "isAvailable debe ser booleano." });
            serviceUpdateData.isAvailable = updateDataFromRequest.isAvailable;
        }

        // Campos array
        if (updateDataFromRequest.allergens !== undefined) {
            if (!Array.isArray(updateDataFromRequest.allergens) || !updateDataFromRequest.allergens.every((s: any) => typeof s === 'string')) return res.status(400).json({ message: "Los alérgenos deben ser un array de strings." });
            serviceUpdateData.allergens = updateDataFromRequest.allergens;
        }
        if (updateDataFromRequest.tags !== undefined) {
            if (!Array.isArray(updateDataFromRequest.tags) || !updateDataFromRequest.tags.every((s: any) => typeof s === 'string')) return res.status(400).json({ message: "Las etiquetas deben ser un array de strings." });
            serviceUpdateData.tags = updateDataFromRequest.tags;
        }
        
        // Campo categoryId (para mover el ítem de categoría)
        if (updateDataFromRequest.categoryId !== undefined) {
            if (typeof updateDataFromRequest.categoryId !== 'string' || updateDataFromRequest.categoryId.trim() === '') return res.status(400).json({ message: "categoryId debe ser un string válido si se proporciona." });
            serviceUpdateData.categoryId = updateDataFromRequest.categoryId.trim();
        }

        if (Object.keys(serviceUpdateData).length === 0) {
            return res.status(400).json({ message: "No se proporcionaron datos válidos para actualizar." });
        }

        const updatedItem = await menuItemAdminService.updateMenuItem(itemId, businessId, serviceUpdateData);
        res.status(200).json(updatedItem);
    } catch (error: any) {
        if (error.message && (error.message.includes('no encontrado') || error.message.includes('no pertenece'))) {
            return res.status(404).json({ message: error.message });
        }
        if (error.message && (error.message.includes('Ya existe un ítem') || error.message.includes('Conflicto de unicidad'))) {
            return res.status(409).json({ message: error.message });
        }
         if (error.message && error.message.startsWith('La nueva categoría de destino')) {
            return res.status(400).json({ message: error.message });
        }
        next(error);
    }
};

// DELETE /api/camarero/admin/menu/items/:itemId
export const deleteMenuItemHandler = async (req: Request, res: Response, next: NextFunction) => {
    const businessId = req.user?.businessId;
    const { itemId } = req.params;

    if (!businessId) return res.status(403).json({ message: "Identificador de negocio no encontrado." });
    if (!itemId) return res.status(400).json({ message: "Se requiere ID del ítem de menú." });

    try {
        const deletedItem = await menuItemAdminService.deleteMenuItem(itemId, businessId);
        res.status(200).json({ message: "Ítem de menú eliminado con éxito.", id: deletedItem.id });
    } catch (error: any) {
         if (error.message && error.message.includes('no encontrado')) {
            return res.status(404).json({ message: error.message });
        }
        if (error.message && error.message.includes('está en uso')) { // Mensaje del servicio para P2003
            return res.status(409).json({ message: error.message });
        }
        next(error);
    }
};