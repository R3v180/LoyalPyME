// backend/src/camarero/admin-menu-category.controller.ts
import { Request, Response, NextFunction } from 'express';
// --- CAMBIO: Importar el servicio real ---
import * as menuCategoryAdminService from './admin-menu-category.service';
// --- FIN CAMBIO ---

// --- Handlers del Controlador ---

// POST /api/camarero/admin/menu/categories
export const createMenuCategoryHandler = async (req: Request, res: Response, next: NextFunction) => {
    const businessId = req.user?.businessId;
    if (!businessId) {
        return res.status(403).json({ message: "Identificador de negocio no encontrado." });
    }

    const { name_es, name_en, description_es, description_en, imageUrl, position, isActive } = req.body;

    if (!name_es || typeof name_es !== 'string' || name_es.trim() === '') {
        return res.status(400).json({ message: "El campo 'name_es' (nombre en español) es obligatorio." });
    }
    if (name_en !== undefined && name_en !== null && typeof name_en !== 'string') {
        return res.status(400).json({ message: "El campo 'name_en' debe ser un texto o nulo." });
    }
    if (position !== undefined && typeof position !== 'number') {
        return res.status(400).json({ message: "El campo 'position' debe ser un número si se proporciona." });
    }
    if (isActive !== undefined && typeof isActive !== 'boolean') {
        return res.status(400).json({ message: "El campo 'isActive' debe ser un booleano si se proporciona." });
    }

    try {
        const categoryData: menuCategoryAdminService.CreateMenuCategoryData = {
            name_es: name_es.trim(),
            name_en: name_en?.trim() || null,
            description_es: description_es?.trim() || null,
            description_en: description_en?.trim() || null,
            imageUrl: imageUrl || null,
            position: typeof position === 'number' ? position : 0,
            isActive: typeof isActive === 'boolean' ? isActive : true,
        };
        // --- CAMBIO: Llamada al servicio real, ya no hay @ts-ignore ---
        const newCategory = await menuCategoryAdminService.createMenuCategory(businessId, categoryData);
        res.status(201).json(newCategory);
    } catch (error: any) {
        if (error.message && error.message.includes('Ya existe una categoría con el nombre')) {
            return res.status(409).json({ message: error.message });
        }
        next(error);
    }
};

// GET /api/camarero/admin/menu/categories
export const getMenuCategoriesHandler = async (req: Request, res: Response, next: NextFunction) => {
    const businessId = req.user?.businessId;
    if (!businessId) {
        return res.status(403).json({ message: "Identificador de negocio no encontrado." });
    }
    try {
        const categories = await menuCategoryAdminService.getMenuCategoriesByBusiness(businessId);
        res.status(200).json(categories);
    } catch (error) {
        next(error);
    }
};

// GET /api/camarero/admin/menu/categories/:categoryId
export const getMenuCategoryByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
    const businessId = req.user?.businessId;
    const { categoryId } = req.params;
    if (!businessId) {
        return res.status(403).json({ message: "Identificador de negocio no encontrado." });
    }
    try {
        const category = await menuCategoryAdminService.getMenuCategoryById(categoryId, businessId);
        if (!category) {
            return res.status(404).json({ message: "Categoría de menú no encontrada o no pertenece a este negocio." });
        }
        res.status(200).json(category);
    } catch (error) {
        next(error);
    }
};

// PUT o PATCH /api/camarero/admin/menu/categories/:categoryId
export const updateMenuCategoryHandler = async (req: Request, res: Response, next: NextFunction) => {
    const businessId = req.user?.businessId;
    const { categoryId } = req.params;
    if (!businessId) {
        return res.status(403).json({ message: "Identificador de negocio no encontrado." });
    }

    const { name_es, name_en, description_es, description_en, imageUrl, position, isActive } = req.body;
    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: "Se requiere al menos un campo para actualizar." });
    }
    if (name_es !== undefined && (typeof name_es !== 'string' || name_es.trim() === '')) {
        return res.status(400).json({ message: "Si se proporciona 'name_es', no puede estar vacío." });
    }
    if (name_en !== undefined && name_en !== null && typeof name_en !== 'string') {
        return res.status(400).json({ message: "Si se proporciona 'name_en', debe ser un texto o nulo." });
    }
    if (position !== undefined && typeof position !== 'number') {
        return res.status(400).json({ message: "Si se proporciona 'position', debe ser un número." });
    }
    if (isActive !== undefined && typeof isActive !== 'boolean') {
        return res.status(400).json({ message: "Si se proporciona 'isActive', debe ser un booleano." });
    }
    
    try {
        const updateData: menuCategoryAdminService.UpdateMenuCategoryData = {};
        if (name_es !== undefined) updateData.name_es = name_es.trim();
        if (name_en !== undefined) updateData.name_en = name_en === null ? null : name_en?.trim() || null;
        if (description_es !== undefined) updateData.description_es = description_es === null ? null : description_es?.trim() || null;
        if (description_en !== undefined) updateData.description_en = description_en === null ? null : description_en?.trim() || null;
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl === null ? null : imageUrl || null;
        if (position !== undefined) updateData.position = position;
        if (isActive !== undefined) updateData.isActive = isActive;

        // --- CAMBIO: Quitar @ts-ignore ---
        const updatedCategory = await menuCategoryAdminService.updateMenuCategory(categoryId, businessId, updateData);
        res.status(200).json(updatedCategory);
    } catch (error: any) {
        if (error.message && error.message.includes('no encontrada')) {
            return res.status(404).json({ message: error.message });
        }
        if (error.message && error.message.includes('Error de unicidad')) {
            return res.status(409).json({ message: error.message });
        }
        next(error);
    }
};

// DELETE /api/camarero/admin/menu/categories/:categoryId
export const deleteMenuCategoryHandler = async (req: Request, res: Response, next: NextFunction) => {
    const businessId = req.user?.businessId;
    const { categoryId } = req.params;
    if (!businessId) {
        return res.status(403).json({ message: "Identificador de negocio no encontrado." });
    }
    try {
        // --- CAMBIO: Quitar @ts-ignore ---
        const deletedCategory = await menuCategoryAdminService.deleteMenuCategory(categoryId, businessId);
        res.status(200).json({ message: "Categoría de menú eliminada con éxito.", id: deletedCategory.id });
    } catch (error: any) {
         if (error.message && error.message.includes('no encontrada')) {
            return res.status(404).json({ message: error.message });
        }
        if (error.message && error.message.includes('contiene ítems que están actualmente en uso')) {
            return res.status(409).json({ message: error.message });
        }
        next(error);
    }
};