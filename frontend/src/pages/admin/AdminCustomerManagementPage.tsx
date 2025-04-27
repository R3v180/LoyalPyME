// filename: frontend/src/pages/admin/AdminCustomerManagementPage.tsx
// Version: 1.12.0 (Implement bulk delete action with confirmation - COMPLETE FILE)

import React, { useState, useCallback } from 'react';
import {
    Paper, Title, Stack, TextInput, Loader, Alert, Pagination, Group, Text,
    Button
} from '@mantine/core';
import {
    IconSearch, IconAlertCircle, IconCheck, IconX,
    IconPlayerPlay, IconPlayerStop, IconTrash // <-- Icono para borrar
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useModals } from '@mantine/modals'; // <-- Importar useModals
import axiosInstance from '../../services/axiosInstance';
import AdjustPointsModal from '../../components/admin/AdjustPointsModal';
import ChangeTierModal from '../../components/admin/ChangeTierModal';
import AssignRewardModal from '../../components/admin/AssignRewardModal';
import CustomerDetailsModal, { CustomerDetails } from '../../components/admin/CustomerDetailsModal';
import { notifications } from '@mantine/notifications';

// Importamos el hook y el tipo Customer básico
import { useAdminCustomers, Customer } from '../../hooks/useAdminCustomers';
// Importamos el componente de tabla
import CustomerTable from '../../components/admin/CustomerTable';

