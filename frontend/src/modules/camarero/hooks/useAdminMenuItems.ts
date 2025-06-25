// frontend/src/hooks/useAdminMenuItems.ts
import { useState, useCallback, useEffect } from 'react';
import axiosInstance from '../../../shared/services/axiosInstance';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { MenuItemData, MenuItemFormData } from '../types/menu.types';

const ITEMS_API_BASE = `/camarero/admin/menu/items`;
const CATEGORY_ITEMS_API_BASE = (categoryId: string) => `/camarero/admin/menu/categories/${categoryId}/items`;

export interface UseAdminMenuItemsReturn {
    items: MenuItemData[];
    loading: boolean;
    error: string | null;
    fetchItems: () => Promise<void>;
    addItem: (data: MenuItemFormData) => Promise<MenuItemData | null>;
    updateItem: (itemId: string, data: Partial<MenuItemFormData>) => Promise<MenuItemData | null>;
    deleteItem: (itemId: string) => Promise<boolean>;
}

export const useAdminMenuItems = (categoryId: string | null): UseAdminMenuItemsReturn => {
    const { t } = useTranslation();
    const [items, setItems] = useState<MenuItemData[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchItems = useCallback(async () => {
        if (!categoryId) {
            setItems([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get<MenuItemData[]>(CATEGORY_ITEMS_API_BASE(categoryId));
            setItems(response.data || []);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || t('common.errorLoadingData');
            setError(msg);
            // No mostrar notificación aquí directamente
        } finally {
            setLoading(false);
        }
    }, [categoryId, t]);

    useEffect(() => {
        if (categoryId) {
            fetchItems();
        } else {
            setItems([]);
        }
    }, [categoryId, fetchItems]);

    const addItem = async (data: MenuItemFormData): Promise<MenuItemData | null> => {
        if (!categoryId) {
            notifications.show({
                title: t('common.error'),
                message: t('adminCamarero.menuItemHook.errorNoCategoryForItem'),
                color: 'red'
            });
            return null;
        }
        setLoading(true);
        try {
            const response = await axiosInstance.post<MenuItemData>(CATEGORY_ITEMS_API_BASE(categoryId), data);
            notifications.show({
                title: t('adminCommon.createSuccess'),
                message: t('adminCamarero.manageMenu.itemCreateSuccess', { name: response.data.name_es || t('adminCamarero.manageMenu.itemFallbackName') }),
                color: 'green',
            });
            fetchItems();
            return response.data;
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || t('adminCommon.createError');
            notifications.show({ title: t('common.error'), message: msg, color: 'red' });
            setLoading(false);
            return null;
        } finally {
            // Asegurar que loading se desactive si no se hizo ya
            if (loading) setLoading(false);
        }
    };

    const updateItem = async (itemId: string, data: Partial<MenuItemFormData>): Promise<MenuItemData | null> => {
        setLoading(true);
        try {
            const response = await axiosInstance.put<MenuItemData>(`${ITEMS_API_BASE}/${itemId}`, data);
            notifications.show({
                title: t('adminCommon.updateSuccess'),
                message: t('adminCamarero.manageMenu.itemUpdateSuccess', { name: response.data.name_es || t('adminCamarero.manageMenu.itemFallbackName') }),
                color: 'green',
            });
            fetchItems();
            return response.data;
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || t('adminCommon.updateError');
            notifications.show({ title: t('common.error'), message: msg, color: 'red' });
            setLoading(false);
            return null;
        } finally {
            if (loading) setLoading(false);
        }
    };

    const deleteItem = async (itemId: string): Promise<boolean> => {
        setLoading(true);
        try {
            await axiosInstance.delete(`${ITEMS_API_BASE}/${itemId}`);
            notifications.show({
                title: t('adminCommon.deleteSuccess'),
                message: t('adminCamarero.manageMenu.itemDeleteSuccess'),
                color: 'green',
            });
            fetchItems();
            return true;
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || t('adminCommon.deleteError');
            notifications.show({ title: t('common.error'), message: msg, color: 'red' });
            setLoading(false);
            return false;
        } finally {
            if (loading) setLoading(false);
        }
    };

    return {
        items,
        loading,
        error,
        fetchItems,
        addItem,
        updateItem,
        deleteItem,
    };
};