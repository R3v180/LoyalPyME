// frontend/src/modules/loyalpyme/components/customer/dashboard/tabs/RewardsTab.tsx
// VERSIÓN 3.0.1 - Corregido el mapeo de `pendingGifts` para incluir todas las propiedades de DisplayReward.

import React from 'react';
import { Box, Title, Stack, Divider } from '@mantine/core';
import { useTranslation } from 'react-i18next';

// Componentes hijos que renderizan las listas
import RewardList from '../../RewardList';
import AvailableCouponsList from '../../AvailableCouponsList'; 

// Tipos necesarios
import { Reward, GrantedReward, DisplayReward } from '../../../../../../shared/types/user.types';

// --- PROPS REFACTORIZADAS ---
interface RewardsTabProps {
    // Para el catálogo de recompensas
    redeemableRewards: Reward[]; // Lista de recompensas del catálogo
    userPoints: number | undefined;
    acquiringRewardId: string | null;
    loadingRewards: boolean;
    errorRewards: string | null;
    onAcquireReward: (rewardId: string) => Promise<void>;

    // Para la sección de cupones
    availableCoupons: GrantedReward[];
    loadingCoupons: boolean;
    errorCoupons: string | null;
    
    // Para la sección de regalos
    pendingGifts: GrantedReward[];
    loadingGifts: boolean;
    onRedeemGift: (grantedRewardId: string, rewardName: string) => Promise<void>;
}

const RewardsTab: React.FC<RewardsTabProps> = ({
    redeemableRewards,
    userPoints,
    acquiringRewardId,
    loadingRewards,
    errorRewards,
    onAcquireReward,
    availableCoupons,
    loadingCoupons,
    errorCoupons,
    pendingGifts,
    loadingGifts,
    onRedeemGift
}) => {
    const { t } = useTranslation();

    // Transformamos los regalos pendientes a DisplayReward para que RewardList los pueda renderizar
    const giftDisplayItems: DisplayReward[] = pendingGifts.map(gr => ({
        isGift: true,
        id: gr.reward.id,
        grantedRewardId: gr.id,
        name_es: gr.reward.name_es,
        name_en: gr.reward.name_en,
        description_es: gr.reward.description_es,
        description_en: gr.reward.description_en,
        pointsCost: 0,
        imageUrl: gr.reward.imageUrl,
        assignedAt: gr.assignedAt,
        assignedByString: gr.assignedBy?.name || gr.assignedBy?.email || t('customerDashboard.summary.unknownAssigner'),
        
        // --- CORRECCIÓN: AÑADIR LAS PROPIEDADES QUE FALTABAN ---
        type: gr.reward.type,
        linkedMenuItemId: gr.reward.linkedMenuItemId,
        discountType: gr.reward.discountType,
        discountValue: Number(gr.reward.discountValue) || null, // Convertir a número por seguridad
        // --- FIN DE LA CORRECCIÓN ---
    }));
    
    // Transformamos las recompensas del catálogo a DisplayReward para RewardList
    const catalogDisplayItems: DisplayReward[] = redeemableRewards.map(r => ({
        isGift: false,
        id: r.id,
        name_es: r.name_es, name_en: r.name_en,
        description_es: r.description_es, description_en: r.description_en,
        pointsCost: r.pointsCost, imageUrl: r.imageUrl,
        type: r.type, linkedMenuItemId: r.linkedMenuItemId,
        discountType: r.discountType, discountValue: Number(r.discountValue) || null, // Convertir a número por seguridad
    }));

    return (
        <Stack gap="xl">
            {/* Sección para los cupones que el usuario ya ha adquirido */}
            <Box>
                <Title order={4}>
                    {t('customerDashboard.availableCouponsTitle')}
                </Title>
                <AvailableCouponsList
                    coupons={availableCoupons}
                    loading={loadingCoupons}
                    error={errorCoupons}
                />
            </Box>
            
            <Divider my="xl" label={t('customerDashboard.rewardsCatalogTitle')} labelPosition="center" />

            {/* Catálogo para adquirir nuevas recompensas con puntos */}
            <Box>
                <RewardList
                    rewards={catalogDisplayItems}
                    userPoints={userPoints}
                    redeemingRewardId={acquiringRewardId}
                    loadingRewards={loadingRewards}
                    errorRewards={errorRewards}
                    onRedeemPoints={onAcquireReward}
                    onRedeemGift={() => Promise.resolve()} // Esta acción no se usa aquí
                    isAcquireFlow={true}
                />
            </Box>

            {/* Sección separada para los regalos pendientes */}
            {giftDisplayItems.length > 0 && (
                 <Stack>
                    <Title order={4}>
                        {t('customerDashboard.giftsSectionTitle')}
                    </Title>
                    <RewardList
                        rewards={giftDisplayItems}
                        userPoints={userPoints}
                        redeemingRewardId={acquiringRewardId}
                        loadingRewards={loadingGifts}
                        errorRewards={null}
                        onRedeemPoints={() => Promise.resolve()}
                        onRedeemGift={onRedeemGift}
                    />
                </Stack>
            )}
        </Stack>
    );
};

export default RewardsTab;