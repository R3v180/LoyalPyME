// filename: frontend/src/pages/CustomerDashboardPage.tsx
// --- INICIO DEL CÓDIGO COMPLETO ---
// File: frontend/src/pages/CustomerDashboardPage.tsx
// Version: 1.1.2 (Fix QrReader props: remove onError, handle error in onResult)

import { useState, useEffect } from 'react';
import {
    Container,
    Title,
    Text,
    SimpleGrid,
    Card,
    Button,
    Skeleton,
    Alert,
    Group,
    TextInput,
    Modal,
    Stack,
    Paper,
    Badge
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCircleCheck, IconGift, IconScan, IconTicket, IconUserCircle, IconX } from '@tabler/icons-react';
import axiosInstance from '../services/axiosInstance';
import { QrReader } from 'react-qr-reader';
import { useDisclosure } from '@mantine/hooks';
import { AxiosError } from 'axios';

// Interfaz para las recompensas
interface Reward {
    id: string;
    name: string;
    description?: string;
    pointsCost: number;
    isActive: boolean;
}

// Interfaz UserData (incluye currentTier)
interface UserData {
    id: string;
    email: string;
    name?: string | null;
    points: number;
    role: string;
    currentTier?: {
        id: string;
        name: string;
    } | null;
}


function CustomerDashboardPage() {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loadingUser, setLoadingUser] = useState(true);
    const [loadingRewards, setLoadingRewards] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [qrTokenInput, setQrTokenInput] = useState('');
    const [validatingQr, setValidatingQr] = useState(false);
    const [redeemingRewardId, setRedeemingRewardId] = useState<string | null>(null);

    // Modal para escaner QR
    const [scannerOpened, { open: openScanner, close: closeScanner }] = useDisclosure(false);
    const [scannerError, setScannerError] = useState<string | null>(null);


    // Función para cargar datos del usuario y recompensas
    const fetchData = async () => {
        setLoadingUser(true);
        setLoadingRewards(true);
        setError(null);
        try {
            const [userResponse, rewardsResponse] = await Promise.all([
                axiosInstance.get<UserData>('/profile'),
                axiosInstance.get<Reward[]>('/customer/rewards')
            ]);

            if (userResponse.data) {
                 setUserData(userResponse.data);
                 console.log("User data received:", userResponse.data);
            } else {
                throw new Error("No se recibieron datos del usuario.");
            }

            setRewards(rewardsResponse.data.filter(reward => reward.isActive));

        } catch (err) {
            console.error("Error fetching data:", err);
            const errorMsg = err instanceof Error ? err.message : 'Ocurrió un error desconocido.';
            setError(`Error al cargar datos: ${errorMsg}`);
            notifications.show({
                title: 'Error de Carga',
                message: `No se pudieron cargar los datos del dashboard. ${errorMsg}`,
                color: 'red',
                icon: <IconAlertCircle />,
            });
        } finally {
            setLoadingUser(false);
            setLoadingRewards(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);


    // --- Handler para Validar QR (por Input o Escáner) ---
    const handleValidateQr = async (token: string | null | undefined) => {
        if (!token) {
            notifications.show({ title: 'Error', message: 'Token QR inválido.', color: 'red', icon: <IconX/> });
            return;
        }
        setValidatingQr(true);
        setScannerError(null);
        try {
            const response = await axiosInstance.post<{ message: string; pointsEarned: number }>('/points/validate-qr', { qrToken: token });
            notifications.show({
                title: 'Éxito',
                message: `${response.data.message} Has ganado ${response.data.pointsEarned} puntos.`,
                color: 'green',
                icon: <IconCircleCheck />,
            });
            setQrTokenInput('');
            closeScanner();
            // Volver a cargar los datos del usuario para actualizar puntos y potencialmente el tier
            await fetchData();

        } catch (err) {
            console.error("Error validating QR:", err);
             const errorMsg = (err instanceof AxiosError && err.response?.data?.message)
                             ? err.response.data.message
                             : (err instanceof Error ? err.message : 'Error desconocido al validar QR.');
            notifications.show({
                title: 'Error de Validación',
                message: errorMsg,
                color: 'red',
                icon: <IconAlertCircle />,
            });
            if (scannerOpened) {
                 setScannerError(errorMsg);
            }
        } finally {
            setValidatingQr(false);
        }
    };

    // --- Handler para Canjear Recompensa ---
     const handleRedeemReward = async (rewardId: string) => {
         setRedeemingRewardId(rewardId);
         try {
             const response = await axiosInstance.post<{ message: string; newPointsBalance: number }>(`/points/redeem-reward/${rewardId}`);
             notifications.show({
                 title: '¡Recompensa Canjeada!',
                 message: response.data.message,
                 color: 'teal',
                 icon: <IconGift />,
             });
             if (userData) {
                 setUserData({ ...userData, points: response.data.newPointsBalance });
             } else {
                  await fetchData();
             }
         } catch (err) {
             console.error(`Error redeeming reward ${rewardId}:`, err);
              const errorMsg = (err instanceof AxiosError && err.response?.data?.message)
                              ? err.response.data.message
                              : (err instanceof Error ? err.message : 'Error desconocido al canjear.');
             notifications.show({
                 title: 'Error al Canjear',
                 message: errorMsg,
                 color: 'red',
                 icon: <IconAlertCircle />,
             });
         } finally {
            setRedeemingRewardId(null);
         }
     };

    // --- Renderizado ---

    return (
        <Container size="lg" py="xl">
            <Title order={2} ta="center" mb="lg">Panel de Cliente</Title>

            {/* Sección de Datos del Usuario */}
            <Paper shadow="sm" p="lg" mb="xl" withBorder>
                <Group justify="space-between" align="flex-start">
                    {loadingUser ? (
                        <Stack w="100%">
                            <Skeleton height={30} width="60%" />
                            <Skeleton height={50} width="40%" />
                            <Skeleton height={25} width="30%" mt="sm" />
                        </Stack>
                    ) : userData ? (
                         <Stack gap="xs">
                            <Title order={3} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                 <IconUserCircle size={28} />
                                 {userData.name || userData.email}
                            </Title>
                            <Text size="xl" fw={700} c="blue">
                                {userData.points} Puntos
                            </Text>
                            <Group mt="sm">
                                <Text fw={500}>Nivel Actual:</Text>
                                {userData.currentTier ? (
                                    <Badge color="teal" size="lg" variant="light">
                                        {userData.currentTier.name}
                                    </Badge>
                                ) : (
                                    <Badge color="gray" size="lg" variant="light">
                                        Básico
                                    </Badge>
                                )}
                            </Group>
                         </Stack>
                    ) : (
                        <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red">
                             {error || 'No se pudieron cargar los datos del usuario.'}
                         </Alert>
                    )}
                </Group>
            </Paper>


             {/* Sección para Validar QR */}
             <Paper shadow="sm" p="lg" mb="xl" withBorder>
                  <Title order={4} mb="md">Validar Código QR</Title>
                  <Group align="flex-end">
                     <TextInput
                         label="Introduce el código del ticket/QR"
                         placeholder="Pega el código aquí..."
                         value={qrTokenInput}
                         onChange={(event) => setQrTokenInput(event.currentTarget.value)}
                         style={{ flexGrow: 1 }}
                         disabled={validatingQr}
                     />
                     <Button
                         onClick={() => handleValidateQr(qrTokenInput)}
                         leftSection={<IconTicket size={18}/>}
                         loading={validatingQr && !scannerOpened}
                         disabled={!qrTokenInput.trim() || validatingQr}
                         variant='outline'
                     >
                         Validar Código
                     </Button>
                     <Button
                         onClick={openScanner}
                         leftSection={<IconScan size={18}/>}
                         disabled={validatingQr}
                         variant='gradient'
                         gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                      >
                         Escanear QR
                     </Button>
                 </Group>
             </Paper>

             {/* Modal del Escáner QR */}
             <Modal opened={scannerOpened} onClose={closeScanner} title="Escanear Código QR" size="md">
                 <Stack>
                     <QrReader
                         scanDelay={300}
                         // *** SECCIÓN MODIFICADA AQUÍ ***
                         // Se elimina onError y se modifica onResult
                         // eslint-disable-next-line @typescript-eslint/no-explicit-any
                         onResult={(result: any, error: any) => {
                             // Primero, comprobar si hay error
                             if (error) {
                                 console.error("Scanner Result Error:", error);
                                 // Podríamos intentar mostrar un mensaje más específico si el objeto error tiene info
                                 // Por ahora, un mensaje genérico dentro del modal
                                 setScannerError("Error al escanear el código. Inténtalo de nuevo.");
                             }
                             // Si no hay error, comprobar si hay resultado
                             else if (result) {
                                 console.log("QR Scanned:", result?.text);
                                 // Validar el token obtenido
                                 handleValidateQr(result?.text);
                             }
                             // Si no hay ni error ni resultado, no hacer nada (esperar siguiente intento)
                         }}
                         // *** FIN SECCIÓN MODIFICADA ***
                         constraints={{ facingMode: 'environment' }}
                         containerStyle={{ width: '100%' }}
                         videoContainerStyle={{ width: '100%', paddingTop: '75%' }}
                         videoStyle={{ width: '100%', height: 'auto' }}
                     />
                     {scannerError && (
                         <Alert icon={<IconAlertCircle size="1rem" />} title="Error de Escaneo" color="red" withCloseButton onClose={() => setScannerError(null)}>
                             {scannerError}
                         </Alert>
                     )}
                      <Text ta="center" c="dimmed" mt="sm">Apunta la cámara al código QR</Text>
                  </Stack>
             </Modal>


            {/* Sección de Recompensas */}
            <Title order={4} mb="md">Recompensas Disponibles</Title>
            {loadingRewards ? (
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                    {[1, 2, 3].map((i) => <Skeleton key={i} height={150} />)}
                </SimpleGrid>
            ) : error && !rewards.length ? (
                <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red" mt="lg">
                    No se pudieron cargar las recompensas disponibles. {error}
                </Alert>
            ) : !rewards.length ? (
                 <Text>No hay recompensas disponibles en este momento.</Text>
            ) : (
                 <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                     {rewards.map((reward) => (
                         <Card shadow="sm" padding="lg" radius="md" withBorder key={reward.id}>
                             <Title order={5}>{reward.name}</Title>
                             {reward.description && <Text size="sm" c="dimmed" mt="xs">{reward.description}</Text>}
                             <Text fw={500} mt="md">{reward.pointsCost} Puntos</Text>
                             <Button
                                 variant="light"
                                 color="blue"
                                 fullWidth
                                 mt="md"
                                 radius="md"
                                 onClick={() => handleRedeemReward(reward.id)}
                                 disabled={!userData || userData.points < reward.pointsCost || redeemingRewardId === reward.id || !!redeemingRewardId}
                                 loading={redeemingRewardId === reward.id}
                                 leftSection={<IconGift size={16}/>}
                              >
                                 {userData && userData.points >= reward.pointsCost ? 'Canjear Recompensa' : 'Puntos insuficientes'}
                             </Button>
                         </Card>
                     ))}
                 </SimpleGrid>
            )}

        </Container>
    );
}

export default CustomerDashboardPage;
// --- FIN DEL CÓDIGO COMPLETO ---