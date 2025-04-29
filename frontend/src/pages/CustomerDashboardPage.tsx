// filename: frontend/src/pages/CustomerDashboardPage.tsx
// Version: 1.7.0 (Add i18n for page title)

import { useState, useCallback } from 'react';
import { Container, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCircleCheck, IconGift } from '@tabler/icons-react';
import axiosInstance from '../services/axiosInstance';
import { AxiosError } from 'axios';
import { useDisclosure } from '@mantine/hooks';
// --- NUEVO: Importar useTranslation ---
import { useTranslation } from 'react-i18next';
// --- FIN NUEVO ---


// Importar Hooks personalizados
import { useUserProfileData } from '../hooks/useUserProfileData';
import { useCustomerRewardsData } from '../hooks/useCustomerRewardsData';
// Importar Componentes Extraídos
import UserInfoDisplay from '../components/customer/UserInfoDisplay';
import RewardList from '../components/customer/RewardList';
import QrValidationSection from '../components/customer/QrValidationSection';

function CustomerDashboardPage() {
    // --- NUEVO: Hook useTranslation ---
    const { t } = useTranslation();
    // --- FIN NUEVO ---

    // Hooks de datos
    const { userData, loading, error, refetch } = useUserProfileData();
    const { displayRewards, loadingRewards, loadingGrantedRewards, errorRewards, refreshRewards } = useCustomerRewardsData();
    // Estados locales de UI
    const [validatingQr, setValidatingQr] = useState(false);
    const [redeemingRewardId, setRedeemingRewardId] = useState<string | null>(null);
    const [scannerOpened, { open: openScanner, close: closeScanner }] = useDisclosure(false);

    // --- Handlers de Acciones (usando t() para notificaciones) ---
    const handleValidateQr = useCallback(async (token: string) => {
        setValidatingQr(true);
        try {
            const response = await axiosInstance.post<{ message: string; pointsEarned: number }>('/points/validate-qr', { qrToken: token });
            notifications.show({
                title: t('common.success'), // Usar clave común
                // Usar clave con interpolación
                message: t('customerDashboard.successQrValidation', { points: response.data.pointsEarned }),
                color: 'green',
                icon: <IconCircleCheck /> });
             await refetch(); // Refrescar datos del usuario (puntos)
             await refreshRewards(); // Refrescar regalos si la validación otorgó uno (menos común)
        } catch (err) {
            const errorMsg = (err instanceof AxiosError && err.response?.data?.message) ? err.response.data.message : (err instanceof Error ? err.message : t('customerDashboard.errorValidatingQrMessage'));
            notifications.show({
                title: t('customerDashboard.errorValidatingQr'),
                message: errorMsg,
                color: 'red',
                icon: <IconAlertCircle /> });
         } finally { setValidatingQr(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refetch, refreshRewards]); // Añadir t a dependencias si se usa directamente en useCallback

    const handleRedeemReward = useCallback(async (rewardId: string) => {
        setRedeemingRewardId(rewardId);
        try {
            // La respuesta de la API no se usa directamente aquí, solo el éxito/error
            await axiosInstance.post<{ message: string; newPointsBalance: number }>(`/points/redeem-reward/${rewardId}`);
            notifications.show({
                title: t('customerDashboard.successRedeemRewardTitle'),
                message: t('customerDashboard.successRedeemRewardMessage'), // Mensaje simple
                color: 'teal', icon: <IconGift /> });
            await refetch(); // Refrescar puntos
            await refreshRewards(); // Refrescar lista (si afecta disponibilidad)
        } catch (err) {
             const errorMsg = (err instanceof AxiosError && err.response?.data?.message) ? err.response.data.message : (err instanceof Error ? err.message : t('customerDashboard.errorRedeemMessage'));
            notifications.show({
                title: t('customerDashboard.errorRedeemTitle'),
                message: errorMsg, color: 'red', icon: <IconAlertCircle /> });
        } finally { setRedeemingRewardId(null); }
     // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refetch, refreshRewards]);

    const handleRedeemGrantedReward = useCallback(async (grantedRewardId: string, rewardName: string) => {
        setRedeemingRewardId(grantedRewardId);
        try {
             await axiosInstance.post(`/customer/granted-rewards/${grantedRewardId}/redeem`);
             notifications.show({
                title: t('customerDashboard.successRedeemGiftTitle'),
                // Usar interpolación para el nombre
                message: t('customerDashboard.successRedeemGiftMessage', { rewardName: rewardName }),
                color: 'green', icon: <IconCircleCheck /> });
             await refreshRewards(); // Refrescar lista de regalos
             await refetch(); // Refrescar datos usuario por si acaso
        } catch (err) {
              const errorMsg = (err instanceof AxiosError && err.response?.data?.message) ? err.response.data.message : (err instanceof Error ? err.message : t('customerDashboard.errorRedeemGiftMessage', 'No se pudo canjear el regalo.')); // Añadir clave para regalo?
             notifications.show({
                title: t('customerDashboard.errorRedeemTitle'), // Título genérico de error canje
                message: errorMsg, color: 'red', icon: <IconAlertCircle /> });
        } finally { setRedeemingRewardId(null); }
     // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refetch, refreshRewards]);

    // --- Renderizado (Solo el título cambia) ---
    return (
        <Container size="lg" py="xl">
            {/* --- CAMBIO: Usar t() para el título --- */}
            <Title order={2} ta="center" mb="lg">{t('customerDashboard.title')}</Title>
            {/* --- FIN CAMBIO --- */}

            {/* Los componentes hijos todavía NO están traducidos internamente */}
            <UserInfoDisplay userData={userData} loadingUser={loading} errorUser={error} />
            <QrValidationSection onValidate={handleValidateQr} isValidating={validatingQr} scannerOpened={scannerOpened} onOpenScanner={openScanner} onCloseScanner={closeScanner} />
            <RewardList rewards={displayRewards} userPoints={userData?.points} redeemingRewardId={redeemingRewardId} loadingRewards={loadingRewards} loadingGrantedRewards={loadingGrantedRewards} errorRewards={errorRewards} onRedeemPoints={handleRedeemReward} onRedeemGift={handleRedeemGrantedReward} />
        </Container>
    );
}

export default CustomerDashboardPage;

// End of File: frontend/src/pages/CustomerDashboardPage.tsx