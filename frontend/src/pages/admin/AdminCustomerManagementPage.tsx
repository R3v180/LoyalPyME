// filename: frontend/src/pages/admin/AdminCustomerManagementPage.tsx
// Version: 1.6.1 (Fix: Use imported SortStatus type in ThProps)

import React, { useState, useCallback } from 'react';
import {
    Paper, Title, Stack, TextInput, Table, Loader, Alert, Pagination, Group, Text, ActionIcon,
    useMantineTheme, UnstyledButton, Center, rem
} from '@mantine/core';
import {
    IconSearch, IconAlertCircle, IconAdjustments, IconGift, IconEye, IconStar, IconToggleLeft,
    IconStairsUp, IconSelector, IconChevronDown, IconChevronUp, IconCheck, IconX
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import axiosInstance from '../../services/axiosInstance';
import AdjustPointsModal from '../../components/admin/AdjustPointsModal';
import ChangeTierModal from '../../components/admin/ChangeTierModal';
import AssignRewardModal from '../../components/admin/AssignRewardModal';
import { notifications } from '@mantine/notifications';
import classes from './AdminCustomerManagementPage.module.css';

// Importamos el hook y las interfaces necesarias
import { useAdminCustomers, Customer, SortStatus } from '../../hooks/useAdminCustomers'; // SortStatus ahora se usará

// --- Componente Th ---
// Interfaz ThProps modificada para usar SortStatus['column']
interface ThProps {
    children: React.ReactNode;
    reversed: boolean;
    sorted: boolean;
    onSort(): void;
    sortKey: SortStatus['column']; // <-- Tipo actualizado
    currentSortKey: SortStatus['column']; // <-- Tipo actualizado
    disabled?: boolean;
}

// Implementación de Th (sin cambios internos)
function Th({ children, reversed, sorted, onSort, sortKey, currentSortKey, disabled }: ThProps) {
    const Icon = sorted && currentSortKey === sortKey ? (reversed ? IconChevronUp : IconChevronDown) : IconSelector;
    const isCurrent = sorted && currentSortKey === sortKey;
    return (
        <Table.Th className={classes.th}>
            <UnstyledButton onClick={disabled ? undefined : onSort} className={classes.control} disabled={disabled}>
                <Group justify="space-between" gap={0} data-active-sort={isCurrent || undefined}>
                    <Text fw={500} fz="sm" span>{children}</Text>
                    {!disabled && (
                        <Center className={classes.icon}>
                            <Icon style={{ width: rem(16), height: rem(16), color: isCurrent ? 'var(--mantine-color-blue-filled)' : undefined }} stroke={1.5} />
                        </Center>
                    )}
                </Group>
            </UnstyledButton>
        </Table.Th>
    );
}

// --- COMPONENTE PRINCIPAL ---
const AdminCustomerManagementPage: React.FC = () => {
    const theme = useMantineTheme();

    // Usamos el hook para obtener datos y manejadores
    const {
        customers, loading, error, activePage, totalPages, setPage,
        searchTerm, setSearchTerm, sortStatus, handleSort, refreshData
    } = useAdminCustomers();

    // Estados locales de UI
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [adjustModalOpened, { open: openAdjustModal, close: closeAdjustModal }] = useDisclosure(false);
    const [changeTierModalOpened, { open: openChangeTierModal, close: closeChangeTierModal }] = useDisclosure(false);
    const [assignRewardModalOpened, { open: openAssignRewardModal, close: closeAssignRewardModal }] = useDisclosure(false);
    const [togglingFavoriteId, setTogglingFavoriteId] = useState<string | null>(null);

    // --- Handlers de Modales y Acciones ---
    const handleOpenAdjustPoints = (customer: Customer) => { setSelectedCustomer(customer); openAdjustModal(); };
    const handleAdjustSuccess = useCallback(() => { refreshData(); }, [refreshData]);
    const handleOpenChangeTier = (customer: Customer) => { setSelectedCustomer(customer); openChangeTierModal(); };
    const handleChangeTierSuccess = useCallback(() => { refreshData(); }, [refreshData]);
    const handleOpenAssignReward = (customer: Customer) => { setSelectedCustomer(customer); openAssignRewardModal(); };
    const handleAssignRewardSuccess = useCallback(() => { console.log('AssignRewardModal success callback triggered (no refresh implemented).'); }, []);

    const handleToggleFavorite = async (customerId: string, currentIsFavorite: boolean) => {
        setTogglingFavoriteId(customerId);
        try {
            await axiosInstance.patch(`/admin/customers/${customerId}/toggle-favorite`);
            notifications.show({ title: 'Estado Cambiado', message: `Cliente ${!currentIsFavorite ? 'marcado como' : 'desmarcado de'} favorito.`, color: 'green', icon: <IconCheck size={18} /> });
            refreshData();
        } catch (err: any) {
            notifications.show({ title: 'Error', message: `No se pudo cambiar el estado de favorito: ${err.response?.data?.message || err.message}`, color: 'red', icon: <IconX size={18} /> });
        } finally {
            setTogglingFavoriteId(null);
        }
    };

    // --- Renderizado de filas (sin cambios) ---
     const rows = customers.map((customer) => (
        <Table.Tr key={customer.id}>
            <Table.Td>
                <ActionIcon variant="subtle" onClick={() => handleToggleFavorite(customer.id, customer.isFavorite ?? false)} loading={togglingFavoriteId === customer.id} disabled={!!togglingFavoriteId} title={customer.isFavorite ? "Quitar de Favoritos" : "Marcar como Favorito"} >
                    <IconStar size={18} stroke={1.5} color={customer.isFavorite ? theme.colors.yellow[6] : theme.colors.gray[4]} fill={customer.isFavorite ? theme.colors.yellow[6] : 'none'} />
                </ActionIcon>
            </Table.Td>
            <Table.Td>{customer.name || '-'}</Table.Td>
            <Table.Td>{customer.email}</Table.Td>
            <Table.Td ta="right">{customer.points}</Table.Td>
            <Table.Td>{customer.currentTier?.name || 'Básico'}</Table.Td>
            <Table.Td>{new Date(customer.createdAt).toLocaleDateString()}</Table.Td>
            <Table.Td>{customer.isActive ? 'Activo' : 'Inactivo'}</Table.Td>
            <Table.Td>
                 <Group gap="xs" justify="flex-end" wrap="nowrap">
                     <ActionIcon variant="subtle" color="gray" title="Ver Detalles"><IconEye size={16} stroke={1.5} /></ActionIcon>
                     <ActionIcon variant="subtle" color="blue" title="Ajustar Puntos" onClick={() => handleOpenAdjustPoints(customer)}> <IconAdjustments size={16} stroke={1.5} /> </ActionIcon>
                     <ActionIcon variant="subtle" color="teal" title="Cambiar Nivel" onClick={() => handleOpenChangeTier(customer)}> <IconStairsUp size={16} stroke={1.5} /> </ActionIcon>
                     <ActionIcon variant="subtle" color="grape" title="Asignar Recompensa" onClick={() => handleOpenAssignReward(customer)}> <IconGift size={16} stroke={1.5} /> </ActionIcon>
                     <ActionIcon variant="subtle" color="orange" title="Activar/Desactivar"><IconToggleLeft size={16} stroke={1.5} /></ActionIcon>
                 </Group>
            </Table.Td>
        </Table.Tr>
    ));

    // --- Renderizado principal (sin cambios) ---
    return (
        <>
            <Paper shadow="sm" p="lg" withBorder radius="lg">
                <Stack gap="lg">
                    <Title order={2}>Gestión de Clientes</Title>
                    <TextInput placeholder="Buscar por nombre o email..." leftSection={<IconSearch size={16} stroke={1.5} />} value={searchTerm} onChange={(event) => setSearchTerm(event.currentTarget.value)} radius="lg"/>
                    {loading && <Group justify="center" p="md"><Loader /></Group>}
                    {error && !loading && <Alert title="Error" color="red" icon={<IconAlertCircle />}>{error}</Alert>}
                    {!loading && !error && customers.length === 0 && (<Text c="dimmed" ta="center" p="md">No se encontraron clientes{searchTerm ? ' para la búsqueda actual' : ''}.</Text>)}
                    {!loading && !error && customers.length > 0 && (
                        <Table.ScrollContainer minWidth={800}>
                            <Table striped highlightOnHover withTableBorder verticalSpacing="sm" className={classes.table}>
                                <Table.Thead className={classes.thead}>
                                    <Table.Tr>
                                        {/* Th usa las props actualizadas y los handlers/estado del hook */}
                                        <Th sorted={sortStatus.column === 'isFavorite'} reversed={sortStatus.direction === 'desc'} onSort={() => handleSort('isFavorite')} sortKey="isFavorite" currentSortKey={sortStatus.column}><IconStar size={14} stroke={1.5}/></Th>
                                        <Th sorted={sortStatus.column === 'name'} reversed={sortStatus.direction === 'desc'} onSort={() => handleSort('name')} sortKey="name" currentSortKey={sortStatus.column}>Nombre</Th>
                                        <Th sorted={sortStatus.column === 'email'} reversed={sortStatus.direction === 'desc'} onSort={() => handleSort('email')} sortKey="email" currentSortKey={sortStatus.column}>Email</Th>
                                        <Th sorted={sortStatus.column === 'points'} reversed={sortStatus.direction === 'desc'} onSort={() => handleSort('points')} sortKey="points" currentSortKey={sortStatus.column}>Puntos</Th>
                                        <Th sorted={sortStatus.column === 'currentTier.level'} reversed={sortStatus.direction === 'desc'} onSort={() => handleSort('currentTier.level')} sortKey="currentTier.level" currentSortKey={sortStatus.column}>Nivel</Th>
                                        <Th sorted={sortStatus.column === 'createdAt'} reversed={sortStatus.direction === 'desc'} onSort={() => handleSort('createdAt')} sortKey="createdAt" currentSortKey={sortStatus.column}>Registrado</Th>
                                        <Th sorted={sortStatus.column === 'isActive'} reversed={sortStatus.direction === 'desc'} onSort={() => handleSort('isActive')} sortKey="isActive" currentSortKey={sortStatus.column}>Estado</Th>
                                        <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>{rows}</Table.Tbody>
                            </Table>
                        </Table.ScrollContainer>
                    )}
                    {!loading && !error && totalPages > 1 && (<Group justify="center" mt="md"><Pagination total={totalPages} value={activePage} onChange={setPage} /></Group>)}
                </Stack>
            </Paper>

            {/* Modales (sin cambios) */}
            <AdjustPointsModal opened={adjustModalOpened} onClose={() => { closeAdjustModal(); setSelectedCustomer(null); }} customer={selectedCustomer} onSuccess={handleAdjustSuccess}/>
            <ChangeTierModal opened={changeTierModalOpened} onClose={() => { closeChangeTierModal(); setSelectedCustomer(null); }} customer={selectedCustomer} onSuccess={handleChangeTierSuccess}/>
            <AssignRewardModal opened={assignRewardModalOpened} onClose={() => { closeAssignRewardModal(); setSelectedCustomer(null); }} customer={selectedCustomer} onSuccess={handleAssignRewardSuccess}/>
        </>
    );
};

export default AdminCustomerManagementPage;