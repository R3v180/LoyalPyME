// filename: frontend/src/pages/CustomerDashboardPage.tsx
// Version: 1.6.3 (Remove unused React import)

import { useState, useCallback } from 'react'; // Quitamos React
import { Container, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCircleCheck, IconGift } from '@tabler/icons-react';
import axiosInstance from '../services/axiosInstance';
import { AxiosError } from 'axios';
import { useDisclosure } from '@mantine/hooks';

// Importar Hooks personalizados
import { useUserProfileData } from '../hooks/useUserProfileData';
import { useCustomerRewardsData } from '../hooks/useCustomerRewardsData';
// Importar Componentes Extraídos
import UserInfoDisplay from '../components/customer/UserInfoDisplay';
import RewardList from '../components/customer/RewardList';
import QrValidationSection from '../components/customer/QrValidationSection';

function CustomerDashboardPage() {
    // Hooks de datos
    const { userData, loading, error, refetch } = useUserProfileData();
    const { displayRewards, loadingRewards, loadingGrantedRewards, errorRewards, refreshRewards } = useCustomerRewardsData();

    // Estados locales de UI
    const [validatingQr, setValidatingQr] = useState(false);
    const [redeemingRewardId, setRedeemingRewardId] = useState<string | null>(null);
    const [scannerOpened, { open: openScanner, close: closeScanner }] = useDisclosure(false);

    // --- Handlers de Acciones ---
    const handleValidateQr = useCallback(async (token: string) => {
        console.log(`[CustomerDashboardPage] Received token to validate: ${token}`);
        setValidatingQr(true);
        try {
            const response = await axiosInstance.post<{ message: string; pointsEarned: number }>('/points/validate-qr', { qrToken: token });
            notifications.show({ title: 'Éxito', message: `${response.data.message} Has ganado ${response.data.pointsEarned} puntos.`, color: 'green', icon: <IconCircleCheck /> });
            await refetch();
        } catch (err) {
            console.error("Error validating QR:", err);
            const errorMsg = (err instanceof AxiosError && err.response?.data?.message) ? err.response.data.message : (err instanceof Error ? err.message : 'Error desconocido al validar QR.');
            notifications.show({ title: 'Error de Validación', message: errorMsg, color: 'red', icon: <IconAlertCircle /> });
        } finally {
            setValidatingQr(false);
        }
    }, [refetch]);

    const handleRedeemReward = useCallback(async (rewardId: string) => {
        setRedeemingRewardId(rewardId);
        try {
            await axiosInstance.post<{ message: string; newPointsBalance: number }>(`/points/redeem-reward/${rewardId}`);
            notifications.show({ title: '¡Recompensa Canjeada!', message: 'Has canjeado tu recompensa.', color: 'teal', icon: <IconGift /> });
            await refetch();
        } catch (err) {
            const errorMsg = (err instanceof AxiosError && err.response?.data?.message) ? err.response.data.message : (err instanceof Error ? err.message : 'Error desconocido al canjear.');
            notifications.show({ title: 'Error al Canjear', message: errorMsg, color: 'red', icon: <IconAlertCircle /> });
        } finally { setRedeemingRewardId(null); }
    }, [refetch]);

    const handleRedeemGrantedReward = useCallback(async (grantedRewardId: string, rewardName: string) => {
        setRedeemingRewardId(grantedRewardId);
        try {
             await axiosInstance.post(`/customer/granted-rewards/${grantedRewardId}/redeem`);
             notifications.show({ title: '¡Regalo Canjeado!', message: `Has canjeado "${rewardName}".`, color: 'green', icon: <IconCircleCheck /> });
             await refreshRewards();
        } catch (err) {
             const errorMsg = (err instanceof AxiosError && err.response?.data?.message) ? err.response.data.message : (err instanceof Error ? err.message : 'No se pudo canjear el regalo.');
             notifications.show({ title: 'Error al Canjear Regalo', message: errorMsg, color: 'red', icon: <IconAlertCircle /> });
        } finally { setRedeemingRewardId(null); }
    }, [refreshRewards]);

    // Renderizado
    return (
        <Container size="lg" py="xl">
            <Title order={2} ta="center" mb="lg">Panel de Cliente</Title>

            <UserInfoDisplay
                userData={userData}
                loadingUser={loading}
                errorUser={error}
            />

            <QrValidationSection
                onValidate={handleValidateQr}
                isValidating={validatingQr}
                scannerOpened={scannerOpened}
                onOpenScanner={openScanner}
                onCloseScanner={closeScanner}
            />

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

        </Container>
    );
}

export default CustomerDashboardPage;

// End of File: frontend/src/pages/CustomerDashboardPage.tsx