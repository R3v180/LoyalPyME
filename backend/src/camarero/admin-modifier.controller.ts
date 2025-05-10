// backend/src/camarero/admin-modifier.controller.ts
import { Request, Response, NextFunction } from 'express';
import * as modifierAdminService from './admin-modifier.service';
import { Prisma } from '@prisma/client'; // Para tipos de error

// === Handlers para ModifierGroup ===

// POST /api/camarero/admin/menu/items/:itemId/modifier-groups
export const createModifierGroupHandler = async (req: Request, res: Response, next: NextFunction) => {
    const businessId = req.user?.businessId;
    const { itemId } = req.params;

    if (!businessId) return res.status(403).json({ message: "Identificador de negocio no encontrado." });
    if (!itemId) return res.status(400).json({ message: "Se requiere ID del ítem de menú." });

    const { name_es, name_en, uiType, minSelections, maxSelections, position, isRequired } = req.body;

    // Validación básica (mejorar con Zod)
    if (!name_es || typeof name_es !== 'string' || name_es.trim() === '') {
        return res.status(400).json({ message: "El campo 'name_es' (nombre en español) es obligatorio para el grupo." });
    }
    // Añadir más validaciones para uiType, minSelections, maxSelections, etc.

    try {
        const groupData: Omit<modifierAdminService.CreateModifierGroupData, 'businessId' | 'menuItemId'> = {
            name_es: name_es.trim(),
            name_en: name_en?.trim() || null,
            uiType: uiType || "RADIO", // Valor por defecto si no se provee
            minSelections: typeof minSelections === 'number' ? minSelections : 0,
            maxSelections: typeof maxSelections === 'number' ? maxSelections : 1,
            position: typeof position === 'number' ? position : 0,
            isRequired: typeof isRequired === 'boolean' ? isRequired : false,
        };
        const newGroup = await modifierAdminService.createModifierGroup(businessId, itemId, groupData);
        res.status(201).json(newGroup);
    } catch (error: any) {
        if (error.message && (error.message.includes('Ya existe un grupo') || error.message.startsWith('Ítem de menú con ID'))) {
            return res.status(error.message.startsWith('Ítem de menú con ID') ? 404 : 409).json({ message: error.message });
        }
        next(error);
    }
};

