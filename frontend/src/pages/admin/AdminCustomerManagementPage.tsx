// filename: frontend/src/pages/admin/AdminCustomerManagementPage.tsx
// Version: 1.1.0 (Implement real API call for fetching customers)

import React, { useState, useEffect, useCallback } from 'react';
import {
    Paper, Title, Stack, TextInput, Table, Loader, Alert, Pagination, Group, Text, ActionIcon,
    useMantineTheme
} from '@mantine/core';
import {
    IconSearch, IconAlertCircle, IconAdjustments, IconGift, IconEye, IconStar, IconToggleLeft,
    IconStairsUp // Asegúrate que todos los iconos necesarios están aquí
} from '@tabler/icons-react';
import axiosInstance from '../../services/axiosInstance'; // Ahora sí lo usaremos

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

// Interfaz para datos de paginación (el backend debería devolver esto)
interface PaginatedResponse<T> {
    items: T[];
    totalPages: number;
    currentPage: number;
    totalItems: number; // Podría ser útil para mostrar "X clientes en total"
}


const AdminCustomerManagementPage: React.FC = () => {
    const theme = useMantineTheme();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [activePage, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // --- Función fetchCustomers MODIFICADA para llamar a la API real ---
    const fetchCustomers = useCallback(async (page = 1, search = '') => {
        setLoading(true);
        setError(null);
        console.log(`Workspaceing customers: page=${page}, search=${search}`); // Log para depuración
        try {
            // Construimos los parámetros de la query
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('limit', '10'); // O el límite que prefieras
            if (search) {
                params.append('search', search);
            }
            // TODO: Añadir parámetro para filtro de favoritos cuando se implemente

            // Llamada real al backend
            const response = await axiosInstance.get<PaginatedResponse<Customer>>(`/admin/customers?${params.toString()}`);

            // Actualizamos el estado con los datos recibidos
            setCustomers(response.data.items);
            setPage(response.data.currentPage);
            setTotalPages(response.data.totalPages);
            console.log("Customers received:", response.data);

        } catch (err: any) {
            console.error("Error fetching customers:", err);
            const errorMsg = err.response?.data?.message || "Error al cargar la lista de clientes.";
            setError(errorMsg);
            // Limpiamos datos si falla la carga
            setCustomers([]);
            setPage(1);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    }, []); // Ya no depende de searchTerm/activePage aquí, se pasan como argumentos

    // Carga inicial (sin cambios)
    useEffect(() => {
        fetchCustomers(1, '');
    }, [fetchCustomers]);

    // Handler para búsqueda/paginación (con debounce) (sin cambios en lógica, solo llama a fetchCustomers)
    useEffect(() => {
        const handler = setTimeout(() => {
            fetchCustomers(activePage, searchTerm);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activePage, searchTerm]); // fetchCustomers ya no es dependencia aquí para evitar bucle si se define sin useCallback antes


    // Renderizado de filas de la tabla (sin cambios)
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
                    <ActionIcon variant="subtle" color="blue" title="Ajustar Puntos"><IconAdjustments size={16} stroke={1.5} /></ActionIcon>
                    <ActionIcon variant="subtle" color="teal" title="Cambiar Nivel"><IconStairsUp size={16} stroke={1.5} /></ActionIcon>
                    <ActionIcon variant="subtle" color="grape" title="Asignar Recompensa"><IconGift size={16} stroke={1.5} /></ActionIcon>
                    <ActionIcon variant="subtle" color="orange" title="Activar/Desactivar"><IconToggleLeft size={16} stroke={1.5} /></ActionIcon>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    // Renderizado principal (sin cambios significativos, excepto que ahora depende de datos reales)
    return (
        <Paper shadow="sm" p="lg" withBorder radius="lg">
            <Stack gap="lg">
                <Title order={2}>Gestión de Clientes</Title>

                <TextInput
                    placeholder="Buscar por nombre o email..."
                    leftSection={<IconSearch size={16} stroke={1.5} />}
                    value={searchTerm}
                    onChange={(event) => {
                        setSearchTerm(event.currentTarget.value);
                        setPage(1); // Resetear a página 1 al buscar
                    }}
                    radius="lg"
                />

                {loading && <Group justify="center" p="md"><Loader /></Group>}
                {error && !loading && <Alert title="Error" color="red" icon={<IconAlertCircle />}>{error}</Alert>}

                {!loading && !error && customers.length === 0 && (
                    <Text c="dimmed" ta="center" p="md">No se encontraron clientes{searchTerm ? ' para la búsqueda actual' : ''}.</Text> // Mensaje mejorado
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
    );
};

export default AdminCustomerManagementPage;