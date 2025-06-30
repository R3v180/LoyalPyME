// frontend/src/modules/loyalpyme/pages/CustomerDashboardPage.tsx
// Version 3.4.1 - Final cleanup, removed OffersTab import.

import { useState, useCallback, useMemo } from 'react';
import { Container, Title, Alert, Tabs, Text, Space, LoadingOverlay } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCircleCheck, IconGift, IconLayoutDashboard, IconHistory, IconUserCircle, IconReceipt } from '@tabler/icons-react';
import axiosInstance from '../../../shared/services/axiosInstance';
import { AxiosError } from 'axios';
import { useDisclosure } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';

// Hooks
import { useUserProfileData } from '../hooks/useUserProfileData';
import { useCustomerRewardsData } from '../hooks/useCustomerRewardsData';
import { useCustomerTierData } from '../hooks/useCustomerTierData';
// Componentes de Pestañas
import SummaryTab from '../components/customer/dashboard/tabs/SummaryTab';
import RewardsTab from '../components/customer/dashboard/tabs/RewardsTab';
import ActivityTab from '../components/customer/dashboard/tabs/ActivityTab';
import PurchaseHistoryTab from '../components/customer/dashboard/tabs/PurchaseHistoryTab';
import ProfileTab from '../components/customer/dashboard/tabs/ProfileTab';

// Tipos
import {
    UserData,
    TierData,
    TierCalculationBasis,
    TierBenefitData
} from '../../../shared/types/user.types';

// Tipos locales
type ProgressBarDataType = { type: 'progress'; percentage: number; currentValueLabel: string; targetValueLabel: string; unit: string; nextTierName: string; } | { type: 'max_level'; currentTierName: string; } | null;
interface TierDisplayMemoResult { progressBarData: ProgressBarDataType; nextTierName: string | null; nextTierBenefits: TierBenefitData[]; }


