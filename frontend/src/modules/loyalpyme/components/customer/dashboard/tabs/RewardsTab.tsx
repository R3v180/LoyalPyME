// frontend/src/modules/loyalpyme/components/customer/dashboard/tabs/RewardsTab.tsx
// Version 2.0.0 - Implements the new "Acquire Reward" flow and separates available coupons.

import React from 'react';
import { Box, Title, Stack, Divider } from '@mantine/core';
import { useTranslation } from 'react-i18next';

// --- NUEVOS COMPONENTES HIJOS ---
import RewardList from '../../RewardList';
import AvailableCouponsList from '../../AvailableCouponsList'; // Componente para mostrar cupones

// --- IMPORTACIÓN CORREGIDA ---
// La ruta ahora apunta al archivo de tipos compartidos correcto.
import { DisplayReward, GrantedReward } from '../../../../../../shared/types/user.types';


// --- PROPS ACTUALIZADAS ---
interface RewardsTabProps {
    // Para el catálogo de recompensas
    displayRewards: DisplayReward[];
    userPoints: number | undefined;
    acquiringRewardId: string | null; // Cambiado de redeemingRewardId
    loadingRewards: boolean;
    errorRewards: string | null;
    onAcquireReward: (rewardId: string) => Promise<void>; // Cambiado de onRedeemPoints

    // Para la nueva sección de cupones
    availableCoupons: GrantedReward[]; // Los cupones que el usuario ya tiene
    loadingCoupons: boolean;
    errorCoupons: string | null;

    // Para los regalos (se mantiene igual por ahora)
    loadingGrantedRewards: boolean;
    onRedeemGift: (grantedRewardId: string, rewardName: string) => Promise<void>;
}

const RewardsTab: React.FC<RewardsTabProps> = ({
    displayRewards,
    userPoints,
    acquiringRewardId,
    loadingRewards,
    errorRewards,
    onAcquireReward,
    availableCoupons,
    loadingCoupons,
    errorCoupons,
    loadingGrantedRewards,
    onRedeemGift
}) => {
    const { t } = useTranslation();

    // Filtramos para separar los regalos de las recompensas normales
    const gifts = displayRewards.filter(r => r.isGift);
    const pointRewards = displayRewards.filter(r => !r.isGift);

    return (
        <Box>
            {/* Sección para los cupones que el usuario ya ha adquirido */}
            <Stack mt="md">
                <Title order={4}>
                    {t('customerDashboard.availableCouponsTitle', 'Mis Cupones Disponibles')}
                </Title>
                <AvailableCouponsList
                    coupons={availableCoupons}
                    loading={loadingCoupons}
                    error={errorCoupons}
                />
            </Stack>
            
            <Divider my="xl" label="Catálogo de Recompensas" labelPosition="center" />

            {/* Catálogo para adquirir nuevas recompensas con puntos */}
            <Stack>
                <Title order={4}>
                    {t('customerDashboard.rewardsCatalogTitle', 'Catálogo para Canjear con Puntos')}
                </Title>
                <RewardList
                    rewards={pointRewards}
                    userPoints={userPoints}
                    redeemingRewardId={acquiringRewardId}
                    loadingRewards={loadingRewards}
                    loadingGrantedRewards={false} // Ya no se maneja aquí
                    errorRewards={errorRewards}
                    onRedeemPoints={onAcquireReward} // Pasamos la nueva función
                    onRedeemGift={() => Promise.resolve()} // Los regalos se manejarán por separado
                    isAcquireFlow={true} // Nuevo prop para cambiar el texto del botón
                />
            </Stack>

            {/* Mantenemos una sección separada para los regalos del admin */}
            {gifts.length > 0 && (
                 <Stack mt="xl">
                    <Title order={4}>
                        {t('customerDashboard.giftsSectionTitle', 'Regalos Recibidos')}
                    </Title>
                    <RewardList
                        rewards={gifts}
                        userPoints={userPoints}
                        redeemingRewardId={acquiringRewardId}
                        loadingRewards={false}
                        loadingGrantedRewards={loadingGrantedRewards}
                        errorRewards={null}
                        onRedeemPoints={() => Promise.resolve()}
                        onRedeemGift={onRedeemGift}
                    />
                </Stack>
            )}
        </Box>
    );
};

export default RewardsTab;