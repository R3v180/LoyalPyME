// File: frontend/src/pages/CustomerDashboardPage.tsx
// Version: 1.2.4 (Match Logout Button style to Admin primary buttons - default filled)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Mantine imports sin cambios respecto a v1.2.3
import { Container, Text, Paper, Title, Stack, SimpleGrid, Card, Button, Group, Alert, TextInput, Loader } from '@mantine/core';
import { IconAlertCircle, IconCircleCheck } from '@tabler/icons-react';
import axiosInstance from '../services/axiosInstance';

// Interfaces (sin cambios)
interface UserProfile { id: string; email: string; name?: string | null; role: string; points: number; businessId: string; }
interface Reward { id: string; name: string; description?: string | null; pointsCost: number; isActive: boolean; businessId: string; }

function CustomerDashboardPage() {
    // Estados (sin cambios)
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
    const [loadingRewards, setLoadingRewards] = useState<boolean>(true);
    const [errorProfile, setErrorProfile] = useState<string | null>(null);
    const [errorRewards, setErrorRewards] = useState<string | null>(null);
    const [qrToken, setQrToken] = useState<string>('');
    const [validatingQr, setValidatingQr] = useState<boolean>(false);
    const [qrValidationResult, setQrValidationResult] = useState<{ message: string; pointsEarned?: number; error?: boolean } | null>(null);
    const [isRedeeming, setIsRedeeming] = useState<string | null>(null);
    const [redeemError, setRedeemError] = useState<string | null>(null);
    const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
    const navigate = useNavigate();

    // Funciones (handleLogout, fetchUserProfile, fetchRewards, handleValidateQr, handleRedeemReward) (sin cambios)
    const handleLogout = () => { console.log('Logging out...'); localStorage.removeItem('token'); navigate('/login'); };
    const fetchUserProfile = async () => { setLoadingProfile(true); setErrorProfile(null); try { const response = await axiosInstance.get<UserProfile>('/profile'); setUserProfile(response.data); console.log('User profile fetched:', response.data); } catch (error: any) { console.error('Error fetching user profile:', error); if (error.response?.status === 401 || error.response?.status === 403) { handleLogout(); } else { setErrorProfile(error.response?.data?.message || error.message || 'Failed to fetch profile.'); } } finally { setLoadingProfile(false); } };
    const fetchRewards = async () => { setLoadingRewards(true); setErrorRewards(null); try { const response = await axiosInstance.get<Reward[]>('/rewards'); setRewards(response.data.filter(reward => reward.isActive)); console.log('Active rewards fetched:', response.data.filter(reward => reward.isActive)); } catch (error: any) { console.error('Error fetching rewards:', error); setErrorRewards(error.response?.data?.message || error.message || 'Failed to fetch rewards.'); } finally { setLoadingRewards(false); } };
    useEffect(() => { fetchUserProfile(); fetchRewards(); }, []);
    const handleValidateQr = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!qrToken) return; setValidatingQr(true); setQrValidationResult(null); try { const response = await axiosInstance.post<{ message: string; pointsEarned: number }>('/points/validate-qr', { qrToken }); setQrValidationResult({ message: response.data.message, pointsEarned: response.data.pointsEarned }); setQrToken(''); fetchUserProfile(); } catch (error: any) { console.error('Error validating QR code:', error); setQrValidationResult({ message: error.response?.data?.message || 'QR validation failed.', error: true }); } finally { setValidatingQr(false); } };
    const handleRedeemReward = async (rewardId: string) => { if (isRedeeming) return; setIsRedeeming(rewardId); setRedeemError(null); setRedeemSuccess(null); console.log(`Attempting to redeem reward ID: ${rewardId}`); try { const response = await axiosInstance.post<{ message: string; newPointsBalance: number }>(`/points/redeem-reward/${rewardId}`); console.log('Redemption successful:', response.data); setRedeemSuccess(response.data.message || 'Reward redeemed successfully!'); fetchUserProfile(); } catch (error: any) { console.error('Error redeeming reward:', error); const errorMessage = error.response?.data?.message || error.message || 'Failed to redeem reward.'; setRedeemError(errorMessage); } finally { setIsRedeeming(null); setTimeout(() => setRedeemSuccess(null), 5000); } };

    // JSX renderizado
    if (loadingProfile) { return <Container size="xs" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Loader /></Container>; }
    if (errorProfile) { return <Container size="xs" mt="xl"><Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">{errorProfile}</Alert></Container>; }
    if (!userProfile) { return <Container size="xs" mt="xl"><Text>No user profile data available.</Text></Container>; }

    return (
        <Container size="lg" my="xl">
            <Stack gap="xl">
                <Paper shadow="sm" p="lg" withBorder>
                    <Group justify="space-between" align="flex-start">
                        <div>
                            <Title order={2} mb="sm">¡Hola, {userProfile.name || userProfile.email}!</Title>
                            <Text size="xl">Tienes <Text span fw={700}>{userProfile.points}</Text> puntos.</Text>
                        </div>
                        {/* --- CAMBIO: Botón Logout sin variant ni size --- */}
                        <Button onClick={handleLogout}>
                            Cerrar Sesión
                        </Button>
                        {/* --- FIN CAMBIO --- */}
                    </Group>
                </Paper>

                {/* Validar QR (sin cambios) */}
                <Paper shadow="sm" p="lg" withBorder>
                    {/* ... contenido form QR ... */}
                     <Title order={3} mb="md">Validar Código QR</Title>
                     <form onSubmit={handleValidateQr}>
                         <Stack>
                             <TextInput label="Introduce el código:" placeholder="Pega el código aquí" value={qrToken} onChange={(event) => setQrToken(event.currentTarget.value)} required disabled={validatingQr} />
                             <Button type="submit" loading={validatingQr} disabled={!qrToken}>Validar Puntos</Button>
                             {qrValidationResult && (<Alert icon={qrValidationResult.error ? <IconAlertCircle size={16} /> : <IconCircleCheck size={16} />} title={qrValidationResult.error ? "Error" : "Éxito"} color={qrValidationResult.error ? "red" : "green"} mt="md" withCloseButton onClose={() => setQrValidationResult(null)}> {qrValidationResult.message} {qrValidationResult.pointsEarned && ` (+${qrValidationResult.pointsEarned} puntos)`} </Alert>)}
                         </Stack>
                     </form>
                </Paper>

                {/* Recompensas Disponibles (sin cambios) */}
                <Paper shadow="sm" p="lg" withBorder>
                     <Title order={3} mb="md">Recompensas Disponibles</Title>
                    {/* ... Alertas y lógica de renderizado de recompensas ... */}
                    {redeemError && (<Alert icon={<IconAlertCircle size={16} />} title="Error al Canjear" color="red" withCloseButton onClose={() => setRedeemError(null)} mb="md">{redeemError}</Alert>)}
                    {redeemSuccess && (<Alert icon={<IconCircleCheck size={16} />} title="Éxito" color="green" withCloseButton onClose={() => setRedeemSuccess(null)} mb="md">{redeemSuccess}</Alert>)}
                    {loadingRewards ? (<Group justify="center"><Loader /></Group>) : errorRewards ? (<Alert icon={<IconAlertCircle size={16} />} title="Error Cargando Recompensas" color="red">{errorRewards}</Alert>) : rewards.length === 0 ? (<Text>No hay recompensas disponibles en este momento.</Text>) : (<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">{rewards.map((reward) => { const canAfford = userProfile.points >= reward.pointsCost; const isCurrentlyRedeemingThis = isRedeeming === reward.id; return (<Card shadow="sm" padding="lg" radius="md" withBorder key={reward.id}><Stack justify="space-between" style={{ height: '100%' }}><div><Text fw={500}>{reward.name}</Text><Text size="sm" c="dimmed" mt="xs">{reward.description || 'Sin descripción.'}</Text></div><Group justify="space-between" mt="md"><Text fw={700}>{reward.pointsCost} Puntos</Text><Button variant="light" color="blue" size="sm" disabled={!canAfford || !!isRedeeming} loading={isCurrentlyRedeemingThis} onClick={() => handleRedeemReward(reward.id)}>{canAfford ? 'Canjear' : 'Puntos insuf.'}</Button></Group></Stack></Card>); })}</SimpleGrid>)}
                </Paper>
            </Stack>
        </Container>
    );
}

export default CustomerDashboardPage;

// End of File: frontend/src/pages/CustomerDashboardPage.tsx