function CustomerDashboardPage() {
    const { t } = useTranslation();
    const { userData, loading: loadingUser, error: errorUser, refetch: refetchUser, setUserData } = useUserProfileData();
    const { displayRewards, availableCoupons, loadingRewards, loadingGrantedRewards, errorRewards, refreshRewards, loadingCoupons, errorCoupons } = useCustomerRewardsData();
    const { allTiers, businessConfig, loading: loadingTierData, error: errorTierData, refetch: refetchTierData } = useCustomerTierData();
    const [validatingQr, setValidatingQr] = useState(false);
    const [acquiringRewardId, setAcquiringRewardId] = useState<string | null>(null);
    const [scannerOpened, { open: openScanner, close: closeScanner }] = useDisclosure(false);
    const [activeTab, setActiveTab] = useState<string | null>('summary');
    
    // Handlers (sin cambios)
    const handleRefetchAll = useCallback(async () => { await Promise.all([refetchUser(), refreshRewards(), refetchTierData()]); }, [refetchUser, refreshRewards, refetchTierData]);
    const handleValidateQr = useCallback(async (token: string) => {
        setValidatingQr(true);
        try {
            const response = await axiosInstance.post<any>('/points/validate-qr', { qrToken: token });
            const apiUser = response.data.user;
            const pointsEarned = response.data.pointsEarned ?? 0;
            if (!apiUser) { throw new Error(t('customerDashboard.errorValidatingQrMessage')); }
            notifications.show({ title: t('common.success'), message: t('customerDashboard.successQrValidation', { points: pointsEarned }), color: 'green', icon: <IconCircleCheck /> });
            const currentUserData = userData;
            setUserData(prev => {
                if (!prev) return null;
                let newTierData: UserData['currentTier'] = null;
                if (apiUser.currentTierId) {
                    const keepOldBenefits = prev.currentTier?.id === apiUser.currentTierId;
                    newTierData = { id: apiUser.currentTierId, name: apiUser.currentTierName || prev.currentTier?.name || '', benefits: keepOldBenefits ? (prev.currentTier?.benefits || []) : [] };
                }
                const newPoints: number = apiUser.points ?? currentUserData?.points ?? 0;
                const newTotalSpend: number = apiUser.totalSpend ?? currentUserData?.totalSpend ?? 0;
                const newTotalVisits: number = apiUser.totalVisits ?? currentUserData?.totalVisits ?? 0;
                return { ...prev, points: newPoints, totalSpend: newTotalSpend, totalVisits: newTotalVisits, currentTier: newTierData };
            });
            await handleRefetchAll();
        } catch (err) {
            const errorMsg = (err instanceof AxiosError && err.response?.data?.message) ? err.response.data.message : (err instanceof Error ? err.message : t('customerDashboard.errorValidatingQrMessage'));
            notifications.show({ title: t('customerDashboard.errorValidatingQr'), message: errorMsg, color: 'red', icon: <IconAlertCircle /> });
        } finally {
            setValidatingQr(false);
        }
    }, [handleRefetchAll, t, setUserData, userData]);
    const handleAcquireReward = useCallback(async (rewardId: string) => {
        setAcquiringRewardId(rewardId);
        try {
            await axiosInstance.post(`/rewards/${rewardId}/redeem`);
            notifications.show({
                title: t('customerDashboard.acquireRewardSuccessTitle', '¡Recompensa Obtenida!'),
                message: t('customerDashboard.acquireRewardSuccessMessage', 'Tu nueva recompensa está disponible en "Mis Cupones".'),
                color: 'teal', icon: <IconGift />
            });
            await handleRefetchAll();
        } catch (err) {
            const errorMsg = (err instanceof AxiosError && err.response?.data?.message) ? err.response.data.message : (err instanceof Error ? err.message : t('customerDashboard.acquireRewardError', 'Error al obtener la recompensa.'));
            notifications.show({ title: t('customerDashboard.errorAcquireTitle', 'Error al Obtener'), message: errorMsg, color: 'red', icon: <IconAlertCircle /> });
        } finally {
            setAcquiringRewardId(null);
        }
    }, [handleRefetchAll, t]);
    const handleRedeemGrantedReward = useCallback(async (grantedRewardId: string, rewardName: string) => {
        setAcquiringRewardId(grantedRewardId);
        try {
            await axiosInstance.post(`/customer/granted-rewards/${grantedRewardId}/redeem`);
            notifications.show({ title: t('customerDashboard.successRedeemGiftTitle'), message: t('customerDashboard.successRedeemGiftMessage', { rewardName }), color: 'green', icon: <IconCircleCheck /> });
            await handleRefetchAll();
        } catch (err) {
            const errorMsg = (err instanceof AxiosError && err.response?.data?.message) ? err.response.data.message : (err instanceof Error ? err.message : t('customerDashboard.errorRedeemGiftMessage'));
            notifications.show({ title: t('customerDashboard.errorRedeemTitle'), message: errorMsg, color: 'red', icon: <IconAlertCircle /> });
        } finally {
            setAcquiringRewardId(null);
        }
    }, [handleRefetchAll, t]);
    const tierDisplayData = useMemo((): TierDisplayMemoResult => {
        const initialLoadingState: TierDisplayMemoResult = { progressBarData: null, nextTierName: null, nextTierBenefits: [] };
        if (loadingUser || loadingTierData || !userData || !allTiers || !businessConfig || !businessConfig.tierCalculationBasis) { return initialLoadingState; }
        const sortTiersLocal = (tiers: TierData[]): TierData[] => [...tiers].sort((a, b) => a.level - b.level);
        const currentMetricValueFunc = (): number => {
            switch (businessConfig.tierCalculationBasis) {
                case TierCalculationBasis.SPEND: return userData.totalSpend ?? 0;
                case TierCalculationBasis.VISITS: return userData.totalVisits ?? 0;
                case TierCalculationBasis.POINTS_EARNED: return userData.points ?? 0;
                default: return 0;
            }
        };
        const currentMetricValue = currentMetricValueFunc();
        const sortedTiers = sortTiersLocal(allTiers);
        const currentTierIndex = sortedTiers.findIndex(t => t.id === userData.currentTier?.id);
        const currentTier = currentTierIndex !== -1 ? sortedTiers[currentTierIndex] : null;
        const currentTierMinValue = currentTier?.minValue ?? 0;
        const nextTier = currentTierIndex !== -1 && currentTierIndex < sortedTiers.length - 1 ? sortedTiers[currentTierIndex + 1] : null;
        let progressBarResult: ProgressBarDataType = null;
        let nextTierNameResult: string | null = null;
        let nextTierBenefitsResult: TierBenefitData[] = [];
        if (!nextTier) {
            progressBarResult = { type: 'max_level' as const, currentTierName: currentTier?.name || t('customerDashboard.baseTier') };
        } else {
            nextTierNameResult = nextTier.name;
            nextTierBenefitsResult = nextTier.benefits ?? [];
            const nextTierMinValue = nextTier.minValue;
            const range = Math.max(0.01, nextTierMinValue - currentTierMinValue);
            const progressInTier = Math.max(0, currentMetricValue - currentTierMinValue);
            let percentage = (progressInTier / range) * 100;
            percentage = Math.max(0, Math.min(100, percentage));
            let unit = '';
            switch (businessConfig.tierCalculationBasis) {
                case TierCalculationBasis.SPEND: unit = '€'; break;
                case TierCalculationBasis.VISITS: unit = t('customerDashboard.progressUnitVisits'); break;
                case TierCalculationBasis.POINTS_EARNED: unit = t('common.points'); break;
            }
            const currentValueLabel = `${currentMetricValue.toLocaleString(undefined, { maximumFractionDigits: businessConfig.tierCalculationBasis === TierCalculationBasis.SPEND ? 2 : 0 })}`;
            const targetValueLabel = `${nextTierMinValue.toLocaleString(undefined, { maximumFractionDigits: businessConfig.tierCalculationBasis === TierCalculationBasis.SPEND ? 2 : 0 })}`;
            if (nextTierNameResult) {
                progressBarResult = { type: 'progress' as const, percentage: percentage, currentValueLabel: currentValueLabel, targetValueLabel: targetValueLabel, unit: unit, nextTierName: nextTierNameResult };
            } else {
                progressBarResult = { type: 'max_level' as const, currentTierName: currentTier?.name || t('customerDashboard.baseTier') };
            }
        }
        return { progressBarData: progressBarResult, nextTierName: nextTierNameResult, nextTierBenefits: nextTierBenefitsResult };
    }, [userData, allTiers, businessConfig, loadingUser, loadingTierData, t]);
    const currentTierBenefits = useMemo(() => { return userData?.currentTier?.benefits ?? []; }, [userData?.currentTier]);
    const isLoading = loadingUser || loadingTierData || loadingRewards || loadingGrantedRewards || loadingCoupons;
    const mainError = errorUser || errorTierData || errorRewards || errorCoupons;

    if (mainError && !isLoading) {
        return ( <Container size="lg" py="xl"><Alert icon={<IconAlertCircle size="1rem" />} title={t('common.errorLoadingData')} color="red" radius="md">{mainError}</Alert></Container> );
    }

    return (
        <Container size="lg" py="xl">
            <LoadingOverlay visible={loadingUser && !userData} overlayProps={{ radius: 'sm', blur: 2 }} />
            {userData && (
                <>
                    <Title order={2} ta="center" mb="xl">{t('customerDashboard.title')}</Title>
                    <Tabs value={activeTab} onChange={setActiveTab} keepMounted={false}>
                        <Tabs.List grow>
                            <Tabs.Tab value="summary" leftSection={<IconLayoutDashboard size={16} />}>{t('customerDashboard.tabSummary', 'Resumen')}</Tabs.Tab>
                            <Tabs.Tab value="rewards" leftSection={<IconGift size={16} />}>{t('customerDashboard.tabRewards', 'Recompensas')}</Tabs.Tab>
                            <Tabs.Tab value="history" leftSection={<IconReceipt size={16} />}>{t('customerDashboard.tabHistory', 'Mis Pedidos')}</Tabs.Tab>
                            <Tabs.Tab value="activity" leftSection={<IconHistory size={16} />}>{t('customerDashboard.tabActivity', 'Actividad de Puntos')}</Tabs.Tab>
                            <Tabs.Tab value="profile" leftSection={<IconUserCircle size={16} />}>{t('customerDashboard.tabProfile', 'Mi Perfil')}</Tabs.Tab>
                        </Tabs.List>
                        <Space h="xl" />
                        <Tabs.Panel value="summary">
                            <SummaryTab
                                userData={userData}
                                loadingUser={loadingUser}
                                errorUser={errorUser}
                                progressBarData={tierDisplayData.progressBarData}
                                currentTierBenefits={currentTierBenefits}
                                nextTierName={tierDisplayData.nextTierName}
                                nextTierBenefits={tierDisplayData.nextTierBenefits}
                                displayRewards={displayRewards}
                                setActiveTab={setActiveTab}
                                handleValidateQr={handleValidateQr}
                                validatingQr={validatingQr}
                                scannerOpened={scannerOpened}
                                onOpenScanner={openScanner}
                                onCloseScanner={closeScanner}
                                userPoints={userData.points}
                                redeemingRewardId={acquiringRewardId}
                                onRedeemGift={handleRedeemGrantedReward}
                                onRedeemPoints={handleAcquireReward}
                            />
                        </Tabs.Panel>
                        <Tabs.Panel value="rewards">
                             <RewardsTab
                                 displayRewards={displayRewards}
                                 userPoints={userData.points}
                                 acquiringRewardId={acquiringRewardId}
                                 loadingRewards={loadingRewards}
                                 loadingGrantedRewards={loadingGrantedRewards}
                                 errorRewards={errorRewards}
                                 onAcquireReward={handleAcquireReward}
                                 onRedeemGift={handleRedeemGrantedReward}
                                 availableCoupons={availableCoupons}
                                 loadingCoupons={loadingCoupons}
                                 errorCoupons={errorCoupons}
                             />
                         </Tabs.Panel>
                         <Tabs.Panel value="history">
                            <PurchaseHistoryTab />
                         </Tabs.Panel>
                         <Tabs.Panel value="activity">
                            <ActivityTab />
                         </Tabs.Panel>
                         <Tabs.Panel value="profile">
                            <ProfileTab />
                         </Tabs.Panel>
                    </Tabs>
                </>
            )}
            {!userData && !loadingUser && !mainError && ( <Text ta="center" c="dimmed" mt="xl">{t('customerDashboard.noUserDataError', 'No se pudieron cargar los datos del usuario.')}</Text> )}
        </Container>
    );
}

export default CustomerDashboardPage;