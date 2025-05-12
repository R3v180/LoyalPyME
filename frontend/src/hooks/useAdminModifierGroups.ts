// frontend/src/hooks/useAdminModifierGroups.ts
import { useState, useCallback, useEffect } from 'react';
import axiosInstance from '../services/axiosInstance';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { ModifierGroupData, ModifierGroupFormData } from '../types/menu.types';

// Endpoints base para los grupos de modificadores.
// Nota: El endpoint para GET y POST está anidado bajo el ítem de menú.
// Los endpoints para PUT y DELETE de un grupo específico usarán el ID del grupo.

const getGroupsApiEndpoint = (menuItemId: string) => `/camarero/admin/menu/items/${menuItemId}/modifier-groups`;
const groupApiEndpoint = (modifierGroupId: string) => `/camarero/admin/modifier-groups/${modifierGroupId}`;

export interface UseAdminModifierGroupsReturn {
    modifierGroups: ModifierGroupData[];
    loading: boolean;
    error: string | null;
    fetchModifierGroups: () => Promise<void>; // Se llamará cuando cambie menuItemId
    addModifierGroup: (data: ModifierGroupFormData) => Promise<ModifierGroupData | null>;
    updateModifierGroup: (groupId: string, data: Partial<ModifierGroupFormData>) => Promise<ModifierGroupData | null>;
    deleteModifierGroup: (groupId: string) => Promise<boolean>;
}

export const useAdminModifierGroups = (menuItemId: string | null): UseAdminModifierGroupsReturn => {
    const { t } = useTranslation();
    const [modifierGroups, setModifierGroups] = useState<ModifierGroupData[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchModifierGroups = useCallback(async () => {
        if (!menuItemId) {
            setModifierGroups([]); // Limpiar si no hay menuItemId
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        console.log(`[useAdminModifierGroups] Fetching groups for menuItemId: ${menuItemId}`);
        try {
            const response = await axiosInstance.get<ModifierGroupData[]>(getGroupsApiEndpoint(menuItemId));
            // El backend ya debería devolverlos ordenados por 'position' (o podríamos ordenar aquí)
            setModifierGroups(response.data || []);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || t('common.errorLoadingData');
            setError(msg);
            notifications.show({ title: t('common.error'), message: msg, color: 'red' });
        } finally {
            setLoading(false);
        }
    }, [menuItemId, t]);

    useEffect(() => {
        fetchModifierGroups();
    }, [fetchModifierGroups]); // Se ejecutará cuando menuItemId cambie (y al montar si menuItemId está presente)

    const addModifierGroup = async (data: ModifierGroupFormData): Promise<ModifierGroupData | null> => {
        if (!menuItemId) {
            notifications.show({ title: t('common.error'), message: 'Error: No se puede añadir un grupo sin un ítem de menú asociado.', color: 'red' });
            return null;
        }
        setLoading(true); // O un estado 'submitting'
        try {
            const response = await axiosInstance.post<ModifierGroupData>(getGroupsApiEndpoint(menuItemId), data);
            notifications.show({
                title: t('adminCommon.createSuccess'),
                // TODO: Añadir clave i18n específica para grupo de modificadores
                message: t('adminCamarero.manageMenu.modifierGroupCreateSuccess', { name: response.data.name_es }),
                color: 'green',
            });
            await fetchModifierGroups(); // Refrescar la lista
            return response.data;
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || t('adminCommon.createError');
            notifications.show({ title: t('common.error'), message: msg, color: 'red' });
            setLoading(false);
            return null;
        } finally {
            // Asegurarse de que loading (o submitting) se desactive
            setLoading(false);
        }
    };

    const updateModifierGroup = async (groupId: string, data: Partial<ModifierGroupFormData>): Promise<ModifierGroupData | null> => {
        setLoading(true);
        try {
            const response = await axiosInstance.put<ModifierGroupData>(groupApiEndpoint(groupId), data);
            notifications.show({
                title: t('adminCommon.updateSuccess'),
                // TODO: Añadir clave i18n específica
                message: t('adminCamarero.manageMenu.modifierGroupUpdateSuccess', { name: response.data.name_es }),
                color: 'green',
            });
            await fetchModifierGroups();
            return response.data;
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || t('adminCommon.updateError');
            notifications.show({ title: t('common.error'), message: msg, color: 'red' });
            setLoading(false);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const deleteModifierGroup = async (groupId: string): Promise<boolean> => {
        setLoading(true);
        try {
            await axiosInstance.delete(groupApiEndpoint(groupId));
            notifications.show({
                title: t('adminCommon.deleteSuccess'),
                // TODO: Añadir clave i18n específica
                message: t('adminCamarero.manageMenu.modifierGroupDeleteSuccess'),
                color: 'green',
            });
            await fetchModifierGroups();
            return true;
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || t('adminCommon.deleteError');
            notifications.show({ title: t('common.error'), message: msg, color: 'red' });
            setLoading(false);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        modifierGroups,
        loading,
        error,
        fetchModifierGroups,
        addModifierGroup,
        updateModifierGroup,
        deleteModifierGroup,
    };
};