// filename: frontend/src/pages/admin/AdminCustomerManagementPage.tsx
// Version: 1.8.1 (Fix: Restore missing useDisclosure import)

import React, { useState, useCallback } from 'react';
import {
    Paper, Title, Stack, TextInput, Loader, Alert, Pagination, Group, Text
} from '@mantine/core';
import {
    IconSearch, IconAlertCircle, IconCheck, IconX
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks'; // <-- Importación restaurada
import axiosInstance from '../../services/axiosInstance';
import AdjustPointsModal from '../../components/admin/AdjustPointsModal';
import ChangeTierModal from '../../components/admin/ChangeTierModal';
import AssignRewardModal from '../../components/admin/AssignRewardModal';
import { notifications } from '@mantine/notifications';

// Importamos el hook y el tipo Customer
import { useAdminCustomers, Customer } from '../../hooks/useAdminCustomers';
// Importamos el componente de tabla
import CustomerTable from '../../components/admin/CustomerTable';

// --- COMPONENTE PRINCIPAL ---
const AdminCustomerManagementPage: React.FC = () => {
    // Usamos el hook para obtener datos y manejadores principales
    const {
        customers, loading, error, activePage, totalPages, setPage,
        searchTerm, setSearchTerm, sortStatus, handleSort, refreshData
    } = useAdminCustomers();

    // Estados locales de UI
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    // Estados y controles de los modales (usan useDisclosure)
    const [adjustModalOpened, { open: openAdjustModal, close: closeAdjustModal }] = useDisclosure(false);
    const [changeTierModalOpened, { open: openChangeTierModal, close: closeChangeTierModal }] = useDisclosure(false);
    const [assignRewardModalOpened, { open: openAssignRewardModal, close: closeAssignRewardModal }] = useDisclosure(false);
    // Estados de carga para acciones en fila
    const [togglingFavoriteId, setTogglingFavoriteId] = useState<string | null>(null);
    const [togglingActiveId, setTogglingActiveId] = useState<string | null>(null);

    // --- Handlers de Modales y Acciones ---
    const handleOpenAdjustPoints = useCallback((customer: Customer) => { setSelectedCustomer(customer); openAdjustModal(); }, [openAdjustModal]); // Añadir dependencia
    const handleAdjustSuccess = useCallback(() => { refreshData(); closeAdjustModal(); setSelectedCustomer(null); }, [refreshData, closeAdjustModal]);

    const handleOpenChangeTier = useCallback((customer: Customer) => { setSelectedCustomer(customer); openChangeTierModal(); }, [openChangeTierModal]); // Añadir dependencia
    const handleChangeTierSuccess = useCallback(() => { refreshData(); closeChangeTierModal(); setSelectedCustomer(null); }, [refreshData, closeChangeTierModal]);

    const handleOpenAssignReward = useCallback((customer: Customer) => { setSelectedCustomer(customer); openAssignRewardModal(); }, [openAssignRewardModal]); // Añadir dependencia
    const handleAssignRewardSuccess = useCallback(() => { console.log('AssignRewardModal success callback triggered (no refresh implemented).'); closeAssignRewardModal(); setSelectedCustomer(null); }, [closeAssignRewardModal]);

    const handleToggleFavorite = useCallback(async (customerId: string, currentIsFavorite: boolean) => {
        setTogglingFavoriteId(customerId);
        try {
            await axiosInstance.patch(`/api/admin/customers/${customerId}/toggle-favorite`);
            notifications.show({ title: 'Estado Cambiado', message: `Cliente ${!currentIsFavorite ? 'marcado como' : 'desmarcado de'} favorito.`, color: 'green', icon: <IconCheck size={18} /> });
            refreshData();
        } catch (err: any) {
            notifications.show({ title: 'Error', message: `No se pudo cambiar el estado de favorito: ${err.response?.data?.message || err.message}`, color: 'red', icon: <IconX size={18} /> });
        } finally {
            setTogglingFavoriteId(null);
        }
    }, [refreshData]);

    // handleViewDetails (placeholder sin cambios)
    const handleViewDetails = useCallback((customer: Customer) => {
        console.log('TODO: Implement View Details for customer:', customer.id);
        alert(`FUNCIONALIDAD PENDIENTE: Ver Detalles para ${customer.email}`);
    }, []);

    // Handler Implementado para Activar/Desactivar
    const handleToggleActive = useCallback(async (customer: Customer) => {
        const actionText = customer.isActive ? 'desactivar' : 'activar';
        if (!window.confirm(`¿Estás seguro de que quieres ${actionText} a ${customer.email}?`)) {
            return;
        }
        setTogglingActiveId(customer.id);
        try {
            await axiosInstance.patch(`/api/admin/customers/${customer.id}/toggle-active`);
            notifications.show({
                title: 'Estado Actualizado',
                message: `Cliente ${customer.email} ${customer.isActive ? 'desactivado' : 'activado'} correctamente.`,
                color: 'green',
                icon: <IconCheck size={18} />,
            });
            refreshData();
        } catch (err: any) {
            console.error(`Error toggling active status for customer ${customer.id}:`, err);
            notifications.show({
                title: 'Error',
                message: `No se pudo cambiar el estado: ${err.response?.data?.message || err.message}`,
                color: 'red',
                icon: <IconX size={18} />,
            });
        } finally {
            setTogglingActiveId(null);
        }
    }, [refreshData]);

    // --- Renderizado principal (sin cambios) ---
    return (
        <>
            <Paper shadow="sm" p="lg" withBorder radius="lg">
                <Stack gap="lg">
                    <Title order={2}>Gestión de Clientes</Title>
                    <TextInput placeholder="Buscar por nombre o email..." leftSection={<IconSearch size={16} stroke={1.5} />} value={searchTerm} onChange={(event) => setSearchTerm(event.currentTarget.value)} radius="lg"/>
                    {/* TODO: Añadir aquí el Checkbox/Switch para filtrar favoritos */}

                    {/* Feedback de Carga/Error */}
                    {loading && <Group justify="center" p="md"><Loader /></Group>}
                    {error && !loading && <Alert title="Error" color="red" icon={<IconAlertCircle />}>{error}</Alert>}

                    {/* Mensaje de Tabla Vacía */}
                    {!loading && !error && customers.length === 0 && (
                        <Text c="dimmed" ta="center" p="md">
                            No se encontraron clientes{searchTerm ? ' para la búsqueda actual' : ''}.
                        </Text>
                    )}

                    {/* Renderizado de la Tabla */}
                    {!loading && !error && customers.length > 0 && (
                        <CustomerTable
                            customers={customers}
                            sortStatus={sortStatus}
                            togglingFavoriteId={togglingFavoriteId}
                            togglingActiveId={togglingActiveId}
                            onSort={handleSort}
                            onToggleFavorite={handleToggleFavorite}
                            onOpenAdjustPoints={handleOpenAdjustPoints}
                            onOpenChangeTier={handleOpenChangeTier}
                            onOpenAssignReward={handleOpenAssignReward}
                            onViewDetails={handleViewDetails}
                            onToggleActive={handleToggleActive}
                        />
                    )}

                    {/* Paginación */}
                    {!loading && !error && totalPages > 1 && (
                        <Group justify="center" mt="md">
                            <Pagination total={totalPages} value={activePage} onChange={setPage} />
                        </Group>
                    )}
                </Stack>
            </Paper>

            {/* Modales */}
            <AdjustPointsModal opened={adjustModalOpened} onClose={() => { closeAdjustModal(); setSelectedCustomer(null); }} customer={selectedCustomer} onSuccess={handleAdjustSuccess}/>
            <ChangeTierModal opened={changeTierModalOpened} onClose={() => { closeChangeTierModal(); setSelectedCustomer(null); }} customer={selectedCustomer} onSuccess={handleChangeTierSuccess}/>
            <AssignRewardModal opened={assignRewardModalOpened} onClose={() => { closeAssignRewardModal(); setSelectedCustomer(null); }} customer={selectedCustomer} onSuccess={handleAssignRewardSuccess}/>
        </>
    );
};

export default AdminCustomerManagementPage;