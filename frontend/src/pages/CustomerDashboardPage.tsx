// filename: frontend/src/pages/CustomerDashboardPage.tsx
// Version: 1.8.1 (Remove unused Stack import)

import { useState, useCallback } from 'react';
import { Container, Title } from '@mantine/core'; // Stack eliminado
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCircleCheck, IconGift } from '@tabler/icons-react';
import axiosInstance from '../services/axiosInstance';
import { AxiosError } from 'axios';
import { useDisclosure } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';


// Importar Hooks personalizados
import { useUserProfileData } from '../hooks/useUserProfileData';
import { useCustomerRewardsData } from '../hooks/useCustomerRewardsData';
// Importar Componentes Extraídos
import UserInfoDisplay from '../components/customer/UserInfoDisplay';
import RewardList from '../components/customer/RewardList';
import QrValidationSection from '../components/customer/QrValidationSection';
import TierBenefitsDisplay from '../components/customer/TierBenefitsDisplay';

function CustomerDashboardPage() {
    const { t } = useTranslation();

    // Hooks de datos
    const { userData, loading, error, refetch } = useUserProfileData();
    const { displayRewards, loadingRewards, loadingGrantedRewards, errorRewards, refreshRewards } = useCustomerRewardsData();
    // Estados locales de UI
    const [validatingQr, setValidatingQr] = useState(false);
    const [redeemingRewardId, setRedeemingRewardId] = useState<string | null>(null);
    const [scannerOpened, { open: openScanner, close: closeScanner }] = useDisclosure(false);

    // --- Handlers de Acciones (sin cambios) ---
    const handleValidateQr = useCallback(async (token: string) => {
        setValidatingQr(true);
        try {
            const response = await axiosInstance.post<{ message: string; pointsEarned: number }>('/points/validate-qr', { qrToken: token });
            notifications.show({
                title: t('common.success'),
                message: t('customerDashboard.successQrValidation', { points: response.data.pointsEarned }),
                color: 'green',
                icon: <IconCircleCheck /> });
             await refetch();
             await refreshRewards();
        } catch (err) {
            const errorMsg = (err instanceof AxiosError && err.response?.data?.message) ? err.response.data.message : (err instanceof Error ? err.message : t('customerDashboard.errorValidatingQrMessage'));
            notifications.show({
                title: t('customerDashboard.errorValidatingQr'),
                message: errorMsg,
                color: 'red',
                icon: <IconAlertCircle /> });
         } finally { setValidatingQr(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refetch, refreshRewards, t]);

    const handleRedeemReward = useCallback(async (rewardId: string) => {
        setRedeemingRewardId(rewardId);
        try {
            await axiosInstance.post<{ message: string; newPointsBalance: number }>(`/points/redeem-reward/${rewardId}`);
            notifications.show({
                 title: t('customerDashboard.successRedeemRewardTitle'),
                message: t('customerDashboard.successRedeemRewardMessage'),
                color: 'teal', icon: <IconGift /> });
            await refetch();
            await refreshRewards();
        } catch (err) {
             const errorMsg = (err instanceof AxiosError && err.response?.data?.message) ? err.response.data.message : (err instanceof Error ? err.message : t('customerDashboard.errorRedeemMessage'));
            notifications.show({
                title: t('customerDashboard.errorRedeemTitle'),
                message: errorMsg, color: 'red', icon: <IconAlertCircle /> });
        } finally { setRedeemingRewardId(null); }
     // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refetch, refreshRewards, t]);

    const handleRedeemGrantedReward = useCallback(async (grantedRewardId: string, rewardName: string) => {
        setRedeemingRewardId(grantedRewardId);
        try {
             await axiosInstance.post(`/customer/granted-rewards/${grantedRewardId}/redeem`);
             notifications.show({
                title: t('customerDashboard.successRedeemGiftTitle'),
                message: t('customerDashboard.successRedeemGiftMessage', { rewardName: rewardName }),
                color: 'green', icon: <IconCircleCheck /> });
             await refreshRewards();
             await refetch();
        } catch (err) {
              const errorMsg = (err instanceof AxiosError && err.response?.data?.message) ? err.response.data.message : (err instanceof Error ? err.message : t('customerDashboard.errorRedeemGiftMessage', 'No se pudo canjear el regalo.'));
             notifications.show({
                title: t('customerDashboard.errorRedeemTitle'),
                message: errorMsg, color: 'red', icon: <IconAlertCircle /> });
        } finally { setRedeemingRewardId(null); }
     // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refetch, refreshRewards, t]);

    // --- Renderizado (sin cambios respecto a la versión anterior que te pasé) ---
    return (
        <Container size="lg" py="xl">
            <Title order={2} ta="center" mb="lg">{t('customerDashboard.title')}</Title>

            {/* UserInfoDisplay se mantiene, pero ahora también pasamos los beneficios al nuevo componente */}
            <UserInfoDisplay userData={userData} loadingUser={loading} errorUser={error} />

            {/* --- NUEVO: Mostrar beneficios si existen --- */}
            {!loading && userData && userData.currentTier && userData.currentTier.benefits && userData.currentTier.benefits.length > 0 && (
                 <TierBenefitsDisplay
                     tierName={userData.currentTier.name}
                     benefits={userData.currentTier.benefits}
                 />
            )}
            {/* --- FIN NUEVO --- */}

            <QrValidationSection onValidate={handleValidateQr} isValidating={validatingQr} scannerOpened={scannerOpened} onOpenScanner={openScanner} onCloseScanner={closeScanner} />
            <RewardList rewards={displayRewards} userPoints={userData?.points} redeemingRewardId={redeemingRewardId} loadingRewards={loadingRewards} loadingGrantedRewards={loadingGrantedRewards} errorRewards={errorRewards} onRedeemPoints={handleRedeemReward} onRedeemGift={handleRedeemGrantedReward} />
        </Container>
    );
}

export default CustomerDashboardPage;

// End of File: frontend/src/pages/CustomerDashboardPage.tsx