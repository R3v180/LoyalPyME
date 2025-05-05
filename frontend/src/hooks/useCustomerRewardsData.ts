// filename: frontend/src/hooks/useCustomerRewardsData.ts
// Version: 1.2.2 (Fix infinite loop by correcting useCallback dependencies)

import { useState, useEffect, useCallback, useMemo } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useTranslation } from 'react-i18next';

// Importar tipos actualizados
import { Reward, GrantedReward, DisplayReward } from '../types/customer';

// Interfaz de retorno (sin cambios)
export interface UseCustomerRewardsDataResult {
    displayRewards: DisplayReward[];
    loadingRewards: boolean;
    loadingGrantedRewards: boolean;
    errorRewards: string | null;
    refreshRewards: () => Promise<void>;
}

// Función Helper para combinar y mapear (sin cambios respecto a v1.2.1)
const combineAndMapRewards = ( rewards: Reward[] | null, grantedRewards: GrantedReward[] | null, t: ReturnType<typeof useTranslation>['t'] ): DisplayReward[] => { /* ... (código interno sin cambios) ... */ console.log('[useCustomerRewardsData] Combining rewards and gifts...'); const combined: DisplayReward[] = []; if (grantedRewards) { const gifts: DisplayReward[] = grantedRewards .filter(gr => gr && gr.reward) .map((gr): DisplayReward => { let assigner = t('customerDashboard.summary.unknownAssigner', 'Desconocido'); if (gr.assignedBy) { assigner = gr.assignedBy.name || gr.assignedBy.email || assigner; } return { isGift: true, grantedRewardId: gr.id, id: gr.reward.id, name_es: gr.reward.name_es, name_en: gr.reward.name_en, description_es: gr.reward.description_es, description_en: gr.reward.description_en, pointsCost: 0, imageUrl: gr.reward.imageUrl, assignedByString: assigner, assignedAt: gr.assignedAt, }; }); combined.push(...gifts); console.log(`[useCustomerRewardsData] Mapped ${gifts.length} gifts.`); } else { console.log('[useCustomerRewardsData] No granted rewards data received.'); } if (rewards) { const grantedRewardBaseIds = new Set(grantedRewards?.map(gr => gr.reward.id) ?? []); const pointsRewards: DisplayReward[] = rewards .filter(r => r && !grantedRewardBaseIds.has(r.id)) .map((r): DisplayReward => { return { isGift: false, id: r.id, name_es: r.name_es, name_en: r.name_en, description_es: r.description_es, description_en: r.description_en, pointsCost: r.pointsCost, imageUrl: r.imageUrl, }; }); combined.push(...pointsRewards); console.log(`[useCustomerRewardsData] Mapped ${pointsRewards.length} points rewards.`); } else { console.log('[useCustomerRewardsData] No points rewards data received.'); } console.log('[useCustomerRewardsData] Final combined display rewards:', combined); return combined; };


// Hook Principal
export const useCustomerRewardsData = (): UseCustomerRewardsDataResult => {
    const { t } = useTranslation(); // No necesitamos i18n aquí directamente si solo pasamos t
    const [rewards, setRewards] = useState<Reward[] | null>(null);
    const [grantedRewards, setGrantedRewards] = useState<GrantedReward[] | null>(null);
    const [loadingRewards, setLoadingRewards] = useState<boolean>(true);
    const [loadingGrantedRewards, setLoadingGrantedRewards] = useState<boolean>(true);
    const [errorRewards, setErrorRewards] = useState<string | null>(null);

    // --- useCallback ACTUALIZADO: Dependencias corregidas ---
    const fetchAllRewardsData = useCallback(async () => {
        setLoadingRewards(true); setLoadingGrantedRewards(true); setErrorRewards(null);
        console.log('[useCustomerRewardsData] Fetching rewards data...');
        try {
            const [rewardsResponse, grantedRewardsResponse] = await Promise.all([
                axiosInstance.get<Reward[]>('/customer/rewards'),
                axiosInstance.get<GrantedReward[]>('/customer/granted-rewards')
            ]);
            if (!Array.isArray(rewardsResponse.data) || !Array.isArray(grantedRewardsResponse.data)) { console.error("Invalid API response structure", {rewards: rewardsResponse.data, granted: grantedRewardsResponse.data}); throw new Error("La respuesta de la API no tiene el formato esperado."); }
            setRewards(rewardsResponse.data);
            setGrantedRewards(grantedRewardsResponse.data);
            console.log('[useCustomerRewardsData] Rewards data fetch successful.');
        } catch (err: any) { console.error('[useCustomerRewardsData] Error fetching rewards data:', err); const message = err.response?.data?.message || err.message || t('customerDashboard.errorLoadingRewards'); setErrorRewards(message); /* No mostrar notif aquí, podría ser molesto en bucle if(!rewards && !grantedRewards) { notifications.show({ title: t('common.errorLoadingData'), message, color: 'red' }); } */
        } finally { setLoadingRewards(false); setLoadingGrantedRewards(false); console.log('[useCustomerRewardsData] Fetch rewards process finished.'); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [t]); // <-- SOLO depende de 't' ahora
    // --- FIN useCallback ---

    // Carga inicial (sin cambios)
    useEffect(() => {
        fetchAllRewardsData();
    }, [fetchAllRewardsData]); // Este useEffect ahora es seguro porque fetchAllRewardsData no cambia innecesariamente

    // Combinar y mapear (sin cambios)
    const displayRewards = useMemo(() => {
        return combineAndMapRewards(rewards, grantedRewards, t);
    }, [rewards, grantedRewards, t]);

    useEffect(() => { console.log("[useCustomerRewardsData] Display rewards updated.", displayRewards); }, [displayRewards]);

    // Función de refresco (sin cambios)
    const refreshRewards = useCallback(() => { console.log("[useCustomerRewardsData] Refresh triggered."); return fetchAllRewardsData(); }, [fetchAllRewardsData]);

    return { displayRewards, loadingRewards, loadingGrantedRewards, errorRewards, refreshRewards };
};

// End of File: frontend/src/hooks/useCustomerRewardsData.ts