// filename: frontend/src/pages/admin/AdminOverview.tsx
// Version: 1.2.1 (Pass 'color' prop to StatCard components)

import { useEffect, useState } from 'react';
import {
    Container, Title, Text, SimpleGrid, Card, Button, Group, Stack,
    Loader, Alert
} from '@mantine/core';
import {
    IconGift, IconStairsUp, IconQrcode, IconUsers, IconSettings,
    IconUserPlus, IconTicket, IconAlertCircle
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';

// Importar el servicio y el tipo de datos
import { getAdminDashboardStats, AdminOverviewStats } from '../../services/adminService'; // Ajusta la ruta si es necesario
// Importar el nuevo componente StatCard
import StatCard from '../../components/admin/StatCard'; // Ajusta la ruta si es necesario

function AdminOverview() {
    // Estados existentes para nombre de admin y negocio
    const [adminName, setAdminName] = useState<string | null>(null);
    const [businessName, setBusinessName] = useState<string | null>(null);

    // Estados para Estadísticas
    const [statsData, setStatsData] = useState<AdminOverviewStats | null>(null);
    const [loadingStats, setLoadingStats] = useState<boolean>(true);
    const [errorStats, setErrorStats] = useState<string | null>(null);

    // useEffect para cargar datos del admin/negocio (sin cambios)
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

    // useEffect para cargar estadísticas (sin cambios en la lógica de fetch)
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


    // Rutas conocidas (sin cambios)
    const routes = {
        rewards: '/admin/dashboard/rewards',
        generateQr: '/admin/dashboard/generate-qr',
        manageTiers: '/admin/dashboard/tiers/manage',
        settingsTiers: '/admin/dashboard/tiers/settings',
        customers: '/admin/dashboard/customers',
    };

    return (
        <Container size="lg" mt="md">
            <Stack gap="xl">
                {/* Saludo e Intro (sin cambios) */}
                <Title order={2}>¡Bienvenido, {adminName || 'Admin'}!</Title>
                <Text fz="lg">
                    Estás en el panel de administración de <Text span fw={700}>{businessName || '...'}</Text>.
                </Text>
                <Text c="dimmed">
                    Desde aquí podrás gestionar tu programa de fidelización: configura niveles,
                    recompensas, clientes y genera códigos QR.
                </Text>

                {/* --- SECCIÓN Estadísticas Clave ACTUALIZADA --- */}
                <Title order={3} mt="lg">Resumen Rápido</Title>
                {loadingStats && (
                    <Group justify="center" p="lg"><Loader /></Group>
                )}
                {errorStats && !loadingStats && (
                    <Alert title="Error al cargar resumen" color="red" icon={<IconAlertCircle size={18} />}>
                        {errorStats}
                    </Alert>
                )}
                {!loadingStats && !errorStats && ( // Mostramos incluso si statsData es null (StatCard maneja el valor null)
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
                        {/* CORRECCIÓN: Añadido prop 'color' a cada StatCard */}
                        <StatCard
                            title="Clientes Activos"
                            value={statsData?.totalActiveCustomers} // Usamos optional chaining por si statsData es null inicialmente
                            icon={<IconUsers size={24} stroke={1.5} />}
                            loading={loadingStats}
                            color="blue" // <--- AÑADIDO
                        />
                        <StatCard
                            title="Nuevos (7d)"
                            value={statsData?.newCustomersLast7Days}
                            icon={<IconUserPlus size={24} stroke={1.5} />}
                            loading={loadingStats}
                            color="teal" // <--- AÑADIDO
                        />
                        <StatCard
                            title="Puntos Otorgados (7d)"
                            value={statsData?.pointsIssuedLast7Days}
                            icon={<IconTicket size={24} stroke={1.5} />}
                            loading={loadingStats}
                            color="grape" // <--- AÑADIDO
                        />
                        <StatCard
                            title="Canjes (7d)"
                            value={statsData?.rewardsRedeemedLast7Days}
                            icon={<IconGift size={24} stroke={1.5} />}
                            loading={loadingStats}
                            color="orange" // <--- AÑADIDO
                        />
                    </SimpleGrid>
                )}
                {/* --- FIN SECCIÓN ACTUALIZADA --- */}


                {/* Sección Accesos Rápidos (sin cambios) */}
                <Title order={3} mt="lg">Accesos Rápidos</Title>
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                    {/* ... (resto de las Card de Accesos Rápidos idénticas a tu versión) ... */}
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