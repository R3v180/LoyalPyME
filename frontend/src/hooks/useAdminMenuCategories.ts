// Nuevo archivo: frontend/src/hooks/useAdminMenuCategories.ts

import { useState, useCallback, useEffect } from 'react';
import axiosInstance from '../services/axiosInstance';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { MenuCategoryData, MenuCategoryFormData } from '../types/menu.types'; // Importar nuestros nuevos tipos

const API_ENDPOINT = '/camarero/admin/menu/categories'; // Endpoint base para categorías

export interface UseAdminMenuCategoriesReturn {
    categories: MenuCategoryData[];
    loading: boolean;
    error: string | null;
    fetchCategories: () => Promise<void>;
    addCategory: (data: MenuCategoryFormData) => Promise<MenuCategoryData | null>;
    updateCategory: (id: string, data: Partial<MenuCategoryFormData>) => Promise<MenuCategoryData | null>;
    deleteCategory: (id: string) => Promise<boolean>;
    // Podríamos añadir aquí funciones para reordenar si fuera necesario
}

export const useAdminMenuCategories = (): UseAdminMenuCategoriesReturn => {
    const { t } = useTranslation();
    const [categories, setCategories] = useState<MenuCategoryData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get<MenuCategoryData[]>(API_ENDPOINT);
            // El backend ya debería devolverlas ordenadas por 'position'
            setCategories(response.data || []);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || t('common.errorLoadingData');
            setError(msg);
            notifications.show({ title: t('common.error'), message: msg, color: 'red' });
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const addCategory = async (data: MenuCategoryFormData): Promise<MenuCategoryData | null> => {
        setLoading(true);
        try {
            const response = await axiosInstance.post<MenuCategoryData>(API_ENDPOINT, data);
            notifications.show({
                title: t('adminCommon.createSuccess'),
                message: t('adminCamarero.manageMenu.categoryCreateSuccess', { name: response.data.name_es }), // Necesitaremos esta clave i18n
                color: 'green',
            });
            await fetchCategories(); // Refrescar la lista
            return response.data;
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || t('adminCommon.createError');
            notifications.show({ title: t('common.error'), message: msg, color: 'red' });
            setLoading(false); // Asegurar que loading se desactiva en error
            return null;
        }
    };

    const updateCategory = async (id: string, data: Partial<MenuCategoryFormData>): Promise<MenuCategoryData | null> => {
        setLoading(true);
        try {
            const response = await axiosInstance.put<MenuCategoryData>(`${API_ENDPOINT}/${id}`, data);
            notifications.show({
                title: t('adminCommon.updateSuccess'),
                message: t('adminCamarero.manageMenu.categoryUpdateSuccess', { name: response.data.name_es }), // Necesitaremos esta clave i18n
                color: 'green',
            });
            await fetchCategories(); // Refrescar
            return response.data;
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || t('adminCommon.updateError');
            notifications.show({ title: t('common.error'), message: msg, color: 'red' });
            setLoading(false);
            return null;
        }
    };

    const deleteCategory = async (id: string): Promise<boolean> => {
        setLoading(true);
        try {
            await axiosInstance.delete(`${API_ENDPOINT}/${id}`);
            notifications.show({
                title: t('adminCommon.deleteSuccess'),
                message: t('adminCamarero.manageMenu.categoryDeleteSuccess'), // Necesitaremos esta clave i18n
                color: 'green',
            });
            await fetchCategories(); // Refrescar
            return true;
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || t('adminCommon.deleteError');
            notifications.show({ title: t('common.error'), message: msg, color: 'red' });
            setLoading(false);
            return false;
        }
    };

    return {
        categories,
        loading,
        error,
        fetchCategories,
        addCategory,
        updateCategory,
        deleteCategory,
    };
};