// File: frontend/src/pages/CustomerDashboardPage.tsx
// Version: 1.3.2 (Remove unused Mantine/Icon imports - Correct Mantine v7 Usage)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Mantine Imports (Solo los necesarios para esta página)
import { Container, Text, Paper, Title, Stack, SimpleGrid, Card, Button, Group, TextInput, Loader, Alert } from '@mantine/core';
// Notifications Imports
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck, IconX, IconGift, IconKey } from '@tabler/icons-react'; // Quitamos IconQrcode, Badge, LoadingOverlay no usados aquí
import axiosInstance from '../services/axiosInstance';

// Interfaces
interface UserProfile { id: string; email: string; name?: string | null; role: string; points: number; businessId: string; }
interface Reward { id: string; name: string; description?: string | null; pointsCost: number; isActive: boolean; businessId: string; }

function CustomerDashboardPage() {
    // Estados
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
    const [loadingRewards, setLoadingRewards] = useState<boolean>(true);
    const [errorProfile, setErrorProfile] = useState<string | null>(null);
    const [errorRewards, setErrorRewards] = useState<string | null>(null);
    const [qrToken, setQrToken] = useState<string>('');
    const [validatingQr, setValidatingQr] = useState<boolean>(false);
    const [isRedeeming, setIsRedeeming] = useState<string | null>(null);
    const navigate = useNavigate();

    // Funciones
    const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); };
    const fetchUserProfile = async () => { setLoadingProfile(true); setErrorProfile(null); try { const response = await axiosInstance.get<UserProfile>('/profile'); setUserProfile(response.data); } catch (error: any) { console.error('Error fetching user profile:', error); if (error.response?.status === 401 || error.response?.status === 403) { handleLogout(); } else { setErrorProfile(error.response?.data?.message || error.message || 'Failed to fetch profile.'); } } finally { setLoadingProfile(false); } };
    const fetchRewards = async () => { setLoadingRewards(true); setErrorRewards(null); try { const response = await axiosInstance.get<Reward[]>('/customer/rewards'); setRewards(response.data); } catch (error: any) { console.error('Error fetching rewards:', error); const message = error.response?.data?.message || 'No se pudieron cargar las recompensas.'; setErrorRewards(message); } finally { setLoadingRewards(false); } };
    useEffect(() => { fetchUserProfile(); fetchRewards(); }, []);

    // handleValidateQr
    const handleValidateQr = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!qrToken) return; setValidatingQr(true); try { const response = await axiosInstance.post<{ message: string; pointsEarned: number }>('/points/validate-qr', { qrToken }); notifications.show({ title: '¡Puntos Añadidos!', message: `${response.data.message} (+${response.data.pointsEarned} puntos)`, color: 'green', icon: <IconCheck size={18} />, autoClose: 5000 }); setQrToken(''); fetchUserProfile(); } catch (error: any) { console.error('Error validating QR code:', error); const errorMessage = error.response?.data?.message || 'Fallo al validar el código QR.'; notifications.show({ title: 'Error de Validación', message: errorMessage, color: 'red', icon: <IconX size={18} />, autoClose: 6000 }); } finally { setValidatingQr(false); } };

    // handleRedeemReward
    const handleRedeemReward = async (rewardId: string, rewardName: string) => { if (isRedeeming) return; setIsRedeeming(rewardId); console.log(`Attempting to redeem reward ID: ${rewardId}`); try { const response = await axiosInstance.post<{ message: string; newPointsBalance: number }>(`/points/redeem-reward/${rewardId}`); console.log('Redemption successful:', response.data); notifications.show({ title: '¡Canje Exitoso!', message: response.data.message || `Recompensa "${rewardName}" canjeada.`, color: 'green', icon: <IconGift size={18} />, autoClose: 4000 }); fetchUserProfile(); } catch (error: any) { console.error('Error redeeming reward:', error); const errorMessage = error.response?.data?.message || 'Fallo al canjear la recompensa.'; notifications.show({ title: 'Error al Canjear', message: errorMessage, color: 'red', icon: <IconX size={18} />, autoClose: 6000 }); } finally { setIsRedeeming(null); } };

    // Renderizado condicional inicial
    if (loadingProfile) { return <Container pt="xl" style={{ display: 'flex', justifyContent: 'center' }}><Loader /></Container>; }
    if (errorProfile) { return <Container pt="xl"><Alert icon={<IconAlertCircle size={16} />} title="Error de Perfil" color="red">{errorProfile}</Alert></Container>; }
    if (!userProfile) { return <Container pt="xl"><Text>No se pudieron cargar los datos del perfil.</Text></Container>; }

    // Renderizado principal
    return (
        <Container size="lg" my="xl">
            <Stack gap="xl">
                <Paper shadow="sm" p="lg" withBorder radius="lg">
                    <Group justify="space-between" align="flex-start">
                        <div>
                            <Title order={2} mb="sm">¡Hola, {userProfile.name || userProfile.email}!</Title>
                            <Text size="xl">Tienes <Text span fw={700}>{userProfile.points}</Text> puntos.</Text>
                        </div>
                         <Button leftSection={<IconKey size={16} />} onClick={handleLogout}>Cerrar Sesión</Button>
                    </Group>
                </Paper>
                <Paper shadow="sm" p="lg" withBorder radius="lg">
                     <Title order={3} mb="md">Validar Código QR</Title>
                     <form onSubmit={handleValidateQr}>
                         <Stack>
                             <TextInput label="Introduce el código:" placeholder="Pega el código aquí" value={qrToken} onChange={(event) => setQrToken(event.currentTarget.value)} required disabled={validatingQr} />
                             <Button type="submit" loading={validatingQr} disabled={!qrToken}>Validar Puntos</Button>
                         </Stack>
                     </form>
                </Paper>
                <Paper shadow="sm" p="lg" withBorder radius="lg">
                    <Title order={3} mb="md">Recompensas Disponibles</Title>
                    {loadingRewards ? (
                        <Group justify="center"><Loader /></Group>
                    ) : errorRewards ? (
                        <Alert icon={<IconAlertCircle size={16} />} title="Error Cargando Recompensas" color="red">{errorRewards}</Alert>
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
                                                <Button variant="light" color="blue" size="sm" disabled={!canAfford || !!isRedeeming} loading={isCurrentlyRedeemingThis} onClick={() => handleRedeemReward(reward.id, reward.name)} > {canAfford ? 'Canjear' : 'Puntos insuf.'} </Button>
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