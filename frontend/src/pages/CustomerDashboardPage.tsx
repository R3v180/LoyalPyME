// filename: frontend/src/pages/CustomerDashboardPage.tsx
// Version: 1.6.1 (Manage scanner modal state in refactored component)

import { useState, useCallback } from 'react';
import {
    Container, Title,
    // Quitar imports no usados por el contenedor
    // Text, Button, Group, TextInput, Modal, Stack, Paper, Badge, ThemeIcon, Tooltip, Skeleton, Alert
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconAlertCircle, IconCircleCheck, IconGift,  // Quitar iconos no usados directamente aquí
    // IconScan, IconTicket, IconUserCircle, IconInfoCircle
} from '@tabler/icons-react';
import axiosInstance from '../services/axiosInstance';
import { AxiosError } from 'axios';
import { useDisclosure } from '@mantine/hooks'; // <-- Importar useDisclosure

// Importar Hooks personalizados
import { useUserProfileData } from '../hooks/useUserProfileData';
import { useCustomerRewardsData } from '../hooks/useCustomerRewardsData';
// Importar Componentes Extraídos
import UserInfoDisplay from '../components/customer/UserInfoDisplay';
import RewardList from '../components/customer/RewardList';
import QrValidationSection from '../components/customer/QrValidationSection';

// --- COMPONENTE PRINCIPAL (CONTENEDOR) ---
function CustomerDashboardPage() {
    // Hooks de datos
    const { userData, loadingUser, errorUser, refreshUserProfile } = useUserProfileData();
    const { displayRewards, loadingRewards, loadingGrantedRewards, errorRewards, refreshRewards } = useCustomerRewardsData();

    // Estados locales de UI para acciones
    const [validatingQr, setValidatingQr] = useState(false);
    const [redeemingRewardId, setRedeemingRewardId] = useState<string | null>(null);

    // --- NUEVO: Estado para el modal del scanner (manejado aquí) ---
    const [scannerOpened, { open: openScanner, close: closeScanner }] = useDisclosure(false);
    // -------------------------------------------------------------


    // --- Handlers de Acciones ---

    // handleValidateQr (llamado por QrValidationSection)
    const handleValidateQr = useCallback(async (token: string) => {
        console.log(`[CustomerDashboardPage] Received token to validate: ${token}`);
        setValidatingQr(true);
        try {
            const response = await axiosInstance.post<{ message: string; pointsEarned: number }>('/points/validate-qr', { qrToken: token });
            notifications.show({ title: 'Éxito', message: `${response.data.message} Has ganado ${response.data.pointsEarned} puntos.`, color: 'green', icon: <IconCircleCheck />, });
            // Refrescar datos del usuario después de validar
            await refreshUserProfile();
            // El modal se cierra desde QrValidationSection si el escaneo fue exitoso
        } catch (err) {
            console.error("Error validating QR:", err);
            const errorMsg = (err instanceof AxiosError && err.response?.data?.message) ? err.response.data.message : (err instanceof Error ? err.message : 'Error desconocido al validar QR.');
            notifications.show({ title: 'Error de Validación', message: errorMsg, color: 'red', icon: <IconAlertCircle />, });
            // El error específico del scanner se muestra dentro de QrValidationSection
        } finally {
            setValidatingQr(false);
        }
    }, [refreshUserProfile]);

    // handleRedeemReward (llamado por RewardList)
    const handleRedeemReward = useCallback(async (rewardId: string) => {
        setRedeemingRewardId(rewardId);
        try {
            await axiosInstance.post<{ message: string; newPointsBalance: number }>(`/points/redeem-reward/${rewardId}`);
            notifications.show({ title: '¡Recompensa Canjeada!', message: 'Has canjeado tu recompensa.', color: 'teal', icon: <IconGift /> });
            // Refrescar perfil para actualizar puntos
            await refreshUserProfile();
        } catch (err) {
            const errorMsg = (err instanceof AxiosError && err.response?.data?.message) ? err.response.data.message : (err instanceof Error ? err.message : 'Error desconocido al canjear.');
            notifications.show({ title: 'Error al Canjear', message: errorMsg, color: 'red', icon: <IconAlertCircle />, });
        } finally { setRedeemingRewardId(null); }
    }, [refreshUserProfile]);

    // handleRedeemGrantedReward (llamado por RewardList)
    const handleRedeemGrantedReward = useCallback(async (grantedRewardId: string, rewardName: string) => {
        setRedeemingRewardId(grantedRewardId);
        try {
             await axiosInstance.post(`/customer/granted-rewards/${grantedRewardId}/redeem`);
             notifications.show({ title: '¡Regalo Canjeado!', message: `Has canjeado "${rewardName}".`, color: 'green', icon: <IconCircleCheck /> });
             // Refrescar lista de recompensas/regalos
             await refreshRewards();
        } catch (err) {
             const errorMsg = (err instanceof AxiosError && err.response?.data?.message) ? err.response.data.message : (err instanceof Error ? err.message : 'No se pudo canjear el regalo.');
             notifications.show({ title: 'Error al Canjear Regalo', message: errorMsg, color: 'red', icon: <IconAlertCircle /> });
        } finally { setRedeemingRewardId(null); }
    }, [refreshRewards]); // Depende de refreshRewards
    // --- FIN HANDLERS ---


    // --- Renderizado ---
    // Renderiza los componentes hijos pasándoles las props necesarias
    return (
        <Container size="lg" py="xl">
            <Title order={2} ta="center" mb="lg">Panel de Cliente</Title>

            <UserInfoDisplay
                userData={userData}
                loadingUser={loadingUser} // Pasar estado de carga específico
                errorUser={errorUser} // Pasar estado de error específico
            />

            <QrValidationSection
                onValidate={handleValidateQr}
                isValidating={validatingQr}
                // --- Pasar props para controlar el modal ---
                scannerOpened={scannerOpened}
                onOpenScanner={openScanner}
                onCloseScanner={closeScanner}
                // ------------------------------------------
            />

            <RewardList
                rewards={displayRewards}
                userPoints={userData?.points}
                redeemingRewardId={redeemingRewardId}
                // Pasamos los estados de carga combinados o separados si los hooks los devuelven así
                loadingRewards={loadingRewards}
                loadingGrantedRewards={loadingGrantedRewards}
                errorRewards={errorRewards} // Pasar error específico de recompensas
                onRedeemPoints={handleRedeemReward}
                onRedeemGift={handleRedeemGrantedReward}
            />

        </Container>
    );
    // --- FIN RENDERIZADO ---
}

export default CustomerDashboardPage;