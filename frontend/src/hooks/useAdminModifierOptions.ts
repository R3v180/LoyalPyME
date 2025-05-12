// frontend/src/hooks/useAdminModifierOptions.ts
import { useState, useCallback, useEffect } from 'react';
import axiosInstance from '../services/axiosInstance';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next'; // Importar useTranslation
import { ModifierOptionData, ModifierOptionFormData } from '../types/menu.types';

const getOptionsApiEndpoint = (modifierGroupId: string) => `/camarero/admin/modifier-groups/${modifierGroupId}/options`;
const optionApiEndpoint = (modifierOptionId: string) => `/camarero/admin/modifier-options/${modifierOptionId}`;

export interface UseAdminModifierOptionsReturn {
    modifierOptions: ModifierOptionData[];
    loading: boolean;
    error: string | null;
    fetchModifierOptions: () => Promise<void>;
    addModifierOption: (data: ModifierOptionFormData) => Promise<ModifierOptionData | null>;
    updateModifierOption: (optionId: string, data: Partial<ModifierOptionFormData>) => Promise<ModifierOptionData | null>;
    deleteModifierOption: (optionId: string) => Promise<boolean>;
}

export const useAdminModifierOptions = (modifierGroupId: string | null): UseAdminModifierOptionsReturn => {
    const { t } = useTranslation(); // Inicializar hook
    const [modifierOptions, setModifierOptions] = useState<ModifierOptionData[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchModifierOptions = useCallback(async () => {
        if (!modifierGroupId) {
            setModifierOptions([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        console.log(`[useAdminModifierOptions] Fetching options for modifierGroupId: ${modifierGroupId}`);
        try {
            const response = await axiosInstance.get<ModifierOptionData[]>(getOptionsApiEndpoint(modifierGroupId));
            setModifierOptions(response.data || []);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || t('adminCamarero.modifierOptionHook.errorLoadingOptions'); // Usar clave
            setError(msg);
            notifications.show({ title: t('common.error'), message: msg, color: 'red' });
        } finally {
            setLoading(false);
        }
    }, [modifierGroupId, t]); // Añadir t como dependencia

    useEffect(() => {
        if (modifierGroupId) {
            fetchModifierOptions();
        } else {
            setModifierOptions([]);
        }
    }, [modifierGroupId, fetchModifierOptions]);

    const addModifierOption = async (data: ModifierOptionFormData): Promise<ModifierOptionData | null> => {
        if (!modifierGroupId) {
            notifications.show({
                title: t('common.error'),
                message: t('adminCamarero.modifierOptionHook.errorNoGroupForOption'), // Usar clave
                color: 'red'
            });
            return null;
        }
        setLoading(true);
        try {
            const response = await axiosInstance.post<ModifierOptionData>(getOptionsApiEndpoint(modifierGroupId), data);
            notifications.show({
                title: t('common.success'),
                message: t('adminCamarero.modifierOptionHook.createSuccess', { optionName: response.data.name_es || t('adminCamarero.modifierOptionHook.fallbackOptionName') }), // Usar clave
                color: 'green',
            });
            await fetchModifierOptions();
            return response.data;
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || t('adminCamarero.modifierOptionHook.errorCreatingOption'); // Usar clave
            notifications.show({ title: t('common.error'), message: msg, color: 'red' });
            setLoading(false);
            return null;
        } finally {
            if (loading) setLoading(false);
        }
    };

    const updateModifierOption = async (optionId: string, data: Partial<ModifierOptionFormData>): Promise<ModifierOptionData | null> => {
        setLoading(true);
        try {
            const response = await axiosInstance.put<ModifierOptionData>(optionApiEndpoint(optionId), data);
            notifications.show({
                title: t('common.success'),
                message: t('adminCamarero.modifierOptionHook.updateSuccess', { optionName: response.data.name_es || t('adminCamarero.modifierOptionHook.fallbackOptionName') }), // Usar clave
                color: 'green',
            });
            await fetchModifierOptions();
            return response.data;
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || t('adminCamarero.modifierOptionHook.errorUpdatingOption'); // Usar clave
            notifications.show({ title: t('common.error'), message: msg, color: 'red' });
            setLoading(false);
            return null;
        } finally {
            if (loading) setLoading(false);
        }
    };

    const deleteModifierOption = async (optionId: string): Promise<boolean> => {
        setLoading(true);
        try {
            await axiosInstance.delete(optionApiEndpoint(optionId));
            notifications.show({
                title: t('common.success'),
                message: t('adminCamarero.modifierOptionHook.deleteSuccess'), // Usar clave
                color: 'green',
            });
            await fetchModifierOptions();
            return true;
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || t('adminCamarero.modifierOptionHook.errorDeletingOption'); // Usar clave
            notifications.show({ title: t('common.error'), message: msg, color: 'red' });
            setLoading(false);
            return false;
        } finally {
            if (loading) setLoading(false);
        }
    };

    return {
        modifierOptions,
        loading,
        error,
        fetchModifierOptions,
        addModifierOption,
        updateModifierOption,
        deleteModifierOption,
    };
};