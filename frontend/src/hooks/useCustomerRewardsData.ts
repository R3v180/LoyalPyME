// filename: frontend/src/hooks/useCustomerRewardsData.ts
// Version: 1.0.1 (Fix encoding, clean comments)

import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../services/axiosInstance';
import { AxiosError } from 'axios';

// --- Interfaces ---
// TODO: Mover estas interfaces a archivos compartidos (e.g., src/types/customer.ts)

// Recompensa normal (canjeable por puntos)
export interface Reward {
    id: string;
    name: string;
    description?: string | null;
    pointsCost: number;
    isActive: boolean; // Necesario para filtrar
}

// Recompensa regalada (instancia específica para un usuario)
export interface GrantedReward {
    id: string; // ID de la instancia GrantedReward
    status: string; // 'PENDING', 'REDEEMED', etc.
    assignedAt: string;
    reward: { // La recompensa base asociada
        id: string;
        name: string;
        description?: string | null;
    };
    assignedBy?: { name?: string | null; email: string; } | null; // Quién asignó (User)
    business?: { name: string; } | null; // O el negocio (si fue por sistema?)
}

// Tipo combinado para mostrar en la UI
export type DisplayReward =
    { isGift: false; id: string; name: string; description?: string | null; pointsCost: number; grantedRewardId?: undefined; assignedByString?: undefined; assignedAt?: undefined; } |
    { isGift: true; grantedRewardId: string; id: string; name: string; description?: string | null; pointsCost: 0; assignedByString: string; assignedAt: string; };


// Tipo de Retorno del Hook
interface UseCustomerRewardsDataReturn {
    displayRewards: DisplayReward[];      // Lista combinada para mostrar
    loadingRewards: boolean;          // Cargando recompensas normales
    loadingGrantedRewards: boolean;   // Cargando regalos
    errorRewards: string | null;      // Error de cualquiera de las cargas
    refreshRewards: () => Promise<void>; // Función para refrescar ambos tipos
}

/**
 * Hook para obtener y gestionar las recompensas normales y los regalos (granted rewards)
 * disponibles para el cliente, combinándolos para su visualización.
 */
export const useCustomerRewardsData = (): UseCustomerRewardsDataReturn => {
    // Estados Internos
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [grantedRewards, setGrantedRewards] = useState<GrantedReward[]>([]);
    const [displayRewards, setDisplayRewards] = useState<DisplayReward[]>([]);
    const [loadingRewards, setLoadingRewards] = useState<boolean>(true);
    const [loadingGrantedRewards, setLoadingGrantedRewards] = useState<boolean>(true);
    const [errorRewards, setErrorRewards] = useState<string | null>(null);

    // Función para Cargar Ambos Tipos de Recompensas
    const fetchRewardsData = useCallback(async () => {
        console.log('[useCustomerRewardsData] Fetching rewards data...');
        // Resetear estados antes de la carga
        setLoadingRewards(true);
        setLoadingGrantedRewards(true);
        setErrorRewards(null);

        try {
            // Hacemos las 2 llamadas en paralelo
            const [rewardsResponse, grantedRewardsResponse] = await Promise.all([
                axiosInstance.get<Reward[]>('/customer/rewards'), // Obtiene todas las del negocio
                // Solo pedimos los regalos pendientes ('PENDING'), el backend debe filtrar por userId
                axiosInstance.get<GrantedReward[]>('/customer/granted-rewards') // Asumiendo que devuelve solo los PENDING del user autenticado
            ]);

            // Procesar recompensas normales (filtrar inactivas aquí por si acaso)
            setRewards(rewardsResponse.data?.filter(r => r.isActive) ?? []);

            // Procesar regalos
            setGrantedRewards(grantedRewardsResponse.data ?? []);

            console.log('[useCustomerRewardsData] Rewards data fetch successful.');

        } catch (err) {
            console.error("[useCustomerRewardsData] Error fetching rewards data:", err);
             // Intentar obtener un mensaje de error útil
             let errorMsg = 'Error al cargar recompensas o regalos.';
             if (err instanceof AxiosError) {
                 errorMsg = err.response?.data?.message || err.message || errorMsg;
             } else if (err instanceof Error) {
                 errorMsg = err.message;
             }
             setErrorRewards(errorMsg);
            // Resetear datos en caso de error
            setRewards([]);
            setGrantedRewards([]);

        } finally {
            // Marcar ambos como no cargando, independientemente de si uno falló
            setLoadingRewards(false);
            setLoadingGrantedRewards(false);
            console.log('[useCustomerRewardsData] Fetch rewards process finished.');
        }
    }, []); // Sin dependencias, carga al montar o al llamar a refetch

    // Efecto para Carga Inicial
    useEffect(() => {
        fetchRewardsData();
    }, [fetchRewardsData]);

    // Efecto para Combinar Recompensas y Regalos en displayRewards
    useEffect(() => {
        console.log('[useCustomerRewardsData] Combining rewards and gifts...');
        // Mapear regalos a formato DisplayReward
        const gifts: DisplayReward[] = grantedRewards
             // Asegurarse de mostrar solo los pendientes si la API devolviera otros por error
            .filter(gr => gr.status === 'PENDING')
            .map(gr => {
                // Fallback para assignedByString
                const assignerName = gr.assignedBy?.name || gr.assignedBy?.email || gr.business?.name || 'Admin';
                return {
                    isGift: true,
                    grantedRewardId: gr.id,
                    id: gr.reward.id, // ID de la recompensa base
                    name: gr.reward.name,
                    description: gr.reward.description,
                    pointsCost: 0, // Los regalos son gratis en puntos
                    assignedByString: assignerName,
                    assignedAt: gr.assignedAt
                };
            });

        // Mapear recompensas normales (ya filtradas por activas)
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

    }, [rewards, grantedRewards]); // Se ejecuta cuando rewards o grantedRewards cambian

    // Retorno del Hook
    return {
        displayRewards,
        loadingRewards, // Podríamos combinar en un solo 'loading' si quisiéramos
        loadingGrantedRewards,
        errorRewards,
        refreshRewards: fetchRewardsData // Exponer la función de carga como 'refresh'
    };
};

export default useCustomerRewardsData; // Asegurarse que el export default usa el nombre correcto

// End of File: frontend/src/hooks/useCustomerRewardsData.ts