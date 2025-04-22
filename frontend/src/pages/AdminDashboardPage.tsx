// File: frontend/src/pages/AdminDashboardPage.tsx
// Version: 1.1.9 (Fix icon size prop, cleanup table JSX whitespace - TRULY 100% COMPLETE)

import React, { useState, useEffect, useCallback } from 'react'; // Dejamos React por si acaso
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance'; // Ignorar warning de no usado si aparece

import AddRewardForm from '../components/AddRewardForm';
import GenerateQrCode from '../components/GenerateQrCode';

// --- Mantine Imports ---
import {
    AppShell, Burger, Group, Button, Title, Text, Box, Loader, Alert, Paper, Stack,
    Table, Badge, ActionIcon, Tooltip, NavLink,
    useMantineTheme
} from '@mantine/core';
// --- Importamos useMediaQuery ---
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
// --- Icon Imports ---
import {
    IconAlertCircle, IconPencil, IconTrash, IconToggleLeft, IconToggleRight,
    IconGauge, IconGift, IconQrcode, IconUsers
} from '@tabler/icons-react';

// --- Interface Reward (EXPANDIDA) ---
interface Reward {
    id: string;
    name: string;
    description?: string | null;
    pointsCost: number;
    isActive: boolean;
    businessId: string;
    createdAt: string;
    updatedAt: string;
}

