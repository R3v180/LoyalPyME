// filename: frontend/src/hooks/useCustomerTierData.ts
// Version: 1.2.2 (Remove unused TierCalculationBasis import)

import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../../shared/services/axiosInstance';
import { AxiosError } from 'axios';
import { notifications } from '@mantine/notifications';
// import { IconAlertCircle } from '@tabler/icons-react'; // Sigue sin usarse

// --- MODIFICACIÓN: Importar solo los tipos usados directamente por el hook ---
import {
    TierData,
    CustomerBusinessConfig,
    UseCustomerTierDataResult,
} from '../../../shared/types/user.types';


// --- Hook ---

// Usar el tipo importado para el retorno
export const useCustomerTierData = (): UseCustomerTierDataResult => {
    // Usar los tipos importados para el estado
    const [allTiers, setAllTiers] = useState<TierData[] | null>(null);
    const [businessConfig, setBusinessConfig] = useState<CustomerBusinessConfig | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        console.log('[useCustomerTierData] Fetching all tiers and business config...');

        try {
            const [tiersResponse, configResponse] = await Promise.all([
                // Usar los tipos importados en las llamadas
                axiosInstance.get<TierData[]>('/customer/tiers'),
                axiosInstance.get<CustomerBusinessConfig>('/customer/business-config')
            ]);

            const activeTiers = tiersResponse.data?.filter(t => t.isActive) ?? [];
            setAllTiers(activeTiers);
            console.log('[useCustomerTierData] Active tiers fetched:', activeTiers);

            setBusinessConfig(configResponse.data ?? null);
            console.log('[useCustomerTierData] Business config fetched:', configResponse.data);

        } catch (err) {
            console.error("[useCustomerTierData] Error fetching data:", err);
            let errorMsg = 'Error al cargar datos de niveles o configuración.';
            if (err instanceof AxiosError) {
                errorMsg = err.response?.data?.message || err.message || errorMsg;
            } else if (err instanceof Error) {
                errorMsg = err.message;
            }
            setError(errorMsg);

            notifications.show({
                title: 'Error de Carga',
                message: errorMsg,
                color: 'red',
                // icon: <IconAlertCircle />, // Mantenemos sin icono
            });

            setAllTiers(null);
            setBusinessConfig(null);
        } finally {
            setLoading(false);
            console.log('[useCustomerTierData] Fetch process finished.');
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // El tipo de retorno ya coincide con UseCustomerTierDataResult importado
    return {
        allTiers,
        businessConfig,
        loading,
        error,
        refetch: fetchData
    };
};

// End of File: frontend/src/hooks/useCustomerTierData.ts