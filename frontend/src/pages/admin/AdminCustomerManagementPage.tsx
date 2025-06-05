// frontend/src/pages/admin/AdminCustomerManagementPage.tsx
// Version 2.0.1 (Complete integration of FiltersBar, BulkActionsBar, and adminCustomerService)

import React, { useState, useEffect, useCallback } from 'react';
import {
    Paper, Title, Stack, Loader, Alert, Pagination, Group, Text
} from '@mantine/core';
import {
    IconAlertCircle, IconCheck, IconX
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useModals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';

// Nuevos Componentes
import CustomerFiltersBar, { TierOption } from '../../components/admin/CustomerFiltersBar';
import CustomerBulkActionsBar from '../../components/admin/CustomerBulkActionsBar';

// Componentes Modales
import AdjustPointsModal from '../../components/admin/AdjustPointsModal';
import ChangeTierModal from '../../components/admin/ChangeTierModal';
import AssignRewardModal from '../../components/admin/AssignRewardModal';
import CustomerDetailsModal, { CustomerDetails } from '../../components/admin/CustomerDetailsModal';
import BulkAdjustPointsModal from '../../components/admin/BulkAdjustPointsModal';

// Hook y Tipos de Datos
import useAdminCustomersData, {
    Customer,
    UseAdminCustomersDataResult,
    SortColumn,
} from '../../hooks/useAdminCustomersData';
import CustomerTable from '../../components/admin/CustomerTable';

// Nuevo Servicio API
import * as adminCustomerService from '../../services/adminCustomerService';
import axiosInstance from '../../services/axiosInstance'; // Para fetchTiersForFilter

const AdminCustomerManagementPage: React.FC = () => {
    const { t } = useTranslation();
    const {
        customers, loading, error,
        currentPage, totalPages, totalItems,
        setPage, searchTerm, setSearchTerm, sortStatus, setSortStatus,
        filters, setFilters,
        refetch
    }: UseAdminCustomersDataResult = useAdminCustomersData();
    const modals = useModals();

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

    useEffect(() => {
        const fetchTiersForFilter = async () => {
            setLoadingTiers(true);
            try {
                const response = await axiosInstance.get<{ id: string; name: string; level: number }[]>('/tiers');
                const sortedTiers = response.data.sort((a, b) => a.level - b.level);
                const options: TierOption[] = [
                    { value: '', label: t('adminCustomersPage.tierFilterAll') },
                    { value: 'NONE', label: t('adminCustomersPage.tierFilterNone') },
                    ...sortedTiers.map(tier => ({ value: tier.id, label: tier.name }))
                ];
                setTierOptions(options);
            } catch (err) {
                console.error("Error fetching tiers for filter:", err);
                notifications.show({ title: t('common.error'), message: t('adminCustomersPage.tierFilterError'), color: 'red' });
                setTierOptions([{ value: '', label: t('adminCustomersPage.tierFilterError') }]);
            } finally { setLoadingTiers(false); }
        };
        fetchTiersForFilter();
    }, [t]);

    const handleOpenAdjustPoints = useCallback((customer: Customer) => { setSelectedCustomer(customer); openAdjustModal(); }, [openAdjustModal]);
    const handleAdjustSuccess = useCallback(() => { refetch(); closeAdjustModal(); setSelectedCustomer(null); }, [refetch, closeAdjustModal]);
    const handleOpenChangeTier = useCallback((customer: Customer) => { setSelectedCustomer(customer); openChangeTierModal(); }, [openChangeTierModal]);
    const handleChangeTierSuccess = useCallback(() => { refetch(); closeChangeTierModal(); setSelectedCustomer(null); }, [refetch, closeChangeTierModal]);
    const handleOpenAssignReward = useCallback((customer: Customer) => { setSelectedCustomer(customer); openAssignRewardModal(); }, [openAssignRewardModal]);
    const handleAssignRewardSuccess = useCallback(() => { refetch(); closeAssignRewardModal(); setSelectedCustomer(null); }, [refetch, closeAssignRewardModal]);
    const handleCloseDetailsModal = () => { closeDetailsModal(); setSelectedCustomerDetails(null); setLoadingDetails(false); setErrorDetails(null); };

    const handleToggleFavorite = useCallback(async (customerId: string, currentIsFavorite: boolean) => {
        setTogglingFavoriteId(customerId);
        try {
            await adminCustomerService.toggleCustomerFavoriteApi(customerId);
            notifications.show({
                title: t('common.updateSuccess'),
                message: t('adminCustomersPage.bulkActionStatusSuccess', { // Reutilizando clave de acción masiva para mensaje similar
                    count: 1, // Implica un cliente
                    status: !currentIsFavorite
                        ? t('adminCustomersPage.bulkActionStatusActivated').replace('activado', 'marcado como favorito') // Adaptar
                        : t('adminCustomersPage.bulkActionStatusDeactivated').replace('desactivado', 'desmarcado de favorito') // Adaptar
                }),
                color: 'green', icon: <IconCheck />
            });
            refetch();
        } catch (err: any) {
            notifications.show({
                title: t('common.error'),
                message: t('adminCustomersPage.bulkActionStatusError', { // Reutilizando clave
                    action: 'cambiar estado de favorito', // Adaptar
                    error: err.response?.data?.message || err.message
                }),
                color: 'red', icon: <IconX />
            });
        } finally { setTogglingFavoriteId(null); }
    }, [refetch, t]);

    const handleToggleActive = useCallback(async (customer: Customer) => {
        const actionText = customer.isActive ? t('adminCustomersPage.bulkConfirmToggleDeactivate') : t('adminCustomersPage.bulkConfirmToggleActivate');
        const currentStatusText = customer.isActive ? t('adminCustomersPage.bulkActionStatusDeactivated') : t('adminCustomersPage.bulkActionStatusActivated');

        if (!window.confirm(t('adminCustomersPage.bulkConfirmToggleActiveMessage', { action: actionText, count: 1 }))) return;

        setTogglingActiveId(customer.id);
        try {
            await adminCustomerService.toggleCustomerActiveApi(customer.id);
            notifications.show({
                title: t('common.updateSuccess'),
                message: t('adminCustomersPage.bulkActionStatusSuccess', { count: 1, status: currentStatusText }),
                color: 'green', icon: <IconCheck />,
            });
            refetch();
        } catch (err: any) {
            console.error(`Error toggling active status for customer ${customer.id}:`, err);
            notifications.show({
                title: t('common.error'),
                message: t('adminCustomersPage.bulkActionStatusError', { action: actionText, error: err.response?.data?.message || err.message }),
                color: 'red', icon: <IconX />,
            });
        } finally { setTogglingActiveId(null); }
    }, [refetch, t]);

    const handleViewDetails = useCallback(async (customer: Customer) => {
        setSelectedCustomerDetails(null); setErrorDetails(null); setLoadingDetails(true); openDetailsModal();
        try {
            const details = await adminCustomerService.getCustomerDetailsApi(customer.id);
            setSelectedCustomerDetails(details);
        } catch (err: any) {
            setErrorDetails(err.response?.data?.message || err.message || t('adminCustomersPage.customerDetailsLoadingError'));
        } finally { setLoadingDetails(false); }
    }, [openDetailsModal, t]);

    const handleSaveNotes = useCallback(async (notes: string | null) => {
        if (!selectedCustomerDetails?.id) { return Promise.reject(new Error("Missing customer ID")); }
        setIsSavingNotes(true);
        try {
            await adminCustomerService.updateCustomerNotesApi(selectedCustomerDetails.id, notes);
            notifications.show({ title: t('common.saveSuccess'), message: t('adminCustomersPage.customerDetailsNotesSaved'), color: 'green', icon: <IconCheck /> });
            const details = await adminCustomerService.getCustomerDetailsApi(selectedCustomerDetails.id);
            setSelectedCustomerDetails(details);
        } catch (err: any) {
            const apiError = err.response?.data?.message || err.message || t('common.errorUnknown');
            notifications.show({ title: t('common.saveError'), message: t('adminCustomersPage.customerDetailsNotesError', { error: apiError }), color: 'red', icon: <IconX /> });
            throw err;
        } finally { setIsSavingNotes(false); }
    }, [selectedCustomerDetails, t]);

    const handleTableSort = useCallback((column: SortColumn) => { setSortStatus({ column, direction: sortStatus.column === column && sortStatus.direction === 'asc' ? 'desc' : 'asc' }); }, [sortStatus, setSortStatus]);
    const handleRowSelectionChange = useCallback((selectedIds: string[]) => { setSelectedRowIds(selectedIds); }, []);

    const handleBulkToggleActive = useCallback(async (targetStatus: boolean) => {
        const action = targetStatus ? t('adminCustomersPage.bulkConfirmToggleActivate') : t('adminCustomersPage.bulkConfirmToggleDeactivate');
        const count = selectedRowIds.length;
        if (count === 0) {
            notifications.show({ title: t('common.info'), message: t('adminCustomersPage.bulkActionNoneSelected'), color: 'yellow' });
            return;
        }
        if (!window.confirm(t('adminCustomersPage.bulkConfirmToggleActiveMessage', { action, count }))) return;

        setIsPerformingBulkAction(true);
        try {
            const response = await adminCustomerService.bulkUpdateCustomerStatusApi(selectedRowIds, targetStatus);
            const statusResult = targetStatus ? t('adminCustomersPage.bulkActionStatusActivated') : t('adminCustomersPage.bulkActionStatusDeactivated');
            notifications.show({ title: t('adminCommon.updateSuccess'), message: t('adminCustomersPage.bulkActionStatusSuccess', { count: response.count, status: statusResult }), color: 'green', icon: <IconCheck /> });
            refetch(); setSelectedRowIds([]);
        } catch (err: any) {
            console.error(`Error during bulk ${action}:`, err);
            const apiError = err.response?.data?.message || err.message || t('common.errorUnknown');
            notifications.show({ title: t('adminCommon.updateError'), message: t('adminCustomersPage.bulkActionStatusError', { action, error: apiError }), color: 'red', icon: <IconX /> });
        } finally { setIsPerformingBulkAction(false); }
    }, [selectedRowIds, refetch, t]);

    const handleBulkDelete = useCallback(() => {
        const count = selectedRowIds.length;
        if (count === 0) {
            notifications.show({ title: t('common.info'), message: t('adminCustomersPage.bulkActionNoneSelected'), color: 'yellow' });
            return;
        }
        modals.openConfirmModal({
            title: t('adminCustomersPage.bulkConfirmDeleteTitle'), centered: true,
            children: ( <Text size="sm">{t('adminCustomersPage.bulkConfirmDeleteMessage', { count })}</Text> ),
            labels: { confirm: t('adminCustomersPage.bulkConfirmDeleteButton'), cancel: t('common.cancel') },
            confirmProps: { color: 'red' }, zIndex: 1001,
            onConfirm: async () => {
                setIsPerformingBulkAction(true);
                try {
                    const response = await adminCustomerService.bulkDeleteCustomersApi(selectedRowIds);
                    notifications.show({ title: t('adminCommon.deleteSuccess'), message: t('adminCustomersPage.bulkActionDeleteSuccess', { count: response.count }), color: 'green', icon: <IconCheck /> });
                    refetch(); setSelectedRowIds([]);
                } catch (err: any) {
                    console.error(`Error during bulk delete:`, err);
                    const apiError = err.response?.data?.message || err.message || t('common.errorUnknown');
                    notifications.show({ title: t('adminCommon.deleteError'), message: t('adminCustomersPage.bulkActionDeleteError', { error: apiError }), color: 'red', icon: <IconX /> });
                } finally { setIsPerformingBulkAction(false); }
            },
        });
    }, [selectedRowIds, refetch, modals, t]);

    const handleBulkAdjustPointsSubmit = useCallback(async (values: { amount: number; reason?: string | undefined }) => {
        const { amount, reason } = values; const count = selectedRowIds.length;
        if (count === 0) {
            notifications.show({ title: t('common.error'), message: t('adminCustomersPage.bulkAdjustPointsErrorNoneSelected'), color: 'red' });
            return Promise.reject(new Error("No customers selected"));
        }
        setIsPerformingBulkAction(true); closeBulkAdjustModal();
        try {
            const response = await adminCustomerService.bulkAdjustCustomerPointsApi(selectedRowIds, amount, reason || null);
            const actionResult = amount > 0 ? t('adminCustomersPage.bulkAdjustPointsAdded') : t('adminCustomersPage.bulkAdjustPointsSubtracted');
            notifications.show({ title: t('adminCommon.updateSuccess'), message: t('adminCustomersPage.bulkAdjustPointsSuccess', { points: Math.abs(amount), action: actionResult, count: response.count }), color: 'green', icon: <IconCheck /> });
            refetch(); setSelectedRowIds([]);
        } catch (err: any) {
            console.error(`Error during bulk points adjustment:`, err);
            const apiError = err.response?.data?.message || err.message || t('common.errorUnknown');
            notifications.show({ title: t('adminCommon.updateError'), message: t('adminCustomersPage.bulkAdjustPointsError', { error: apiError }), color: 'red', icon: <IconX /> });
            throw err; // Relanzar para que el modal sepa que falló y no se cierre si así está programado
        } finally { setIsPerformingBulkAction(false); }
    }, [selectedRowIds, refetch, closeBulkAdjustModal, t]);

    const handleFilterSearchTermChange = (term: string) => setSearchTerm(term);
    const handleFilterActiveChange = (value: string | null) => {
        setFilters({ isActive: value === 'active' ? true : value === 'inactive' ? false : undefined });
    };
    const handleFilterFavoriteChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFilters({ isFavorite: event.currentTarget.checked ? true : undefined });
    };
    const handleFilterTierChange = (value: string | null) => {
        setFilters({ tierId: value || undefined });
    };

    const areFiltersActive = filters.isActive !== undefined || filters.isFavorite !== undefined || filters.tierId !== undefined;

    return (
        <>
            <Paper shadow="sm" p="lg" withBorder radius="lg">
                <Stack gap="lg">
                    <Title order={2}>{t('adminCustomersPage.title')}</Title>
                    <CustomerFiltersBar
                        searchTerm={searchTerm}
                        onSearchTermChange={handleFilterSearchTermChange}
                        activeFilterValue={filters.isActive === true ? 'active' : filters.isActive === false ? 'inactive' : ''}
                        onActiveFilterChange={handleFilterActiveChange}
                        isFavoriteFilterChecked={filters.isFavorite === true}
                        onIsFavoriteFilterChange={handleFilterFavoriteChange}
                        tierFilterValue={filters.tierId || ''}
                        onTierFilterChange={handleFilterTierChange}
                        tierOptions={tierOptions}
                        loadingFilters={loadingTiers}
                        disabled={loading || isPerformingBulkAction}
                    />
                    <CustomerBulkActionsBar
                        selectedRowCount={selectedRowIds.length}
                        onBulkDelete={handleBulkDelete}
                        onBulkActivate={() => handleBulkToggleActive(true)}
                        onBulkDeactivate={() => handleBulkToggleActive(false)}
                        onOpenBulkAdjustPoints={openBulkAdjustModal}
                        isPerformingBulkAction={isPerformingBulkAction}
                    />

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
                            <Pagination total={totalPages} value={currentPage} onChange={setPage} disabled={loading || isPerformingBulkAction}/>
                        </Group>
                    )}
                </Stack>
            </Paper>

            <AdjustPointsModal
                opened={adjustModalOpened}
                onClose={() => { closeAdjustModal(); setSelectedCustomer(null); }}
                customer={selectedCustomer}
                onSuccess={handleAdjustSuccess} // Este onSuccess ahora es solo para refetch y cerrar modal
            />
            <ChangeTierModal
                opened={changeTierModalOpened}
                onClose={() => { closeChangeTierModal(); setSelectedCustomer(null); }}
                customer={selectedCustomer}
                onSuccess={handleChangeTierSuccess} // Similarmente, para refetch y cerrar
            />
            <AssignRewardModal
                opened={assignRewardModalOpened}
                onClose={() => { closeAssignRewardModal(); setSelectedCustomer(null); }}
                customer={selectedCustomer}
                onSuccess={handleAssignRewardSuccess} // Similarmente
            />
            <CustomerDetailsModal
                opened={detailsModalOpened}
                onClose={handleCloseDetailsModal}
                customerDetails={selectedCustomerDetails}
                isLoading={loadingDetails || isSavingNotes}
                error={errorDetails}
                onSaveNotes={handleSaveNotes} // Este ya usa el servicio
            />
            <BulkAdjustPointsModal
                opened={bulkAdjustModalOpened}
                onClose={closeBulkAdjustModal}
                onSubmit={handleBulkAdjustPointsSubmit} // Este ya usa el servicio
                numberOfCustomers={selectedRowIds.length}
            />
        </>
    );
};

export default AdminCustomerManagementPage;