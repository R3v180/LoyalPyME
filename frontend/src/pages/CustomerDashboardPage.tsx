// filename: frontend/src/pages/CustomerDashboardPage.tsx
// Version: 1.6.0 (Refactor: Use QrValidationSection component)

import { useState, useCallback } from 'react';
import {
    Container, Title, 
    // Ya no se necesitan: Text, Button, Group, TextInput, Modal, Stack, Paper
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconAlertCircle, IconCircleCheck, 
    // Ya no se necesitan: IconScan, IconTicket
} from '@tabler/icons-react';
import axiosInstance from '../services/axiosInstance';
// Ya no se necesita: QrReader, useDisclosure
import { AxiosError } from 'axios';

// Importar Hooks
import { useUserProfileData } from '../hooks/useUserProfileData';
import { useCustomerRewardsData } from '../hooks/useCustomerRewardsData';
// Importar Componentes Extraídos
import UserInfoDisplay from '../components/customer/UserInfoDisplay';
import RewardList from '../components/customer/RewardList';
import QrValidationSection from '../components/customer/QrValidationSection'; // <-- Importamos QrValidationSection

// --- COMPONENTE PRINCIPAL ---
function CustomerDashboardPage() {
    // --- Llamada a los Hooks ---
    const { userData, loadingUser, errorUser, refreshUserProfile } = useUserProfileData();
    const { displayRewards, loadingRewards, loadingGrantedRewards, errorRewards, refreshRewards } = useCustomerRewardsData();
    // --------------------------

    // --- Estados locales de UI (solo los necesarios aquí) ---
    const [validatingQr, setValidatingQr] = useState(false); // ¿Está la API validando un QR?
    const [redeemingRewardId, setRedeemingRewardId] = useState<string | null>(null); // ¿Se está canjeando algo?
    // Los estados qrTokenInput, scannerOpened, scannerError ahora están DENTRO de QrValidationSection
    // -------------------------------------------

    // --- Handlers de Acciones ---

    // handleValidateQr ahora solo recibe el token del componente hijo
    const handleValidateQr = useCallback(async (token: string) => {
        console.log(`[CustomerDashboardPage] Received token to validate: ${token}`);
        setValidatingQr(true);
        try {
            // Llamada API sigue aquí
            await axiosInstance.post<{ message: string; pointsEarned: number }>('/points/validate-qr', { qrToken: token });
            notifications.show({ title: 'Éxito', message: `Código validado correctamente.`, color: 'green', icon: <IconCircleCheck />, });
            // Ya no necesitamos limpiar input ni cerrar modal aquí (lo hace el hijo si es necesario)
            await refreshUserProfile(); // Refrescar datos del usuario
        } catch (err) {
            console.error("Error validating QR:", err);
            const errorMsg = (err instanceof AxiosError && err.response?.data?.message) ? err.response.data.message : (err instanceof Error ? err.message : 'Error desconocido al validar QR.');
            notifications.show({ title: 'Error de Validación', message: errorMsg, color: 'red', icon: <IconAlertCircle />, });
            // Ya no necesitamos setScannerError aquí
        } finally {
            setValidatingQr(false); // Terminar estado de carga
        }
    }, [refreshUserProfile]); // Ya no depende de scannerOpened/closeScanner

    // handleRedeemReward (sin cambios)
    const handleRedeemReward = useCallback(async (rewardId: string) => {
        setRedeemingRewardId(rewardId);
        try {
            await axiosInstance.post<{ message: string; newPointsBalance: number }>(`/points/redeem-reward/${rewardId}`);
            notifications.show({ title: '¡Recompensa Canjeada!', message: 'Has canjeado tu recompensa.', color: 'teal' });
            await refreshUserProfile();
        } catch (err) {
            const errorMsg = (err instanceof AxiosError && err.response?.data?.message) ? err.response.data.message : (err instanceof Error ? err.message : 'Error desconocido al canjear.');
            notifications.show({ title: 'Error al Canjear', message: errorMsg, color: 'red', icon: <IconAlertCircle />, });
        } finally { setRedeemingRewardId(null); }
    }, [refreshUserProfile]);

    // handleRedeemGrantedReward (sin cambios)
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
    // --- FIN HANDLERS ---


    // --- Renderizado ---
    // Ahora es mucho más declarativo, solo coloca los componentes principales
    return (
        <Container size="lg" py="xl">
            <Title order={2} ta="center" mb="lg">Panel de Cliente</Title>

            {/* Componente de Info Usuario */}
            <UserInfoDisplay
                userData={userData}
                loadingUser={loadingUser}
                errorUser={errorUser}
            />

            {/* === Componente de Validación QR === */}
            <QrValidationSection
                onValidate={handleValidateQr} // Pasa el handler de esta página
                isValidating={validatingQr}    // Pasa el estado de carga de esta página
            />
            {/* ================================= */}

            {/* Componente de Lista de Recompensas */}
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
    // --- FIN RENDERIZADO ---
}

export default CustomerDashboardPage;