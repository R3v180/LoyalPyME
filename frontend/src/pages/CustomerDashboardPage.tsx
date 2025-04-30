// filename: frontend/src/pages/CustomerDashboardPage.tsx
// Version: 2.1.7 (Fix implicit types in useMemo, fix imports, remove duplicate preview render - FULL CODE)

import { useState, useCallback, useMemo } from 'react';
import { Container, Title, Stack, Box, Alert, Grid } from '@mantine/core'; // Progress, Text, IconLoader eliminados
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCircleCheck, IconGift } from '@tabler/icons-react';
import axiosInstance from '../services/axiosInstance';
import { AxiosError } from 'axios';
import { useDisclosure } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';


// Importar Hooks personalizados
import { useUserProfileData } from '../hooks/useUserProfileData';
import { useCustomerRewardsData } from '../hooks/useCustomerRewardsData';
import { useCustomerTierData } from '../hooks/useCustomerTierData';

// Importar Componentes Extraídos
import UserInfoDisplay from '../components/customer/UserInfoDisplay';
import RewardList from '../components/customer/RewardList';
import QrValidationSection from '../components/customer/QrValidationSection';


// Importar tipos desde el archivo central
import {
    TierData,
    TierCalculationBasis,
    TierBenefitData // <-- Asegurarse que está importado
} from '../types/customer';


// Definir tipos para useMemo FUERA del componente
type ProgressBarDataType = {
    type: 'progress';
    percentage: number;
    currentValueLabel: string;
    targetValueLabel: string;
    unit: string;
    nextTierName: string;
} | {
    type: 'max_level';
    currentTierName: string;
} | null;

interface TierDisplayMemoResult {
    progressBarData: ProgressBarDataType;
    nextTierName: string | null;
    nextTierBenefits: TierBenefitData[];
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

    // Combinar funciones de refetch
    const handleRefetchAll = useCallback(async () => {
        console.log("Refetching all dashboard data...");
        await Promise.all([refetchUser(), refreshRewards(), refetchTierData()]);
        console.log("Refetch finished.");
    }, [refetchUser, refreshRewards, refetchTierData]);

    // Handlers de Acciones
    const handleValidateQr = useCallback(async (token: string) => {
        setValidatingQr(true);
        try {
            const response = await axiosInstance.post<{
                message: string;
                pointsEarned: number;
                user: { // Tipo local para la respuesta específica
                    id: string; points: number; totalSpend: number;
                    totalVisits: number; currentTierId: string | null;
                    currentTierName: string | null;
                 };
            }>('/points/validate-qr', { qrToken: token });

            const { pointsEarned, user: updatedUserDataFromApi } = response.data;

            notifications.show({
                title: t('common.success'),
                message: t('customerDashboard.successQrValidation', { points: pointsEarned }),
                color: 'green',
                icon: <IconCircleCheck /> });

            // Actualizar estado local inmediatamente
            setUserData(prevUserData => {
                if (!prevUserData) return null;
                const updatedTierObject = updatedUserDataFromApi.currentTierId
                    ? {
                        id: updatedUserDataFromApi.currentTierId,
                        name: updatedUserDataFromApi.currentTierName || 'Unknown Tier',
                        benefits: prevUserData.currentTier?.id === updatedUserDataFromApi.currentTierId
                                  ? (prevUserData.currentTier?.benefits || [])
                                  : []
                      }
                    : null;
                return {
                    ...prevUserData,
                    points: updatedUserDataFromApi.points,
                    totalSpend: updatedUserDataFromApi.totalSpend,
                    totalVisits: updatedUserDataFromApi.totalVisits,
                    currentTier: updatedTierObject
                };
            });
             // Llamar a refetch después para asegurar consistencia total (ej: beneficios del tier)
             await handleRefetchAll();

        } catch (err) {
            const errorMsg = (err instanceof AxiosError && err.response?.data?.message) ? err.response.data.message : (err instanceof Error ? err.message : t('customerDashboard.errorValidatingQrMessage'));
            notifications.show({
                title: t('customerDashboard.errorValidatingQr'),
                message: errorMsg,
                color: 'red',
                icon: <IconAlertCircle /> });
         } finally { setValidatingQr(false); }
    }, [handleRefetchAll, t, setUserData]); // Añadir setUserData a dependencias

