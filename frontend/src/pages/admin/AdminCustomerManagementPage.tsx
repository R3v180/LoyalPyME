// filename: frontend/src/pages/admin/AdminCustomerManagementPage.tsx
// Version: 1.5.5 (Code formatting cleanup for whitespace warning)

import React, { useState, useEffect, useCallback } from 'react';
import {
    Paper, Title, Stack, TextInput, Table, Loader, Alert, Pagination, Group, Text, ActionIcon,
    useMantineTheme, UnstyledButton, Center, rem // Tooltip quitado
} from '@mantine/core';
import {
    IconSearch, IconAlertCircle, IconAdjustments, IconGift, IconEye, IconStar, IconToggleLeft,
    IconStairsUp, IconSelector, IconChevronDown, IconChevronUp
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import axiosInstance from '../../services/axiosInstance';
import AdjustPointsModal from '../../components/admin/AdjustPointsModal';
import ChangeTierModal from '../../components/admin/ChangeTierModal';
import AssignRewardModal from '../../components/admin/AssignRewardModal';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import classes from './AdminCustomerManagementPage.module.css';

// Interfaces
export interface Customer { id: string; name?: string | null; email: string; points: number; currentTier?: { id: string; name: string; level?: number; } | null; createdAt: string; isFavorite?: boolean; isActive?: boolean; }
interface CustomerApiResponse { items: Customer[]; totalPages: number; currentPage: number; totalItems: number; }
interface SortStatus { column: keyof Customer | 'currentTier.level' | 'createdAt'; direction: 'asc' | 'desc'; }

// Componente Th
interface ThProps { children: React.ReactNode; reversed: boolean; sorted: boolean; onSort(): void; sortKey: string; currentSortKey: string; disabled?: boolean; }
function Th({ children, reversed, sorted, onSort, sortKey, currentSortKey, disabled }: ThProps) { const Icon = sorted && currentSortKey === sortKey ? (reversed ? IconChevronUp : IconChevronDown) : IconSelector; const isCurrent = sorted && currentSortKey === sortKey; return ( <Table.Th className={classes.th}> <UnstyledButton onClick={disabled ? undefined : onSort} className={classes.control} disabled={disabled}> <Group justify="space-between" gap={0} data-active-sort={isCurrent || undefined}> <Text fw={500} fz="sm" span>{children}</Text> {!disabled && ( <Center className={classes.icon}><Icon style={{ width: rem(16), height: rem(16), color: isCurrent ? 'var(--mantine-color-blue-filled)' : undefined }} stroke={1.5} /></Center> )} </Group> </UnstyledButton> </Table.Th> ); }

// --- COMPONENTE PRINCIPAL ---
const AdminCustomerManagementPage: React.FC = () => {
    const theme = useMantineTheme();
    // Estados
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
    const [sortStatus, setSortStatus] = useState<SortStatus>({ column: 'createdAt', direction: 'desc' });

    // fetchCustomers
    const fetchCustomers = useCallback(async (page = 1, search = '', sort = sortStatus, onlyFavorites = false) => { setLoading(true); setError(null); console.log(`Workspaceing customers: page=${page}, search=${search}, sortBy=${sort.column}, sortDir=${sort.direction}, onlyFav=${onlyFavorites}`); try { const params = new URLSearchParams({ page: page.toString(), limit: '10', sortBy: sort.column, sortDir: sort.direction }); if (search) params.append('search', search); if (onlyFavorites) params.append('isFavorite', 'true'); const response = await axiosInstance.get<CustomerApiResponse>(`/admin/customers?${params.toString()}`); const apiData = response.data; if (apiData && Array.isArray(apiData.items) && typeof apiData.currentPage === 'number' && typeof apiData.totalPages === 'number') { setCustomers(apiData.items); setPage(apiData.currentPage); setTotalPages(apiData.totalPages); console.log("Customers state updated successfully."); } else { console.error("Invalid paginated response structure:", apiData); throw new Error("La respuesta del servidor no tiene el formato esperado."); } } catch (err: any) { console.error("Error fetching or processing customers:", err); const errorMsg = err.response?.data?.message || err.message || 'Error desconocido al cargar clientes.'; setError(errorMsg); setCustomers([]); setPage(1); setTotalPages(1); } finally { console.log('Executing finally block...'); setLoading(false); } }, [sortStatus.column, sortStatus.direction]);
    useEffect(() => { fetchCustomers(1, '', sortStatus); }, [fetchCustomers]);
    useEffect(() => { const handler = setTimeout(() => { fetchCustomers(activePage, searchTerm, sortStatus); }, 500); return () => { clearTimeout(handler); }; }, [activePage, searchTerm, sortStatus, fetchCustomers]);

    // Handlers Modales y Toggle
    const handleOpenAdjustPoints = (customer: Customer) => { setSelectedCustomer(customer); openAdjustModal(); };
    const handleAdjustSuccess = () => { fetchCustomers(activePage, searchTerm, sortStatus); }
    const handleOpenChangeTier = (customer: Customer) => { setSelectedCustomer(customer); openChangeTierModal(); };
    const handleChangeTierSuccess = () => { fetchCustomers(activePage, searchTerm, sortStatus); }
    const handleOpenAssignReward = (customer: Customer) => { setSelectedCustomer(customer); openAssignRewardModal(); };
    const handleAssignRewardSuccess = () => { console.log('Reward assigned callback triggered (no refresh implemented).'); }
    const handleToggleFavorite = async (customerId: string, currentIsFavorite: boolean) => { console.log(`Toggling favorite for ${customerId}, current: ${currentIsFavorite}`); setTogglingFavoriteId(customerId); try { await axiosInstance.patch(`/admin/customers/${customerId}/toggle-favorite`); notifications.show({ title: 'Estado Cambiado', message: `Cliente ${!currentIsFavorite ? 'marcado como' : 'desmarcado de'} favorito.`, color: 'green', icon: <IconCheck size={18} /> }); fetchCustomers(activePage, searchTerm, sortStatus); } catch (err: any) { console.error(`Error toggling favorite for customer ${customerId}:`, err); notifications.show({ title: 'Error', message: `No se pudo cambiar el estado de favorito: ${err.response?.data?.message || err.message}`, color: 'red', icon: <IconX size={18} /> }); } finally { setTogglingFavoriteId(null); } };
    const handleSort = (column: SortStatus['column']) => { setSortStatus(current => { const isSameColumn = column === current.column; const direction = isSameColumn ? (current.direction === 'asc' ? 'desc' : 'asc') : 'asc'; return { column, direction }; }); setPage(1); };

    // Renderizado de filas
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

    // Renderizado principal
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
                     {!loading && !error && customers.length > 0 && (
                         <Table.ScrollContainer minWidth={800}>
                             <Table striped highlightOnHover withTableBorder verticalSpacing="sm" className={classes.table}>
                                 <Table.Thead className={classes.thead}>
                                     <Table.Tr>
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
                                 {/* Asegurar que no hay espacios extraños alrededor de {rows} */}
                                 <Table.Tbody>{rows}</Table.Tbody>
                             </Table>
                         </Table.ScrollContainer>
                     )}
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