// frontend/src/hooks/useAdminModifierOptions.ts
import { useState, useCallback, useEffect } from 'react';
import axiosInstance from '../services/axiosInstance';
import { notifications } from '@mantine/notifications';
// Asegúrate de que no necesitas useTranslation directamente aquí si las notificaciones son genéricas
// o si los mensajes específicos se construyen en el componente que usa el hook.
// import { useTranslation } from 'react-i18next'; 
import { ModifierOptionData, ModifierOptionFormData } from '../types/menu.types';

// Endpoints para Opciones de Modificadores
// GET y POST están anidados bajo el grupo de modificadores
const getOptionsApiEndpoint = (modifierGroupId: string) => `/camarero/admin/modifier-groups/${modifierGroupId}/options`;
// PUT y DELETE usan el ID de la opción directamente
const optionApiEndpoint = (modifierOptionId: string) => `/camarero/admin/modifier-options/${modifierOptionId}`;

export interface UseAdminModifierOptionsReturn {
    modifierOptions: ModifierOptionData[];
    loading: boolean;
    error: string | null;
    fetchModifierOptions: () => Promise<void>; // Se llamará cuando cambie modifierGroupId
    addModifierOption: (data: ModifierOptionFormData) => Promise<ModifierOptionData | null>;
    updateModifierOption: (optionId: string, data: Partial<ModifierOptionFormData>) => Promise<ModifierOptionData | null>;
    deleteModifierOption: (optionId: string) => Promise<boolean>;
}

export const useAdminModifierOptions = (modifierGroupId: string | null): UseAdminModifierOptionsReturn => {
    // const { t } = useTranslation(); // Descomentar si se usan claves i18n aquí
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
            const msg = err.response?.data?.message || err.message || "Error cargando opciones de modificador."; // Mensaje genérico
            setError(msg);
            notifications.show({ title: "Error", message: msg, color: 'red' });
        } finally {
            setLoading(false);
        }
    }, [modifierGroupId]);

    useEffect(() => {
        if (modifierGroupId) { // Solo hacer fetch si hay un ID de grupo
            fetchModifierOptions();
        } else {
            setModifierOptions([]); // Limpiar si no hay ID de grupo
        }
    }, [modifierGroupId, fetchModifierOptions]);

    const addModifierOption = async (data: ModifierOptionFormData): Promise<ModifierOptionData | null> => {
        if (!modifierGroupId) {
            notifications.show({ title: "Error", message: 'No se puede añadir una opción sin un grupo de modificadores asociado.', color: 'red' });
            return null;
        }
        setLoading(true);
        try {
            const response = await axiosInstance.post<ModifierOptionData>(getOptionsApiEndpoint(modifierGroupId), data);
            notifications.show({
                title: "Éxito",
                message: `Opción "${response.data.name_es}" creada correctamente.`, // Mensaje genérico
                color: 'green',
            });
            await fetchModifierOptions();
            return response.data;
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || "Error al crear la opción.";
            notifications.show({ title: "Error", message: msg, color: 'red' });
            setLoading(false);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const updateModifierOption = async (optionId: string, data: Partial<ModifierOptionFormData>): Promise<ModifierOptionData | null> => {
        setLoading(true);
        try {
            const response = await axiosInstance.put<ModifierOptionData>(optionApiEndpoint(optionId), data);
            notifications.show({
                title: "Éxito",
                message: `Opción "${response.data.name_es}" actualizada correctamente.`,
                color: 'green',
            });
            await fetchModifierOptions();
            return response.data;
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || "Error al actualizar la opción.";
            notifications.show({ title: "Error", message: msg, color: 'red' });
            setLoading(false);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const deleteModifierOption = async (optionId: string): Promise<boolean> => {
        setLoading(true);
        try {
            await axiosInstance.delete(optionApiEndpoint(optionId));
            notifications.show({
                title: "Éxito",
                message: "Opción de modificador eliminada correctamente.",
                color: 'green',
            });
            await fetchModifierOptions();
            return true;
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || "Error al eliminar la opción.";
            notifications.show({ title: "Error", message: msg, color: 'red' });
            setLoading(false);
            return false;
        } finally {
            setLoading(false);
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