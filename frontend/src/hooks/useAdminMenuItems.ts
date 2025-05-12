// frontend/src/hooks/useAdminMenuItems.ts
import { useState, useCallback, useEffect } from 'react';
import axiosInstance from '../services/axiosInstance';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { MenuItemData, MenuItemFormData } from '../types/menu.types'; // Importar tipos de ítem

// Nota: Los endpoints del backend son un poco diferentes para ítems.
// La creación y listado de ítems están anidados bajo una categoría.
// La actualización y borrado de un ítem específico se hace por el ID del ítem.

export interface UseAdminMenuItemsReturn {
    items: MenuItemData[];
    loading: boolean;
    error: string | null;
    fetchItems: () => Promise<void>; // fetchItems no necesitará categoryId si el hook se instancia con él
    addItem: (data: MenuItemFormData) => Promise<MenuItemData | null>;
    updateItem: (itemId: string, data: Partial<MenuItemFormData>) => Promise<MenuItemData | null>;
    deleteItem: (itemId: string) => Promise<boolean>;
}

export const useAdminMenuItems = (categoryId: string | null): UseAdminMenuItemsReturn => {
    const { t } = useTranslation();
    const [items, setItems] = useState<MenuItemData[]>([]);
    const [loading, setLoading] = useState<boolean>(false); // Iniciar en false, cargar solo si hay categoryId
    const [error, setError] = useState<string | null>(null);

    const ITEMS_API_BASE = `/camarero/admin/menu/items`; // Para GET por ID, PUT, DELETE
    const CATEGORY_ITEMS_API_BASE = `/camarero/admin/menu/categories/${categoryId}/items`; // Para GET y POST por categoría

    const fetchItems = useCallback(async () => {
        if (!categoryId) {
            setItems([]); // Si no hay categoryId, no hay ítems que cargar
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get<MenuItemData[]>(CATEGORY_ITEMS_API_BASE);
            setItems(response.data || []);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || t('common.errorLoadingData');
            setError(msg);
            // No mostrar notificación aquí directamente, el componente que lo usa decidirá
        } finally {
            setLoading(false);
        }
    }, [categoryId, t, CATEGORY_ITEMS_API_BASE]); // Depende de categoryId

    useEffect(() => {
        if (categoryId) { // Solo cargar si hay un categoryId
            fetchItems();
        } else {
            setItems([]); // Limpiar ítems si no hay categoría seleccionada
        }
    }, [categoryId, fetchItems]); // fetchItems ya incluye categoryId en sus dependencias

    const addItem = async (data: MenuItemFormData): Promise<MenuItemData | null> => {
        if (!categoryId) {
            notifications.show({ title: t('common.error'), message: 'No se puede añadir un ítem sin una categoría seleccionada.', color: 'red' });
            return null;
        }
        setLoading(true); // Podríamos tener un estado de 'submitting' separado
        try {
            const response = await axiosInstance.post<MenuItemData>(CATEGORY_ITEMS_API_BASE, data);
            notifications.show({
                title: t('adminCommon.createSuccess'),
                message: t('adminCamarero.manageMenu.itemCreateSuccess', { name: response.data.name_es || 'Ítem' }), // Necesitarás esta clave
                color: 'green',
            });
            fetchItems(); // Refrescar
            return response.data;
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || t('adminCommon.createError');
            notifications.show({ title: t('common.error'), message: msg, color: 'red' });
            setLoading(false);
            return null;
        }
    };

    const updateItem = async (itemId: string, data: Partial<MenuItemFormData>): Promise<MenuItemData | null> => {
        setLoading(true);
        try {
            const response = await axiosInstance.put<MenuItemData>(`${ITEMS_API_BASE}/${itemId}`, data);
            notifications.show({
                title: t('adminCommon.updateSuccess'),
                message: t('adminCamarero.manageMenu.itemUpdateSuccess', { name: response.data.name_es || 'Ítem' }), // Necesitarás esta clave
                color: 'green',
            });
            fetchItems(); // Refrescar
            return response.data;
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || t('adminCommon.updateError');
            notifications.show({ title: t('common.error'), message: msg, color: 'red' });
            setLoading(false);
            return null;
        }
    };

    const deleteItem = async (itemId: string): Promise<boolean> => {
        setLoading(true);
        try {
            await axiosInstance.delete(`${ITEMS_API_BASE}/${itemId}`);
            notifications.show({
                title: t('adminCommon.deleteSuccess'),
                message: t('adminCamarero.manageMenu.itemDeleteSuccess'), // Necesitarás esta clave
                color: 'green',
            });
            fetchItems(); // Refrescar
            return true;
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || t('adminCommon.deleteError');
            notifications.show({ title: t('common.error'), message: msg, color: 'red' });
            setLoading(false);
            return false;
        }
    };

    return {
        items,
        loading,
        error,
        fetchItems, // Aunque se llama internamente, puede ser útil para un refresh manual
        addItem,
        updateItem,
        deleteItem,
    };
};