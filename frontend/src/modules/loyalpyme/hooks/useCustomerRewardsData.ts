// frontend/src/modules/loyalpyme/hooks/useCustomerRewardsData.ts
// VERSIÓN 4.0.0 - Simplificado. Ahora devuelve listas separadas en lugar de un array unificado.

import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../../shared/services/axiosInstance';
import { useTranslation } from 'react-i18next';

import { Reward, GrantedReward } from '../../../shared/types/user.types';

export interface UseCustomerRewardsDataResult {
    redeemableRewards: Reward[];          // Recompensas del catálogo para canjear con puntos
    availableCoupons: GrantedReward[];    // Cupones ya adquiridos y listos para usar
    pendingGifts: GrantedReward[];        // Regalos asignados por el admin, pendientes de canje
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export const useCustomerRewardsData = (): UseCustomerRewardsDataResult => {
    const { t } = useTranslation();

    const [rewardsCatalog, setRewardsCatalog] = useState<Reward[]>([]);
    const [allGrantedRewards, setAllGrantedRewards] = useState<GrantedReward[]>([]);
    
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        setError(null);
        console.log('[useCustomerRewardsData] Fetching all rewards data...');
        
        try {
            // Se mantienen las mismas dos llamadas a la API
            const [rewardsResponse, grantedRewardsResponse] = await Promise.all([
                axiosInstance.get<Reward[]>('/customer/rewards'),
                axiosInstance.get<GrantedReward[]>('/customer/granted-rewards') 
            ]);

            // Guardamos los datos en sus respectivos estados
            setRewardsCatalog(rewardsResponse.data || []);
            setAllGrantedRewards(grantedRewardsResponse.data || []);
            
            console.log(`[useCustomerRewardsData] Fetched ${rewardsResponse.data?.length ?? 0} catalog rewards and ${grantedRewardsResponse.data?.length ?? 0} granted rewards.`);

        } catch (err: any) {
            const message = err.response?.data?.message || err.message || t('customerDashboard.errorLoadingRewards');
            setError(message);
            console.error('[useCustomerRewardsData] Error fetching rewards data:', err);
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);
    
    // El hook ahora devuelve las listas filtradas y separadas
    return {
        redeemableRewards: rewardsCatalog,
        availableCoupons: allGrantedRewards.filter(gr => gr.status === 'AVAILABLE'),
        pendingGifts: allGrantedRewards.filter(gr => gr.status === 'PENDING'),
        loading,
        error,
        refresh: fetchAllData,
    };
};