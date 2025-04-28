// filename: frontend/src/pages/admin/AdminOverview.tsx
// Version: 1.3.2 (Fix trend calculation for zero previous value)

import { useEffect, useState, useMemo } from 'react';
import {
    Container, Title, Text, SimpleGrid, Card, Button, Group, Stack,
    Loader, Alert
} from '@mantine/core';
import {
    IconGift, IconStairsUp, IconQrcode, IconUsers, IconSettings,
    IconUserPlus, IconTicket, IconAlertCircle
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';

// Importar el servicio y el tipo de datos actualizado
import { getAdminDashboardStats, AdminOverviewStats } from '../../services/adminService';
// Importar el componente StatCard
import StatCard from '../../components/admin/StatCard';

// Definimos el tipo TrendDirection localmente
type TrendDirection = 'up' | 'down' | 'neutral';

function AdminOverview() {
    // Estados
    const [adminName, setAdminName] = useState<string | null>(null);
    const [businessName, setBusinessName] = useState<string | null>(null);
    const [statsData, setStatsData] = useState<AdminOverviewStats | null>(null);
    const [loadingStats, setLoadingStats] = useState<boolean>(true);
    const [errorStats, setErrorStats] = useState<string | null>(null);

    // useEffect para cargar datos del admin/negocio
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setAdminName(parsedUser.name || parsedUser.email || 'Admin');
                setBusinessName(parsedUser.business?.name || parsedUser.businessName || 'tu Negocio');
            } catch (e) {
                console.error("Error parsing user data for admin overview", e);
                setAdminName('Admin');
                setBusinessName('tu Negocio');
            }
        } else {
            setAdminName('Admin');
            setBusinessName('tu Negocio');
        }
    }, []);

    // useEffect para cargar estadísticas
    useEffect(() => {
        const fetchStats = async () => {
            setLoadingStats(true);
            setErrorStats(null);
            console.log("[AdminOverview] Fetching stats...");
            try {
                const data = await getAdminDashboardStats();
                setStatsData(data);
            } catch (err: any) {
                console.error("[AdminOverview] Error fetching stats:", err);
                setErrorStats(err.message || 'No se pudieron cargar las estadísticas.');
            } finally {
                setLoadingStats(false);
                console.log("[AdminOverview] Stats fetch finished.");
            }
        };
        fetchStats();
    }, []);


    // Función HELPER para Calcular Tendencia (Versión Corregida para Inf%)
    const calculateTrend = useMemo(() => (current: number | null | undefined, previous: number | null | undefined): { trendValue: string | null, trendDirection: TrendDirection | null } => {
        const currentVal = current ?? 0;
        const previousVal = previous ?? 0;

        if (previousVal === 0) {
            if (currentVal > 0) {
                // CAMBIO: En lugar de '+Inf%', devolvemos '-' pero mantenemos 'up'
                return { trendValue: '-', trendDirection: 'up' };
            }
            // Si ambos son 0, N/A neutral
            return { trendValue: 'N/A', trendDirection: 'neutral' };
        }

        // El resto del cálculo sigue igual...
        const percentageChange = ((currentVal - previousVal) / previousVal) * 100;

        // Comprobar si el resultado es inválido ANTES de formatear
        if (isNaN(percentageChange) || !isFinite(percentageChange)) {
             console.warn("Invalid percentageChange calculated:", { currentVal, previousVal, percentageChange });
             return { trendValue: 'Error', trendDirection: 'neutral'}; // Indicar error
        }

        let direction: TrendDirection = 'neutral';
        const threshold = 0.05; // Umbral pequeño para evitar flechas por cambios mínimos
        if (percentageChange > threshold) {
            direction = 'up';
        } else if (percentageChange < -threshold) {
            direction = 'down';
        }

        const formattedValue = `${percentageChange >= 0 ? '+' : ''}${percentageChange.toFixed(1)}%`;

         // Si la dirección es neutral porque el cambio es muy pequeño o cero, mostrar "0.0%"
        if (direction === 'neutral') {
             return { trendValue: "0.0%", trendDirection: 'neutral' };
        }


        return { trendValue: formattedValue, trendDirection: direction };
    }, []);


    // Rutas conocidas
    const routes = {
        rewards: '/admin/dashboard/rewards',
        generateQr: '/admin/dashboard/generate-qr',
        manageTiers: '/admin/dashboard/tiers/manage',
        settingsTiers: '/admin/dashboard/tiers/settings',
        customers: '/admin/dashboard/customers',
    };

    // CÁLCULO DE TENDENCIAS
    const newCustomersTrend = useMemo(() => {
        if (!statsData) return { trendValue: null, trendDirection: null };
        return calculateTrend(statsData.newCustomersLast7Days, statsData.newCustomersPrevious7Days);
    }, [statsData, calculateTrend]);

    const pointsIssuedTrend = useMemo(() => {
        if (!statsData) return { trendValue: null, trendDirection: null };
        return calculateTrend(statsData.pointsIssuedLast7Days, statsData.pointsIssuedPrevious7Days);
    }, [statsData, calculateTrend]);

    const rewardsRedeemedTrend = useMemo(() => {
        if (!statsData) return { trendValue: null, trendDirection: null };
        return calculateTrend(statsData.rewardsRedeemedLast7Days, statsData.rewardsRedeemedPrevious7Days);
    }, [statsData, calculateTrend]);


    return (
        <Container size="lg" mt="md">
            <Stack gap="xl">
                {/* Saludo e Intro */}
                <Title order={2}>¡Bienvenido, {adminName || 'Admin'}!</Title>
                <Text fz="lg">
                    Estás en el panel de administración de <Text span fw={700}>{businessName || '...'}</Text>.
                </Text>
                <Text c="dimmed">
                    Desde aquí podrás gestionar tu programa de fidelización: configura niveles,
                    recompensas, clientes y genera códigos QR.
                </Text>

                {/* Sección Estadísticas Clave */}
                <Title order={3} mt="lg">Resumen Rápido</Title>
                {loadingStats && (
                    <Group justify="center" p="lg"><Loader /></Group>
                )}
                {errorStats && !loadingStats && (
                    <Alert title="Error al cargar resumen" color="red" icon={<IconAlertCircle size={18} />}>
                        {errorStats}
                    </Alert>
                )}
                 {!loadingStats && !errorStats && (
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
                        <StatCard
                            title="Clientes Activos"
                            value={statsData?.totalActiveCustomers}
                            icon={<IconUsers size={24} stroke={1.5} />}
                            loading={loadingStats}
                            color="blue"
                        />
                        <StatCard
                            title="Nuevos (7d)"
                            value={statsData?.newCustomersLast7Days}
                            icon={<IconUserPlus size={24} stroke={1.5} />}
                            loading={loadingStats}
                            color="teal"
                            trendValue={newCustomersTrend.trendValue}
                            trendDirection={newCustomersTrend.trendDirection}
                        />
                        <StatCard
                            title="Puntos Otorgados (7d)"
                            value={statsData?.pointsIssuedLast7Days}
                            icon={<IconTicket size={24} stroke={1.5} />}
                            loading={loadingStats}
                            color="grape"
                            trendValue={pointsIssuedTrend.trendValue}
                            trendDirection={pointsIssuedTrend.trendDirection}
                        />
                        <StatCard
                            title="Canjes (7d)"
                            value={statsData?.rewardsRedeemedLast7Days}
                            icon={<IconGift size={24} stroke={1.5} />}
                            loading={loadingStats}
                            color="orange"
                            trendValue={rewardsRedeemedTrend.trendValue}
                            trendDirection={rewardsRedeemedTrend.trendDirection}
                        />
                    </SimpleGrid>
                )}

                {/* Sección Accesos Rápidos */}
                <Title order={3} mt="lg">Accesos Rápidos</Title>
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                     {/* Tarjeta Recompensas */}
                     <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Group justify="space-between" mt="md" mb="xs">
                            <Text fw={500}>Recompensas</Text>
                            <IconGift size={24} stroke={1.5} />
                        </Group>
                        <Text size="sm" c="dimmed" miw={60}>
                            Crea y administra las recompensas que tus clientes pueden canjear.
                        </Text>
                        <Button variant="light" color="blue" fullWidth mt="md" radius="md" component={Link} to={routes.rewards}>
                            Gestionar Recompensas
                        </Button>
                    </Card>
                    {/* Tarjeta Niveles */}
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Group justify="space-between" mt="md" mb="xs">
                            <Text fw={500}>Niveles Fidelización</Text>
                            <IconStairsUp size={24} stroke={1.5} />
                        </Group>
                        <Text size="sm" c="dimmed" miw={60}>
                            Define los diferentes niveles y beneficios para tus clientes.
                        </Text>
                        <Button variant="light" color="teal" fullWidth mt="md" radius="md" component={Link} to={routes.manageTiers}>
                            Gestionar Niveles
                        </Button>
                    </Card>
                    {/* Tarjeta Configuración Niveles */}
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                         <Group justify="space-between" mt="md" mb="xs">
                            <Text fw={500}>Configuración Niveles</Text>
                            <IconSettings size={24} stroke={1.5} />
                        </Group>
                        <Text size="sm" c="dimmed" miw={60}>
                            Ajusta la lógica de cómo los clientes suben o bajan de nivel.
                        </Text>
                        <Button variant="light" color="orange" fullWidth mt="md" radius="md" component={Link} to={routes.settingsTiers}>
                            Ajustar Configuración
                        </Button>
                    </Card>
                    {/* Tarjeta Generar QR */}
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Group justify="space-between" mt="md" mb="xs">
                            <Text fw={500}>Generar QR Puntos</Text>
                            <IconQrcode size={24} stroke={1.5} />
                        </Group>
                        <Text size="sm" c="dimmed" miw={60}>
                            Crea códigos QR únicos para que tus clientes sumen puntos.
                        </Text>
                        <Button variant="light" color="grape" fullWidth mt="md" radius="md" component={Link} to={routes.generateQr}>
                            Generar Código QR
                        </Button>
                    </Card>
                    {/* Tarjeta Clientes */}
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                       <Group justify="space-between" mt="md" mb="xs">
                            <Text fw={500}>Clientes</Text>
                            <IconUsers size={24} stroke={1.5} />
                        </Group>
                        <Text size="sm" c="dimmed" miw={60}>
                            Consulta y gestiona la lista de tus clientes registrados.
                        </Text>
                        <Button variant="light" color="indigo" fullWidth mt="md" radius="md" component={Link} to={routes.customers}>
                            Gestionar Clientes
                        </Button>
                    </Card>
                </SimpleGrid>
            </Stack>
        </Container>
    );
}

export default AdminOverview;
// End of file: frontend/src/pages/admin/AdminOverview.tsx