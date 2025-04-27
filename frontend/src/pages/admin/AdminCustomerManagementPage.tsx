// filename: frontend/src/pages/admin/AdminCustomerManagementPage.tsx
// Version: 1.11.0 (Implement bulk activate/deactivate action) // <-- Incremento versión

import React, { useState, useCallback } from 'react';
import {
    Paper, Title, Stack, TextInput, Loader, Alert, Pagination, Group, Text,
    Button
} from '@mantine/core';
import {
    IconSearch, IconAlertCircle, IconCheck, IconX,
    IconPlayerPlay, IconPlayerStop // <-- Nuevos iconos para acciones masivas
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
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
    // Hook para la lista de clientes
    const {
        customers, loading, error, activePage, totalPages, setPage,
        searchTerm, setSearchTerm, sortStatus, handleSort, refreshData
    } = useAdminCustomers();

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
    const [isPerformingBulkAction, setIsPerformingBulkAction] = useState<boolean>(false); // <-- Estado de carga acción masiva

    // --- Handlers Modales y Acciones Fila (sin cambios) ---
    const handleOpenAdjustPoints = useCallback((customer: Customer) => { setSelectedCustomer(customer); openAdjustModal(); }, [openAdjustModal]);
    const handleAdjustSuccess = useCallback(() => { refreshData(); closeAdjustModal(); setSelectedCustomer(null); }, [refreshData, closeAdjustModal]);
    const handleOpenChangeTier = useCallback((customer: Customer) => { setSelectedCustomer(customer); openChangeTierModal(); }, [openChangeTierModal]);
    const handleChangeTierSuccess = useCallback(() => { refreshData(); closeChangeTierModal(); setSelectedCustomer(null); }, [refreshData, closeChangeTierModal]);
    const handleOpenAssignReward = useCallback((customer: Customer) => { setSelectedCustomer(customer); openAssignRewardModal(); }, [openAssignRewardModal]);
    const handleAssignRewardSuccess = useCallback(() => { console.log('AssignRewardModal success callback triggered (no refresh implemented).'); closeAssignRewardModal(); setSelectedCustomer(null); }, [closeAssignRewardModal]);
    const handleToggleFavorite = useCallback(async (customerId: string, _currentIsFavorite: boolean) => { /* ... */ setTogglingFavoriteId(customerId); try { await axiosInstance.patch(`/admin/customers/${customerId}/toggle-favorite`); notifications.show({ title: '...', message: `...`, color: 'green', icon: <IconCheck size={18} /> }); refreshData(); } catch (err: any) { notifications.show({ title: 'Error', message: `...`, color: 'red', icon: <IconX size={18} /> }); } finally { setTogglingFavoriteId(null); } }, [refreshData]);
    const handleToggleActive = useCallback(async (customer: Customer) => { /* ... */ const actionText = customer.isActive ? 'desactivar' : 'activar'; if (!window.confirm(`...`)) { return; } setTogglingActiveId(customer.id); try { await axiosInstance.patch(`/admin/customers/${customer.id}/toggle-active`); notifications.show({ title: '...', message: `... ${actionText}...`, color: 'green', icon: <IconCheck size={18} />, }); refreshData(); } catch (err: any) { console.error(`...`, err); notifications.show({ title: 'Error', message: `...`, color: 'red', icon: <IconX size={18} />, }); } finally { setTogglingActiveId(null); } }, [refreshData]);
    const handleViewDetails = useCallback(async (customer: Customer) => { /* ... */ console.log(`...`); setSelectedCustomerDetails(null); setErrorDetails(null); setLoadingDetails(true); openDetailsModal(); try { const response = await axiosInstance.get<CustomerDetails>(`/admin/customers/${customer.id}/details`); setSelectedCustomerDetails(response.data); } catch (err: any) { console.error(`...`, err); setErrorDetails(err.response?.data?.message || err.message || "..."); } finally { setLoadingDetails(false); } }, [openDetailsModal]);
    const handleCloseDetailsModal = () => { /* ... */ closeDetailsModal(); setSelectedCustomerDetails(null); setLoadingDetails(false); setErrorDetails(null); };
    const handleSaveNotes = useCallback(async (notes: string | null) => { /* ... */ if (!selectedCustomerDetails?.id) { /*...*/ return Promise.reject(new Error("...")); } const customerId = selectedCustomerDetails.id; console.log(`...`); setIsSavingNotes(true); try { await axiosInstance.patch(`/admin/customers/${customerId}/notes`, { notes: notes }); notifications.show({ title: '...', message: '...', color: 'green', icon: <IconCheck size={18} />, }); const response = await axiosInstance.get<CustomerDetails>(`/admin/customers/${customerId}/details`); setSelectedCustomerDetails(response.data); } catch (err: any) { console.error(`...`, err); notifications.show({ title: 'Error', message: `...`, color: 'red', icon: <IconX size={18} />, }); throw err; } finally { setIsSavingNotes(false); } }, [selectedCustomerDetails, setSelectedCustomerDetails]);
    const handleRowSelectionChange = useCallback((selectedIds: string[]) => { setSelectedRowIds(selectedIds); }, []);
    // --------------------------------------

    // --- Handler para Acción Masiva Activar/Desactivar ---
    const handleBulkToggleActive = useCallback(async (targetStatus: boolean) => {
        const actionText = targetStatus ? 'activar' : 'desactivar';
        const count = selectedRowIds.length;
        if (count === 0) {
            notifications.show({ title: 'Acción Masiva', message: 'No hay clientes seleccionados.', color: 'yellow' });
            return;
        }
        // Confirmación
        if (!window.confirm(`¿Estás seguro de que quieres ${actionText} a ${count} cliente(s) seleccionado(s)?`)) {
            return;
        }

        setIsPerformingBulkAction(true); // Iniciar carga

        try {
            // Llamar al endpoint masivo del backend
            const response = await axiosInstance.patch('/admin/customers/bulk-status', {
                customerIds: selectedRowIds,
                isActive: targetStatus
            });

            // Notificación de éxito
            notifications.show({
                title: 'Acción Masiva Completada',
                message: `${response.data.count} cliente(s) ${targetStatus ? 'activados' : 'desactivados'} correctamente.`,
                color: 'green',
                icon: <IconCheck size={18} />,
            });

            // Refrescar datos y limpiar selección
            refreshData();
            setSelectedRowIds([]); // Limpiar selección tras éxito

        } catch (err: any) {
            // Notificación de error
            console.error(`Error during bulk ${actionText}:`, err);
            notifications.show({
                title: 'Error en Acción Masiva',
                message: `No se pudo ${actionText} a los clientes: ${err.response?.data?.message || err.message}`,
                color: 'red',
                icon: <IconX size={18} />,
            });
        } finally {
            setIsPerformingBulkAction(false); // Terminar carga
        }
    }, [selectedRowIds, refreshData, setSelectedRowIds]); // Dependencias necesarias
    // -------------------------------------------


    // --- Renderizado principal ---
    return (
        <>
            <Paper shadow="sm" p="lg" withBorder radius="lg">
                <Stack gap="lg">
                    <Title order={2}>Gestión de Clientes</Title>
                    <TextInput placeholder="Buscar por nombre o email..." leftSection={<IconSearch size={16} stroke={1.5} />} value={searchTerm} onChange={(event) => setSearchTerm(event.currentTarget.value)} radius="lg"/>

                    {/* --- Panel Acciones Masivas (con botones funcionales) --- */}
                    {selectedRowIds.length > 0 && (
                        <Paper p="xs" mb="md" withBorder shadow="xs" >
                            <Group justify="space-between">
                                <Text fw={500} size="sm">{selectedRowIds.length} cliente(s) seleccionado(s)</Text>
                                <Group>
                                    <Button size="xs" color="red" variant="outline" disabled={isPerformingBulkAction}>Eliminar Seleccionados (Próx.)</Button>
                                    {/* Botones Activar/Desactivar Funcionales */}
                                    <Button
                                        size="xs" color="green" variant="outline"
                                        leftSection={<IconPlayerPlay size={14}/>}
                                        onClick={() => handleBulkToggleActive(true)} // Llama al handler para ACTIVAR
                                        loading={isPerformingBulkAction} // Estado de carga
                                        disabled={isPerformingBulkAction} // Deshabilitar mientras carga
                                    >
                                        Activar
                                    </Button>
                                     <Button
                                        size="xs" color="red" variant="outline"
                                        leftSection={<IconPlayerStop size={14}/>}
                                        onClick={() => handleBulkToggleActive(false)} // Llama al handler para DESACTIVAR
                                        loading={isPerformingBulkAction} // Estado de carga
                                        disabled={isPerformingBulkAction} // Deshabilitar mientras carga
                                    >
                                        Desactivar
                                    </Button>
                                    {/* ---------------------------------- */}
                                     <Button size="xs" color="blue" variant="outline" disabled={isPerformingBulkAction}>Ajustar Puntos (Próx.)</Button>
                                </Group>
                            </Group>
                        </Paper>
                    )}
                    {/* --- Fin Panel --- */}

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