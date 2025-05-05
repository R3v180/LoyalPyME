// filename: frontend/src/pages/CustomerDashboardPage.tsx
// Version: 3.0.11 (Simplify default value assignment in setUserData)

import { useState, useCallback, useMemo } from 'react';
import { Container, Title, Alert, Tabs, Text, Space, LoadingOverlay } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCircleCheck, IconGift, IconLayoutDashboard, IconHistory, IconSpeakerphone, IconUserCircle } from '@tabler/icons-react';
import axiosInstance from '../services/axiosInstance';
import { AxiosError } from 'axios';
import { useDisclosure } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
// Importar Hooks
import { useUserProfileData } from '../hooks/useUserProfileData';
import { useCustomerRewardsData } from '../hooks/useCustomerRewardsData';
import { useCustomerTierData } from '../hooks/useCustomerTierData';
// Importar componentes de las pestañas
import SummaryTab from '../components/customer/dashboard/tabs/SummaryTab';
import RewardsTab from '../components/customer/dashboard/tabs/RewardsTab';
import ActivityTab from '../components/customer/dashboard/tabs/ActivityTab';
import OffersTab from '../components/customer/dashboard/tabs/OffersTab';
import ProfileTab from '../components/customer/dashboard/tabs/ProfileTab';

// Importar tipos desde la ruta correcta
import {
    UserData,
    TierData,
    TierCalculationBasis,
    TierBenefitData
} from '../types/customer';

// Definir tipos para useMemo
type ProgressBarDataType = {
    type: 'progress';
    percentage: number; currentValueLabel: string; targetValueLabel: string; unit: string; nextTierName: string;
} | { type: 'max_level'; currentTierName: string; } | null;
interface TierDisplayMemoResult {
    progressBarData: ProgressBarDataType; nextTierName: string | null; nextTierBenefits: TierBenefitData[];
}

