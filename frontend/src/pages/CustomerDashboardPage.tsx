// File: frontend/src/pages/CustomerDashboardPage.tsx
// Version: 1.1.1 (Fixed missing Box import and unused icons - Truly Complete Code)

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';

// Mantine Imports
import {
    Container, Stack, Group, Title, Text, Button, Paper, Loader, Alert,
    TextInput, SimpleGrid, Card, Badge, ThemeIcon,
    Box // <-- Box importado correctamente
} from '@mantine/core';
// --- Icon Imports (Quitamos los no usados) ---
import { IconAlertCircle, IconCircleCheck, IconCoin } from '@tabler/icons-react';

// --- Interface UserData (EXPANDIDA) ---
interface UserData {
    id: string;
    email: string;
    name?: string | null;
    phone?: string | null;
    role: 'CUSTOMER_FINAL';
    isActive: boolean;
    businessId: string;
    points: number;
    marketingOptIn: boolean;
    createdAt: string;
    updatedAt: string;
}

// --- Interface Reward (EXPANDIDA) ---
interface Reward {
    id: string;
    businessId: string;
    name: string;
    description?: string | null;
    pointsCost: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

const CustomerDashboardPage: React.FC = () => {
    const navigate = useNavigate();
    // --- Estados ---
    const [userData, setUserData] = useState<UserData | null>(null);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [qrTokenInput, setQrTokenInput] = useState<string>('');
    const [validationResult, setValidationResult] = useState<string | null>(null);
    const [validationResultType, setValidationResultType] = useState<'success' | 'error' | null>(null);
    const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isSubmittingQr, setIsSubmittingQr] = useState<boolean>(false);

    // --- Funciones de Fetch y Manejadores (sin cambios internos) ---
    const stableFetchInitialData = useCallback(async () => {
        if (!userData) setIsLoadingData(true);
        setFetchError(null);
        try {
            const [profileResponse, rewardsResponse] = await Promise.all([
                axiosInstance.get<UserData>('/profile'),
                axiosInstance.get<Reward[]>('/rewards')
            ]);
            setUserData(profileResponse.data);
            setRewards(rewardsResponse.data.filter(reward => reward.isActive));
        } catch (err: any) {
            console.error('FETCH ERROR (stable):', err);
            let errorMessage = 'Error al cargar los datos.';
            if (err.response) { errorMessage = `Error ${err.response.status}: ${err.response.data?.message || err.message || 'No se pudo obtener datos.'}`; }
            else if (err.request) { errorMessage = 'No se pudo conectar con el servidor.'; }
            else { errorMessage = `Error en la petición: ${err.message}`; }
            if (!userData) setFetchError(errorMessage);
            else console.warn("Error refreshing data:", errorMessage);
        } finally {
            if (isLoadingData && !userData) setIsLoadingData(false);
        }
    }, [userData, isLoadingData]);

    useEffect(() => {
        stableFetchInitialData();
    }, [stableFetchInitialData]);

