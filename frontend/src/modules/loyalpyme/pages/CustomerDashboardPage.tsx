// frontend/src/modules/loyalpyme/pages/CustomerDashboardPage.tsx
// VERSIÓN 7.0.0 - Reestructurado para eliminar la pestaña de recompensas.

import { useState, useCallback, useMemo } from 'react';
import { Container, Title, Alert, Tabs, Space, LoadingOverlay, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCircleCheck, IconLayoutDashboard, IconHistory, IconUserCircle, IconReceipt } from '@tabler/icons-react';
import axiosInstance from '../../../shared/services/axiosInstance';
import { AxiosError } from 'axios';
import { useDisclosure } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';

// Hooks
import { useUserProfileData } from '../hooks/useUserProfileData';
import { useCustomerRewardsData } from '../hooks/useCustomerRewardsData';
import { useCustomerTierData } from '../hooks/useCustomerTierData';

// Componentes
import SummaryTab from '../components/customer/dashboard/tabs/SummaryTab';
import ActivityTab from '../components/customer/dashboard/tabs/ActivityTab';
import PurchaseHistoryTab from '../components/customer/dashboard/tabs/PurchaseHistoryTab';
import ProfileTab from '../components/customer/dashboard/tabs/ProfileTab';

// Tipos
import { TierBenefitData, TierCalculationBasis } from '../../../shared/types/user.types';

type ProgressBarDataType = { type: 'progress'; percentage: number; currentValueLabel: string; targetValueLabel: string; unit: string; nextTierName: string; } | { type: 'max_level'; currentTierName: string; } | null;
interface TierDisplayMemoResult { progressBarData: ProgressBarDataType; nextTierName: string | null; nextTierBenefits: TierBenefitData[]; }

