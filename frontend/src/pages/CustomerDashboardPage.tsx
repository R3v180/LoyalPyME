// filename: frontend/src/pages/CustomerDashboardPage.tsx
// Version: 1.2.2 (Implement actual API call for redeeming granted rewards - FULL CODE)

import { useState, useEffect, useCallback } from 'react';
import {
    Container, Title, Text, SimpleGrid, Card, Button, Skeleton, Alert, Group, TextInput, Modal, Stack, Paper, Badge, ThemeIcon, Tooltip
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCircleCheck, IconGift, IconScan, IconTicket, IconUserCircle, IconX, IconInfoCircle } from '@tabler/icons-react';
import axiosInstance from '../services/axiosInstance';
import { QrReader } from 'react-qr-reader';
import { useDisclosure } from '@mantine/hooks';
import { AxiosError} from 'axios'; // Asegurarse que AxiosResponse se usa o quitar

// --- TIPOS ---
interface Reward { id: string; name: string; description?: string; pointsCost: number; isActive: boolean; }
interface UserData { id: string; email: string; name?: string | null; points: number; role: string; currentTier?: { id: string; name: string; } | null; }
interface GrantedReward {
    id: string; status: string; assignedAt: string;
    reward: { id: string; name: string; description?: string | null; };
    assignedBy?: { name?: string | null; email: string; } | null;
    business?: { name: string; } | null;
}
type DisplayReward =
    { isGift: false; id: string; name: string; description?: string | null; pointsCost: number; grantedRewardId?: undefined; assignedByString?: undefined; assignedAt?: undefined; } |
    { isGift: true; grantedRewardId: string; id: string; name: string; description?: string | null; pointsCost: 0; assignedByString: string; assignedAt: string; };
// -----------