    const handleRedeemReward = useCallback(async (rewardId: string) => {
        setRedeemingRewardId(rewardId); // Marcar como redimiendo esta recompensa específica
        try {
            await axiosInstance.post<{ message: string; newPointsBalance: number }>(`/points/redeem-reward/${rewardId}`);
            notifications.show({
                 title: t('customerDashboard.successRedeemRewardTitle'),
                message: t('customerDashboard.successRedeemRewardMessage'),
                color: 'teal', icon: <IconGift /> });
            await handleRefetchAll(); // Refrescar todo después del canje
        } catch (err) {
             const errorMsg = (err instanceof AxiosError && err.response?.data?.message) ? err.response.data.message : (err instanceof Error ? err.message : t('customerDashboard.errorRedeemMessage'));
            notifications.show({
                title: t('customerDashboard.errorRedeemTitle'),
                message: errorMsg, color: 'red', icon: <IconAlertCircle /> });
        } finally {
             setRedeemingRewardId(null); // Limpiar el ID de la recompensa en proceso
        }
    }, [handleRefetchAll, t]); // Dependencias

    const handleRedeemGrantedReward = useCallback(async (grantedRewardId: string, rewardName: string) => {
        setRedeemingRewardId(grantedRewardId); // Marcar como redimiendo este regalo específico
        try {
             await axiosInstance.post(`/customer/granted-rewards/${grantedRewardId}/redeem`);
             notifications.show({
                title: t('customerDashboard.successRedeemGiftTitle'),
                message: t('customerDashboard.successRedeemGiftMessage', { rewardName: rewardName }),
                color: 'green', icon: <IconCircleCheck /> });
             await handleRefetchAll(); // Refrescar todo después del canje
        } catch (err) {
              const errorMsg = (err instanceof AxiosError && err.response?.data?.message) ? err.response.data.message : (err instanceof Error ? err.message : t('customerDashboard.errorRedeemGiftMessage', 'No se pudo canjear el regalo.'));
             notifications.show({
                title: t('customerDashboard.errorRedeemTitle'),
                message: errorMsg, color: 'red', icon: <IconAlertCircle /> });
        } finally {
            setRedeemingRewardId(null); // Limpiar el ID del regalo en proceso
        }
    }, [handleRefetchAll, t]); // Dependencias