function CustomerDashboardPage() {
    const { t } = useTranslation();
    const { userData, loading: loadingUser, error: errorUser, refetch: refetchUser } = useUserProfileData();
    
    const { 
        redeemableRewards, availableCoupons, pendingGifts, 
        loading: loadingRewardsData, error: errorRewardsData, 
        refresh: refreshRewardsData 
    } = useCustomerRewardsData();
    
    const { allTiers, businessConfig, loading: loadingTierData, error: errorTierData, refetch: refetchTierData } = useCustomerTierData();
    
    const [validatingQr, setValidatingQr] = useState(false);
    const [scannerOpened, { open: openScanner, close: closeScanner }] = useDisclosure(false);
    const [activeTab, setActiveTab] = useState<string | null>('summary');
    const [redeemingItemId, setRedeemingItemId] = useState<string | null>(null);
    
    const handleRefetchAll = useCallback(async () => {
        await Promise.all([refetchUser(), refreshRewardsData(), refetchTierData()]);
    }, [refetchUser, refreshRewardsData, refetchTierData]);

    const handleValidateQr = useCallback(async (token: string) => {
        setValidatingQr(true);
        try {
            const response = await axiosInstance.post<any>('/points/validate-qr', { qrToken: token });
            if (!response.data.user) { throw new Error(t('customerDashboard.errorValidatingQrMessage')); }
            notifications.show({ title: t('common.success'), message: t('customerDashboard.successQrValidation', { points: response.data.pointsEarned ?? 0 }), color: 'green', icon: <IconCircleCheck /> });
            await handleRefetchAll();
        } catch (err: unknown) {
            const errorMsg = (err instanceof AxiosError && err.response?.data?.message) ? err.response.data.message : (err instanceof Error ? err.message : t('customerDashboard.errorValidatingQrMessage'));
            notifications.show({ title: t('customerDashboard.errorValidatingQr'), message: errorMsg, color: 'red', icon: <IconAlertCircle /> });
        } finally {
            setValidatingQr(false);
        }
    }, [handleRefetchAll, t]);

    const handleRedeemPoints = useCallback(async (rewardId: string) => {
        setRedeemingItemId(rewardId);
        try {
            await axiosInstance.post(`/points/redeem-reward/${rewardId}`);
            notifications.show({ title: t('customerDashboard.acquireRewardSuccessTitle'), message: t('customerDashboard.acquireRewardSuccessMessage'), color: 'green', icon: <IconCircleCheck /> });
            await handleRefetchAll();
        } catch (err) {
            const errorMsg = (err instanceof AxiosError && err.response?.data?.message) ? err.response.data.message : (err instanceof Error ? err.message : t('customerDashboard.acquireRewardError'));
            notifications.show({ title: t('customerDashboard.errorAcquireTitle'), message: errorMsg, color: 'red', icon: <IconAlertCircle /> });
        } finally {
            setRedeemingItemId(null);
        }
    }, [handleRefetchAll, t]);

    const handleRedeemGift = useCallback(async (grantedRewardId: string, rewardName: string) => {
        setRedeemingItemId(grantedRewardId);
        try {
            await axiosInstance.post(`/customer/granted-rewards/${grantedRewardId}/redeem`);
            notifications.show({ title: t('customerDashboard.successRedeemGiftTitle'), message: t('customerDashboard.successRedeemGiftMessage', { rewardName }), color: 'green', icon: <IconCircleCheck /> });
            await handleRefetchAll();
        } catch (err) {
            const errorMsg = (err instanceof AxiosError && err.response?.data?.message) ? err.response.data.message : (err instanceof Error ? err.message : t('customerDashboard.errorRedeemGiftMessage'));
            notifications.show({ title: t('customerDashboard.errorRedeemTitle'), message: errorMsg, color: 'red', icon: <IconAlertCircle /> });
        } finally {
            setRedeemingItemId(null);
        }
    }, [handleRefetchAll, t]);

    const tierDisplayData = useMemo((): TierDisplayMemoResult => {
        if (loadingUser || loadingTierData || !userData || !allTiers || !businessConfig || !businessConfig.tierCalculationBasis) { return { progressBarData: null, nextTierName: null, nextTierBenefits: [] }; }
        const sortedTiers = [...allTiers].sort((a, b) => a.level - b.level);
        const currentTierIndex = sortedTiers.findIndex(t => t.id === userData.currentTier?.id);
        const currentTier = currentTierIndex !== -1 ? sortedTiers[currentTierIndex] : null;
        const nextTier = currentTierIndex !== -1 && currentTierIndex < sortedTiers.length - 1 ? sortedTiers[currentTierIndex + 1] : null;
        if (!nextTier) { return { progressBarData: { type: 'max_level', currentTierName: currentTier?.name || t('customerDashboard.baseTier') }, nextTierName: null, nextTierBenefits: [] }; }
        let unit = ''; let currentMetricValue = 0;
        switch (businessConfig.tierCalculationBasis) {
            case TierCalculationBasis.SPEND: unit = '€'; currentMetricValue = userData.totalSpend ?? 0; break;
            case TierCalculationBasis.VISITS: unit = t('customerDashboard.progressUnitVisits'); currentMetricValue = userData.totalVisits ?? 0; break;
            case TierCalculationBasis.POINTS_EARNED: unit = t('common.points'); currentMetricValue = userData.points ?? 0; break;
        }
        const currentTierMinValue = currentTier?.minValue ?? 0;
        const range = Math.max(0.01, nextTier.minValue - currentTierMinValue);
        const progressInTier = Math.max(0, currentMetricValue - currentTierMinValue);
        const percentage = Math.max(0, Math.min(100, (progressInTier / range) * 100));
        const formatOptions = { maximumFractionDigits: unit === '€' ? 2 : 0 };
        const currentValueLabel = currentMetricValue.toLocaleString(undefined, formatOptions);
        const targetValueLabel = nextTier.minValue.toLocaleString(undefined, formatOptions);
        return { progressBarData: { type: 'progress', percentage, currentValueLabel, targetValueLabel, unit, nextTierName: nextTier.name }, nextTierName: nextTier.name, nextTierBenefits: nextTier.benefits ?? [] };
    }, [userData, allTiers, businessConfig, loadingUser, loadingTierData, t]);

    const currentTierBenefits = useMemo(() => userData?.currentTier?.benefits ?? [], [userData?.currentTier]);
    const isLoading = loadingUser || loadingTierData || loadingRewardsData;
    const mainError = errorUser || errorTierData || errorRewardsData;

    if (mainError && !isLoading) { return ( <Container size="lg" py="xl"><Alert icon={<IconAlertCircle size="1rem" />} title={t('common.errorLoadingData')} color="red" radius="md">{mainError}</Alert></Container> ); }

    return (
        <Container size="lg" py="xl">
            <LoadingOverlay visible={isLoading && !userData} overlayProps={{ radius: 'sm', blur: 2 }} />
            {userData && (
                <>
                    <Title order={2} ta="center" mb="xl">{t('customerDashboard.title')}</Title>
                    <Tabs value={activeTab} onChange={setActiveTab} keepMounted={false}>
                        <Tabs.List grow>
                            <Tabs.Tab value="summary" leftSection={<IconLayoutDashboard size={16} />}>{t('customerDashboard.tabSummary')}</Tabs.Tab>
                            <Tabs.Tab value="history" leftSection={<IconReceipt size={16} />}>{t('customerDashboard.tabHistory')}</Tabs.Tab>
                            <Tabs.Tab value="activity" leftSection={<IconHistory size={16} />}>{t('customerDashboard.tabActivity')}</Tabs.Tab>
                            <Tabs.Tab value="profile" leftSection={<IconUserCircle size={16} />}>{t('customerDashboard.tabProfile')}</Tabs.Tab>
                        </Tabs.List>
                        <Space h="xl" />
                        <Tabs.Panel value="summary">
                            <SummaryTab
                                userData={userData} loadingUser={loadingUser} errorUser={errorUser}
                                progressBarData={tierDisplayData.progressBarData} currentTierBenefits={currentTierBenefits}
                                nextTierName={tierDisplayData.nextTierName} nextTierBenefits={tierDisplayData.nextTierBenefits}
                                redeemableRewards={redeemableRewards}
                                userPoints={userData.points}
                                loadingRewards={loadingRewardsData}
                                errorRewards={errorRewardsData}
                                pendingGifts={pendingGifts}
                                availableCoupons={availableCoupons}
                                redeemingRewardId={redeemingItemId}
                                onRedeemPoints={handleRedeemPoints}
                                onRedeemGift={handleRedeemGift}
                                handleValidateQr={handleValidateQr} validatingQr={validatingQr}
                                scannerOpened={scannerOpened} onOpenScanner={openScanner} onCloseScanner={closeScanner}
                            />
                        </Tabs.Panel>
                         <Tabs.Panel value="history"><PurchaseHistoryTab /></Tabs.Panel>
                         <Tabs.Panel value="activity"><ActivityTab /></Tabs.Panel>
                         <Tabs.Panel value="profile"><ProfileTab /></Tabs.Panel>
                    </Tabs>
                </>
            )}
            {!userData && !isLoading && !mainError && (
                <Text ta="center" c="dimmed" mt="xl">{t('customerDashboard.noUserDataError')}</Text>
            )}
        </Container>
    );
}

export default CustomerDashboardPage;