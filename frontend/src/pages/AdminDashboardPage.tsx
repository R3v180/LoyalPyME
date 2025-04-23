// File: frontend/src/pages/AdminDashboardPage.tsx
// Version: 1.3.0 (Implement Edit Reward Modal and Logic)

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';

// --- CAMBIO: Importar RewardForm renombrado ---
import RewardForm from '../components/AddRewardForm'; // Usamos el form adaptado
// --- FIN CAMBIO ---
import GenerateQrCode from '../components/GenerateQrCode';

// --- CAMBIO: Importar Modal ---
import {
    AppShell, Burger, Group, Button, Title, Text, Box, Loader, Alert, Paper, Stack,
    Table, Badge, ActionIcon, Tooltip, NavLink, Modal, // Añadir Modal
    useMantineTheme
} from '@mantine/core';
// --- FIN CAMBIO ---
// --- CAMBIO: Importar useDisclosure para el modal ---
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
// --- FIN CAMBIO ---
import {
    IconAlertCircle, IconPencil, IconTrash, IconToggleLeft, IconToggleRight,
    IconGauge, IconGift, IconQrcode, IconUsers
} from '@tabler/icons-react';

// Interfaz Reward (sin cambios)
interface Reward {
    id: string; name: string; description?: string | null; pointsCost: number;
    isActive: boolean; businessId: string; createdAt: string; updatedAt: string;
}

// Tipo ActionLoading (añadir 'edit')
type ActionLoading = { type: 'toggle' | 'delete' | 'edit'; id: string } | null;


