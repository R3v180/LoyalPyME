// filename: frontend/src/pages/admin/AdminCustomerManagementPage.tsx
// Version: 1.7.0 (Refactor: Use CustomerTable component)

import React, { useState, useCallback } from 'react';
import {
    Paper, Title, Stack, TextInput, Loader, Alert, Pagination, Group, Text
    // Ya no se necesitan: Table, ActionIcon, useMantineTheme, UnstyledButton, Center, rem
} from '@mantine/core';
import {
    IconSearch, IconAlertCircle, IconCheck, IconX
    // Ya no se necesitan iconos de tabla: IconAdjustments, IconGift, IconEye, IconStar, IconToggleLeft, IconStairsUp, IconSelector, IconChevronDown, IconChevronUp
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import axiosInstance from '../../services/axiosInstance'; // Necesario para toggleFavorite
import AdjustPointsModal from '../../components/admin/AdjustPointsModal';
import ChangeTierModal from '../../components/admin/ChangeTierModal';
import AssignRewardModal from '../../components/admin/AssignRewardModal';
import { notifications } from '@mantine/notifications';
// Ya no necesitamos importar classes de CSS aquí si CustomerTable lo importa
// import classes from './AdminCustomerManagementPage.module.css';

// Importamos el hook y el tipo Customer
import { useAdminCustomers, Customer } from '../../hooks/useAdminCustomers'; // SortStatus ya no se importa aquí
// Importamos el nuevo componente de tabla
import CustomerTable from '../../components/admin/CustomerTable';

// Ya no necesitamos definir Th ni ThProps aquí

// --- COMPONENTE PRINCIPAL ---
const AdminCustomerManagementPage: React.FC = () => {
    // Usamos el hook para obtener datos y manejadores principales
    const {
        customers, loading, error, activePage, totalPages, setPage,
        searchTerm, setSearchTerm, sortStatus, handleSort, refreshData
    } = useAdminCustomers();

    // Estados locales de UI (modales, selección, estado de carga acción favorita)
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [adjustModalOpened, { open: openAdjustModal, close: closeAdjustModal }] = useDisclosure(false);
    const [changeTierModalOpened, { open: openChangeTierModal, close: closeChangeTierModal }] = useDisclosure(false);
    const [assignRewardModalOpened, { open: openAssignRewardModal, close: closeAssignRewardModal }] = useDisclosure(false);
    const [togglingFavoriteId, setTogglingFavoriteId] = useState<string | null>(null);

    // --- Handlers de Modales y Acciones (pasados como props a CustomerTable) ---
    const handleOpenAdjustPoints = useCallback((customer: Customer) => { setSelectedCustomer(customer); openAdjustModal(); }, []);
    const handleAdjustSuccess = useCallback(() => { refreshData(); }, [refreshData]);

    const handleOpenChangeTier = useCallback((customer: Customer) => { setSelectedCustomer(customer); openChangeTierModal(); }, []);
    const handleChangeTierSuccess = useCallback(() => { refreshData(); }, [refreshData]);

    const handleOpenAssignReward = useCallback((customer: Customer) => { setSelectedCustomer(customer); openAssignRewardModal(); }, []);
    const handleAssignRewardSuccess = useCallback(() => { console.log('AssignRewardModal success callback triggered (no refresh implemented).'); }, []);

    const handleToggleFavorite = useCallback(async (customerId: string, currentIsFavorite: boolean) => {
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
    }, [refreshData]); // Añadimos refreshData como dependencia

    // --- Placeholders para acciones futuras de la tabla ---
    const handleViewDetails = useCallback((customer: Customer) => {
        console.log('TODO: Implement View Details for customer:', customer.id);
        alert(`FUNCIONALIDAD PENDIENTE: Ver Detalles para ${customer.email}`);
        // Aquí iría la lógica para abrir un modal de detalles o navegar a otra página
    }, []);

    const handleToggleActive = useCallback((customer: Customer) => {
        console.log('TODO: Implement Toggle Active for customer:', customer.id);
        alert(`FUNCIONALIDAD PENDIENTE: Activar/Desactivar a ${customer.email}`);
        // Aquí iría la lógica para llamar a la API, mostrar notificación y refrescar
        // const newStatus = !customer.isActive;
        // try { ... await axiosInstance.patch(...); refreshData(); ... } catch { ... }
    }, []); // Añadir refreshData como dependencia cuando se implemente

    // --- Renderizado principal ---
    // Ahora es mucho más limpio, la complejidad de la tabla está en CustomerTable
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

                    {/* Renderizado de la Tabla (si hay datos y no hay carga/error) */}
                    {!loading && !error && customers.length > 0 && (
                        <CustomerTable
                            customers={customers}
                            sortStatus={sortStatus}
                            togglingFavoriteId={togglingFavoriteId}
                            onSort={handleSort}
                            onToggleFavorite={handleToggleFavorite}
                            onOpenAdjustPoints={handleOpenAdjustPoints}
                            onOpenChangeTier={handleOpenChangeTier}
                            onOpenAssignReward={handleOpenAssignReward}
                            onViewDetails={handleViewDetails} // Pasamos el placeholder
                            onToggleActive={handleToggleActive} // Pasamos el placeholder
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

            {/* Modales (sin cambios) */}
            <AdjustPointsModal opened={adjustModalOpened} onClose={() => { closeAdjustModal(); setSelectedCustomer(null); }} customer={selectedCustomer} onSuccess={handleAdjustSuccess}/>
            <ChangeTierModal opened={changeTierModalOpened} onClose={() => { closeChangeTierModal(); setSelectedCustomer(null); }} customer={selectedCustomer} onSuccess={handleChangeTierSuccess}/>
            <AssignRewardModal opened={assignRewardModalOpened} onClose={() => { closeAssignRewardModal(); setSelectedCustomer(null); }} customer={selectedCustomer} onSuccess={handleAssignRewardSuccess}/>
        </>
    );
};

export default AdminCustomerManagementPage;