function CustomerDashboardPage() {
    // --- Estados ---
    const [userData, setUserData] = useState<UserData | null>(null);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [grantedRewards, setGrantedRewards] = useState<GrantedReward[]>([]);
    const [displayRewards, setDisplayRewards] = useState<DisplayReward[]>([]);
    const [loadingUser, setLoadingUser] = useState(true);
    const [loadingRewards, setLoadingRewards] = useState(true);
    const [loadingGrantedRewards, setLoadingGrantedRewards] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [qrTokenInput, setQrTokenInput] = useState('');
    const [validatingQr, setValidatingQr] = useState(false);
    const [redeemingRewardId, setRedeemingRewardId] = useState<string | null>(null);
    const [scannerOpened, { open: openScanner, close: closeScanner }] = useDisclosure(false);
    const [scannerError, setScannerError] = useState<string | null>(null);
    // -------------

    // --- Lógica de Carga de Datos (fetchData) ---
    const fetchData = useCallback(async () => {
        setLoadingUser(true); setLoadingRewards(true); setLoadingGrantedRewards(true); setError(null);
        setRewards([]); setGrantedRewards([]); setDisplayRewards([]);
        try {
            const [userResponse, rewardsResponse, grantedRewardsResponse] = await Promise.all([
                axiosInstance.get<UserData>('/profile'),
                axiosInstance.get<Reward[]>('/customer/rewards'),
                axiosInstance.get<GrantedReward[]>('/customer/granted-rewards')
            ]);
            if (userResponse.data) { setUserData(userResponse.data); } else { throw new Error("No se recibieron datos del usuario."); }
            setRewards(rewardsResponse.data?.filter(reward => reward.isActive) ?? []);
            setGrantedRewards(grantedRewardsResponse.data ?? []);
        } catch (err) {
             console.error("Error fetching data:", err);
             const errorMsg = err instanceof Error ? err.message : 'Ocurrió un error desconocido.';
             let detailedError = `Error al cargar datos: ${errorMsg}.`;
              if (err instanceof AxiosError && err.response) { detailedError += ` (Status: ${err.response.status}, URL: ${err.config?.url})`; }
             setError(detailedError);
             notifications.show({ title: 'Error de Carga', message: `No se pudieron cargar todos los datos del dashboard. ${errorMsg}`, color: 'red', icon: <IconAlertCircle />, });
        } finally {
            setLoadingUser(false); setLoadingRewards(false); setLoadingGrantedRewards(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);
    // --- FIN LÓGICA DE CARGA ---


    // --- useEffect para combinar recompensas ---
    useEffect(() => {
        const gifts: DisplayReward[] = grantedRewards.map(gr => {
            const assignerName = gr.business?.name || gr.assignedBy?.name || gr.assignedBy?.email || 'Admin';
            return { isGift: true, grantedRewardId: gr.id, id: gr.reward.id, name: gr.reward.name, description: gr.reward.description, pointsCost: 0, assignedByString: assignerName, assignedAt: gr.assignedAt };
        });
        const pointsRewards: DisplayReward[] = rewards.map(r => ({ ...r, isGift: false }));
        setDisplayRewards([...gifts, ...pointsRewards]);
    }, [rewards, grantedRewards]);
    // --- FIN LÓGICA COMBINAR ---


    // --- Handlers ---
    // Handler para Validar QR
    const handleValidateQr = useCallback(async (token: string | null | undefined) => {
        if (!token) { notifications.show({ title: 'Error', message: 'Token QR inválido.', color: 'red', icon: <IconX/> }); return; }
        setValidatingQr(true); setScannerError(null);
        try {
            const response = await axiosInstance.post<{ message: string; pointsEarned: number }>('/points/validate-qr', { qrToken: token });
            notifications.show({ title: 'Éxito', message: `${response.data.message} Has ganado ${response.data.pointsEarned} puntos.`, color: 'green', icon: <IconCircleCheck />, });
            setQrTokenInput(''); closeScanner();
            await fetchData();
        } catch (err) {
            console.error("Error validating QR:", err);
            const errorMsg = (err instanceof AxiosError && err.response?.data?.message) ? err.response.data.message : (err instanceof Error ? err.message : 'Error desconocido al validar QR.');
            notifications.show({ title: 'Error de Validación', message: errorMsg, color: 'red', icon: <IconAlertCircle />, });
            if (scannerOpened) { setScannerError(errorMsg); }
        } finally { setValidatingQr(false); }
    }, [fetchData, scannerOpened, closeScanner]);

    // Handler para Canjear Recompensa POR PUNTOS
     const handleRedeemReward = useCallback(async (rewardId: string) => {
        setRedeemingRewardId(rewardId);
        try {
            const response = await axiosInstance.post<{ message: string; newPointsBalance: number }>(`/points/redeem-reward/${rewardId}`);
            notifications.show({ title: '¡Recompensa Canjeada!', message: response.data.message, color: 'teal', icon: <IconGift />, });
            setUserData(prev => prev ? { ...prev, points: response.data.newPointsBalance } : null);
        } catch (err) {
            console.error(`Error redeeming reward ${rewardId}:`, err);
            const errorMsg = (err instanceof AxiosError && err.response?.data?.message) ? err.response.data.message : (err instanceof Error ? err.message : 'Error desconocido al canjear.');
            notifications.show({ title: 'Error al Canjear', message: errorMsg, color: 'red', icon: <IconAlertCircle />, });
        } finally { setRedeemingRewardId(null); }
    }, []); // No necesita dependencia de userData aquí

    // --- handleRedeemGrantedReward MODIFICADO ---
    const handleRedeemGrantedReward = useCallback(async (grantedRewardId: string, rewardName: string) => {
         console.log(`Attempting to redeem GRANTED reward: ${grantedRewardId} (${rewardName})`);
         setRedeemingRewardId(grantedRewardId); // Usar el ID de la instancia GrantedReward
         try {
              // --- LLAMADA REAL A LA API ---
              await axiosInstance.post(`/customer/granted-rewards/${grantedRewardId}/redeem`);
              // -----------------------------

              notifications.show({
                  title: '¡Regalo Canjeado!', // Mensaje final
                  message: `Has canjeado "${rewardName}".`,
                  color: 'green',
                  icon: <IconCircleCheck /> // Usar el icono correcto
              });
              fetchData(); // Recarga todos los datos para actualizar la lista

         } catch (err) {
              console.error(`Error redeeming granted reward ${grantedRewardId}:`, err);
              const errorMsg = (err instanceof AxiosError && err.response?.data?.message)
                             ? err.response.data.message
                             : (err instanceof Error ? err.message : 'No se pudo canjear el regalo.');
               notifications.show({
                   title: 'Error al Canjear Regalo',
                   message: errorMsg,
                   color: 'red',
                   icon: <IconAlertCircle />
                });
         } finally {
              setRedeemingRewardId(null);
         }
     }, [fetchData]); // Depende de fetchData para refrescar
    // --- FIN handleRedeemGrantedReward MODIFICADO ---

    // --- FIN HANDLERS ---


    // --- Renderizado (JSX Completo) ---
    return (
        <Container size="lg" py="xl">
            <Title order={2} ta="center" mb="lg">Panel de Cliente</Title>

            {/* Sección de Datos del Usuario */}
             <Paper shadow="sm" p="lg" mb="xl" withBorder>
                 {loadingUser ? ( <Stack w="100%"><Skeleton height={30} width="60%" /><Skeleton height={50} width="40%" /><Skeleton height={25} width="30%" mt="sm" /></Stack> )
                  : userData ? ( <Stack gap="xs"> <Title order={3} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><IconUserCircle size={28} />{userData.name || userData.email}</Title> <Text size="xl" fw={700} c="blue">{userData.points} Puntos</Text> <Group mt="sm"><Text fw={500}>Nivel Actual:</Text>{userData.currentTier ? (<Badge color="teal" size="lg" variant="light">{userData.currentTier.name}</Badge>) : (<Badge color="gray" size="lg" variant="light">Básico</Badge>)}</Group> </Stack> )
                  : (<Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red">{error || 'No se pudieron cargar los datos del usuario.'}</Alert>)}
             </Paper>

            {/* Sección para Validar QR */}
             <Paper shadow="sm" p="lg" mb="xl" withBorder>
                 <Title order={4} mb="md">Validar Código QR</Title>
                 <Group align="flex-end">
                     <TextInput label="Introduce el código del ticket/QR" placeholder="Pega el código aquí..." value={qrTokenInput} onChange={(event) => setQrTokenInput(event.currentTarget.value)} style={{ flexGrow: 1 }} disabled={validatingQr}/>
                     <Button onClick={() => handleValidateQr(qrTokenInput)} leftSection={<IconTicket size={18}/>} loading={validatingQr && !scannerOpened} disabled={!qrTokenInput.trim() || validatingQr} variant='outline'>Validar Código</Button>
                     <Button onClick={openScanner} leftSection={<IconScan size={18}/>} disabled={validatingQr} variant='gradient' gradient={{ from: 'blue', to: 'cyan', deg: 90 }}>Escanear QR</Button>
                 </Group>
             </Paper>

            {/* Modal del Escáner QR */}
            <Modal opened={scannerOpened} onClose={closeScanner} title="Escanear Código QR" size="md">
                 <Stack>
                     <QrReader scanDelay={500} constraints={{ facingMode: 'environment' }} containerStyle={{ width: '100%' }} videoContainerStyle={{ width: '100%', paddingTop: '75%' }} videoStyle={{ width: '100%', height: 'auto', objectFit: 'cover' }} onResult={(result: any, error: any) => { if (error && !validatingQr) { console.error("Scanner Result Error:", error); setScannerError("Error al escanear..."); } else if (result && !validatingQr) { console.log("QR Scanned:", result?.text); handleValidateQr(result?.text); } }} />
                     {scannerError && ( <Alert icon={<IconAlertCircle size="1rem" />} title="Error de Escaneo" color="red" withCloseButton onClose={() => setScannerError(null)}>{scannerError}</Alert> )}
                     <Text ta="center" c="dimmed" mt="sm">Apunta la cámara al código QR del ticket</Text>
                     {validatingQr && <Group justify='center'><Text>Validando...</Text></Group>}
                      <Button variant="outline" onClick={closeScanner} disabled={validatingQr}> Cancelar Escaneo </Button>
                 </Stack>
             </Modal>


            {/* Sección de Recompensas/Regalos */}
            <Title order={4} mb="md">Recompensas y Regalos</Title>
            {(loadingRewards || loadingGrantedRewards) ? ( <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>{[1, 2, 3].map((i) => <Skeleton key={`sk-${i}`} height={180} />)}</SimpleGrid> )
             : error && displayRewards.length === 0 ? ( <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red" mt="lg"> No se pudieron cargar las recompensas o regalos. {error} </Alert> )
             : displayRewards.length === 0 ? ( <Text>No hay recompensas ni regalos disponibles en este momento.</Text> )
             : (
                 <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                     {displayRewards.map((item) => (
                         <Card shadow="sm" padding="lg" radius="md" withBorder key={item.isGift ? `G-${item.grantedRewardId}` : `R-${item.id}`}>
                            {item.isGift ? (
                                <>
                                    <Group justify="space-between" mb="xs"><Title order={5}>{item.name}</Title><ThemeIcon color="yellow" variant="light" radius="xl" size="lg"><IconGift stroke={1.5}/></ThemeIcon></Group>
                                    {item.description && <Text size="sm" c="dimmed" mt="xs">{item.description}</Text>}
                                     <Group gap="xs" mt="md" justify='space-between'><Badge color="lime" variant='light' size="lg" radius="sm">Gratis</Badge><Tooltip multiline w={200} withArrow position="top" label={`Regalado por ${item.assignedByString} el ${new Date(item.assignedAt).toLocaleDateString()}`}><Group gap={4} style={{cursor: 'help'}}><IconInfoCircle size={16} stroke={1.5} style={{ display: 'block' }}/><Text size="xs" c="dimmed">Info</Text></Group></Tooltip></Group>
                                     <Button variant="filled" color="yellow" fullWidth mt="md" radius="md" onClick={() => handleRedeemGrantedReward(item.grantedRewardId!, item.name)} disabled={redeemingRewardId === item.grantedRewardId || !!redeemingRewardId} loading={redeemingRewardId === item.grantedRewardId} leftSection={<IconGift size={16}/>}>Canjear Regalo</Button>
                                </>
                             ) : (
                                 <>
                                     <Title order={5}>{item.name}</Title>
                                     {item.description && <Text size="sm" c="dimmed" mt="xs">{item.description}</Text>}
                                     <Text fw={500} mt="md">{item.pointsCost} Puntos</Text>
                                     <Button variant="light" color="blue" fullWidth mt="md" radius="md" onClick={() => handleRedeemReward(item.id)} disabled={!userData || userData.points < item.pointsCost || redeemingRewardId === item.id || !!redeemingRewardId} loading={redeemingRewardId === item.id} leftSection={<IconGift size={16}/>}>{userData && userData.points >= item.pointsCost ? 'Canjear Recompensa' : 'Puntos insuficientes'}</Button>
                                 </>
                             )}
                         </Card>
                     ))}
                 </SimpleGrid>
             )}
             {/* Fin Sección Recompensas */}

        </Container>
    );
    // --- FIN RENDERIZADO ---
}

export default CustomerDashboardPage;