const AdminDashboardPage: React.FC = () => {
    // Estados existentes
    const navigate = useNavigate();
    const [userName, setUserName] = useState<string | null>(null);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState<boolean>(false);
    const [opened, { toggle: toggleNavbar }] = useDisclosure(); // Renombrar toggle para claridad
    const theme = useMantineTheme();
    const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
    const [actionLoading, setActionLoading] = useState<ActionLoading>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    // --- NUEVO: Estado y handlers para el Modal de Edición ---
    const [editModalOpened, { open: openEditModalHandler, close: closeEditModal }] = useDisclosure(false);
    const [editingReward, setEditingReward] = useState<Reward | null>(null);

    const handleOpenEditModal = (reward: Reward) => {
        setEditingReward(reward); // Guardar la recompensa a editar
        setActionError(null); // Limpiar errores de acciones anteriores
        openEditModalHandler(); // Abrir el modal
    };

    const handleCloseEditModal = () => {
        closeEditModal(); // Cerrar modal
        setEditingReward(null); // Limpiar recompensa en edición
    };

    // Callback para cuando la edición en el form es exitosa
    const handleRewardUpdated = () => {
        handleCloseEditModal(); // Cerrar el modal
        fetchRewards(); // Refrescar la lista de recompensas
        // Podríamos añadir un mensaje de éxito aquí si quisiéramos
    };
    // --- FIN NUEVO ---


    // Funciones fetchRewards, useEffect, handleLogout, handleRewardAdded (sin cambios lógicos)
    const fetchRewards = useCallback(async () => { if (rewards.length === 0) setLoading(true); setError(null); try { const response = await axiosInstance.get<Reward[]>('/rewards'); setRewards(response.data); } catch (err: any) { console.error('Error fetching rewards:', err); const message = `Error al cargar las recompensas: ${err.response?.data?.message || err.message || 'Error desconocido'}`; if (rewards.length === 0) setError(message); else console.error("Failed to refresh rewards:", message); } finally { if (loading && rewards.length === 0) setLoading(false); } }, [rewards.length, loading]);
    useEffect(() => { const storedUser = localStorage.getItem('user'); if (storedUser) { try { const parsedUser = JSON.parse(storedUser); setUserName(parsedUser.name || parsedUser.email || 'Admin'); } catch (e) { console.error("Error parsing user data", e); setUserName('Admin'); } } else { setUserName('Admin'); } fetchRewards(); }, [fetchRewards]);
    const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); };
    const handleRewardAdded = () => { setShowAddForm(false); fetchRewards(); }; // Esta es la que se pasa a onSubmitSuccess en modo ADD

    // Funciones handleToggleActive, handleDeleteReward (sin cambios lógicos)
    const handleToggleActive = async (rewardId: string, currentIsActive: boolean) => { setActionLoading({ type: 'toggle', id: rewardId }); setActionError(null); const newIsActive = !currentIsActive; console.log(`Attempting to set isActive=${newIsActive} for reward ${rewardId}`); try { await axiosInstance.patch(`/rewards/${rewardId}`, { isActive: newIsActive }); setRewards(prevRewards => prevRewards.map(r => r.id === rewardId ? { ...r, isActive: newIsActive, updatedAt: new Date().toISOString() } : r )); } catch (err: any) { console.error('Error toggling reward active state:', err); const message = `Error al ${newIsActive ? 'activar' : 'desactivar'}: ${err.response?.data?.message || err.message || 'Error desconocido'}`; setActionError(message); } finally { setActionLoading(null); } };
    const handleDeleteReward = async (rewardId: string, rewardName: string) => { if (!window.confirm(`¿Estás seguro de que quieres eliminar la recompensa "${rewardName}"? Esta acción no se puede deshacer.`)) { return; } setActionLoading({ type: 'delete', id: rewardId }); setActionError(null); console.log(`Attempting to delete reward ${rewardId}`); try { await axiosInstance.delete(`/rewards/${rewardId}`); setRewards(prevRewards => prevRewards.filter(r => r.id !== rewardId)); } catch (err: any) { console.error('Error deleting reward:', err); const message = `Error al eliminar "${rewardName}": ${err.response?.data?.message || err.message || 'Error desconocido'}`; if (err.response?.status === 404) { setActionError(`No se encontró la recompensa "${rewardName}" (quizás ya fue eliminada). Refresca la lista.`); } else { setActionError(message); } } finally { setActionLoading(null); } };


    // Función renderRewardsTable (MODIFICADA para conectar botón Editar)
    const renderRewardsTable = () => {
      const rows = rewards.map((reward) => {
          const iconSize = 14;
          const isLoadingToggle = actionLoading?.type === 'toggle' && actionLoading?.id === reward.id;
          const isLoadingDelete = actionLoading?.type === 'delete' && actionLoading?.id === reward.id;
          // Podríamos añadir isLoadingEdit si el form de edición estuviera en línea, pero está en modal
          const isAnyActionLoading = !!actionLoading;

          const actionIcons = (
              <>
                  {/* --- CAMBIO: Conectar botón Editar --- */}
                  <Tooltip label="Editar Recompensa" withArrow position={isMobile ? 'bottom' : 'left'}>
                       <ActionIcon
                          variant="subtle"
                          color="blue"
                          onClick={() => handleOpenEditModal(reward)} // <-- LLAMA A ABRIR MODAL
                          disabled={isAnyActionLoading}
                       >
                           <IconPencil size={iconSize} stroke={1.5} />
                       </ActionIcon>
                  </Tooltip>
                  {/* --- FIN CAMBIO --- */}
                  <Tooltip label={reward.isActive ? "Desactivar" : "Activar"} withArrow position="top"><ActionIcon variant="subtle" color={reward.isActive ? 'orange' : 'teal'} onClick={() => handleToggleActive(reward.id, reward.isActive)} loading={isLoadingToggle} disabled={isAnyActionLoading}>{reward.isActive ? <IconToggleLeft size={iconSize} stroke={1.5} /> : <IconToggleRight size={iconSize} stroke={1.5} />}</ActionIcon></Tooltip>
                  <Tooltip label="Eliminar Recompensa" withArrow position={isMobile ? 'bottom' : 'right'}><ActionIcon variant="subtle" color="red" onClick={() => handleDeleteReward(reward.id, reward.name)} loading={isLoadingDelete} disabled={isAnyActionLoading}><IconTrash size={iconSize} stroke={1.5} /></ActionIcon></Tooltip>
              </>
          );
          // Resto de la fila (sin cambios)
          return (<Table.Tr key={reward.id}><Table.Td fz={{ base: 'xs', sm: 'sm' }}>{reward.name}</Table.Td><Table.Td fz={{ base: 'xs', sm: 'sm' }}>{reward.pointsCost}</Table.Td><Table.Td><Badge color={reward.isActive ? 'green' : 'gray'} variant="light" radius="lg" fz={{ base: 'xs', sm: 'sm' }}>{reward.isActive ? 'Activa' : 'Inactiva'}</Badge></Table.Td><Table.Td>{isMobile ? (<Stack gap={2} align="flex-end">{actionIcons}</Stack>) : (<Group gap="xs" justify="flex-end" wrap="nowrap">{actionIcons}</Group>)}</Table.Td></Table.Tr>);
      });
      // Retorno de la tabla (sin cambios)
      return (<Table striped highlightOnHover withTableBorder withColumnBorders verticalSpacing="sm"><Table.Thead><Table.Tr><Table.Th fz={{ base: 'xs', sm: 'sm' }}>Nombre</Table.Th><Table.Th fz={{ base: 'xs', sm: 'sm' }}>Coste</Table.Th><Table.Th fz={{ base: 'xs', sm: 'sm' }}>Estado</Table.Th><Table.Th style={{ textAlign: 'right' }} fz={{ base: 'xs', sm: 'sm' }}>Acciones</Table.Th></Table.Tr></Table.Thead><Table.Tbody>{rows}</Table.Tbody></Table>);
    };


    // Función renderRewardsSectionContent (sin cambios)
    const renderRewardsSectionContent = () => { /* ...código sin cambios... */ if (loading && rewards.length === 0) return <Group justify="center" p="lg"><Loader /></Group>; if (error && rewards.length === 0) return (<Alert icon={<IconAlertCircle size={16} />} title="Error al cargar" color="red" radius="lg">{error}</Alert>); if (rewards.length === 0) return <Text c="dimmed" ta="center" p="lg">Aún no has creado ninguna recompensa.</Text>; return renderRewardsTable(); };


    // RENDER PRINCIPAL (Añadir Modal y corregir uso de RewardForm para Add)
    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{ width: 250, breakpoint: 'sm', collapsed: { mobile: !opened } }}
            padding="md"
        >
             <AppShell.Header>
                  <Group h="100%" px="md" justify="space-between"><Burger opened={opened} onClick={toggleNavbar} hiddenFrom="sm" size="sm" /><Title order={3} hiddenFrom="sm">LoyalPyME Admin</Title><Title order={4} visibleFrom="sm">LoyalPyME Admin</Title><Group gap="xs"><Text size="sm" visibleFrom="xs">Bienvenido, {userName || 'Admin'}!</Text><Button onClick={handleLogout}>Cerrar Sesión</Button></Group></Group>
             </AppShell.Header>
              <AppShell.Navbar p="md">
                  <NavLink href="#dashboard" label="Dashboard" leftSection={<IconGauge size="1rem" stroke={1.5} />} active onClick={(event) => event.preventDefault()} /><NavLink href="#rewards" label="Recompensas" leftSection={<IconGift size="1rem" stroke={1.5} />} onClick={(event) => event.preventDefault()} /><NavLink href="#generate-qr" label="Generar QR" leftSection={<IconQrcode size="1rem" stroke={1.5} />} onClick={(event) => event.preventDefault()} /><NavLink href="#customers" label="Clientes (próx.)" leftSection={<IconUsers size="1rem" stroke={1.5} />} disabled onClick={(event) => event.preventDefault()} />
             </AppShell.Navbar>
             <AppShell.Main>
                 <Title order={1} mb="xl">Panel de Administración</Title>
                 <Paper shadow="xs" p="lg" withBorder radius="lg" mb="xl">
                     <Stack gap="md">
                         <Group justify="space-between" align="flex-start">
                             <Title order={2}>Gestión de Recompensas</Title>
                             <Button onClick={() => setShowAddForm(!showAddForm)} disabled={loading && rewards.length === 0} variant={showAddForm ? "outline" : "filled"} radius="lg">{showAddForm ? 'Cancelar Añadir' : 'Añadir Recompensa'}</Button>
                         </Group>
                         {actionError && ( <Alert icon={<IconAlertCircle size={16} />} title="Error en Acción" color="red" withCloseButton onClose={() => setActionError(null)} mt="sm" radius="lg">{actionError}</Alert> )}
                         {renderRewardsSectionContent()}
                         {showAddForm && (
                             <Paper withBorder p="md" mt="md" radius="lg">
                                 {/* --- CAMBIO: Usar RewardForm con props correctas para MODO ADD --- */}
                                 <RewardForm
                                     mode="add"
                                     onSubmitSuccess={handleRewardAdded} // La función que ya existía
                                     onCancel={() => setShowAddForm(false)}
                                 />
                                 {/* --- FIN CAMBIO --- */}
                             </Paper>
                         )}
                     </Stack>
                 </Paper>

                 {/* Sección Generar QR (sin cambios) */}
                 <Paper shadow="xs" p="lg" withBorder radius="lg">
                     {/* ... */}
                     <Stack gap="md"><Title order={2}>Generar QR de Puntos</Title><GenerateQrCode /></Stack>
                 </Paper>

                 {/* Footer (sin cambios) */}
                 <Box mt="xl" pt="xl" style={{ textAlign: 'center' }}><Text c="dimmed" size="sm">LoyalPyME v1.0 MVP</Text></Box>
             </AppShell.Main>

             {/* --- NUEVO: Modal de Edición --- */}
             <Modal
                opened={editModalOpened}
                onClose={handleCloseEditModal} // Usa el handler para limpiar estado
                title="Editar Recompensa"
                centered // Para centrar el modal
                radius="lg"
                overlayProps={{
                    backgroundOpacity: 0.55,
                    blur: 3,
                 }}
             >
                {/* Renderizar el formulario solo si hay una recompensa seleccionada */}
                {editingReward && (
                    <RewardForm
                        mode="edit"
                        initialData={editingReward} // Pasar datos iniciales
                        rewardIdToUpdate={editingReward.id} // Pasar el ID para la URL del PATCH
                        onSubmitSuccess={handleRewardUpdated} // Llamar a la función de éxito de edición
                        onCancel={handleCloseEditModal} // Usar el handler que cierra y limpia
                    />
                )}
             </Modal>
             {/* --- FIN NUEVO --- */}

        </AppShell>
    );
};

export default AdminDashboardPage;

// End of File: frontend/src/pages/AdminDashboardPage.tsx