// --- COMPONENTE PRINCIPAL ---
const AdminCustomerManagementPage: React.FC = () => {
    // Hooks
    const { customers, loading, error, activePage, totalPages, setPage, searchTerm, setSearchTerm, sortStatus, handleSort, refreshData } = useAdminCustomers();
    const modals = useModals(); // Hook para modales de confirmación

    // Estados locales de UI
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [adjustModalOpened, { open: openAdjustModal, close: closeAdjustModal }] = useDisclosure(false);
    const [changeTierModalOpened, { open: openChangeTierModal, close: closeChangeTierModal }] = useDisclosure(false);
    const [assignRewardModalOpened, { open: openAssignRewardModal, close: closeAssignRewardModal }] = useDisclosure(false);
    const [detailsModalOpened, { open: openDetailsModal, close: closeDetailsModal }] = useDisclosure(false);
    const [selectedCustomerDetails, setSelectedCustomerDetails] = useState<CustomerDetails | null>(null);
    const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
    const [errorDetails, setErrorDetails] = useState<string | null>(null);
    const [togglingFavoriteId, setTogglingFavoriteId] = useState<string | null>(null);
    const [togglingActiveId, setTogglingActiveId] = useState<string | null>(null);
    const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);
    const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
    const [isPerformingBulkAction, setIsPerformingBulkAction] = useState<boolean>(false);

    // --- Handlers Modales Existentes (Código Completo) ---
    const handleOpenAdjustPoints = useCallback((customer: Customer) => { setSelectedCustomer(customer); openAdjustModal(); }, [openAdjustModal]);
    const handleAdjustSuccess = useCallback(() => { refreshData(); closeAdjustModal(); setSelectedCustomer(null); }, [refreshData, closeAdjustModal]);
    const handleOpenChangeTier = useCallback((customer: Customer) => { setSelectedCustomer(customer); openChangeTierModal(); }, [openChangeTierModal]);
    const handleChangeTierSuccess = useCallback(() => { refreshData(); closeChangeTierModal(); setSelectedCustomer(null); }, [refreshData, closeChangeTierModal]);
    const handleOpenAssignReward = useCallback((customer: Customer) => { setSelectedCustomer(customer); openAssignRewardModal(); }, [openAssignRewardModal]);
    const handleAssignRewardSuccess = useCallback(() => { console.log('AssignRewardModal success callback triggered (no refresh implemented).'); closeAssignRewardModal(); setSelectedCustomer(null); }, [closeAssignRewardModal]);

    // --- Handlers Acciones Fila (Código Completo) ---
    const handleToggleFavorite = useCallback(async (customerId: string, _currentIsFavorite: boolean) => {
        setTogglingFavoriteId(customerId);
        try {
            await axiosInstance.patch(`/admin/customers/${customerId}/toggle-favorite`);
            notifications.show({ title: 'Estado Cambiado', message: `Cliente ${!_currentIsFavorite ? 'marcado como' : 'desmarcado de'} favorito.`, color: 'green', icon: <IconCheck size={18} /> });
            refreshData();
        } catch (err: any) {
            notifications.show({ title: 'Error', message: `No se pudo cambiar el estado de favorito: ${err.response?.data?.message || err.message}`, color: 'red', icon: <IconX size={18} /> });
        } finally { setTogglingFavoriteId(null); }
    }, [refreshData]);

    const handleToggleActive = useCallback(async (customer: Customer) => {
       const actionText = customer.isActive ? 'desactivar' : 'activar';
        if (!window.confirm(`¿Estás seguro de que quieres ${actionText} a ${customer.email}?`)) { return; }
        setTogglingActiveId(customer.id);
        try {
            await axiosInstance.patch(`/admin/customers/${customer.id}/toggle-active`);
            notifications.show({ title: 'Estado Actualizado', message: `Cliente ${customer.email} ${actionText === 'activar' ? 'activado' : 'desactivado'} correctamente.`, color: 'green', icon: <IconCheck size={18} />, });
            refreshData();
        } catch (err: any) {
            console.error(`Error toggling active status for customer ${customer.id}:`, err);
            notifications.show({ title: 'Error', message: `No se pudo cambiar el estado: ${err.response?.data?.message || err.message}`, color: 'red', icon: <IconX size={18} />, });
        } finally { setTogglingActiveId(null); }
    }, [refreshData]);

    // Handler Ver Detalles (Código Completo)
    const handleViewDetails = useCallback(async (customer: Customer) => {
        console.log(`Workspaceing details for customer: ${customer.id}`);
        setSelectedCustomerDetails(null); setErrorDetails(null); setLoadingDetails(true); openDetailsModal();
        try {
            const response = await axiosInstance.get<CustomerDetails>(`/admin/customers/${customer.id}/details`);
            setSelectedCustomerDetails(response.data);
        } catch (err: any) {
            console.error(`Error fetching details for customer ${customer.id}:`, err);
            setErrorDetails(err.response?.data?.message || err.message || "Error al cargar los detalles.");
        } finally { setLoadingDetails(false); }
    }, [openDetailsModal]);

     // Handler Cerrar Modal Detalles (Código Completo)
     const handleCloseDetailsModal = () => {
         closeDetailsModal(); setSelectedCustomerDetails(null); setLoadingDetails(false); setErrorDetails(null);
     };

    // Handler para Guardar Notas (Código Completo)
    const handleSaveNotes = useCallback(async (notes: string | null) => {
        if (!selectedCustomerDetails?.id) {
             console.error("Cannot save notes, customer details or ID are missing.");
             notifications.show({ title: 'Error Interno', message: 'No se puede guardar notas: falta información del cliente.', color: 'red' });
             // Devolvemos una promesa rechazada para que el modal sepa que falló
             return Promise.reject(new Error("Missing customer ID"));
        }
        const customerId = selectedCustomerDetails.id;
        console.log(`[ADM_CUST_PAGE] Saving notes for customer ${customerId}`);
        setIsSavingNotes(true);
        try {
            await axiosInstance.patch(`/admin/customers/${customerId}/notes`, { notes: notes });
            notifications.show({ title: 'Notas Guardadas', message: 'Las notas del administrador se han guardado correctamente.', color: 'green', icon: <IconCheck size={18} />, });
            // Refrescar detalles en el modal
            const response = await axiosInstance.get<CustomerDetails>(`/admin/customers/${customerId}/details`);
            setSelectedCustomerDetails(response.data);
             // Devolver promesa resuelta para indicar éxito (opcional)
             // return Promise.resolve();
        } catch (err: any) {
            console.error(`Error saving notes for customer ${customerId}:`, err);
            notifications.show({ title: 'Error al Guardar', message: `No se pudieron guardar las notas: ${err.response?.data?.message || err.message}`, color: 'red', icon: <IconX size={18} />, });
            throw err; // Relanzar error para que el modal sepa que falló
        } finally {
            setIsSavingNotes(false);
        }
    }, [selectedCustomerDetails, setSelectedCustomerDetails]); // Dependencia añadida para re-fetch

    // Handler para actualizar selección (Código Completo)
    const handleRowSelectionChange = useCallback((selectedIds: string[]) => {
        setSelectedRowIds(selectedIds);
    }, []);

    // Handler para Acción Masiva Activar/Desactivar (Código Completo)
    const handleBulkToggleActive = useCallback(async (targetStatus: boolean) => {
        const actionText = targetStatus ? 'activar' : 'desactivar';
        const count = selectedRowIds.length;
        if (count === 0) { notifications.show({ title: 'Acción Masiva', message: 'No hay clientes seleccionados.', color: 'yellow' }); return; }
        if (!window.confirm(`¿Estás seguro de que quieres ${actionText} a ${count} cliente(s) seleccionado(s)?`)) { return; }
        setIsPerformingBulkAction(true);
        try {
            const response = await axiosInstance.patch('/admin/customers/bulk-status', { customerIds: selectedRowIds, isActive: targetStatus });
            notifications.show({ title: 'Acción Masiva Completada', message: `${response.data.count} cliente(s) ${targetStatus ? 'activados' : 'desactivados'} correctamente.`, color: 'green', icon: <IconCheck size={18} />, });
            refreshData();
            setSelectedRowIds([]);
        } catch (err: any) {
            console.error(`Error during bulk ${actionText}:`, err);
            notifications.show({ title: 'Error en Acción Masiva', message: `No se pudo ${actionText} a los clientes: ${err.response?.data?.message || err.message}`, color: 'red', icon: <IconX size={18} />, });
        } finally { setIsPerformingBulkAction(false); }
    }, [selectedRowIds, refreshData, setSelectedRowIds]);

    // --- NUEVO: Handler para Borrado Masivo ---
    const handleBulkDelete = useCallback(() => {
        const count = selectedRowIds.length;
        if (count === 0) {
            notifications.show({ title: 'Acción Masiva', message: 'No hay clientes seleccionados.', color: 'yellow' });
            return;
        }
        // Abrir modal de confirmación Mantine
        modals.openConfirmModal({
            title: `Confirmar Eliminación Masiva`,
            centered: true,
            children: (
                <Text size="sm">
                    ¿Estás seguro de que quieres eliminar permanentemente a {count} cliente(s) seleccionado(s)?
                    <Text c="red" fw={700} component="span"> Esta acción no se puede deshacer.</Text>
                </Text>
            ),
            labels: { confirm: 'Eliminar Clientes', cancel: 'Cancelar' },
            confirmProps: { color: 'red' },
            zIndex: 1001,
            onCancel: () => console.log('Bulk delete cancelled'),
            onConfirm: async () => { // Async para poder usar await dentro
                console.log(`[ADM_CUST_PAGE] Confirmed bulk delete for ${count} customers`);
                setIsPerformingBulkAction(true); // Iniciar carga
                try {
                    // Llamar al endpoint masivo del backend para borrar
                    const response = await axiosInstance.delete('/admin/customers/bulk-delete', {
                        data: { customerIds: selectedRowIds } // Pasar IDs en el body.data
                    });
                    // Notificación de éxito
                    notifications.show({
                        title: 'Acción Masiva Completada',
                        message: `${response.data.count} cliente(s) eliminados correctamente.`,
                        color: 'green',
                        icon: <IconCheck size={18} />,
                    });
                    // Refrescar datos y limpiar selección
                    refreshData();
                    setSelectedRowIds([]);
                } catch (err: any) {
                    // Notificación de error
                    console.error(`Error during bulk delete:`, err);
                    notifications.show({
                        title: 'Error en Acción Masiva',
                        message: `No se pudo eliminar a los clientes: ${err.response?.data?.message || err.message}`,
                        color: 'red',
                        icon: <IconX size={18} />,
                    });
                } finally {
                    setIsPerformingBulkAction(false); // Terminar carga
                }
            },
        });
    }, [selectedRowIds, refreshData, setSelectedRowIds, modals]); // Dependencias
    // -------------------------------------------

    // --- Renderizado principal ---
    return (
        <>
            <Paper shadow="sm" p="lg" withBorder radius="lg">
                <Stack gap="lg">
                    <Title order={2}>Gestión de Clientes</Title>
                    <TextInput placeholder="Buscar por nombre o email..." leftSection={<IconSearch size={16} stroke={1.5} />} value={searchTerm} onChange={(event) => setSearchTerm(event.currentTarget.value)} radius="lg"/>

                    {/* Panel Acciones Masivas (con botón Eliminar funcional) */}
                    {selectedRowIds.length > 0 && (
                        <Paper p="xs" mb="md" withBorder shadow="xs" >
                            <Group justify="space-between">
                                <Text fw={500} size="sm">{selectedRowIds.length} cliente(s) seleccionado(s)</Text>
                                <Group>
                                    {/* Botón Eliminar Funcional */}
                                    <Button
                                        size="xs" color="red" variant="filled"
                                        leftSection={<IconTrash size={14}/>}
                                        onClick={handleBulkDelete} // Llama al nuevo handler
                                        loading={isPerformingBulkAction}
                                        disabled={isPerformingBulkAction}
                                    >
                                        Eliminar Seleccionados
                                    </Button>
                                    {/* Resto de botones */}
                                    <Button size="xs" color="green" variant="outline" leftSection={<IconPlayerPlay size={14}/>} onClick={() => handleBulkToggleActive(true)} loading={isPerformingBulkAction} disabled={isPerformingBulkAction} > Activar </Button>
                                    <Button size="xs" color="red" variant="outline" leftSection={<IconPlayerStop size={14}/>} onClick={() => handleBulkToggleActive(false)} loading={isPerformingBulkAction} disabled={isPerformingBulkAction} > Desactivar </Button>
                                    <Button size="xs" color="blue" variant="outline" disabled={isPerformingBulkAction}>Ajustar Puntos (Próx.)</Button>
                                </Group>
                            </Group>
                        </Paper>
                    )}
                    {/* Fin Panel */}

                    {/* Resto del renderizado (tabla, modales, etc.) */}
                    {loading && <Group justify="center" p="md"><Loader /></Group>}
                    {error && !loading && <Alert title="Error" color="red" icon={<IconAlertCircle />}>{error}</Alert>}
                    {!loading && !error && customers.length === 0 && (<Text c="dimmed" ta="center" p="md"> No se encontraron clientes{searchTerm ? ' para la búsqueda actual' : ''}. </Text> )}
                    {!loading && !error && customers.length > 0 && (
                        <CustomerTable
                            customers={customers}
                            sortStatus={sortStatus}
                            togglingFavoriteId={togglingFavoriteId}
                            togglingActiveId={togglingActiveId}
                            selectedRows={selectedRowIds}
                            onSort={handleSort}
                            onToggleFavorite={handleToggleFavorite}
                            onOpenAdjustPoints={handleOpenAdjustPoints}
                            onOpenChangeTier={handleOpenChangeTier}
                            onOpenAssignReward={handleOpenAssignReward}
                            onViewDetails={handleViewDetails}
                            onToggleActive={handleToggleActive}
                            onRowSelectionChange={handleRowSelectionChange}
                        />
                    )}
                    {!loading && !error && totalPages > 1 && (<Group justify="center" mt="md"><Pagination total={totalPages} value={activePage} onChange={setPage} /></Group>)}
                </Stack>
            </Paper>

            {/* Modales */}
            <AdjustPointsModal opened={adjustModalOpened} onClose={() => { closeAdjustModal(); setSelectedCustomer(null); }} customer={selectedCustomer} onSuccess={handleAdjustSuccess}/>
            <ChangeTierModal opened={changeTierModalOpened} onClose={() => { closeChangeTierModal(); setSelectedCustomer(null); }} customer={selectedCustomer} onSuccess={handleChangeTierSuccess}/>
            <AssignRewardModal opened={assignRewardModalOpened} onClose={() => { closeAssignRewardModal(); setSelectedCustomer(null); }} customer={selectedCustomer} onSuccess={handleAssignRewardSuccess}/>
            <CustomerDetailsModal
                 opened={detailsModalOpened}
                 onClose={handleCloseDetailsModal}
                 customerDetails={selectedCustomerDetails}
                 isLoading={loadingDetails || isSavingNotes}
                 error={errorDetails}
                 onSaveNotes={handleSaveNotes}
             />
        </>
    );
};

export default AdminCustomerManagementPage;