    // Lógica para calcular la barra de progreso y datos del siguiente nivel
    const tierDisplayData = useMemo((): TierDisplayMemoResult => {
        const initialLoadingState: TierDisplayMemoResult = { progressBarData: null, nextTierName: null, nextTierBenefits: [] };
        if (loadingUser || loadingTierData || !userData || !allTiers || !businessConfig || !businessConfig.tierCalculationBasis) {
            return initialLoadingState;
        }

        const currentMetricValueFunc = (): number => {
            switch (businessConfig.tierCalculationBasis) {
                case TierCalculationBasis.SPEND: return userData.totalSpend ?? 0;
                case TierCalculationBasis.VISITS: return userData.totalVisits ?? 0;
                case TierCalculationBasis.POINTS_EARNED: return userData.points ?? 0;
                default: return 0;
            }
        };
        const currentMetricValue = currentMetricValueFunc();

        const currentTier = allTiers.find(t => t.id === userData.currentTier?.id);
        const currentTierLevel = currentTier?.level ?? -1;
        const currentTierMinValue = currentTier?.minValue ?? 0;
        const nextTier = allTiers
            .filter(t => t.level > currentTierLevel)
            .sort((a: TierData, b: TierData) => a.level - b.level)[0];

        let progressBarResult: ProgressBarDataType = null;
        let nextTierNameResult: string | null = null;
        let nextTierBenefitsResult: TierBenefitData[] = [];

        if (!nextTier) {
            progressBarResult = { type: 'max_level' as const, currentTierName: currentTier?.name || t('customerDashboard.baseTier') };
        } else {
             nextTierNameResult = nextTier.name;
             // --- AVISO: Arreglar el tipo TierData para incluir benefits ---
             nextTierBenefitsResult = (nextTier as TierData & { benefits?: TierBenefitData[] })?.benefits || [];

            const nextTierMinValue = nextTier.minValue;
            const range = nextTierMinValue - currentTierMinValue;
            const progressInTier = currentMetricValue - currentTierMinValue;

            if (range <= 0) {
                progressBarResult = { type: 'max_level' as const, currentTierName: currentTier?.name || t('customerDashboard.baseTier') };
                 nextTierNameResult = null;
                 nextTierBenefitsResult = [];
            } else {
                let percentage = (progressInTier / range) * 100;
                percentage = Math.max(0, Math.min(100, percentage));
                let unit = '';
                switch (businessConfig.tierCalculationBasis) {
                    case TierCalculationBasis.SPEND: unit = '€'; break;
                    case TierCalculationBasis.VISITS: unit = t('customerDashboard.progressUnitVisits'); break;
                    case TierCalculationBasis.POINTS_EARNED: unit = t('customerDashboard.points'); break;
                }
                const currentValueLabel = `${currentMetricValue.toLocaleString(undefined, { maximumFractionDigits: businessConfig.tierCalculationBasis === TierCalculationBasis.SPEND ? 2 : 0 })}`;
                const targetValueLabel = `${nextTierMinValue.toLocaleString(undefined, { maximumFractionDigits: businessConfig.tierCalculationBasis === TierCalculationBasis.SPEND ? 2 : 0 })}`;
                progressBarResult = {
                    type: 'progress' as const,
                    percentage: percentage,
                    currentValueLabel: currentValueLabel,
                    targetValueLabel: targetValueLabel,
                    unit: unit,
                    nextTierName: nextTierNameResult
                };
            }
        }

        return {
            progressBarData: progressBarResult,
            nextTierName: nextTierNameResult,
            nextTierBenefits: nextTierBenefitsResult
        };

    }, [userData, allTiers, businessConfig, loadingUser, loadingTierData, t]);


    // --- Renderizado ---
    return (
        <Container size="lg" py="xl">
            <Title order={2} ta="center" mb="xl">{t('customerDashboard.title')}</Title>

            <Grid>
                {/* Columna Izquierda (Información Principal) */}
                <Grid.Col span={{ base: 12, md: 7 }}>
                    <Stack>
                        <UserInfoDisplay
                            userData={userData}
                            loadingUser={loadingUser}
                            errorUser={errorUser}
                            progressBarData={tierDisplayData.progressBarData}
                            benefits={userData?.currentTier?.benefits}
                            nextTierName={tierDisplayData.nextTierName} // Prop pasada
                            nextTierBenefits={tierDisplayData.nextTierBenefits} // Prop pasada
                        />

                         {/* Renderizado de NextTierPreview ya NO se hace aquí */}

                         { !loadingTierData && errorTierData &&
                            <Alert title={t('common.error')} color="orange" icon={<IconAlertCircle />}>{t('customerDashboard.errorLoadingProgress', 'No se pudieron cargar los datos de niveles.')}</Alert>
                         }
                    </Stack>
                </Grid.Col>

                {/* Columna Derecha (Acciones y Recompensas) */}
                <Grid.Col span={{ base: 12, md: 5 }}>
                    <Stack>
                        <QrValidationSection onValidate={handleValidateQr} isValidating={validatingQr} scannerOpened={scannerOpened} onOpenScanner={openScanner} onCloseScanner={closeScanner} />
                        <Box>
                            <RewardList
                                rewards={displayRewards}
                                userPoints={userData?.points}
                                redeemingRewardId={redeemingRewardId}
                                loadingRewards={loadingRewards}
                                loadingGrantedRewards={loadingGrantedRewards}
                                errorRewards={errorRewards}
                                onRedeemPoints={handleRedeemReward}
                                onRedeemGift={handleRedeemGrantedReward}
                            />
                        </Box>
                    </Stack>
                </Grid.Col>
            </Grid>

        </Container>
    );
}

export default CustomerDashboardPage;

// End of File: frontend/src/pages/CustomerDashboardPage.tsx