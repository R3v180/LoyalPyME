// filename: src/pages/admin/AdminOverview.tsx (Actualizado con Tarjeta Config. Niveles)
import { useEffect, useState } from 'react';
import { Container, Title, Text, SimpleGrid, Card, Button, Group, Stack } from '@mantine/core';
// Asegúrate que IconSettings está importado
import { IconGift, IconStairsUp, IconQrcode, IconUsers, IconSettings } from '@tabler/icons-react';
import { Link } from 'react-router-dom';

function AdminOverview() {
    const [adminName, setAdminName] = useState<string | null>(null);
    const [businessName, setBusinessName] = useState<string | null>(null);


    useEffect(() => {
        // Intentar obtener datos desde localStorage
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

    // Rutas conocidas de tu Navbar
    const routes = {
        rewards: '/admin/dashboard/rewards',
        generateQr: '/admin/dashboard/generate-qr',
        manageTiers: '/admin/dashboard/tiers/manage',
        settingsTiers: '/admin/dashboard/tiers/settings', // <-- Ruta para Config. Niveles
        customers: '/admin/dashboard/customers',
    };

    return (
        <Container size="lg" mt="md">
            <Stack gap="xl">
                <Title order={2}>¡Bienvenido, {adminName || 'Admin'}!</Title>
                <Text fz="lg">
                    Estás en el panel de administración de <Text span fw={700}>{businessName || '...'}</Text>.
                </Text>
                <Text c="dimmed">
                    Desde aquí podrás gestionar tu programa de fidelización: configura niveles,
                    recompensas, clientes y genera códigos QR.
                </Text>

                <Title order={3} mt="lg">Accesos Rápidos</Title>
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                    {/* Tarjeta para Recompensas */}
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Group justify="space-between" mt="md" mb="xs">
                            <Text fw={500}>Recompensas</Text>
                            <IconGift size={24} stroke={1.5} />
                        </Group>
                        <Text size="sm" c="dimmed" miw={60}>
                            Crea y administra las recompensas que tus clientes pueden canjear.
                        </Text>
                        <Button
                            variant="light" color="blue" fullWidth mt="md" radius="md"
                            component={Link} to={routes.rewards}
                        >
                            Gestionar Recompensas
                        </Button>
                    </Card>

                    {/* Tarjeta para Gestionar Niveles */}
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                         <Group justify="space-between" mt="md" mb="xs">
                             <Text fw={500}>Niveles Fidelización</Text>
                             <IconStairsUp size={24} stroke={1.5} />
                         </Group>
                         <Text size="sm" c="dimmed" miw={60}>
                             Define los diferentes niveles y beneficios para tus clientes.
                         </Text>
                         <Button
                             variant="light" color="teal" fullWidth mt="md" radius="md"
                             component={Link} to={routes.manageTiers}
                         >
                            Gestionar Niveles
                         </Button>
                    </Card>

                     {/* --- NUEVA TARJETA AÑADIDA --- */}
                     <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Group justify="space-between" mt="md" mb="xs">
                            <Text fw={500}>Configuración Niveles</Text>
                            <IconSettings size={24} stroke={1.5} />
                        </Group>
                        <Text size="sm" c="dimmed" miw={60}>
                            Ajusta la lógica de cómo los clientes suben o bajan de nivel.
                        </Text>
                        <Button
                            variant="light"
                            color="orange" // Puedes cambiar el color
                            fullWidth
                            mt="md"
                            radius="md"
                            component={Link}
                            to={routes.settingsTiers} // Enlace a la configuración
                        >
                            Ajustar Configuración
                        </Button>
                    </Card>
                    {/* --- FIN NUEVA TARJETA --- */}

                     {/* Tarjeta para Generar QR */}
                     <Card shadow="sm" padding="lg" radius="md" withBorder>
                         <Group justify="space-between" mt="md" mb="xs">
                             <Text fw={500}>Generar QR Puntos</Text>
                             <IconQrcode size={24} stroke={1.5} />
                         </Group>
                         <Text size="sm" c="dimmed" miw={60}>
                             Crea códigos QR únicos para que tus clientes sumen puntos.
                         </Text>
                         <Button
                             variant="light" color="grape" fullWidth mt="md" radius="md"
                             component={Link} to={routes.generateQr}
                         >
                             Generar Código QR
                         </Button>
                    </Card>

                     {/* Tarjeta para Clientes (Placeholder) */}
                     <Card shadow="sm" padding="lg" radius="md" withBorder>
                         <Group justify="space-between" mt="md" mb="xs">
                             <Text fw={500}>Clientes</Text>
                             <IconUsers size={24} stroke={1.5} />
                         </Group>
                         <Text size="sm" c="dimmed" miw={60}>
                             Consulta y gestiona la lista de tus clientes registrados (Próximamente).
                         </Text>
                         <Button
                             variant="light" color="gray" fullWidth mt="md" radius="md"
                             disabled
                         >
                            Gestionar Clientes
                         </Button>
                    </Card>

                </SimpleGrid>
            </Stack>
        </Container>
    );
}

export default AdminOverview;