// filename: frontend/src/pages/admin/AdminCustomerManagementPage.tsx
// Version: 1.9.3 (Fix: Remove unused AxiosError import)

import React, { useState, useCallback } from 'react';
import {
    Paper, Title, Stack, TextInput, Loader, Alert, Pagination, Group, Text
} from '@mantine/core';
import {
    IconSearch, IconAlertCircle, IconCheck, IconX
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import axiosInstance from '../../services/axiosInstance';
import AdjustPointsModal from '../../components/admin/AdjustPointsModal';
import ChangeTierModal from '../../components/admin/ChangeTierModal';
import AssignRewardModal from '../../components/admin/AssignRewardModal';
import CustomerDetailsModal, { CustomerDetails } from '../../components/admin/CustomerDetailsModal';
import { notifications } from '@mantine/notifications';
// import { AxiosError } from 'axios'; // <-- Importación eliminada

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

    // --- Handlers Modales Existentes ---
    const handleOpenAdjustPoints = useCallback((customer: Customer) => { setSelectedCustomer(customer); openAdjustModal(); }, [openAdjustModal]);
    const handleAdjustSuccess = useCallback(() => { refreshData(); closeAdjustModal(); setSelectedCustomer(null); }, [refreshData, closeAdjustModal]);
    const handleOpenChangeTier = useCallback((customer: Customer) => { setSelectedCustomer(customer); openChangeTierModal(); }, [openChangeTierModal]);
    const handleChangeTierSuccess = useCallback(() => { refreshData(); closeChangeTierModal(); setSelectedCustomer(null); }, [refreshData, closeChangeTierModal]);
    const handleOpenAssignReward = useCallback((customer: Customer) => { setSelectedCustomer(customer); openAssignRewardModal(); }, [openAssignRewardModal]);
    const handleAssignRewardSuccess = useCallback(() => { console.log('AssignRewardModal success callback triggered (no refresh implemented).'); closeAssignRewardModal(); setSelectedCustomer(null); }, [closeAssignRewardModal]);

    // --- Handlers Acciones Fila ---
    const handleToggleFavorite = useCallback(async (customerId: string, currentIsFavorite: boolean) => {
        setTogglingFavoriteId(customerId);
        try {
            await axiosInstance.patch(`/admin/customers/${customerId}/toggle-favorite`);
            notifications.show({ title: 'Estado Cambiado', message: `Cliente ${!currentIsFavorite ? 'marcado como' : 'desmarcado de'} favorito.`, color: 'green', icon: <IconCheck size={18} /> });
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
            notifications.show({ title: 'Estado Actualizado', message: `Cliente ${customer.email} ${customer.isActive ? 'desactivado' : 'activado'} correctamente.`, color: 'green', icon: <IconCheck size={18} />, });
            refreshData();
        } catch (err: any) {
            console.error(`Error toggling active status for customer ${customer.id}:`, err);
            notifications.show({ title: 'Error', message: `No se pudo cambiar el estado: ${err.response?.data?.message || err.message}`, color: 'red', icon: <IconX size={18} />, });
        } finally { setTogglingActiveId(null); }
    }, [refreshData]);

    // Handler Ver Detalles
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

     // Handler Cerrar Modal Detalles
     const handleCloseDetailsModal = () => {
         closeDetailsModal(); setSelectedCustomerDetails(null); setLoadingDetails(false); setErrorDetails(null);
     };

    // Handler para Guardar Notas
    const handleSaveNotes = useCallback(async (notes: string | null) => {
        if (!selectedCustomerDetails?.id) {
             console.error("Cannot save notes, customer details or ID are missing.");
             notifications.show({ title: 'Error Interno', message: 'No se puede guardar notas: falta información del cliente.', color: 'red' });
             return Promise.reject(new Error("Missing customer ID")); // Devolver promesa rechazada
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
            // return Promise.resolve(); // Indicar éxito al modal (opcional)

        } catch (err: any) {
            console.error(`Error saving notes for customer ${customerId}:`, err);
            notifications.show({ title: 'Error al Guardar', message: `No se pudieron guardar las notas: ${err.response?.data?.message || err.message}`, color: 'red', icon: <IconX size={18} />, });
            throw err; // Relanzar error para que el modal sepa que falló
        } finally {
            setIsSavingNotes(false);
        }
    }, [selectedCustomerDetails, setSelectedCustomerDetails]);
    // --------------------------------------

    // --- Renderizado principal ---
    return (
        <>
            <Paper shadow="sm" p="lg" withBorder radius="lg">
                <Stack gap="lg">
                    <Title order={2}>Gestión de Clientes</Title>
                    <TextInput placeholder="Buscar por nombre o email..." leftSection={<IconSearch size={16} stroke={1.5} />} value={searchTerm} onChange={(event) => setSearchTerm(event.currentTarget.value)} radius="lg"/>
                    {loading && <Group justify="center" p="md"><Loader /></Group>}
                    {error && !loading && <Alert title="Error" color="red" icon={<IconAlertCircle />}>{error}</Alert>}
                    {!loading && !error && customers.length === 0 && (<Text c="dimmed" ta="center" p="md"> No se encontraron clientes{searchTerm ? ' para la búsqueda actual' : ''}. </Text> )}
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
                 isLoading={loadingDetails || isSavingNotes} // Pasamos también isSavingNotes
                 error={errorDetails}
                 onSaveNotes={handleSaveNotes} // Pasamos la función de guardado
             />
        </>
    );
};

export default AdminCustomerManagementPage;