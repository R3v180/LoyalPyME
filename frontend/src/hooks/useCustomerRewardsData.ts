// filename: frontend/src/hooks/useCustomerRewardsData.ts
// Version: 1.0.0 (Initial creation - focused hook)

import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../services/axiosInstance';
import { AxiosError } from 'axios';

// --- Interfaces ---
// TODO: Mover estas interfaces a archivos compartidos (e.g., src/types/)

// Recompensa normal (canjeable por puntos)
export interface Reward {
    id: string;
    name: string;
    description?: string | null;
    pointsCost: number;
    isActive: boolean;
}

// Recompensa regalada (instancia específica para un usuario)
export interface GrantedReward {
    id: string; // ID de la instancia GrantedReward
    status: string; // 'GRANTED', 'REDEEMED', etc.
    assignedAt: string;
    reward: { // La recompensa base asociada
        id: string;
        name: string;
        description?: string | null;
    };
    assignedBy?: { name?: string | null; email: string; } | null;
    business?: { name: string; } | null;
}

// Tipo combinado para mostrar en la UI
export type DisplayReward =
    { isGift: false; id: string; name: string; description?: string | null; pointsCost: number; grantedRewardId?: undefined; assignedByString?: undefined; assignedAt?: undefined; } |
    { isGift: true; grantedRewardId: string; id: string; name: string; description?: string | null; pointsCost: 0; assignedByString: string; assignedAt: string; };


// --- Tipo de Retorno del Hook ---
interface UseCustomerRewardsDataReturn {
    displayRewards: DisplayReward[];        // Lista combinada para mostrar
    loadingRewards: boolean;            // Cargando recompensas normales
    loadingGrantedRewards: boolean;     // Cargando regalos
    errorRewards: string | null;        // Error de cualquiera de las cargas
    refreshRewards: () => Promise<void>; // Función para refrescar ambos tipos
}

/**
 * Hook para obtener y gestionar las recompensas normales y los regalos (granted rewards)
 * disponibles para el cliente, combinándolos para su visualización.
 */
export const useCustomerRewardsData = (): UseCustomerRewardsDataReturn => {
    // --- Estados Internos ---
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [grantedRewards, setGrantedRewards] = useState<GrantedReward[]>([]);
    const [displayRewards, setDisplayRewards] = useState<DisplayReward[]>([]);
    const [loadingRewards, setLoadingRewards] = useState<boolean>(true);
    const [loadingGrantedRewards, setLoadingGrantedRewards] = useState<boolean>(true);
    const [errorRewards, setErrorRewards] = useState<string | null>(null); // Error combinado

    // --- Función para Cargar Ambos Tipos de Recompensas ---
    const fetchRewardsData = useCallback(async () => {
        console.log('[useCustomerRewardsData] Fetching rewards data...');
        setLoadingRewards(true);
        setLoadingGrantedRewards(true);
        setErrorRewards(null); // Limpiar error previo

        try {
            // Hacemos las 2 llamadas en paralelo
            const [rewardsResponse, grantedRewardsResponse] = await Promise.all([
                axiosInstance.get<Reward[]>('/customer/rewards'),
                // Solo pedimos los regalos pendientes ('GRANTED')
                axiosInstance.get<GrantedReward[]>('/customer/granted-rewards?status=GRANTED')
            ]);

            // Procesar recompensas normales (filtrar inactivas)
            setRewards(rewardsResponse.data?.filter(r => r.isActive) ?? []);

            // Procesar regalos
            setGrantedRewards(grantedRewardsResponse.data ?? []);

            console.log('[useCustomerRewardsData] Rewards data fetch successful.');

        } catch (err) {
            console.error("[useCustomerRewardsData] Error fetching rewards data:", err);
             // Intentar obtener un mensaje de error útil
             let errorMsg = 'Error al cargar recompensas o regalos.';
             if (err instanceof AxiosError) {
                 // Si una de las llamadas falló, su error específico puede estar en err.response
                 errorMsg = err.response?.data?.message || err.message || errorMsg;
             } else if (err instanceof Error) {
                 errorMsg = err.message;
             }
             setErrorRewards(errorMsg);

             // Resetear datos en caso de error
             setRewards([]);
             setGrantedRewards([]);

        } finally {
            setLoadingRewards(false);
            setLoadingGrantedRewards(false);
            console.log('[useCustomerRewardsData] Fetch rewards process finished.');
        }
    }, []); // Sin dependencias

    // --- Efecto para Carga Inicial ---
    useEffect(() => {
        fetchRewardsData();
    }, [fetchRewardsData]);

    // --- Efecto para Combinar Recompensas y Regalos ---
    useEffect(() => {
        console.log('[useCustomerRewardsData] Combining rewards and gifts...');
        // Mapear regalos a formato DisplayReward
        const gifts: DisplayReward[] = grantedRewards
            // Podríamos filtrar aquí por status === 'GRANTED' como doble check
            // .filter(gr => gr.status === 'GRANTED')
            .map(gr => {
                const assignerName = gr.business?.name || gr.assignedBy?.name || gr.assignedBy?.email || 'Admin';
                return {
                    isGift: true,
                    grantedRewardId: gr.id,
                    id: gr.reward.id,
                    name: gr.reward.name,
                    description: gr.reward.description,
                    pointsCost: 0,
                    assignedByString: assignerName,
                    assignedAt: gr.assignedAt
                };
            });

        // Mapear recompensas normales a formato DisplayReward
        const pointsRewards: DisplayReward[] = rewards.map(r => ({
            isGift: false,
            id: r.id,
            name: r.name,
            description: r.description,
            pointsCost: r.pointsCost
        }));

        // Combinar (regalos primero) y actualizar estado
        setDisplayRewards([...gifts, ...pointsRewards]);
        console.log('[useCustomerRewardsData] Display rewards updated.');

    }, [rewards, grantedRewards]); // Depende de los datos internos

    // --- Retorno del Hook ---
    return {
        displayRewards,
        loadingRewards,
        loadingGrantedRewards,
        errorRewards,
        refreshRewards: fetchRewardsData // Exponer la función de carga como 'refresh'
    };
};