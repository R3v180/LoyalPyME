// filename: frontend/src/pages/admin/AdminCustomerManagementPage.tsx
// Version: 1.2.1 (Fix API call URL - remove duplicate /api)

import React, { useState, useEffect, useCallback } from 'react';
import {
    Paper, Title, Stack, TextInput, Table, Loader, Alert, Pagination, Group, Text, ActionIcon,
    useMantineTheme
} from '@mantine/core';
import {
    IconSearch, IconAlertCircle, IconAdjustments, IconGift, IconEye, IconStar, IconToggleLeft,
    IconStairsUp
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import axiosInstance from '../../services/axiosInstance'; // Usando la ruta que corregiste tú: ../../services/...
import AdjustPointsModal from '../../components/admin/AdjustPointsModal'; // Usando la ruta que corregiste tú

// Interfaz básica para el cliente
interface Customer {
  id: string;
  name?: string | null;
  email: string;
  points: number;
  currentTier?: { name: string } | null;
  createdAt: string;
  isFavorite?: boolean;
  isActive?: boolean;
}

// Interfaz para datos de paginación
interface PaginatedResponse<T> {
    items: T[];
    totalPages: number;
    currentPage: number;
    totalItems: number;
}

const AdminCustomerManagementPage: React.FC = () => {
    const theme = useMantineTheme();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [activePage, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [adjustModalOpened, { open: openAdjustModal, close: closeAdjustModal }] = useDisclosure(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    // Función para cargar clientes
    const fetchCustomers = useCallback(async (page = 1, search = '') => {
        setLoading(true);
        setError(null);
        console.log(`Workspaceing customers: page=${page}, search=${search}`); // Corregido typo "Workspaceing"
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('limit', '10');
            if (search) {
                params.append('search', search);
            }

            // --- LÍNEA CORREGIDA: Quitamos el /api inicial ---
            const response = await axiosInstance.get<PaginatedResponse<Customer>>(
                `/admin/customers?${params.toString()}` // Ahora SÓLO la parte relativa a la baseURL
            );
            // ---------------------------------------------

            setCustomers(response.data.items);
            setPage(response.data.currentPage);
            setTotalPages(response.data.totalPages);
            console.log("Customers received:", response.data);

        } catch (err: any) {
            console.error("Error fetching customers:", err);
            // Extraer mensaje de error específico si viene en la respuesta 404
             const errorMsg = err.response?.data?.message || `Error al cargar la lista de clientes (${err.message || 'Error desconocido'}).`; // Más detalle
            setError(errorMsg);
            setCustomers([]);
            setPage(1);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    }, []);

    // Carga inicial
    useEffect(() => {
        fetchCustomers(1, '');
    }, [fetchCustomers]);

    // Handler para búsqueda/paginación
    useEffect(() => {
        const handler = setTimeout(() => {
            fetchCustomers(activePage, searchTerm);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activePage, searchTerm]);

    // Handler para abrir el modal
    const handleOpenAdjustPoints = (customer: Customer) => {
        setSelectedCustomer(customer);
        openAdjustModal();
    };

    // Handler para cuando el modal tiene éxito
    const handleAdjustSuccess = () => {
        fetchCustomers(activePage, searchTerm); // Refrescamos los datos
    }

    // Renderizado de filas
    const rows = customers.map((customer) => (
        <Table.Tr key={customer.id}>
             <Table.Td><IconStar size={16} stroke={1.5} color={customer.isFavorite ? theme.colors.yellow[6] : theme.colors.gray[4]} /></Table.Td>
             <Table.Td>{customer.name || '-'}</Table.Td>
             <Table.Td>{customer.email}</Table.Td>
             <Table.Td>{customer.points}</Table.Td>
             <Table.Td>{customer.currentTier?.name || 'Básico'}</Table.Td>
             <Table.Td>{new Date(customer.createdAt).toLocaleDateString()}</Table.Td>
             <Table.Td>{customer.isActive ? 'Activo' : 'Inactivo'}</Table.Td>
             <Table.Td>
                 <Group gap="xs" justify="flex-end" wrap="nowrap">
                     <ActionIcon variant="subtle" color="gray" title="Ver Detalles"><IconEye size={16} stroke={1.5} /></ActionIcon>
                     <ActionIcon
                         variant="subtle"
                         color="blue"
                         title="Ajustar Puntos"
                         onClick={() => handleOpenAdjustPoints(customer)}
                     >
                         <IconAdjustments size={16} stroke={1.5} />
                     </ActionIcon>
                     <ActionIcon variant="subtle" color="teal" title="Cambiar Nivel"><IconStairsUp size={16} stroke={1.5} /></ActionIcon>
                     <ActionIcon variant="subtle" color="grape" title="Asignar Recompensa"><IconGift size={16} stroke={1.5} /></ActionIcon>
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

                    <TextInput
                        placeholder="Buscar por nombre o email..."
                        leftSection={<IconSearch size={16} stroke={1.5} />}
                        value={searchTerm}
                        onChange={(event) => {
                            setSearchTerm(event.currentTarget.value);
                            setPage(1);
                        }}
                        radius="lg"
                    />

                    {loading && <Group justify="center" p="md"><Loader /></Group>}
                    {error && !loading && <Alert title="Error" color="red" icon={<IconAlertCircle />}>{error}</Alert>}

                    {!loading && !error && customers.length === 0 && (
                        <Text c="dimmed" ta="center" p="md">No se encontraron clientes{searchTerm ? ' para la búsqueda actual' : ''}.</Text>
                    )}

                    {!loading && !error && customers.length > 0 && (
                        <Table.ScrollContainer minWidth={800}>
                            <Table striped highlightOnHover withTableBorder verticalSpacing="sm">
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th title="Favorito"><IconStar size={14} stroke={1.5}/></Table.Th>
                                        <Table.Th>Nombre</Table.Th>
                                        <Table.Th>Email</Table.Th>
                                        <Table.Th>Puntos</Table.Th>
                                        <Table.Th>Nivel</Table.Th>
                                        <Table.Th>Registrado</Table.Th>
                                        <Table.Th>Estado</Table.Th>
                                        <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>{rows}</Table.Tbody>
                            </Table>
                        </Table.ScrollContainer>
                    )}

                    {!loading && !error && totalPages > 1 && (
                         <Group justify="center" mt="md">
                            <Pagination total={totalPages} value={activePage} onChange={setPage} />
                         </Group>
                    )}

                </Stack>
            </Paper>

            <AdjustPointsModal
                opened={adjustModalOpened}
                onClose={() => { closeAdjustModal(); setSelectedCustomer(null); }}
                customer={selectedCustomer}
                onSuccess={handleAdjustSuccess}
            />
        </>
    );
};

export default AdminCustomerManagementPage;