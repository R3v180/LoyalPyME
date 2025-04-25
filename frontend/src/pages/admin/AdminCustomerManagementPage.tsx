// filename: frontend/src/pages/admin/AdminCustomerManagementPage.tsx
// Version: 1.4.4 (Fix API PATCH URL in handleToggleFavorite - DEFINITIVE CLEAN CODE)

import React, { useState, useEffect, useCallback } from 'react';
import {
    Paper, Title, Stack, TextInput, Table, Loader, Alert, Pagination, Group, Text, ActionIcon,
    useMantineTheme, Tooltip
} from '@mantine/core';
import {
    IconSearch, IconAlertCircle, IconAdjustments, IconGift, IconEye, IconStar, IconToggleLeft,
    IconStairsUp
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import axiosInstance from '../../services/axiosInstance';
import AdjustPointsModal from '../../components/admin/AdjustPointsModal';
import ChangeTierModal from '../../components/admin/ChangeTierModal';
import AssignRewardModal from '../../components/admin/AssignRewardModal';
// import { AxiosError } from 'axios'; // No se usa
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';

// Exportar Interfaz Customer
export interface Customer {
  id: string; name?: string | null; email: string; points: number;
  currentTier?: { id: string; name: string; } | null;
  createdAt: string; isFavorite?: boolean; isActive?: boolean;
}

// Interfaz PaginatedResponse
interface PaginatedResponse {
    items: Customer[]; totalPages: number; currentPage: number; totalItems: number;
}

const AdminCustomerManagementPage: React.FC = () => {
    const theme = useMantineTheme();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [activePage, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [adjustModalOpened, { open: openAdjustModal, close: closeAdjustModal }] = useDisclosure(false);
    const [changeTierModalOpened, { open: openChangeTierModal, close: closeChangeTierModal }] = useDisclosure(false);
    const [assignRewardModalOpened, { open: openAssignRewardModal, close: closeAssignRewardModal }] = useDisclosure(false);
    const [togglingFavoriteId, setTogglingFavoriteId] = useState<string | null>(null);

    const fetchCustomers = useCallback(async (page = 1, search = '') => {
        setLoading(true); setError(null); console.log(`Workspaceing customers: page=${page}, search=${search}`);
        try {
            const params = new URLSearchParams({ page: page.toString(), limit: '10' });
            if (search) params.append('search', search);
            // TODO: Añadir isFavorite a params si el filtro está activo
            const response = await axiosInstance.get<PaginatedResponse>(`/admin/customers?${params.toString()}`); // URL Correcta
            if (response.data && Array.isArray(response.data.items) && typeof response.data.currentPage === 'number' && typeof response.data.totalPages === 'number') {
                setCustomers(response.data.items); setPage(response.data.currentPage); setTotalPages(response.data.totalPages); console.log("Customers received:", response.data);
            } else { console.error("Invalid paginated response structure:", response.data); throw new Error("La respuesta del servidor no tiene el formato esperado."); }
        } catch (err: any) { console.error("Error fetching customers:", err); const errorMsg = err.response?.data?.message || `Error al cargar la lista de clientes (${err.message || 'Error desconocido'}).`; setError(errorMsg); setCustomers([]); setPage(1); setTotalPages(1);
        } finally { console.log('Executing finally block...'); setLoading(false); }
    }, []);

    useEffect(() => { fetchCustomers(1, ''); }, [fetchCustomers]);
    useEffect(() => { const handler = setTimeout(() => { fetchCustomers(activePage, searchTerm); }, 500); return () => { clearTimeout(handler); }; }, [activePage, searchTerm, fetchCustomers]);

    const handleOpenAdjustPoints = (customer: Customer) => { setSelectedCustomer(customer); openAdjustModal(); };
    const handleAdjustSuccess = () => { fetchCustomers(activePage, searchTerm); }
    const handleOpenChangeTier = (customer: Customer) => { setSelectedCustomer(customer); openChangeTierModal(); };
    const handleChangeTierSuccess = () => { fetchCustomers(activePage, searchTerm); }
    const handleOpenAssignReward = (customer: Customer) => { setSelectedCustomer(customer); openAssignRewardModal(); };
    const handleAssignRewardSuccess = () => { console.log('Reward assigned callback triggered (no refresh implemented).'); }

    const handleToggleFavorite = async (customerId: string, currentIsFavorite: boolean) => {
        console.log(`Toggling favorite for ${customerId}, current: ${currentIsFavorite}`);
        setTogglingFavoriteId(customerId);
        setCustomers(prev => prev.map(cust => cust.id === customerId ? { ...cust, isFavorite: !currentIsFavorite } : cust ));
        try {
            // --- LLAMADA PATCH DEFINITIVAMENTE CORREGIDA ---
            await axiosInstance.patch(`/admin/customers/${customerId}/toggle-favorite`); // SIN /api inicial
            // -----------------------------------------------
            notifications.show({ title: 'Estado Cambiado', message: `Cliente ${!currentIsFavorite ? 'marcado como' : 'desmarcado de'} favorito.`, color: 'green', icon: <IconCheck size={18} /> });
        } catch (err: any) {
            console.error(`Error toggling favorite for customer ${customerId}:`, err);
             notifications.show({ title: 'Error', message: `No se pudo cambiar el estado de favorito: ${err.response?.data?.message || err.message}`, color: 'red', icon: <IconX size={18} /> });
            setCustomers(prev => prev.map(cust => cust.id === customerId ? { ...cust, isFavorite: currentIsFavorite } : cust )); // Revertir
        } finally {
            setTogglingFavoriteId(null);
        }
    };

    const rows = customers.map((customer) => (
        <Table.Tr key={customer.id}>
            <Table.Td>
                <Tooltip label={customer.isFavorite ? "Quitar de Favoritos" : "Marcar como Favorito"} withArrow position="top">
                    <ActionIcon variant="subtle" onClick={() => handleToggleFavorite(customer.id, customer.isFavorite ?? false)} loading={togglingFavoriteId === customer.id} disabled={!!togglingFavoriteId}>
                        <IconStar size={18} stroke={1.5} color={customer.isFavorite ? theme.colors.yellow[6] : theme.colors.gray[4]} fill={customer.isFavorite ? theme.colors.yellow[6] : 'none'} />
                    </ActionIcon>
                </Tooltip>
            </Table.Td>
            <Table.Td>{customer.name || '-'}</Table.Td>
            <Table.Td>{customer.email}</Table.Td>
            <Table.Td>{customer.points}</Table.Td>
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

    return (
        <>
            <Paper shadow="sm" p="lg" withBorder radius="lg">
                 <Stack gap="lg">
                     <Title order={2}>Gestión de Clientes</Title>
                     <TextInput placeholder="Buscar por nombre o email..." leftSection={<IconSearch size={16} stroke={1.5} />} value={searchTerm} onChange={(event) => { setSearchTerm(event.currentTarget.value); setPage(1); }} radius="lg"/>
                     {/* TODO: Añadir aquí el Checkbox/Switch para filtrar favoritos */}
                     {loading && <Group justify="center" p="md"><Loader /></Group>}
                     {error && !loading && <Alert title="Error" color="red" icon={<IconAlertCircle />}>{error}</Alert>}
                     {!loading && !error && customers.length === 0 && (<Text c="dimmed" ta="center" p="md">No se encontraron clientes{searchTerm ? ' para la búsqueda actual' : ''}.</Text>)}
                     {!loading && !error && customers.length > 0 && ( <Table.ScrollContainer minWidth={800}><Table striped highlightOnHover withTableBorder verticalSpacing="sm"><Table.Thead><Table.Tr> <Table.Th title="Favorito"><IconStar size={14} stroke={1.5}/></Table.Th> <Table.Th>Nombre</Table.Th> <Table.Th>Email</Table.Th> <Table.Th>Puntos</Table.Th> <Table.Th>Nivel</Table.Th> <Table.Th>Registrado</Table.Th> <Table.Th>Estado</Table.Th> <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th> </Table.Tr></Table.Thead><Table.Tbody>{rows}</Table.Tbody></Table></Table.ScrollContainer> )}
                     {!loading && !error && totalPages > 1 && (<Group justify="center" mt="md"><Pagination total={totalPages} value={activePage} onChange={setPage} /></Group>)}
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