function CustomerDashboardPage() {
    const { t } = useTranslation();
    // Hooks de datos
    const { userData, loading: loadingUser, error: errorUser, refetch: refetchUser, setUserData } = useUserProfileData();
    const { displayRewards, loadingRewards, loadingGrantedRewards, errorRewards, refreshRewards } = useCustomerRewardsData();
    const { allTiers, businessConfig, loading: loadingTierData, error: errorTierData, refetch: refetchTierData } = useCustomerTierData();
    // Estados locales de UI
    const [validatingQr, setValidatingQr] = useState(false);
    const [redeemingRewardId, setRedeemingRewardId] = useState<string | null>(null);
    const [scannerOpened, { open: openScanner, close: closeScanner }] = useDisclosure(false);
    const [activeTab, setActiveTab] = useState<string | null>('summary');
    // Handlers
    const handleRefetchAll = useCallback(async () => { /* ... */ await Promise.all([refetchUser(), refreshRewards(), refetchTierData()]); /* ... */ }, [refetchUser, refreshRewards, refetchTierData]);

    // --- handleValidateQr con asignación de números más clara ---
    const handleValidateQr = useCallback(async (token: string) => {
        setValidatingQr(true);
        try {
            const response = await axiosInstance.post<{
                pointsEarned: number | null | undefined;
                user: {
                    points: number | null | undefined;
                    totalSpend: number | null | undefined;
                    totalVisits: number | null | undefined;
                    currentTierId: string | null | undefined;
                    currentTierName?: string | null | undefined;
                } | null | undefined;
            }>('/points/validate-qr', { qrToken: token });

            const apiUser = response.data.user;
            const pointsEarned = response.data.pointsEarned ?? 0;

            if (!apiUser) {
                console.error("API response missing user data after QR validation");
                throw new Error(t('customerDashboard.errorValidatingQrMessage'));
            }

            notifications.show({
                title: t('common.success'),
                message: t('customerDashboard.successQrValidation', { points: pointsEarned }),
                color: 'green', icon: <IconCircleCheck />
            });

            // Actualizar estado local usando setUserData del hook
            setUserData(prev => {
                if (!prev) return null;

                // Calcula los nuevos valores NUMÉRICOS asegurando un valor válido
                const newPoints: number = apiUser.points ?? prev.points ?? 0;
                const newTotalSpend: number = apiUser.totalSpend ?? prev.totalSpend ?? 0;
                const newTotalVisits: number = apiUser.totalVisits ?? prev.totalVisits ?? 0;

                // Construir el objeto del nuevo tier de forma segura
                let newTierData: UserData['currentTier'] = null;
                if (apiUser.currentTierId) {
                    const keepOldBenefits = prev.currentTier?.id === apiUser.currentTierId;
                    newTierData = {
                        id: apiUser.currentTierId,
                        name: apiUser.currentTierName || prev.currentTier?.name || '',
                        benefits: keepOldBenefits ? (prev.currentTier?.benefits || []) : []
                    };
                }

                // Devolver el nuevo estado completo
                return {
                    ...prev,
                    points: newPoints,
                    totalSpend: newTotalSpend,
                    totalVisits: newTotalVisits,
                    currentTier: newTierData
                };
            });

            await handleRefetchAll();

        } catch (err) {
            const errorMsg = (err instanceof AxiosError && err.response?.data?.message) ? err.response.data.message : (err instanceof Error ? err.message : t('customerDashboard.errorValidatingQrMessage'));
            notifications.show({ title: t('customerDashboard.errorValidatingQr'), message: errorMsg, color: 'red', icon: <IconAlertCircle /> });
        } finally {
            setValidatingQr(false);
        }
    }, [handleRefetchAll, t, setUserData]); // <- userData quitado de dependencias aquí, ya que se lee vía 'prev'
    // --- FIN handleValidateQr ---

    const handleRedeemReward = useCallback(async (rewardId: string) => { /* ... (sin cambios) ... */ setRedeemingRewardId(rewardId); try { await axiosInstance.post<any>(`/points/redeem-reward/${rewardId}`); notifications.show({ title: t('customerDashboard.successRedeemRewardTitle'), message: t('customerDashboard.successRedeemRewardMessage'), color: 'teal', icon: <IconGift /> }); await handleRefetchAll(); } catch (err) { const errorMsg = (err instanceof AxiosError && err.response?.data?.message) ? err.response.data.message : (err instanceof Error ? err.message : t('customerDashboard.errorRedeemMessage')); notifications.show({ title: t('customerDashboard.errorRedeemTitle'), message: errorMsg, color: 'red', icon: <IconAlertCircle /> }); } finally { setRedeemingRewardId(null); } }, [handleRefetchAll, t]);
    const handleRedeemGrantedReward = useCallback(async (grantedRewardId: string, rewardName: string) => { /* ... (sin cambios) ... */ setRedeemingRewardId(grantedRewardId); try { await axiosInstance.post(`/customer/granted-rewards/${grantedRewardId}/redeem`); notifications.show({ title: t('customerDashboard.successRedeemGiftTitle'), message: t('customerDashboard.successRedeemGiftMessage', { rewardName }), color: 'green', icon: <IconCircleCheck /> }); await handleRefetchAll(); } catch (err) { const errorMsg = (err instanceof AxiosError && err.response?.data?.message) ? err.response.data.message : (err instanceof Error ? err.message : t('customerDashboard.errorRedeemGiftMessage')); notifications.show({ title: t('customerDashboard.errorRedeemTitle'), message: errorMsg, color: 'red', icon: <IconAlertCircle /> }); } finally { setRedeemingRewardId(null); } }, [handleRefetchAll, t]);

    // --- Memo para calcular datos de tier (SIN '!' en dependencia userData) ---
     const tierDisplayData = useMemo((): TierDisplayMemoResult => {
        const initialLoadingState: TierDisplayMemoResult = { progressBarData: null, nextTierName: null, nextTierBenefits: [] };
        if (loadingUser || loadingTierData || !userData || !allTiers || !businessConfig || !businessConfig.tierCalculationBasis) {
            return initialLoadingState;
        }
        const sortTiersLocal = (tiers: TierData[]): TierData[] => [...tiers].sort((a, b) => a.level - b.level);
        const currentMetricValueFunc = (): number => { switch (businessConfig.tierCalculationBasis) { case TierCalculationBasis.SPEND: return userData.totalSpend ?? 0; case TierCalculationBasis.VISITS: return userData.totalVisits ?? 0; case TierCalculationBasis.POINTS_EARNED: return userData.points ?? 0; default: return 0; }};
        const currentMetricValue = currentMetricValueFunc();
        const sortedTiers = sortTiersLocal(allTiers);
        const currentTierIndex = sortedTiers.findIndex(t => t.id === userData.currentTier?.id);
        const currentTier = currentTierIndex !== -1 ? sortedTiers[currentTierIndex] : null;
        const currentTierMinValue = currentTier?.minValue ?? 0;
        const nextTier = currentTierIndex !== -1 && currentTierIndex < sortedTiers.length - 1 ? sortedTiers[currentTierIndex + 1] : null;
        let progressBarResult: ProgressBarDataType = null; let nextTierNameResult: string | null = null; let nextTierBenefitsResult: TierBenefitData[] = [];
        if (!nextTier) { progressBarResult = { type: 'max_level' as const, currentTierName: currentTier?.name || t('customerDashboard.baseTier') };
        }
        else {
            nextTierNameResult = nextTier.name;
            nextTierBenefitsResult = nextTier.benefits ?? [];
            const nextTierMinValue = nextTier.minValue;
            const range = Math.max(0.01, nextTierMinValue - currentTierMinValue);
            const progressInTier = Math.max(0, currentMetricValue - currentTierMinValue);
            let percentage = (progressInTier / range) * 100; percentage = Math.max(0, Math.min(100, percentage));
            let unit = '';
            switch (businessConfig.tierCalculationBasis) { case TierCalculationBasis.SPEND: unit = '€'; break; case TierCalculationBasis.VISITS: unit = t('customerDashboard.progressUnitVisits'); break; case TierCalculationBasis.POINTS_EARNED: unit = t('common.points'); break; }
            const currentValueLabel = `${currentMetricValue.toLocaleString(undefined, { maximumFractionDigits: businessConfig.tierCalculationBasis === TierCalculationBasis.SPEND ? 2 : 0 })}`;
            const targetValueLabel = `${nextTierMinValue.toLocaleString(undefined, { maximumFractionDigits: businessConfig.tierCalculationBasis === TierCalculationBasis.SPEND ? 2 : 0 })}`;
            if (nextTierNameResult) { progressBarResult = { type: 'progress' as const, percentage: percentage, currentValueLabel: currentValueLabel, targetValueLabel: targetValueLabel, unit: unit, nextTierName: nextTierNameResult };
            }
            else { progressBarResult = { type: 'max_level' as const, currentTierName: currentTier?.name || t('customerDashboard.baseTier') }; }
        }
        return { progressBarData: progressBarResult, nextTierName: nextTierNameResult, nextTierBenefits: nextTierBenefitsResult };
    }, [userData, allTiers, businessConfig, loadingUser, loadingTierData, t]); // <-- Mantenemos userData SIN '!'
    // --- FIN useMemo ---

    const currentTierBenefits = useMemo(() => { return userData?.currentTier?.benefits ?? []; }, [userData?.currentTier]);
    const isLoading = loadingUser || loadingTierData || loadingRewards || loadingGrantedRewards;
    const mainError = errorUser || errorTierData || errorRewards;
    if (mainError && !isLoading) { return ( <Container size="lg" py="xl"><Alert icon={<IconAlertCircle size="1rem" />} title={t('common.errorLoadingData')} color="red" radius="md">{mainError}</Alert></Container> ); }

    // Renderizado Principal
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
                            <Tabs.Tab value="activity" leftSection={<IconHistory size={16} />} disabled>{t('customerDashboard.tabActivity', 'Mi Actividad')}</Tabs.Tab>
                            <Tabs.Tab value="offers" leftSection={<IconSpeakerphone size={16} />} disabled>{t('customerDashboard.tabOffers', 'Ofertas y Noticias')}</Tabs.Tab>
                            <Tabs.Tab value="profile" leftSection={<IconUserCircle size={16} />} disabled>{t('customerDashboard.tabProfile', 'Mi Perfil')}</Tabs.Tab>
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
                                loadingTierData={loadingTierData}
                                errorTierData={errorTierData}
                                displayRewards={displayRewards}
                                setActiveTab={setActiveTab}
                                handleValidateQr={handleValidateQr}
                                validatingQr={validatingQr}
                                scannerOpened={scannerOpened}
                                onOpenScanner={openScanner}
                                onCloseScanner={closeScanner}
                            />
                        </Tabs.Panel>
                        <Tabs.Panel value="rewards">
                             <RewardsTab
                                 displayRewards={displayRewards}
                                 userPoints={userData.points}
                                 redeemingRewardId={redeemingRewardId}
                                 loadingRewards={loadingRewards}
                                 loadingGrantedRewards={loadingGrantedRewards}
                                 errorRewards={errorRewards}
                                 onRedeemPoints={handleRedeemReward}
                                 onRedeemGift={handleRedeemGrantedReward}
                             />
                         </Tabs.Panel>
                         <Tabs.Panel value="activity"><ActivityTab /></Tabs.Panel>
                         <Tabs.Panel value="offers"><OffersTab /></Tabs.Panel>
                         <Tabs.Panel value="profile"><ProfileTab /></Tabs.Panel>
                    </Tabs>
                </>
            )}
            {!userData && !loadingUser && !mainError && ( <Text ta="center" c="dimmed" mt="xl">No se pudieron cargar los datos del usuario.</Text> )}
        </Container>
    );
}

export default CustomerDashboardPage;

// End of File: frontend/src/pages/CustomerDashboardPage.tsx