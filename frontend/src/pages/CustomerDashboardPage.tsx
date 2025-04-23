// File: frontend/src/pages/CustomerDashboardPage.tsx
// Version: 1.5.2 (Fix Mantine v7 responsive style syntax - COMPLETE CODE)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Mantine Imports
import { Container, Text, Paper, Title, Stack, SimpleGrid, Card, Button, Group, TextInput, Alert, Skeleton, Modal, MantineTheme } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
// QR Reader Import
import { QrReader } from 'react-qr-reader';
// Notifications Import
import { notifications } from '@mantine/notifications';
// Icons Import
import { IconAlertCircle, IconCheck, IconX, IconGift, IconKey, IconScan } from '@tabler/icons-react';
// Axios Instance Import
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
    const [qrTokenInput, setQrTokenInput] = useState<string>('');
    const [validatingQr, setValidatingQr] = useState<boolean>(false);
    const [isRedeeming, setIsRedeeming] = useState<string | null>(null);
    const navigate = useNavigate();
    const [scannerOpened, { open: openScanner, close: closeScanner }] = useDisclosure(false);

    // --- Funciones ---
    const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); };
    const fetchUserProfile = async () => { setLoadingProfile(true); setErrorProfile(null); try { const response = await axiosInstance.get<UserProfile>('/profile'); setUserProfile(response.data); } catch (error: any) { console.error('Error fetching user profile:', error); if (error.response?.status === 401 || error.response?.status === 403) { handleLogout(); } else { setErrorProfile(error.response?.data?.message || error.message || 'Failed to fetch profile.'); } } finally { setLoadingProfile(false); } };
    const fetchRewards = async () => { setLoadingRewards(true); setErrorRewards(null); try { const response = await axiosInstance.get<Reward[]>('/customer/rewards'); setRewards(response.data); } catch (error: any) { console.error('Error fetching rewards:', error); const message = error.response?.data?.message || 'No se pudieron cargar las recompensas.'; setErrorRewards(message); } finally { setLoadingRewards(false); } };
    useEffect(() => { fetchUserProfile(); fetchRewards(); }, []);
    const validateToken = async (token: string) => { if (!token || validatingQr) return; setValidatingQr(true); try { const response = await axiosInstance.post<{ message: string; pointsEarned: number }>('/points/validate-qr', { qrToken: token }); notifications.show({ title: '¡Puntos Añadidos!', message: `${response.data.message} (+${response.data.pointsEarned} puntos)`, color: 'green', icon: <IconCheck size={18} />, autoClose: 5000 }); setQrTokenInput(''); fetchUserProfile(); } catch (error: any) { console.error('Error validating QR code:', error); const errorMessage = error.response?.data?.message || 'Fallo al validar el código QR.'; notifications.show({ title: 'Error de Validación', message: errorMessage, color: 'red', icon: <IconX size={18} />, autoClose: 6000 }); } finally { setValidatingQr(false); } };
    const handleValidateQrManual = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); validateToken(qrTokenInput); };
    const handleRedeemReward = async (rewardId: string, rewardName: string) => { if (isRedeeming) return; setIsRedeeming(rewardId); try { const response = await axiosInstance.post<{ message: string; newPointsBalance: number }>(`/points/redeem-reward/${rewardId}`); notifications.show({ title: '¡Canje Exitoso!', message: response.data.message || `Recompensa "${rewardName}" canjeada.`, color: 'green', icon: <IconGift size={18} />, autoClose: 4000 }); fetchUserProfile(); } catch (error: any) { console.error('Error redeeming reward:', error); const errorMessage = error.response?.data?.message || 'Fallo al canjear la recompensa.'; notifications.show({ title: 'Error al Canjear', message: errorMessage, color: 'red', icon: <IconX size={18} />, autoClose: 6000 }); } finally { setIsRedeeming(null); } };

    // --- Renderizado Condicional Inicial: Bloque if (loadingProfile) ---
    if (loadingProfile) {
        return (
            <Container size="lg" my="xl">
                <Stack gap="xl">
                    {/* Skeleton para la sección del perfil */}
                    <Paper shadow="sm" p="lg" withBorder radius="lg">
                        <Group justify="space-between" align="flex-start">
                            <div> <Skeleton height={30} width="60%" mb="md" /> <Skeleton height={20} width="40%" /> </div>
                             <Skeleton height={36} width={120} radius="md" />
                        </Group>
                    </Paper>
                    {/* Skeleton para la sección de validar QR */}
                     <Paper shadow="sm" p="lg" withBorder radius="lg">
                         <Skeleton height={25} width="40%" mb="md" /> <Skeleton height={36} mb="sm"/> <Skeleton height={36} />
                     </Paper>
                    {/* Skeleton para la sección de recompensas */}
                    <Paper shadow="sm" p="lg" withBorder radius="lg">
                        <Skeleton height={25} width="50%" mb="lg" />
                        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
                            {[1, 2, 3].map((i) => (
                                <Card shadow="sm" padding="lg" radius="md" withBorder key={i}>
                                    <Stack justify="space-between" style={{ height: '100%' }}>
                                        <div> <Skeleton height={20} width="80%" mb="sm" /> <Skeleton height={14} mb="xs" /> <Skeleton height={14} width="70%" mb="md" /> </div>
                                        <Group justify="space-between"> <Skeleton height={20} width="30%" /> <Skeleton height={30} width="40%" radius="sm" /> </Group>
                                    </Stack>
                                </Card>
                            ))}
                        </SimpleGrid>
                    </Paper>
                </Stack>
            </Container>
        );
    }

    // --- Renderizado Condicional Inicial: Bloque if (errorProfile) ---
    if (errorProfile) {
        return (
            <Container pt="xl">
                <Alert icon={<IconAlertCircle size={16} />} title="Error de Perfil" color="red">
                    {errorProfile}
                </Alert>
            </Container>
        );
    }

    // --- Renderizado Condicional Inicial: Bloque if (!userProfile) ---
    if (!userProfile) {
        return (
            <Container pt="xl">
                <Text>No se pudieron cargar los datos del perfil.</Text>
            </Container>
        );
     }

    // --- Renderizado Principal ---
    return (
        <> {/* Fragmento necesario para el Modal */}
            <Container size="lg" my="xl">
                <Stack gap="xl">
                    {/* Sección Perfil */}
                    <Paper shadow="sm" p="lg" withBorder radius="lg">
                        <Group
                            justify="space-between"
                            gap="md"
                            align="flex-start"
                            style={(theme: MantineTheme) => ({
                                flexDirection: 'row',
                                [`@media (max-width: ${theme.breakpoints.sm})`]: {
                                    flexDirection: 'column',
                                    alignItems: 'stretch',
                                    gap: theme.spacing.sm,
                                },
                           })}
                        >
                            <div>
                                <Title order={2} mb="sm">¡Hola, {userProfile.name || userProfile.email}!</Title>
                                <Text size="xl">Tienes <Text span fw={700}>{userProfile.points}</Text> puntos.</Text>
                            </div>
                            <Button
                                leftSection={<IconKey size={16} />}
                                onClick={handleLogout}
                                fullWidth={true}
                                style={(theme: MantineTheme) => ({
                                     [`@media (min-width: ${theme.breakpoints.sm})`]: {
                                        maxWidth: '160px',
                                        alignSelf: 'flex-start',
                                        flexShrink: 0,
                                        width: 'auto',
                                    }
                                 })}
                             >
                                Cerrar Sesión
                             </Button>
                        </Group>
                    </Paper>

                    {/* Sección Validar QR con 2 Opciones */}
                    <Paper shadow="sm" p="lg" withBorder radius="lg">
                        <Title order={3} mb="md">Validar Puntos</Title>
                        <form onSubmit={handleValidateQrManual}>
                            <Stack>
                                <TextInput
                                    label="Opción 1: Introduce el código manualmente:"
                                    placeholder="Pega el código aquí"
                                    value={qrTokenInput}
                                    onChange={(event) => setQrTokenInput(event.currentTarget.value)}
                                    required
                                    disabled={validatingQr}
                                />
                                <Button type="submit" loading={validatingQr} disabled={!qrTokenInput}>
                                    Validar Código
                                </Button>
                            </Stack>
                        </form>
                        <Button
                            mt="md"
                            leftSection={<IconScan size={18} />}
                            variant="outline"
                            onClick={openScanner}
                            disabled={validatingQr}
                        >
                            Opción 2: Escanear Código QR
                        </Button>
                    </Paper>

                    {/* Sección Recompensas */}
                     <Paper shadow="sm" p="lg" withBorder radius="lg">
                        <Title order={3} mb="md">Recompensas Disponibles</Title>
                        {loadingRewards ? (
                             <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
                                {[1, 2, 3].map((i) => (
                                    <Card shadow="sm" padding="lg" radius="md" withBorder key={i}>
                                        <Stack justify="space-between" style={{ height: '100%' }}>
                                            <div> <Skeleton height={20} width="80%" mb="sm" /> <Skeleton height={14} mb="xs" /> <Skeleton height={14} width="70%" mb="md" /> </div>
                                            <Group justify="space-between"> <Skeleton height={20} width="30%" /> <Skeleton height={30} width="40%" radius="sm" /> </Group>
                                        </Stack>
                                    </Card>
                                ))}
                            </SimpleGrid>
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

            {/* Modal para el Escáner QR */}
            <Modal opened={scannerOpened} onClose={closeScanner} title="Escanear Código QR" centered size="md">
                <QrReader
                    constraints={{ facingMode: 'environment' }}
                    scanDelay={500}
                    onResult={(result, error) => {
                        if (!!result) {
                            const scannedToken = result?.getText();
                            if (scannedToken) {
                                console.log("QR Scanned:", scannedToken);
                                closeScanner();
                                validateToken(scannedToken);
                            }
                        }
                        if (!!error) {
                            // console.info(error); // Descomentar para depurar errores de escaneo
                        }
                    }}
                    videoContainerStyle={{paddingTop: '0'}}
                    videoStyle={{objectFit: 'cover', width: '100%'}}
                />
                 <Text ta="center" mt="sm" c="dimmed">Apunta la cámara al código QR</Text>
            </Modal>
        </>
    );
}

export default CustomerDashboardPage;