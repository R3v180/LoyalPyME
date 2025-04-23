// File: frontend/src/pages/CustomerDashboardPage.tsx
// Version: 1.3.1 (Integrate Notifications - Fully Expanded JSX)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Mantine Imports
import { Container, Text, Paper, Title, Stack, SimpleGrid, Card, Button, Group, TextInput, Loader, Alert } from '@mantine/core';
// Notifications Imports
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck, IconX } from '@tabler/icons-react'; // IconAlertCircle se mantiene por si hay error general
import axiosInstance from '../services/axiosInstance';

// Interfaces (sin cambios)
interface UserProfile { id: string; email: string; name?: string | null; role: string; points: number; businessId: string; }
interface Reward { id: string; name: string; description?: string | null; pointsCost: number; isActive: boolean; businessId: string; }

function CustomerDashboardPage() {
    // Estados (Quitamos los de resultado/error para alertas locales)
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
    const [loadingRewards, setLoadingRewards] = useState<boolean>(true);
    const [errorProfile, setErrorProfile] = useState<string | null>(null); // Mantenemos error de carga perfil
    const [errorRewards, setErrorRewards] = useState<string | null>(null); // Mantenemos error de carga recompensas
    const [qrToken, setQrToken] = useState<string>('');
    const [validatingQr, setValidatingQr] = useState<boolean>(false);
    const [isRedeeming, setIsRedeeming] = useState<string | null>(null);
    const navigate = useNavigate();

    // Funciones (handleLogout, fetchUserProfile, fetchRewards, useEffect) (sin cambios lógicos)
    const handleLogout = () => { console.log('Logging out...'); localStorage.removeItem('token'); navigate('/login'); };
    const fetchUserProfile = async () => { setLoadingProfile(true); setErrorProfile(null); try { const response = await axiosInstance.get<UserProfile>('/profile'); setUserProfile(response.data); console.log('User profile fetched:', response.data); } catch (error: any) { console.error('Error fetching user profile:', error); if (error.response?.status === 401 || error.response?.status === 403) { handleLogout(); } else { setErrorProfile(error.response?.data?.message || error.message || 'Failed to fetch profile.'); } } finally { setLoadingProfile(false); } };
    const fetchRewards = async () => { setLoadingRewards(true); setErrorRewards(null); try { const response = await axiosInstance.get<Reward[]>('/rewards'); setRewards(response.data.filter(reward => reward.isActive)); console.log('Active rewards fetched:', response.data.filter(reward => reward.isActive)); } catch (error: any) { console.error('Error fetching rewards:', error); setErrorRewards(error.response?.data?.message || error.message || 'Failed to fetch rewards.'); } finally { setLoadingRewards(false); } };
    useEffect(() => { fetchUserProfile(); fetchRewards(); }, []);


    // handleValidateQr (Usa notificaciones)
    const handleValidateQr = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!qrToken) return;
        setValidatingQr(true);
        try {
            const response = await axiosInstance.post<{ message: string; pointsEarned: number }>('/points/validate-qr', { qrToken });
            notifications.show({ title: '¡Puntos Añadidos!', message: `${response.data.message} (+${response.data.pointsEarned} puntos)`, color: 'green', icon: <IconCheck size={18} />, autoClose: 5000 });
            setQrToken('');
            fetchUserProfile();
        } catch (error: any) {
            console.error('Error validating QR code:', error);
            const errorMessage = error.response?.data?.message || 'Fallo al validar el código QR.';
            notifications.show({ title: 'Error de Validación', message: errorMessage, color: 'red', icon: <IconX size={18} />, autoClose: 6000 });
        } finally {
            setValidatingQr(false);
        }
    };

    // handleRedeemReward (Usa notificaciones)
    const handleRedeemReward = async (rewardId: string) => {
        if (isRedeeming) return;
        setIsRedeeming(rewardId);
        console.log(`Attempting to redeem reward ID: ${rewardId}`);
        try {
            const response = await axiosInstance.post<{ message: string; newPointsBalance: number }>(`/points/redeem-reward/${rewardId}`);
            console.log('Redemption successful:', response.data);
            notifications.show({ title: '¡Canje Exitoso!', message: response.data.message || 'Recompensa canjeada con éxito.', color: 'green', icon: <IconCheck size={18} />, autoClose: 4000 });
            fetchUserProfile();
        } catch (error: any) {
            console.error('Error redeeming reward:', error);
            const errorMessage = error.response?.data?.message || 'Fallo al canjear la recompensa.';
            notifications.show({ title: 'Error al Canjear', message: errorMessage, color: 'red', icon: <IconX size={18} />, autoClose: 6000 });
        } finally {
            setIsRedeeming(null);
        }
    };

    // --- JSX Renderizado Principal (COMPLETO) ---
    if (loadingProfile) {
        // Mostrar Loader mientras carga el perfil inicial
        return (
            <Container size="xs" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Loader />
            </Container>
        );
    }

    if (errorProfile) {
        // Mostrar error si falla la carga del perfil
        return (
            <Container size="xs" mt="xl">
                <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
                    {errorProfile}
                </Alert>
            </Container>
        );
    }

    if (!userProfile) {
        // Mostrar mensaje si no hay datos de perfil (raro si no hubo error)
        return (
            <Container size="xs" mt="xl">
                <Text>No user profile data available.</Text>
            </Container>
        );
    }

    // Si todo está bien, mostrar el dashboard
    return (
        <Container size="lg" my="xl">
            <Stack gap="xl">
                {/* Saludo y Puntos */}
                <Paper shadow="sm" p="lg" withBorder>
                    <Group justify="space-between" align="flex-start">
                        <div>
                            <Title order={2} mb="sm">¡Hola, {userProfile.name || userProfile.email}!</Title>
                            <Text size="xl">Tienes <Text span fw={700}>{userProfile.points}</Text> puntos.</Text>
                        </div>
                         {/* Usamos el botón logout con estilo por defecto (filled) */}
                         <Button onClick={handleLogout}>Cerrar Sesión</Button>
                    </Group>
                </Paper>

                {/* Validar QR */}
                <Paper shadow="sm" p="lg" withBorder>
                     <Title order={3} mb="md">Validar Código QR</Title>
                     <form onSubmit={handleValidateQr}>
                         <Stack>
                             <TextInput label="Introduce el código:" placeholder="Pega el código aquí" value={qrToken} onChange={(event) => setQrToken(event.currentTarget.value)} required disabled={validatingQr} />
                             <Button type="submit" loading={validatingQr} disabled={!qrToken}>Validar Puntos</Button>
                             {/* Las alertas de resultado se quitaron, ahora son notificaciones */}
                         </Stack>
                     </form>
                </Paper>

                {/* Recompensas Disponibles */}
                <Paper shadow="sm" p="lg" withBorder>
                    <Title order={3} mb="md">Recompensas Disponibles</Title>
                    {/* Las alertas de resultado de canje se quitaron, ahora son notificaciones */}

                    {/* Lógica de renderizado de recompensas COMPLETA */}
                    {loadingRewards ? (
                        <Group justify="center">
                            <Loader />
                        </Group>
                    ) : errorRewards ? (
                        <Alert icon={<IconAlertCircle size={16} />} title="Error Cargando Recompensas" color="red">
                            {errorRewards}
                        </Alert>
                    ) : rewards.length === 0 ? (
                        <Text c="dimmed" ta="center">No hay recompensas disponibles en este momento.</Text>
                    ) : (
                        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
                            {rewards.map((reward) => {
                                const canAfford = userProfile.points >= reward.pointsCost;
                                const isCurrentlyRedeemingThis = isRedeeming === reward.id;
                                return (
                                    <Card shadow="sm" padding="lg" radius="md" withBorder key={reward.id}>
                                        <Stack justify="space-between" style={{ height: '100%' }}>
                                            <div>
                                                <Text fw={500}>{reward.name}</Text>
                                                <Text size="sm" c="dimmed" mt="xs">{reward.description || 'Sin descripción.'}</Text>
                                            </div>
                                            <Group justify="space-between" mt="md">
                                                 <Text fw={700}>{reward.pointsCost} Puntos</Text>
                                                <Button
                                                    variant="light"
                                                    color="blue"
                                                    size="sm"
                                                    disabled={!canAfford || !!isRedeeming}
                                                    loading={isCurrentlyRedeemingThis}
                                                    onClick={() => handleRedeemReward(reward.id)}
                                                >
                                                    {canAfford ? 'Canjear' : 'Puntos insuf.'}
                                                </Button>
                                            </Group>
                                        </Stack>
                                    </Card>
                                );
                            })}
                        </SimpleGrid>
                    )}
                </Paper>
            </Stack>
        </Container>
    );
}

export default CustomerDashboardPage;

// End of File: frontend/src/pages/CustomerDashboardPage.tsx