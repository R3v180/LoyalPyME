// filename: frontend/src/pages/admin/AdminCustomerManagementPage.tsx
// Version: 1.14.5 (Remove unused CustomerFilters type import)

import React, { useState, useEffect, useCallback } from 'react';
import {
    Paper, Title, Stack, TextInput, Loader, Alert, Pagination, Group, Text,
    Button, Checkbox, Select
} from '@mantine/core';
import {
    IconSearch, IconAlertCircle, IconCheck, IconX, IconFilter,
    IconPlayerPlay, IconPlayerStop, IconTrash, IconPlusMinus
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useModals } from '@mantine/modals';
import axiosInstance from '../../services/axiosInstance';
import AdjustPointsModal from '../../components/admin/AdjustPointsModal';
import ChangeTierModal from '../../components/admin/ChangeTierModal';
import AssignRewardModal from '../../components/admin/AssignRewardModal';
import CustomerDetailsModal, { CustomerDetails } from '../../components/admin/CustomerDetailsModal';
import BulkAdjustPointsModal from '../../components/admin/BulkAdjustPointsModal';
import { notifications } from '@mantine/notifications';

// Importamos tipos y hook correctamente (SIN CustomerFilters aquí)
import useAdminCustomersData, {
    Customer,
    UseAdminCustomersDataResult,
    SortColumn
} from '../../hooks/useAdminCustomersData';
// Importamos el componente de tabla
import CustomerTable from '../../components/admin/CustomerTable';

// Tipo para opciones del Select de Tier
interface TierOption {
    value: string;
    label: string;
}