    const handleQrValidationSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setValidationResult(null); setValidationResultType(null);
        if (!qrTokenInput.trim()) { setValidationResult('Por favor, introduce un código QR.'); setValidationResultType('error'); return; }
        setIsSubmittingQr(true);
        try {
            const response = await axiosInstance.post<{ message: string; pointsEarned: number }>('/points/validate-qr', { qrToken: qrTokenInput.trim() });
            setValidationResult(`${response.data.message} (+${response.data.pointsEarned} puntos)`);
            setValidationResultType('success');
            setQrTokenInput('');
            stableFetchInitialData();
        } catch (err: any) {
            console.error('Error validating QR code:', err);
            setValidationResult(`Error al validar: ${err.response?.data?.message || err.message || 'Error desconocido'}`);
            setValidationResultType('error');
        } finally {
            setIsSubmittingQr(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    // --- RENDER (JSX sin cambios internos respecto a v1.1.1) ---
    return (
        <Container size="lg" py="lg">
            {/* Cabecera */}
            <Group justify="space-between" mb="xl">
                <Title order={2}>Hola, {userData?.name || userData?.email || 'Cliente'}!</Title>
                <Button variant="light" onClick={handleLogout} radius="lg">Cerrar Sesión</Button>
            </Group>

             {/* Error General / Carga Inicial */}
             {isLoadingData && !userData && (<Group justify='center' p="xl"><Loader /></Group>)}
              {fetchError && !userData && (
                 <Alert icon={<IconAlertCircle size={16} />} title="Error al Cargar Datos" color="red" radius="lg" mb="lg">
                      {fetchError} -- Por favor, intenta recargar la página o contacta con soporte.
                 </Alert>
             )}

            {/* Contenido Principal */}
             {!fetchError && (
                <Stack gap="xl">
                    {/* Sección Puntos */}
                    <Paper shadow="xs" p="lg" withBorder radius="lg">
                         <Group>
                             <ThemeIcon size="xl" radius="lg" variant="light"><IconCoin stroke={1.5} /></ThemeIcon>
                             <div>
                                <Text c="dimmed" size="sm">Tus Puntos</Text>
                                <Text fz="2rem" fw={700}>{userData?.points ?? 0}</Text>
                             </div>
                         </Group>
                    </Paper>

                    {/* Sección Validar QR */}
                    <Paper shadow="xs" p="lg" withBorder radius="lg">
                        <Title order={3} mb="md">Validar Código QR</Title>
                        <form onSubmit={handleQrValidationSubmit}>
                            <Group align="flex-end">
                                <TextInput label="Introduce el código:" placeholder="Pega el código aquí" value={qrTokenInput} onChange={(e) => setQrTokenInput(e.currentTarget.value)} required disabled={isSubmittingQr} radius="lg" style={{ flexGrow: 1 }}/>
                                <Button type="submit" loading={isSubmittingQr} radius="lg">Validar Puntos</Button>
                            </Group>
                        </form>
                        {validationResult && (
                            <Alert icon={validationResultType === 'success' ? <IconCircleCheck size={16} /> : <IconAlertCircle size={16} />} title={validationResultType === 'success' ? "Éxito" : "Error"} color={validationResultType === 'error' ? 'red' : 'green'} radius="lg" mt="md" withCloseButton={false}>
                                {validationResult}
                            </Alert>
                        )}
                    </Paper>

                    {/* Sección Recompensas Disponibles */}
                    <Paper shadow="xs" p="lg" withBorder radius="lg">
                        <Title order={3} mb="md">Recompensas Disponibles</Title>
                        {!isLoadingData && rewards.length === 0 && (<Text c="dimmed">No hay recompensas activas disponibles en este momento.</Text>)}
                        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
                            {rewards.map((reward) => {
                                const canAfford = userData ? userData.points >= reward.pointsCost : false;
                                return (
                                    <Card shadow="sm" padding="lg" radius="lg" withBorder key={reward.id} style={{ opacity: canAfford ? 1 : 0.6 }}>
                                        <Group justify="space-between" mb="xs">
                                            <Text fw={500}>{reward.name}</Text>
                                            <Badge color="blue" variant="light" radius="lg">{reward.pointsCost} Puntos</Badge>
                                        </Group>
                                        <Text size="sm" c="dimmed" mb="md">{reward.description || 'Sin descripción adicional.'}</Text>
                                        <Button variant="light" color="blue" fullWidth mt="md" radius="lg" disabled={!canAfford} onClick={() => console.log("TODO: Canjear", reward.id)}>
                                            {canAfford ? 'Canjear Recompensa' : 'Puntos insuficientes'}
                                        </Button>
                                    </Card>
                                );
                            })}
                        </SimpleGrid>
                         {isLoadingData && rewards.length === 0 && (<Group justify='center' p="lg"><Loader size="sm" /></Group>)}
                    </Paper>
                </Stack>
             )}

            {/* Footer */}
            <Box mt="xl" pt="xl" style={{ textAlign: 'center' }}>
                <Text c="dimmed" size="sm">LoyalPyME v1.0 MVP</Text>
            </Box>
        </Container>
    );
};

export default CustomerDashboardPage;

// End of File: frontend/src/pages/CustomerDashboardPage.tsx