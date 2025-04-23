// File: frontend/src/pages/admin/AdminRewardsManagement.tsx
// Version: 1.0.0 (Component for Rewards Management Section)

import React, { useState, useEffect, useCallback } from 'react';
// Necesitaremos axiosInstance aquí
import axiosInstance from '../../services/axiosInstance'; // Ajusta la ruta si es necesario

// Importar Formulario
import RewardForm from '../../components/AddRewardForm'; // Ajusta la ruta si es necesario

// Mantine Imports necesarios para esta sección
import {
    Group, Button, Title, Text, Loader, Alert, Paper, Stack,
    Table, Badge, ActionIcon, Tooltip, Modal
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { useMantineTheme } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconAlertCircle, IconPencil, IconTrash, IconToggleLeft, IconToggleRight,
    IconCheck, IconX
} from '@tabler/icons-react';

// Interface Reward y Tipo ActionLoading (definidos aquí ahora)
interface Reward { id: string; name: string; description?: string | null; pointsCost: number; isActive: boolean; businessId: string; createdAt: string; updatedAt: string; }
type ActionLoading = { type: 'toggle' | 'delete'; id: string } | null; // Edit no necesita loading visual aquí ya que está en modal


const AdminRewardsManagement: React.FC = () => {
    // --- Estados y Hooks para esta sección ---
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState<boolean>(true); // Loading inicial
    const [error, setError] = useState<string | null>(null); // Error de carga inicial
    const [showAddForm, setShowAddForm] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<ActionLoading>(null); // Loading para acciones de tabla
    // Estado y handlers para Modal de Edición
    const [editModalOpened, { open: openEditModalHandler, close: closeEditModal }] = useDisclosure(false);
    const [editingReward, setEditingReward] = useState<Reward | null>(null);
    // Hooks de tema y media query para tabla responsiva
    const theme = useMantineTheme();
    const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

    // --- Funciones de Lógica de Recompensas ---

    // fetchRewards
    const fetchRewards = useCallback(async () => {
        // Evitar setLoading(true) si ya hay datos y solo estamos refrescando
        if (rewards.length === 0) setLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get<Reward[]>('/rewards');
            setRewards(response.data);
        } catch (err: any) {
            console.error('Error fetching rewards:', err);
            const message = `Error al cargar las recompensas: ${err.response?.data?.message || err.message || 'Error desconocido'}`;
            if (rewards.length === 0) setError(message);
            else notifications.show({ title: 'Error al Refrescar', message, color: 'red', icon: <IconX size={18}/> });
        } finally {
             // Solo quitar loading inicial si estábamos cargando desde cero
             if (loading && rewards.length === 0) setLoading(false);
             // Asegurarnos de quitar el loading si la llamada se hizo aunque hubiera datos
             else if (loading) setLoading(false);
        }
    }, [rewards.length, loading]); // Dependencias ajustadas

    // useEffect para carga inicial de recompensas
    useEffect(() => {
        fetchRewards();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Queremos que se ejecute solo al montar este componente

    // handleRewardAdded (Callback para el form en modo 'add')
    const handleRewardAdded = () => {
        setShowAddForm(false);
        fetchRewards();
    };

    // handleToggleActive
    const handleToggleActive = async (rewardId: string, currentIsActive: boolean) => {
        setActionLoading({ type: 'toggle', id: rewardId });
        const newIsActive = !currentIsActive;
        const actionText = newIsActive ? 'activada' : 'desactivada';
        try {
            await axiosInstance.patch(`/rewards/${rewardId}`, { isActive: newIsActive });
            setRewards(prevRewards => prevRewards.map(r => r.id === rewardId ? { ...r, isActive: newIsActive, updatedAt: new Date().toISOString() } : r ));
            notifications.show({ title: `Recompensa ${actionText}`, message: `La recompensa se ha ${actionText} correctamente.`, color: 'green', icon: <IconCheck size={18} />, autoClose: 4000 });
        } catch (err: any) {
            console.error('Error toggling reward active state:', err);
            const message = `Error al ${actionText} la recompensa: ${err.response?.data?.message || err.message || 'Error desconocido'}`;
            notifications.show({ title: 'Error al Actualizar Estado', message: message, color: 'red', icon: <IconX size={18} />, autoClose: 6000 });
        } finally {
            setActionLoading(null);
        }
    };

    // handleDeleteReward
    const handleDeleteReward = async (rewardId: string, rewardName: string) => {
        if (!window.confirm(`¿Estás seguro de que quieres eliminar la recompensa "${rewardName}"? Esta acción no se puede deshacer.`)) { return; }
        setActionLoading({ type: 'delete', id: rewardId });
        try {
            await axiosInstance.delete(`/rewards/${rewardId}`);
            setRewards(prevRewards => prevRewards.filter(r => r.id !== rewardId));
            notifications.show({ title: 'Recompensa Eliminada', message: `La recompensa "${rewardName}" ha sido eliminada.`, color: 'green', icon: <IconCheck size={18} />, autoClose: 4000 });
        } catch (err: any) {
            console.error('Error deleting reward:', err);
            const message = `Error al eliminar "${rewardName}": ${err.response?.data?.message || err.message || 'Error desconocido'}`;
             let notifyMessage = message;
             if (err.response?.status === 404) { notifyMessage = `No se encontró la recompensa "${rewardName}" (quizás ya fue eliminada).`; }
            notifications.show({ title: 'Error al Eliminar', message: notifyMessage, color: 'red', icon: <IconX size={18} />, autoClose: 6000 });
        } finally {
            setActionLoading(null);
        }
    };

    // Handlers para el Modal de Edición
    const handleOpenEditModal = (reward: Reward) => { setEditingReward(reward); openEditModalHandler(); };
    const handleCloseEditModal = () => { closeEditModal(); setEditingReward(null); };
    const handleRewardUpdated = () => { handleCloseEditModal(); fetchRewards(); };

    // --- Renderizado de la Tabla ---
    const renderRewardsTable = () => {
        const rows = rewards.map((reward) => {
            const iconSize = 14;
            const isLoadingToggle = actionLoading?.type === 'toggle' && actionLoading?.id === reward.id;
            const isLoadingDelete = actionLoading?.type === 'delete' && actionLoading?.id === reward.id;
            const isAnyActionLoading = !!actionLoading;
            const actionIcons = ( <> <Tooltip label="Editar Recompensa" withArrow position={isMobile ? 'bottom' : 'left'}><ActionIcon variant="subtle" color="blue" onClick={() => handleOpenEditModal(reward)} disabled={isAnyActionLoading}><IconPencil size={iconSize} stroke={1.5} /></ActionIcon></Tooltip> <Tooltip label={reward.isActive ? "Desactivar" : "Activar"} withArrow position="top"><ActionIcon variant="subtle" color={reward.isActive ? 'orange' : 'teal'} onClick={() => handleToggleActive(reward.id, reward.isActive)} loading={isLoadingToggle} disabled={isAnyActionLoading}>{reward.isActive ? <IconToggleLeft size={iconSize} stroke={1.5} /> : <IconToggleRight size={iconSize} stroke={1.5} />}</ActionIcon></Tooltip> <Tooltip label="Eliminar Recompensa" withArrow position={isMobile ? 'bottom' : 'right'}><ActionIcon variant="subtle" color="red" onClick={() => handleDeleteReward(reward.id, reward.name)} loading={isLoadingDelete} disabled={isAnyActionLoading}><IconTrash size={iconSize} stroke={1.5} /></ActionIcon></Tooltip> </> );
            return (<Table.Tr key={reward.id}><Table.Td fz={{ base: 'xs', sm: 'sm' }}>{reward.name}</Table.Td><Table.Td fz={{ base: 'xs', sm: 'sm' }}>{reward.pointsCost}</Table.Td><Table.Td><Badge color={reward.isActive ? 'green' : 'gray'} variant="light" radius="lg" fz={{ base: 'xs', sm: 'sm' }}>{reward.isActive ? 'Activa' : 'Inactiva'}</Badge></Table.Td><Table.Td>{isMobile ? (<Stack gap={2} align="flex-end">{actionIcons}</Stack>) : (<Group gap="xs" justify="flex-end" wrap="nowrap">{actionIcons}</Group>)}</Table.Td></Table.Tr>);
         });
        return (<Table striped highlightOnHover withTableBorder withColumnBorders verticalSpacing="sm"><Table.Thead><Table.Tr><Table.Th fz={{ base: 'xs', sm: 'sm' }}>Nombre</Table.Th><Table.Th fz={{ base: 'xs', sm: 'sm' }}>Coste</Table.Th><Table.Th fz={{ base: 'xs', sm: 'sm' }}>Estado</Table.Th><Table.Th style={{ textAlign: 'right' }} fz={{ base: 'xs', sm: 'sm' }}>Acciones</Table.Th></Table.Tr></Table.Thead><Table.Tbody>{rows}</Table.Tbody></Table>);
    };

    // --- Renderizado de la Sección ---
    const renderRewardsSectionContent = () => {
         if (loading) return <Group justify="center" p="lg"><Loader /></Group>;
         if (error) return (<Alert icon={<IconAlertCircle size={16} />} title="Error al cargar" color="red" radius="lg">{error}</Alert>);
         // Modificamos la condición para mostrar tabla aunque el form esté abierto
         if (rewards.length === 0 && !showAddForm) return <Text c="dimmed" ta="center" p="lg">Aún no has creado ninguna recompensa.</Text>;
         // Si hay recompensas, siempre mostramos la tabla
         if (rewards.length > 0) return renderRewardsTable();
         // Fallback por si acaso (no debería llegar aquí si rewards.length es 0 y showAddForm es true)
         return null;
    };

    // --- RENDER PRINCIPAL DEL COMPONENTE ---
    return (
        // Usamos Paper para mantener un estilo similar a como estaba antes
        <Paper shadow="xs" p="lg" withBorder radius="lg">
            <Stack gap="md">
                {/* Cabecera de la sección */}
                <Group justify="space-between" align="flex-start">
                    <Title order={2}>Gestión de Recompensas</Title>
                    <Button
                       onClick={() => setShowAddForm(!showAddForm)}
                       disabled={loading} // Deshabilitar solo si está cargando inicialmente
                       variant={showAddForm ? "outline" : "filled"}
                       radius="lg"
                    >
                         {showAddForm ? 'Cancelar Añadir' : 'Añadir Recompensa'}
                    </Button>
                </Group>

                {/* Contenido (Tabla o mensaje 'sin recompensas') */}
                {renderRewardsSectionContent()}

                {/* Formulario de Añadir (Condicional) */}
                {showAddForm && (
                    <Paper withBorder p="md" mt="md" radius="lg">
                         <RewardForm
                             mode="add"
                             onSubmitSuccess={handleRewardAdded}
                             onCancel={() => setShowAddForm(false)}
                         />
                    </Paper>
                )}
            </Stack>

            {/* Modal de Edición */}
            <Modal
                opened={editModalOpened}
                onClose={handleCloseEditModal}
                title="Editar Recompensa"
                centered
                radius="lg"
                overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
            >
                {editingReward && (
                    <RewardForm
                        mode="edit"
                        initialData={editingReward}
                        rewardIdToUpdate={editingReward.id}
                        onSubmitSuccess={handleRewardUpdated}
                        onCancel={handleCloseEditModal}
                    />
                )}
             </Modal>
        </Paper>
    );
};

export default AdminRewardsManagement;

// End of File: frontend/src/pages/admin/AdminRewardsManagement.tsx