// --- COMPONENTE PRINCIPAL ---
const AdminCustomerManagementPage: React.FC = () => {
    // Hook
    const {
        customers, loading, error,
        currentPage, totalPages, totalItems,
        setPage, searchTerm, setSearchTerm, sortStatus, setSortStatus,
        filters, setFilters,
        refetch
    }: UseAdminCustomersDataResult = useAdminCustomersData();
    const modals = useModals();

    // Estados locales de UI (sin cambios)
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [adjustModalOpened, { open: openAdjustModal, close: closeAdjustModal }] = useDisclosure(false);
    const [changeTierModalOpened, { open: openChangeTierModal, close: closeChangeTierModal }] = useDisclosure(false);
    const [assignRewardModalOpened, { open: openAssignRewardModal, close: closeAssignRewardModal }] = useDisclosure(false);
    const [detailsModalOpened, { open: openDetailsModal, close: closeDetailsModal }] = useDisclosure(false);
    const [bulkAdjustModalOpened, { open: openBulkAdjustModal, close: closeBulkAdjustModal }] = useDisclosure(false);
    const [selectedCustomerDetails, setSelectedCustomerDetails] = useState<CustomerDetails | null>(null);
    const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
    const [errorDetails, setErrorDetails] = useState<string | null>(null);
    const [togglingFavoriteId, setTogglingFavoriteId] = useState<string | null>(null);
    const [togglingActiveId, setTogglingActiveId] = useState<string | null>(null);
    const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);
    const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
    const [isPerformingBulkAction, setIsPerformingBulkAction] = useState<boolean>(false);
    const [tierOptions, setTierOptions] = useState<TierOption[]>([]);
    const [loadingTiers, setLoadingTiers] = useState<boolean>(true);

    // useEffect para cargar los Tiers (sin cambios)
    useEffect(() => {
        const fetchTiersForFilter = async () => {
            setLoadingTiers(true); try { const response = await axiosInstance.get<{ id: string; name: string; level: number }[]>('/tiers');
                const sortedTiers = response.data.sort((a, b) => a.level - b.level);
                const options: TierOption[] = [ { value: '', label: 'Todos los Niveles' }, { value: 'NONE', label: 'Sin Nivel (Básico)' }, ...sortedTiers.map(tier => ({ value: tier.id, label: tier.name })) ];
                setTierOptions(options); } catch (err) { console.error("Error fetching tiers for filter:", err); notifications.show({ title: 'Error al cargar Niveles', message: 'No se pudo obtener la lista de niveles para el filtro.', color: 'red' }); setTierOptions([{ value: '', label: 'Error al cargar' }]); } finally { setLoadingTiers(false); } };
        fetchTiersForFilter(); }, []);

    // Handlers Modales (sin cambios)
    const handleOpenAdjustPoints = useCallback((customer: Customer) => { setSelectedCustomer(customer); openAdjustModal(); }, [openAdjustModal]);
    const handleAdjustSuccess = useCallback(() => { refetch(); closeAdjustModal(); setSelectedCustomer(null); }, [refetch, closeAdjustModal]);
    const handleOpenChangeTier = useCallback((customer: Customer) => { setSelectedCustomer(customer); openChangeTierModal(); }, [openChangeTierModal]);
    const handleChangeTierSuccess = useCallback(() => { refetch(); closeChangeTierModal(); setSelectedCustomer(null); }, [refetch, closeChangeTierModal]);
    const handleOpenAssignReward = useCallback((customer: Customer) => { setSelectedCustomer(customer); openAssignRewardModal(); }, [openAssignRewardModal]);
    const handleAssignRewardSuccess = useCallback(() => { closeAssignRewardModal(); setSelectedCustomer(null); }, [closeAssignRewardModal]);
    const handleCloseDetailsModal = () => { closeDetailsModal(); setSelectedCustomerDetails(null); setLoadingDetails(false); setErrorDetails(null); };

    // Handlers Acciones Fila (sin cambios)
    const handleToggleFavorite = useCallback(async (customerId: string, currentIsFavorite: boolean) => { setTogglingFavoriteId(customerId); try { await axiosInstance.patch(`/admin/customers/${customerId}/toggle-favorite`); notifications.show({ title: 'Estado Cambiado', message: `Cliente ${!currentIsFavorite ? 'marcado como' : 'desmarcado de'} favorito.`, color: 'green', icon: <IconCheck size={18} /> }); refetch(); } catch (err: any) { notifications.show({ title: 'Error', message: `No se pudo cambiar el estado de favorito: ${err.response?.data?.message || err.message}`, color: 'red', icon: <IconX size={18} /> }); } finally { setTogglingFavoriteId(null); } }, [refetch]);
    const handleToggleActive = useCallback(async (customer: Customer) => { const actionText = customer.isActive ? 'desactivar' : 'activar'; if (!window.confirm(`¿Estás seguro de que quieres ${actionText} a ${customer.email}?`)) { return; } setTogglingActiveId(customer.id); try { await axiosInstance.patch(`/admin/customers/${customer.id}/toggle-active`); notifications.show({ title: 'Estado Actualizado', message: `Cliente ${customer.email} ${actionText === 'activar' ? 'activado' : 'desactivado'} correctamente.`, color: 'green', icon: <IconCheck size={18} />, }); refetch(); } catch (err: any) { console.error(`Error toggling active status for customer ${customer.id}:`, err); notifications.show({ title: 'Error', message: `No se pudo cambiar el estado: ${err.response?.data?.message || err.message}`, color: 'red', icon: <IconX size={18} />, }); } finally { setTogglingActiveId(null); } }, [refetch]);
    const handleViewDetails = useCallback(async (customer: Customer) => { setSelectedCustomerDetails(null); setErrorDetails(null); setLoadingDetails(true); openDetailsModal(); try { const response = await axiosInstance.get<CustomerDetails>(`/admin/customers/${customer.id}/details`); setSelectedCustomerDetails(response.data); } catch (err: any) { setErrorDetails(err.response?.data?.message || err.message || "Error al cargar los detalles."); } finally { setLoadingDetails(false); } }, [openDetailsModal]);
    const handleSaveNotes = useCallback(async (notes: string | null) => { if (!selectedCustomerDetails?.id) { return Promise.reject(new Error("Missing customer ID")); } const customerId = selectedCustomerDetails.id; setIsSavingNotes(true); try { await axiosInstance.patch(`/admin/customers/${customerId}/notes`, { notes: notes }); notifications.show({ title: 'Notas Guardadas', message: 'Las notas del administrador se han guardado correctamente.', color: 'green', icon: <IconCheck size={18} />, }); const response = await axiosInstance.get<CustomerDetails>(`/admin/customers/${customerId}/details`); setSelectedCustomerDetails(response.data); } catch (err: any) { notifications.show({ title: 'Error al Guardar', message: `No se pudieron guardar las notas: ${err.response?.data?.message || err.message}`, color: 'red', icon: <IconX size={18} />, }); throw err; } finally { setIsSavingNotes(false); } }, [selectedCustomerDetails]);

    // Handler de Ordenación (sin cambios)
    const handleTableSort = useCallback((column: SortColumn) => {
        const direction = sortStatus.column === column && sortStatus.direction === 'asc' ? 'desc' : 'asc';
        setSortStatus({ column, direction });
    }, [sortStatus, setSortStatus]);

    // Handlers Acciones Masivas (sin cambios)
    const handleRowSelectionChange = useCallback((selectedIds: string[]) => { setSelectedRowIds(selectedIds); }, []);
    const handleBulkToggleActive = useCallback(async (targetStatus: boolean) => { const actionText = targetStatus ? 'activar' : 'desactivar'; const count = selectedRowIds.length; if (count === 0) { notifications.show({ title: 'Acción Masiva', message: 'No hay clientes seleccionados.', color: 'yellow' }); return; } if (!window.confirm(`¿Estás seguro de que quieres ${actionText} a ${count} cliente(s) seleccionado(s)?`)) { return; } setIsPerformingBulkAction(true); try { const response = await axiosInstance.patch('/admin/customers/bulk-status', { customerIds: selectedRowIds, isActive: targetStatus }); notifications.show({ title: 'Acción Masiva Completada', message: `${response.data.count} cliente(s) ${targetStatus ? 'activados' : 'desactivados'} correctamente.`, color: 'green', icon: <IconCheck size={18} />, }); refetch(); setSelectedRowIds([]); } catch (err: any) { console.error(`Error during bulk ${actionText}:`, err); notifications.show({ title: 'Error en Acción Masiva', message: `No se pudo ${actionText} a los clientes: ${err.response?.data?.message || err.message}`, color: 'red', icon: <IconX size={18} />, }); } finally { setIsPerformingBulkAction(false); } }, [selectedRowIds, refetch]);
    const handleBulkDelete = useCallback(() => { const count = selectedRowIds.length; if (count === 0) { notifications.show({ title: 'Acción Masiva', message: 'No hay clientes seleccionados.', color: 'yellow' }); return; } modals.openConfirmModal({ title: `Confirmar Eliminación Masiva`, centered: true, children: ( <Text size="sm"> ¿Estás seguro de que quieres eliminar permanentemente a {count} cliente(s) seleccionado(s)? <Text c="red" fw={700} component="span"> Esta acción no se puede deshacer.</Text> </Text> ), labels: { confirm: 'Eliminar Clientes', cancel: 'Cancelar' }, confirmProps: { color: 'red' }, zIndex: 1001, onConfirm: async () => { setIsPerformingBulkAction(true); try { const response = await axiosInstance.delete('/admin/customers/bulk-delete', { data: { customerIds: selectedRowIds } }); notifications.show({ title: 'Acción Masiva Completada', message: `${response.data.count} cliente(s) eliminados correctamente.`, color: 'green', icon: <IconCheck size={18} />, }); refetch(); setSelectedRowIds([]); } catch (err: any) { console.error(`Error during bulk delete:`, err); notifications.show({ title: 'Error en Acción Masiva', message: `No se pudo eliminar a los clientes: ${err.response?.data?.message || err.message}`, color: 'red', icon: <IconX size={18} />, }); } finally { setIsPerformingBulkAction(false); } }, }); }, [selectedRowIds, refetch, modals]);
    const handleBulkAdjustPointsSubmit = useCallback(async (values: { amount: number; reason?: string | undefined }) => { const { amount, reason } = values; const count = selectedRowIds.length; if (count === 0) { notifications.show({ title: 'Acción Masiva', message: 'Error inesperado: No hay clientes seleccionados.', color: 'red' }); return Promise.reject(new Error("No customers selected")); } setIsPerformingBulkAction(true); closeBulkAdjustModal(); try { const response = await axiosInstance.post('/admin/customers/bulk-adjust-points', { customerIds: selectedRowIds, amount: amount, reason: reason || null }); notifications.show({ title: 'Acción Masiva Completada', message: `${Math.abs(amount)} puntos ${amount > 0 ? 'añadidos' : 'restados'} a ${response.data.count} cliente(s) correctamente.`, color: 'green', icon: <IconCheck size={18} />, }); refetch(); setSelectedRowIds([]); } catch (err: any) { console.error(`Error during bulk points adjustment:`, err); notifications.show({ title: 'Error en Acción Masiva', message: `No se pudo ajustar los puntos: ${err.response?.data?.message || err.message}`, color: 'red', icon: <IconX size={18} />, }); } finally { setIsPerformingBulkAction(false); } }, [selectedRowIds, refetch, closeBulkAdjustModal]);

    // Handlers para los cambios en los filtros (sin cambios)
    const handleIsActiveFilterChange = (value: string | null) => { let isActiveValue: boolean | undefined; if (value === 'active') isActiveValue = true; else if (value === 'inactive') isActiveValue = false; else isActiveValue = undefined; setFilters({ isActive: isActiveValue }); };
    const handleIsFavoriteFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => { setFilters({ isFavorite: event.currentTarget.checked ? true : undefined }); };
    const handleTierFilterChange = (value: string | null) => { setFilters({ tierId: value || undefined }); };

    // Comprobación si hay filtros activos (sin cambios)
    const areFiltersActive = filters.isActive !== undefined || filters.isFavorite !== undefined || filters.tierId !== undefined;

    // Renderizado principal (sin cambios)
    return (
        <>
            <Paper shadow="sm" p="lg" withBorder radius="lg">
                <Stack gap="lg">
                    <Title order={2}>Gestión de Clientes</Title>
                    <Paper p="md" withBorder radius="md" shadow="xs">
                        <Group>
                            <IconFilter size={18} /> <Text fw={500} size="sm">Filtros:</Text>
                             <TextInput placeholder="Buscar por nombre o email..." leftSection={<IconSearch size={16} stroke={1.5} />} value={searchTerm} onChange={(event) => setSearchTerm(event.currentTarget.value)} radius="md" style={{ flex: 1 }} />
                             <Select placeholder="Estado" data={[{ value: '', label: 'Todos los Estados' }, { value: 'active', label: 'Activo' }, { value: 'inactive', label: 'Inactivo' } ]} value={filters.isActive === true ? 'active' : filters.isActive === false ? 'inactive' : ''} onChange={handleIsActiveFilterChange} clearable={false} radius="md" disabled={loading} style={{ minWidth: 150 }} />
                             <Checkbox label="Solo Favoritos" checked={filters.isFavorite === true} onChange={handleIsFavoriteFilterChange} disabled={loading} />
                             <Select placeholder="Nivel" data={tierOptions} value={filters.tierId || ''} onChange={handleTierFilterChange} disabled={loading || loadingTiers} searchable clearable={false} radius="md" style={{ minWidth: 180 }} />
                        </Group>
                    </Paper>
                    {selectedRowIds.length > 0 && (
                         <Paper p="xs" mb="md" withBorder shadow="xs" >
                            <Group justify="space-between">
                                <Text fw={500} size="sm">{selectedRowIds.length} cliente(s) seleccionado(s)</Text>
                                <Group>
                                    <Button size="xs" color="red" variant="filled" leftSection={<IconTrash size={14}/>} onClick={handleBulkDelete} loading={isPerformingBulkAction} disabled={isPerformingBulkAction} > Eliminar </Button>
                                    <Button size="xs" color="green" variant="outline" leftSection={<IconPlayerPlay size={14}/>} onClick={() => handleBulkToggleActive(true)} loading={isPerformingBulkAction} disabled={isPerformingBulkAction} > Activar </Button>
                                    <Button size="xs" color="red" variant="outline" leftSection={<IconPlayerStop size={14}/>} onClick={() => handleBulkToggleActive(false)} loading={isPerformingBulkAction} disabled={isPerformingBulkAction} > Desactivar </Button>
                                    <Button size="xs" color="blue" variant="outline" leftSection={<IconPlusMinus size={14}/>} onClick={openBulkAdjustModal} disabled={isPerformingBulkAction} > Puntos </Button>
                                </Group>
                            </Group>
                        </Paper>
                    )}
                    {!loading && !error && ( <Group justify="space-between"><Text size="sm" c="dimmed">{totalItems} cliente(s) encontrado(s){searchTerm || areFiltersActive ? ' con los criterios actuales' : ''}.</Text></Group> )}
                    {loading && <Group justify="center" p="md"><Loader /></Group>}
                    {error && !loading && <Alert title="Error" color="red" icon={<IconAlertCircle />}>{error}</Alert>}
                    {!loading && !error && customers.length === 0 && totalItems > 0 && ( <Text c="dimmed" ta="center" p="md">No hay clientes en esta página con los criterios actuales.</Text> )}
                    {!loading && !error && totalItems === 0 && ( <Text c="dimmed" ta="center" p="md">No se encontraron clientes {searchTerm || areFiltersActive ? 'con los criterios actuales' : ''}.</Text> )}
                    {!loading && !error && customers.length > 0 && (
                        <CustomerTable customers={customers} sortStatus={sortStatus} togglingFavoriteId={togglingFavoriteId} togglingActiveId={togglingActiveId} selectedRows={selectedRowIds} onSort={handleTableSort} onToggleFavorite={handleToggleFavorite} onOpenAdjustPoints={handleOpenAdjustPoints} onOpenChangeTier={handleOpenChangeTier} onOpenAssignReward={handleOpenAssignReward} onViewDetails={handleViewDetails} onToggleActive={handleToggleActive} onRowSelectionChange={handleRowSelectionChange} />
                    )}
                    {!loading && !error && totalPages > 1 && ( <Group justify="center" mt="md"><Pagination total={totalPages} value={currentPage} onChange={setPage} /></Group> )}
                </Stack>
            </Paper>
             <AdjustPointsModal opened={adjustModalOpened} onClose={() => { closeAdjustModal(); setSelectedCustomer(null); }} customer={selectedCustomer} onSuccess={handleAdjustSuccess}/>
             <ChangeTierModal opened={changeTierModalOpened} onClose={() => { closeChangeTierModal(); setSelectedCustomer(null); }} customer={selectedCustomer} onSuccess={handleChangeTierSuccess}/>
             <AssignRewardModal opened={assignRewardModalOpened} onClose={() => { closeAssignRewardModal(); setSelectedCustomer(null); }} customer={selectedCustomer} onSuccess={handleAssignRewardSuccess}/>
             <CustomerDetailsModal opened={detailsModalOpened} onClose={handleCloseDetailsModal} customerDetails={selectedCustomerDetails} isLoading={loadingDetails || isSavingNotes} error={errorDetails} onSaveNotes={handleSaveNotes}/>
             <BulkAdjustPointsModal opened={bulkAdjustModalOpened} onClose={closeBulkAdjustModal} onSubmit={handleBulkAdjustPointsSubmit} numberOfCustomers={selectedRowIds.length} />
        </>
    );
};

export default AdminCustomerManagementPage;