// GET /api/camarero/admin/menu/items/:itemId/modifier-groups
export const getModifierGroupsByMenuItemHandler = async (req: Request, res: Response, next: NextFunction) => {
    const businessId = req.user?.businessId;
    const { itemId } = req.params;

    if (!businessId) return res.status(403).json({ message: "Identificador de negocio no encontrado." });
    if (!itemId) return res.status(400).json({ message: "Se requiere ID del ítem de menú." });

    try {
        const groups = await modifierAdminService.getModifierGroupsByMenuItem(itemId, businessId);
        res.status(200).json(groups);
    } catch (error: any) {
        if (error.message && error.message.startsWith('Ítem de menú con ID')) {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};

// PUT o PATCH /api/camarero/admin/modifier-groups/:modifierGroupId
export const updateModifierGroupHandler = async (req: Request, res: Response, next: NextFunction) => {
    const businessId = req.user?.businessId;
    const { modifierGroupId } = req.params;

    if (!businessId) return res.status(403).json({ message: "Identificador de negocio no encontrado." });
    if (!modifierGroupId) return res.status(400).json({ message: "Se requiere ID del grupo de modificadores." });

    const updateDataFromRequest = req.body;
    if (Object.keys(updateDataFromRequest).length === 0) {
        return res.status(400).json({ message: "Se requiere al menos un campo para actualizar." });
    }
    // Aquí irían validaciones más detalladas para los campos de updateDataFromRequest

    try {
        // No es necesario construir el objeto 'serviceUpdateData' aquí si el tipo del servicio es suficientemente permisivo
        // y los nombres de campo coinciden. El servicio se encarga de la lógica.
        const updatedGroup = await modifierAdminService.updateModifierGroup(modifierGroupId, businessId, updateDataFromRequest);
        res.status(200).json(updatedGroup);
    } catch (error: any) {
        if (error.message && error.message.startsWith('Grupo de modificadores con ID')) {
            return res.status(404).json({ message: error.message });
        }
        if (error.message && error.message.includes('Error de unicidad')) {
            return res.status(409).json({ message: error.message });
        }
        next(error);
    }
};

// DELETE /api/camarero/admin/modifier-groups/:modifierGroupId
export const deleteModifierGroupHandler = async (req: Request, res: Response, next: NextFunction) => {
    const businessId = req.user?.businessId;
    const { modifierGroupId } = req.params;

    if (!businessId) return res.status(403).json({ message: "Identificador de negocio no encontrado." });
    if (!modifierGroupId) return res.status(400).json({ message: "Se requiere ID del grupo de modificadores." });

    try {
        const deletedGroup = await modifierAdminService.deleteModifierGroup(modifierGroupId, businessId);
        res.status(200).json({ message: "Grupo de modificadores eliminado con éxito.", id: deletedGroup.id });
    } catch (error: any) {
        if (error.message && error.message.startsWith('Grupo de modificadores con ID')) {
            return res.status(404).json({ message: error.message });
        }
        if (error.message && error.message.includes('opciones está en uso')) { // Mensaje del servicio para P2003
            return res.status(409).json({ message: error.message });
        }
        next(error);
    }
};


// === Handlers para ModifierOption ===

// POST /api/camarero/admin/modifier-groups/:modifierGroupId/options
export const createModifierOptionHandler = async (req: Request, res: Response, next: NextFunction) => {
    const businessId = req.user?.businessId; // Para verificar pertenencia del grupo padre
    const { modifierGroupId } = req.params;

    if (!businessId) return res.status(403).json({ message: "Identificador de negocio no encontrado." });
    if (!modifierGroupId) return res.status(400).json({ message: "Se requiere ID del grupo de modificadores." });

    const { name_es, name_en, priceAdjustment, position, isDefault, isAvailable } = req.body;

    if (!name_es || typeof name_es !== 'string' || name_es.trim() === '') {
        return res.status(400).json({ message: "El campo 'name_es' es obligatorio para la opción." });
    }
    // Añadir más validaciones (priceAdjustment debe ser número, etc.)

    try {
        const optionData: Omit<modifierAdminService.CreateModifierOptionData, 'groupId'> = {
            name_es: name_es.trim(),
            name_en: name_en?.trim() || null,
            priceAdjustment: priceAdjustment === undefined ? 0 : new Prisma.Decimal(priceAdjustment),
            position: typeof position === 'number' ? position : 0,
            isDefault: typeof isDefault === 'boolean' ? isDefault : false,
            isAvailable: typeof isAvailable === 'boolean' ? isAvailable : true,
        };
        const newOption = await modifierAdminService.createModifierOption(modifierGroupId, businessId, optionData);
        res.status(201).json(newOption);
    } catch (error: any) {
        if (error.message && (error.message.includes('Ya existe una opción') || error.message.startsWith('Grupo de modificadores con ID'))) {
            return res.status(error.message.startsWith('Grupo de modificadores con ID') ? 404 : 409).json({ message: error.message });
        }
        next(error);
    }
};

// GET /api/camarero/admin/modifier-groups/:modifierGroupId/options
export const getModifierOptionsByGroupHandler = async (req: Request, res: Response, next: NextFunction) => {
    // businessId no es estrictamente necesario aquí si el servicio confía en que modifierGroupId es válido
    // pero se podría añadir una capa extra de verificación si se desea.
    const { modifierGroupId } = req.params;
    if (!modifierGroupId) return res.status(400).json({ message: "Se requiere ID del grupo de modificadores." });

    try {
        // El servicio getModifierOptionsByGroup podría necesitar businessId si queremos verificar que el grupo
        // realmente pertenece al negocio del admin autenticado, ANTES de buscar las opciones.
        // Por ahora, el servicio actual no lo requiere, pero es una consideración de seguridad/lógica.
        const options = await modifierAdminService.getModifierOptionsByGroup(modifierGroupId);
        res.status(200).json(options);
    } catch (error) {
        next(error);
    }
};

// PUT o PATCH /api/camarero/admin/modifier-options/:modifierOptionId
export const updateModifierOptionHandler = async (req: Request, res: Response, next: NextFunction) => {
    const businessId = req.user?.businessId; // Para verificar pertenencia
    const { modifierOptionId } = req.params;

    if (!businessId) return res.status(403).json({ message: "Identificador de negocio no encontrado." });
    if (!modifierOptionId) return res.status(400).json({ message: "Se requiere ID de la opción de modificador." });

    const updateDataFromRequest = req.body;
    if (Object.keys(updateDataFromRequest).length === 0) {
        return res.status(400).json({ message: "Se requiere al menos un campo para actualizar." });
    }
    // Aquí irían validaciones más detalladas

    try {
        const serviceUpdateData: modifierAdminService.UpdateModifierOptionData = { ...updateDataFromRequest };
        if (updateDataFromRequest.priceAdjustment !== undefined) {
            serviceUpdateData.priceAdjustment = new Prisma.Decimal(updateDataFromRequest.priceAdjustment);
        }
        // ... procesar otros campos si necesitan conversión o validación específica ...

        const updatedOption = await modifierAdminService.updateModifierOption(modifierOptionId, businessId, serviceUpdateData);
        res.status(200).json(updatedOption);
    } catch (error: any) {
        if (error.message && error.message.startsWith('Opción de modificador con ID')) {
            return res.status(404).json({ message: error.message });
        }
        if (error.message && error.message.includes('Error de unicidad')) {
            return res.status(409).json({ message: error.message });
        }
        next(error);
    }
};

// DELETE /api/camarero/admin/modifier-options/:modifierOptionId
export const deleteModifierOptionHandler = async (req: Request, res: Response, next: NextFunction) => {
    const businessId = req.user?.businessId; // Para verificar pertenencia
    const { modifierOptionId } = req.params;

    if (!businessId) return res.status(403).json({ message: "Identificador de negocio no encontrado." });
    if (!modifierOptionId) return res.status(400).json({ message: "Se requiere ID de la opción de modificador." });

    try {
        const deletedOption = await modifierAdminService.deleteModifierOption(modifierOptionId, businessId);
        res.status(200).json({ message: "Opción de modificador eliminada con éxito.", id: deletedOption.id });
    } catch (error: any) {
        if (error.message && error.message.startsWith('Opción de modificador con ID')) {
            return res.status(404).json({ message: error.message });
        }
         if (error.message && error.message.includes('está en uso')) {
            return res.status(409).json({ message: error.message });
        }
        next(error);
    }
};