const AdminDashboardPage: React.FC = () => {
    // --- Estados y hooks ---
    const navigate = useNavigate(); // Ignorar warning de no usado si aparece
    const [userName, setUserName] = useState<string | null>(null);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState<boolean>(false);
    const [opened, { toggle }] = useDisclosure(); // Para Navbar móvil
    const theme = useMantineTheme(); // <-- Hook para acceder al tema
    // --- Hook para detectar pantalla pequeña ---
    const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

    // --- Función fetchRewards (EXPANDIDA) ---
    const fetchRewards = useCallback(async () => {
        // Usamos setLoading, setError, axiosInstance, setRewards
        if (rewards.length === 0) setLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get<Reward[]>('/rewards');
            setRewards(response.data);
        } catch (err: any) {
            console.error('Error fetching rewards:', err);
            const message = `Error al cargar las recompensas: ${err.response?.data?.message || err.message || 'Error desconocido'}`;
            setError(message);
            if (rewards.length > 0) {
                 console.warn("Error refreshing rewards:", message);
            }
        } finally {
             if (loading && rewards.length === 0) setLoading(false);
        }
    }, [rewards.length, loading]); // Dependencias

    // --- useEffect (EXPANDIDO) ---
    useEffect(() => {
        // Usamos setUserName
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUserName(parsedUser.name || parsedUser.email || 'Admin');
            } catch (e) { console.error("Error parsing user data", e); setUserName('Admin'); }
        } else { setUserName('Admin'); }
        // Usamos fetchRewards
        fetchRewards();
    }, [fetchRewards]); // Dependencia correcta

    // --- handleLogout (EXPANDIDO) ---
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login'); // <-- Usamos navigate
    };

    // --- handleRewardAdded (EXPANDIDO) ---
    const handleRewardAdded = () => {
        // Usamos setShowAddForm y fetchRewards
        setShowAddForm(false);
        fetchRewards();
    };

    // --- Función para renderizar la tabla (ICON SIZE CORREGIDO, WHITESPACE AJUSTADO) ---
    const renderRewardsTable = () => {
      const rows = rewards.map((reward) => {
          const iconSize = 14; // Definimos tamaño numérico para iconos
          const actionIcons = (
              <>
                <Tooltip label="Editar Recompensa" withArrow position={isMobile ? 'bottom' : 'left'}>
                  <ActionIcon variant="subtle" color="blue" onClick={() => console.log('TODO: Editar', reward.id)}>
                    {/* --- CORRECCIÓN: size={iconSize} --- */}
                    <IconPencil size={iconSize} stroke={1.5} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label={reward.isActive ? "Desactivar" : "Activar"} withArrow position="top">
                  <ActionIcon variant="subtle" color={reward.isActive ? 'orange' : 'teal'} onClick={() => console.log('TODO: Toggle Activo', reward.id)}>
                    {/* --- CORRECCIÓN: size={iconSize} --- */}
                    {reward.isActive ? <IconToggleLeft size={iconSize} stroke={1.5} /> : <IconToggleRight size={iconSize} stroke={1.5} />}
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Eliminar Recompensa" withArrow position={isMobile ? 'bottom' : 'right'}>
                   <ActionIcon variant="subtle" color="red" onClick={() => console.log('TODO: Eliminar', reward.id)}>
                     {/* --- CORRECCIÓN: size={iconSize} --- */}
                     <IconTrash size={iconSize} stroke={1.5} />
                   </ActionIcon>
                 </Tooltip>
              </>
          );

          // --- CORRECCIÓN: Sin espacios extra entre <tr> y <td> ---
          return (
            <Table.Tr key={reward.id}>
              <Table.Td fz={{ base: 'xs', sm: 'sm' }}>{reward.name}</Table.Td><Table.Td fz={{ base: 'xs', sm: 'sm' }}>{reward.pointsCost}</Table.Td><Table.Td>
                 <Badge color={reward.isActive ? 'green' : 'gray'} variant="light" radius="lg" fz={{ base: 'xs', sm: 'sm' }}>
                   {reward.isActive ? 'Activa' : 'Inactiva'}
                 </Badge>
              </Table.Td><Table.Td>
                 {/* Renderizado condicional usando isMobile */}
                 {isMobile ? (
                     <Stack gap={2} align="flex-end">{actionIcons}</Stack>
                 ) : (
                     <Group gap="xs" justify="flex-end" wrap="nowrap">{actionIcons}</Group>
                 )}
              </Table.Td>
            </Table.Tr>
          );
      }); // Fin de rows.map

      // --- Retorno de renderRewardsTable ---
      return (
        <Table striped highlightOnHover withTableBorder withColumnBorders verticalSpacing="sm">
          <Table.Thead>
            {/* --- CORRECCIÓN: Sin espacios extra entre <tr> y <th> --- */}
            <Table.Tr>
              <Table.Th fz={{ base: 'xs', sm: 'sm' }}>Nombre</Table.Th><Table.Th fz={{ base: 'xs', sm: 'sm' }}>Coste</Table.Th><Table.Th fz={{ base: 'xs', sm: 'sm' }}>Estado</Table.Th><Table.Th style={{ textAlign: 'right' }} fz={{ base: 'xs', sm: 'sm' }}>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          {/* --- CORRECCIÓN: Sin espacios extra entre <tbody> y {rows} --- */}
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      );
    }; // Fin de renderRewardsTable

    // --- Función renderRewardsSectionContent (sin Box con scroll) ---
    const renderRewardsSectionContent = () => {
         if (loading && rewards.length === 0) return <Group justify="center" p="lg"><Loader /></Group>;
         if (error && rewards.length === 0) return (<Alert icon={<IconAlertCircle size={16} />} title="Error al cargar" color="red" radius="lg">{error}</Alert>);
         if (rewards.length === 0) return <Text c="dimmed" ta="center" p="lg">Aún no has creado ninguna recompensa.</Text>;
         // Quitamos el Box con scroll, confiando en que apilar acciones es suficiente
         return renderRewardsTable();
    }; // Fin de renderRewardsSectionContent

    // --- RENDER PRINCIPAL CON APPSHELL ---
    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{ width: 250, breakpoint: 'sm', collapsed: { mobile: !opened } }}
            padding="md"
        >
            {/* Cabecera */}
            <AppShell.Header>
                <Group h="100%" px="md" justify="space-between">
                     <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                     <Title order={3} hiddenFrom="sm">LoyalPyME Admin</Title>
                     <Title order={4} visibleFrom="sm">LoyalPyME Admin</Title>
                     <Group gap="xs">
                        {/* Uso de userName */}
                        <Text size="sm" visibleFrom="xs">Bienvenido, {userName || 'Admin'}!</Text>
                        <Button variant="light" size="sm" onClick={handleLogout} radius="lg">Cerrar Sesión</Button>
                     </Group>
                </Group>
            </AppShell.Header>

            {/* Navbar */}
             <AppShell.Navbar p="md">
               <NavLink href="#dashboard" label="Dashboard" leftSection={<IconGauge size="1rem" stroke={1.5} />} active onClick={(event) => event.preventDefault()} />
               <NavLink href="#rewards" label="Recompensas" leftSection={<IconGift size="1rem" stroke={1.5} />} onClick={(event) => event.preventDefault()} />
               <NavLink href="#generate-qr" label="Generar QR" leftSection={<IconQrcode size="1rem" stroke={1.5} />} onClick={(event) => event.preventDefault()} />
               <NavLink href="#customers" label="Clientes (próx.)" leftSection={<IconUsers size="1rem" stroke={1.5} />} disabled onClick={(event) => event.preventDefault()} />
             </AppShell.Navbar>

            {/* Contenido Principal */}
            <AppShell.Main>
                 <Title order={1} mb="xl">Panel de Administración</Title>
                 {/* Sección Recompensas */}
                 <Paper shadow="xs" p="lg" withBorder radius="lg" mb="xl">
                     <Stack gap="md">
                         <Group justify="space-between" align="flex-start">
                             <Title order={2}>Gestión de Recompensas</Title>
                             <Button onClick={() => setShowAddForm(!showAddForm)} disabled={loading && rewards.length === 0} variant={showAddForm ? "outline" : "filled"} radius="lg">
                                 {showAddForm ? 'Cancelar Añadir' : 'Añadir Recompensa'}
                             </Button>
                         </Group>
                         {/* Contenido */}
                         {renderRewardsSectionContent()}
                         {/* Formulario condicional */}
                         {showAddForm && (
                             <Paper withBorder p="md" mt="md" radius="lg">
                                 <AddRewardForm onRewardAdded={handleRewardAdded} onCancel={() => setShowAddForm(false)} />
                             </Paper>
                         )}
                     </Stack>
                 </Paper>
                 {/* Sección Generar QR */}
                 <Paper shadow="xs" p="lg" withBorder radius="lg">
                     <Stack gap="md">
                         <Title order={2}>Generar QR de Puntos</Title>
                         <GenerateQrCode />
                     </Stack>
                 </Paper>
                 {/* Footer */}
                 <Box mt="xl" pt="xl" style={{ textAlign: 'center' }}>
                     <Text c="dimmed" size="sm">LoyalPyME v1.0 MVP</Text>
                 </Box>
            </AppShell.Main>
        </AppShell>
    );
}; // Fin del componente AdminDashboardPage


// --- Interface Reward (Expandida) ---
interface Reward {
    id: string; name: string; description?: string | null; pointsCost: number;
    isActive: boolean; businessId: string; createdAt: string; updatedAt: string;
}

// Export
export default AdminDashboardPage;

// End of File: frontend/src/pages/AdminDashboardPage.tsx