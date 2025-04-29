// filename: frontend/src/pages/admin/AdminOverview.tsx
// Version: 1.4.1 (Remove unused React import)

import { useEffect, useState } from 'react'; // Quitamos import React
import {
    Container, Title, Text, SimpleGrid, Card, Button, Group, Stack,
    Loader, Alert
} from '@mantine/core';
import {
    IconGift, IconStairsUp, IconQrcode, IconUsers, IconSettings,
    IconUserPlus, IconTicket, IconAlertCircle
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';

// Importar el hook de estadísticas
import { useAdminOverviewStats } from '../../hooks/useAdminOverviewStats';
// Importar el componente StatCard
import StatCard from '../../components/admin/StatCard';

// El tipo TrendDirection ahora podría venir del hook o definirse globalmente

function AdminOverview() {
    // Estado solo para nombre de admin y negocio
    const [adminName, setAdminName] = useState<string | null>(null);
    const [businessName, setBusinessName] = useState<string | null>(null);

    // Uso del Hook para Estadísticas y Tendencias
    const {
        statsData,
        loadingStats,
        errorStats,
        newCustomersTrend,
        pointsIssuedTrend,
        rewardsRedeemedTrend,
        // refetchStats
    } = useAdminOverviewStats();

    // useEffect para cargar datos del admin/negocio (sin cambios)
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) { try { const parsedUser = JSON.parse(storedUser); setAdminName(parsedUser.name || parsedUser.email || 'Admin'); setBusinessName(parsedUser.business?.name || parsedUser.businessName || 'tu Negocio'); } catch (e) { console.error("Error parsing user data for admin overview", e); setAdminName('Admin'); setBusinessName('tu Negocio'); } }
        else { setAdminName('Admin'); setBusinessName('tu Negocio'); }
    }, []);

    // Rutas conocidas (sin cambios)
    const routes = { rewards: '/admin/dashboard/rewards', generateQr: '/admin/dashboard/generate-qr', manageTiers: '/admin/dashboard/tiers/manage', settingsTiers: '/admin/dashboard/tiers/settings', customers: '/admin/dashboard/customers', };

    return (
        <Container size="lg" mt="md">
            <Stack gap="xl">
                {/* Saludo e Intro */}
                <Title order={2}>¡Bienvenido, {adminName || 'Admin'}!</Title>
                <Text fz="lg"> Estás en el panel de administración de <Text span fw={700}>{businessName || '...'}</Text>. </Text>
                <Text c="dimmed"> Desde aquí podrás gestionar tu programa de fidelización: configura niveles, recompensas, clientes y genera códigos QR. </Text>

                {/* Sección Estadísticas Clave */}
                <Title order={3} mt="lg">Resumen Rápido</Title>
                {loadingStats && ( <Group justify="center" p="lg"><Loader /></Group> )}
                {errorStats && !loadingStats && ( <Alert title="Error al cargar resumen" color="red" icon={<IconAlertCircle size={18} />}> {errorStats} </Alert> )}
                 {!loadingStats && !errorStats && statsData && (
                     <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
                         <StatCard title="CLIENTES ACTIVOS" value={statsData.totalActiveCustomers} icon={<IconUsers size={24} stroke={1.5} />} loading={loadingStats} color="blue" />
                         <StatCard title="NUEVOS (7D)" value={statsData.newCustomersLast7Days} icon={<IconUserPlus size={24} stroke={1.5} />} loading={loadingStats} color="teal" trendValue={newCustomersTrend.trendValue} trendDirection={newCustomersTrend.trendDirection} />
                         <StatCard title="PUNTOS (7D)" value={statsData.pointsIssuedLast7Days} icon={<IconTicket size={24} stroke={1.5} />} loading={loadingStats} color="grape" trendValue={pointsIssuedTrend.trendValue} trendDirection={pointsIssuedTrend.trendDirection} />
                         <StatCard title="CANJES (7D)" value={statsData.rewardsRedeemedLast7Days} icon={<IconGift size={24} stroke={1.5} />} loading={loadingStats} color="orange" trendValue={rewardsRedeemedTrend.trendValue} trendDirection={rewardsRedeemedTrend.trendDirection} />
                     </SimpleGrid>
                 )}
                  {!loadingStats && !errorStats && !statsData && ( <Text c="dimmed" ta="center">No hay datos estadísticos disponibles.</Text> )}

                {/* Sección Accesos Rápidos */}
                <Title order={3} mt="lg">Accesos Rápidos</Title>
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                    <Card shadow="sm" padding="lg" radius="md" withBorder> <Group justify="space-between" mt="md" mb="xs"> <Text fw={500}>Recompensas</Text> <IconGift size={24} stroke={1.5} /> </Group> <Text size="sm" c="dimmed"> Crea y administra las recompensas que tus clientes pueden canjear. </Text> <Button variant="light" color="blue" fullWidth mt="md" radius="md" component={Link} to={routes.rewards}> Gestionar Recompensas </Button> </Card>
                    <Card shadow="sm" padding="lg" radius="md" withBorder> <Group justify="space-between" mt="md" mb="xs"> <Text fw={500}>Niveles Fidelización</Text> <IconStairsUp size={24} stroke={1.5} /> </Group> <Text size="sm" c="dimmed"> Define los diferentes niveles y beneficios para tus clientes. </Text> <Button variant="light" color="teal" fullWidth mt="md" radius="md" component={Link} to={routes.manageTiers}> Gestionar Niveles </Button> </Card>
                    <Card shadow="sm" padding="lg" radius="md" withBorder> <Group justify="space-between" mt="md" mb="xs"> <Text fw={500}>Configuración Niveles</Text> <IconSettings size={24} stroke={1.5} /> </Group> <Text size="sm" c="dimmed"> Ajusta la lógica de cómo los clientes suben o bajan de nivel. </Text> <Button variant="light" color="orange" fullWidth mt="md" radius="md" component={Link} to={routes.settingsTiers}> Ajustar Configuración </Button> </Card>
                    <Card shadow="sm" padding="lg" radius="md" withBorder> <Group justify="space-between" mt="md" mb="xs"> <Text fw={500}>Generar QR Puntos</Text> <IconQrcode size={24} stroke={1.5} /> </Group> <Text size="sm" c="dimmed"> Crea códigos QR únicos para que tus clientes sumen puntos. </Text> <Button variant="light" color="grape" fullWidth mt="md" radius="md" component={Link} to={routes.generateQr}> Generar Código QR </Button> </Card>
                    <Card shadow="sm" padding="lg" radius="md" withBorder> <Group justify="space-between" mt="md" mb="xs"> <Text fw={500}>Clientes</Text> <IconUsers size={24} stroke={1.5} /> </Group> <Text size="sm" c="dimmed"> Consulta y gestiona la lista de tus clientes registrados. </Text> <Button variant="light" color="indigo" fullWidth mt="md" radius="md" component={Link} to={routes.customers}> Gestionar Clientes </Button> </Card>
                </SimpleGrid>
            </Stack>
        </Container>
    );
}

export default AdminOverview;

// End of file: frontend/src/pages/admin/AdminOverview.tsx