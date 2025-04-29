// filename: frontend/src/pages/admin/AdminCustomerManagementPage.tsx
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
import { useTranslation } from 'react-i18next'; // Importar hook

// Importamos tipos y hook correctamente
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
    const { t } = useTranslation(); // Hook de traducción
    // Hook
    const {
        customers, loading, error,
        currentPage, totalPages, totalItems,
        setPage, searchTerm, setSearchTerm, sortStatus, setSortStatus,
        filters, setFilters,
        refetch
    }: UseAdminCustomersDataResult = useAdminCustomersData();
    const modals = useModals();

    // Estados locales de UI
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

    // useEffect para cargar los Tiers
    useEffect(() => {
        const fetchTiersForFilter = async () => {
            setLoadingTiers(true);
            try {
                const response = await axiosInstance.get<{ id: string; name: string; level: number }[]>('/tiers');
                const sortedTiers = response.data.sort((a, b) => a.level - b.level);
                // Usar t() para las opciones del filtro de nivel
                const options: TierOption[] = [
                    { value: '', label: t('adminCustomersPage.tierFilterAll') },
                    { value: 'NONE', label: t('adminCustomersPage.tierFilterNone') },
                    ...sortedTiers.map(tier => ({ value: tier.id, label: tier.name })) // Nombres de tier vienen de BD
                ];
                setTierOptions(options);
            } catch (err) {
                console.error("Error fetching tiers for filter:", err);
                notifications.show({
                    title: t('common.error'), // Clave común
                    message: t('adminCustomersPage.tierFilterError'), // Usar clave existente
                    color: 'red'
                });
                setTierOptions([{ value: '', label: t('adminCustomersPage.tierFilterError') }]); // Usar clave existente
            } finally {
                setLoadingTiers(false);
            }
        };
        fetchTiersForFilter();
    }, [t]); // Añadir t como dependencia

    // Handlers Modales (Actualizar títulos o mensajes que se pasen a los modales si aplica)
    const handleOpenAdjustPoints = useCallback((customer: Customer) => { setSelectedCustomer(customer); openAdjustModal(); }, [openAdjustModal]);
    const handleAdjustSuccess = useCallback(() => { refetch(); closeAdjustModal(); setSelectedCustomer(null); }, [refetch, closeAdjustModal]);
    const handleOpenChangeTier = useCallback((customer: Customer) => { setSelectedCustomer(customer); openChangeTierModal(); }, [openChangeTierModal]);
    const handleChangeTierSuccess = useCallback(() => { refetch(); closeChangeTierModal(); setSelectedCustomer(null); }, [refetch, closeChangeTierModal]);
    const handleOpenAssignReward = useCallback((customer: Customer) => { setSelectedCustomer(customer); openAssignRewardModal(); }, [openAssignRewardModal]);
    const handleAssignRewardSuccess = useCallback(() => { closeAssignRewardModal(); setSelectedCustomer(null); }, [closeAssignRewardModal]);
    const handleCloseDetailsModal = () => { closeDetailsModal(); setSelectedCustomerDetails(null); setLoadingDetails(false); setErrorDetails(null); };

    // Handlers Acciones Fila (Notificaciones deben moverse al hook o servicio idealmente)
    const handleToggleFavorite = useCallback(async (customerId: string, currentIsFavorite: boolean) => {
        setTogglingFavoriteId(customerId);
        try {
            await axiosInstance.patch(`/admin/customers/${customerId}/toggle-favorite`);
            notifications.show({
                title: t('common.updateSuccess'), // Clave común
                message: `Cliente ${!currentIsFavorite ? 'marcado como' : 'desmarcado de'} favorito.`, // TODO: i18n
                color: 'green', icon: <IconCheck size={18} />
            });
            refetch();
        } catch (err: any) {
            notifications.show({
                title: t('common.error'), // Clave común
                message: `No se pudo cambiar el estado de favorito: ${err.response?.data?.message || err.message}`, // TODO: i18n
                color: 'red', icon: <IconX size={18} />
            });
        } finally {
            setTogglingFavoriteId(null);
        }
    }, [refetch, t]);

    const handleToggleActive = useCallback(async (customer: Customer) => {
        const actionText = customer.isActive ? t('adminCustomersPage.bulkConfirmToggleDeactivate') : t('adminCustomersPage.bulkConfirmToggleActivate');
        // Usar confirmación genérica por ahora, idealmente con nombre de cliente
        if (!window.confirm(t('adminCustomersPage.bulkConfirmToggleActiveMessage', { action: actionText, count: 1 }))) {
            return;
        }
        setTogglingActiveId(customer.id);
        try {
            await axiosInstance.patch(`/admin/customers/${customer.id}/toggle-active`);
            const statusText = customer.isActive ? t('adminCustomersPage.bulkActionStatusDeactivated') : t('adminCustomersPage.bulkActionStatusActivated');
            notifications.show({
                title: t('common.updateSuccess'), // Clave común
                message: `Cliente ${customer.email} ${statusText} correctamente.`, // TODO: i18n
                color: 'green', icon: <IconCheck size={18} />,
            });
            refetch();
        } catch (err: any) {
            console.error(`Error toggling active status for customer ${customer.id}:`, err);
            notifications.show({
                title: t('common.error'), // Clave común
                message: `No se pudo cambiar el estado: ${err.response?.data?.message || err.message}`, // TODO: i18n
                color: 'red', icon: <IconX size={18} />,
            });
        } finally {
            setTogglingActiveId(null);
        }
    }, [refetch, t]);

    const handleViewDetails = useCallback(async (customer: Customer) => {
        setSelectedCustomerDetails(null); setErrorDetails(null); setLoadingDetails(true); openDetailsModal();
        try {
            const response = await axiosInstance.get<CustomerDetails>(`/admin/customers/${customer.id}/details`);
            setSelectedCustomerDetails(response.data);
        } catch (err: any) {
            setErrorDetails(err.response?.data?.message || err.message || t('adminCustomersPage.customerDetailsLoadingError')); // Clave i18n
        } finally {
            setLoadingDetails(false);
        }
    }, [openDetailsModal, t]);

    const handleSaveNotes = useCallback(async (notes: string | null) => {
        if (!selectedCustomerDetails?.id) { return Promise.reject(new Error("Missing customer ID")); }
        const customerId = selectedCustomerDetails.id;
        setIsSavingNotes(true);
        try {
            await axiosInstance.patch(`/admin/customers/${customerId}/notes`, { notes: notes });
            notifications.show({
                title: t('common.saveSuccess'), // Clave común
                message: t('adminCustomersPage.customerDetailsNotesSaved'), // Clave i18n
                color: 'green', icon: <IconCheck size={18} />,
            });
            const response = await axiosInstance.get<CustomerDetails>(`/admin/customers/${customerId}/details`);
            setSelectedCustomerDetails(response.data);
        } catch (err: any) {
            const apiError = err.response?.data?.message || err.message || t('common.errorUnknown');
            notifications.show({
                title: t('common.saveError'), // Clave común
                message: t('adminCustomersPage.customerDetailsNotesError', { error: apiError }), // Clave i18n
                color: 'red', icon: <IconX size={18} />,
            });
            throw err;
        } finally {
            setIsSavingNotes(false);
        }
    }, [selectedCustomerDetails, t]);

    // Handler de Ordenación
    const handleTableSort = useCallback((column: SortColumn) => {
        const direction = sortStatus.column === column && sortStatus.direction === 'asc' ? 'desc' : 'asc';
        setSortStatus({ column, direction });
    }, [sortStatus, setSortStatus]);

    // Handlers Acciones Masivas (Actualizar notificaciones y confirmaciones)
    const handleRowSelectionChange = useCallback((selectedIds: string[]) => { setSelectedRowIds(selectedIds); }, []);

    const handleBulkToggleActive = useCallback(async (targetStatus: boolean) => {
        const action = targetStatus ? t('adminCustomersPage.bulkConfirmToggleActivate') : t('adminCustomersPage.bulkConfirmToggleDeactivate');
        const statusResult = targetStatus ? t('adminCustomersPage.bulkActionStatusActivated') : t('adminCustomersPage.bulkActionStatusDeactivated');
        const count = selectedRowIds.length;
        if (count === 0) {
            notifications.show({ title: t('common.info', 'Información'), message: t('adminCustomersPage.bulkActionNoneSelected'), color: 'yellow' });
            return;
        }
        // Usar t() para la confirmación
        if (!window.confirm(t('adminCustomersPage.bulkConfirmToggleActiveMessage', { action, count }))) {
            return;
        }
        setIsPerformingBulkAction(true);
        try {
            const response = await axiosInstance.patch('/admin/customers/bulk-status', { customerIds: selectedRowIds, isActive: targetStatus });
            notifications.show({
                title: t('adminCommon.updateSuccess'), // Clave común
                message: t('adminCustomersPage.bulkActionStatusSuccess', { count: response.data.count, status: statusResult }),
                color: 'green', icon: <IconCheck size={18} />,
            });
            refetch();
            setSelectedRowIds([]);
        } catch (err: any) {
            console.error(`Error during bulk ${action}:`, err);
            const apiError = err.response?.data?.message || err.message || t('common.errorUnknown');
            notifications.show({
                title: t('adminCommon.updateError'), // Clave común
                message: t('adminCustomersPage.bulkActionStatusError', { action, error: apiError }),
                color: 'red', icon: <IconX size={18} />,
            });
        } finally {
            setIsPerformingBulkAction(false);
        }
    }, [selectedRowIds, refetch, t]);

    const handleBulkDelete = useCallback(() => {
        const count = selectedRowIds.length;
        if (count === 0) {
            notifications.show({ title: t('common.info'), message: t('adminCustomersPage.bulkActionNoneSelected'), color: 'yellow' });
            return;
        }
        // Usar t() para el modal de confirmación
        modals.openConfirmModal({
            title: t('adminCustomersPage.bulkConfirmDeleteTitle'),
            centered: true,
            children: (
                <Text size="sm">
                    {t('adminCustomersPage.bulkConfirmDeleteMessage', { count })}
                </Text>
            ),
            labels: { confirm: t('adminCustomersPage.bulkConfirmDeleteButton'), cancel: t('common.cancel') },
            confirmProps: { color: 'red' },
            zIndex: 1001, // Asegurar que esté sobre otros modales si aplica
            onConfirm: async () => {
                setIsPerformingBulkAction(true);
                try {
                    const response = await axiosInstance.delete('/admin/customers/bulk-delete', { data: { customerIds: selectedRowIds } });
                    notifications.show({
                        title: t('adminCommon.deleteSuccess'), // Clave común
                        message: t('adminCustomersPage.bulkActionDeleteSuccess', { count: response.data.count }),
                        color: 'green', icon: <IconCheck size={18} />,
                    });
                    refetch();
                    setSelectedRowIds([]);
                } catch (err: any) {
                    console.error(`Error during bulk delete:`, err);
                    const apiError = err.response?.data?.message || err.message || t('common.errorUnknown');
                    notifications.show({
                        title: t('adminCommon.deleteError'), // Clave común
                        message: t('adminCustomersPage.bulkActionDeleteError', { error: apiError }),
                        color: 'red', icon: <IconX size={18} />,
                    });
                } finally {
                    setIsPerformingBulkAction(false);
                }
            },
        });
    }, [selectedRowIds, refetch, modals, t]);

    const handleBulkAdjustPointsSubmit = useCallback(async (values: { amount: number; reason?: string | undefined }) => {
        const { amount, reason } = values;
        const count = selectedRowIds.length;
        if (count === 0) {
            notifications.show({ title: t('common.error'), message: t('adminCustomersPage.bulkAdjustPointsErrorNoneSelected'), color: 'red' });
            return Promise.reject(new Error("No customers selected"));
        }
        setIsPerformingBulkAction(true);
        closeBulkAdjustModal();
        try {
            const response = await axiosInstance.post('/admin/customers/bulk-adjust-points', { customerIds: selectedRowIds, amount: amount, reason: reason || null });
            const actionResult = amount > 0 ? t('adminCustomersPage.bulkAdjustPointsAdded') : t('adminCustomersPage.bulkAdjustPointsSubtracted');
            notifications.show({
                title: t('adminCommon.updateSuccess'), // Clave común
                message: t('adminCustomersPage.bulkAdjustPointsSuccess', { points: Math.abs(amount), action: actionResult, count: response.data.count }),
                color: 'green', icon: <IconCheck size={18} />,
            });
            refetch();
            setSelectedRowIds([]);
        } catch (err: any) {
            console.error(`Error during bulk points adjustment:`, err);
            const apiError = err.response?.data?.message || err.message || t('common.errorUnknown');
            notifications.show({
                title: t('adminCommon.updateError'), // Clave común
                message: t('adminCustomersPage.bulkAdjustPointsError', { error: apiError }),
                color: 'red', icon: <IconX size={18} />,
            });
        } finally {
            setIsPerformingBulkAction(false);
        }
    }, [selectedRowIds, refetch, closeBulkAdjustModal, t]);

    // Handlers para los cambios en los filtros
    const handleIsActiveFilterChange = (value: string | null) => {
        let isActiveValue: boolean | undefined;
        if (value === 'active') isActiveValue = true;
        else if (value === 'inactive') isActiveValue = false;
        else isActiveValue = undefined;
        setFilters({ isActive: isActiveValue });
    };
    const handleIsFavoriteFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFilters({ isFavorite: event.currentTarget.checked ? true : undefined });
    };
    const handleTierFilterChange = (value: string | null) => {
        setFilters({ tierId: value || undefined });
    };

    // Comprobación si hay filtros activos
    const areFiltersActive = filters.isActive !== undefined || filters.isFavorite !== undefined || filters.tierId !== undefined;

    // Renderizado principal
    return (
        <>
            <Paper shadow="sm" p="lg" withBorder radius="lg">
                <Stack gap="lg">
                    <Title order={2}>{t('adminCustomersPage.title')}</Title>
                    <Paper p="md" withBorder radius="md" shadow="xs">
                        <Group>
                            <IconFilter size={18} />
                            <Text fw={500} size="sm">{t('adminCustomersPage.filterLabel')}</Text>
                            <TextInput
                                placeholder={t('adminCustomersPage.searchPlaceholder')}
                                leftSection={<IconSearch size={16} stroke={1.5} />}
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.currentTarget.value)}
                                radius="md"
                                style={{ flex: 1 }}
                            />
                            <Select
                                placeholder={t('adminCustomersPage.statusFilterPlaceholder')}
                                data={[
                                    { value: '', label: t('adminCustomersPage.statusFilterAll') },
                                    { value: 'active', label: t('adminCustomersPage.statusFilterActive') },
                                    { value: 'inactive', label: t('adminCustomersPage.statusFilterInactive') }
                                ]}
                                value={filters.isActive === true ? 'active' : filters.isActive === false ? 'inactive' : ''}
                                onChange={handleIsActiveFilterChange}
                                clearable={false}
                                radius="md"
                                disabled={loading}
                                style={{ minWidth: 150 }}
                            />
                            <Checkbox
                                label={t('adminCustomersPage.favoriteFilterLabel')}
                                checked={filters.isFavorite === true}
                                onChange={handleIsFavoriteFilterChange}
                                disabled={loading}
                            />
                            <Select
                                placeholder={t('adminCustomersPage.tierFilterPlaceholder')}
                                data={tierOptions} // Ya están traducidas las opciones "Todos" y "Sin Nivel"
                                value={filters.tierId || ''}
                                onChange={handleTierFilterChange}
                                disabled={loading || loadingTiers}
                                searchable
                                clearable={false}
                                radius="md"
                                style={{ minWidth: 180 }}
                            />
                        </Group>
                    </Paper>

                    {selectedRowIds.length > 0 && (
                        <Paper p="xs" mb="md" withBorder shadow="xs" >
                            <Group justify="space-between">
                                <Text fw={500} size="sm">
                                    {t('adminCustomersPage.selectedCount', { count: selectedRowIds.length })}
                                </Text>
                                <Group>
                                    <Button size="xs" color="red" variant="filled" leftSection={<IconTrash size={14}/>} onClick={handleBulkDelete} loading={isPerformingBulkAction} disabled={isPerformingBulkAction} >
                                        {t('adminCustomersPage.bulkDeleteButton')}
                                    </Button>
                                    <Button size="xs" color="green" variant="outline" leftSection={<IconPlayerPlay size={14}/>} onClick={() => handleBulkToggleActive(true)} loading={isPerformingBulkAction} disabled={isPerformingBulkAction} >
                                        {t('adminCustomersPage.bulkActivateButton')}
                                    </Button>
                                    <Button size="xs" color="red" variant="outline" leftSection={<IconPlayerStop size={14}/>} onClick={() => handleBulkToggleActive(false)} loading={isPerformingBulkAction} disabled={isPerformingBulkAction} >
                                        {t('adminCustomersPage.bulkDeactivateButton')}
                                    </Button>
                                    <Button size="xs" color="blue" variant="outline" leftSection={<IconPlusMinus size={14}/>} onClick={openBulkAdjustModal} disabled={isPerformingBulkAction} >
                                        {t('adminCustomersPage.bulkPointsButton')}
                                    </Button>
                                </Group>
                            </Group>
                        </Paper>
                    )}

                    {!loading && !error && (
                        <Group justify="space-between">
                            <Text size="sm" c="dimmed">
                                {t('adminCustomersPage.resultsCount', { count: totalItems })}
                                {searchTerm || areFiltersActive ? ` ${t('adminCustomersPage.resultsCountFiltered')}` : ''}.
                            </Text>
                        </Group>
                    )}
                    {loading && <Group justify="center" p="md"><Loader /></Group>}
                    {error && !loading && <Alert title={t('common.error')} color="red" icon={<IconAlertCircle />}>{error}</Alert>}
                    {!loading && !error && customers.length === 0 && totalItems > 0 && (
                         <Text c="dimmed" ta="center" p="md">{t('adminCustomersPage.noResultsFiltered')}</Text>
                     )}
                    {!loading && !error && totalItems === 0 && (
                         <Text c="dimmed" ta="center" p="md">{searchTerm || areFiltersActive ? t('adminCustomersPage.noResultsFiltered') : t('adminCustomersPage.noResults')}.</Text>
                     )}
                    {!loading && !error && customers.length > 0 && (
                        // CustomerTable necesita i18n internamente
                        <CustomerTable
                            customers={customers}
                            sortStatus={sortStatus}
                            togglingFavoriteId={togglingFavoriteId}
                            togglingActiveId={togglingActiveId}
                            selectedRows={selectedRowIds}
                            onSort={handleTableSort}
                            onToggleFavorite={handleToggleFavorite}
                            onOpenAdjustPoints={handleOpenAdjustPoints}
                            onOpenChangeTier={handleOpenChangeTier}
                            onOpenAssignReward={handleOpenAssignReward}
                            onViewDetails={handleViewDetails}
                            onToggleActive={handleToggleActive}
                            onRowSelectionChange={handleRowSelectionChange}
                        />
                    )}
                    {!loading && !error && totalPages > 1 && (
                        <Group justify="center" mt="md">
                            <Pagination total={totalPages} value={currentPage} onChange={setPage} />
                        </Group>
                    )}
                </Stack>
            </Paper>

            {/* Modales (necesitan i18n internamente) */}
            <AdjustPointsModal
                opened={adjustModalOpened}
                onClose={() => { closeAdjustModal(); setSelectedCustomer(null); }}
                customer={selectedCustomer}
                onSuccess={handleAdjustSuccess}/>
            <ChangeTierModal
                opened={changeTierModalOpened}
                onClose={() => { closeChangeTierModal(); setSelectedCustomer(null); }}
                customer={selectedCustomer}
                onSuccess={handleChangeTierSuccess}/>
            <AssignRewardModal
                opened={assignRewardModalOpened}
                onClose={() => { closeAssignRewardModal(); setSelectedCustomer(null); }}
                customer={selectedCustomer}
                onSuccess={handleAssignRewardSuccess}/>
            <CustomerDetailsModal
                opened={detailsModalOpened}
                onClose={handleCloseDetailsModal}
                customerDetails={selectedCustomerDetails}
                isLoading={loadingDetails || isSavingNotes}
                error={errorDetails}
                onSaveNotes={handleSaveNotes}/>
            {/* Usar t() para el título del modal de ajuste masivo */}
            <BulkAdjustPointsModal
                opened={bulkAdjustModalOpened}
                onClose={closeBulkAdjustModal}
                onSubmit={handleBulkAdjustPointsSubmit}
                numberOfCustomers={selectedRowIds.length}
            />
        </>
    );
};

export default AdminCustomerManagementPage;