// filename: frontend/src/components/admin/CustomerTable.tsx
// Version: 1.0.0 (Initial extraction)

import React from 'react';
import {
    Table, Group, ActionIcon, Text, useMantineTheme, UnstyledButton, Center, rem
} from '@mantine/core';
import {
    IconAdjustments, IconGift, IconEye, IconStar, IconToggleLeft,
    IconStairsUp, IconSelector, IconChevronDown, IconChevronUp
} from '@tabler/icons-react';
import classes from '../../pages/admin/AdminCustomerManagementPage.module.css'; // Reutilizamos las clases CSS

// Importamos tipos necesarios (idealmente desde un archivo centralizado)
import { Customer, SortStatus } from '../../hooks/useAdminCustomers';

// --- Componente Th (Movido aquí) ---
interface ThProps {
    children: React.ReactNode;
    reversed: boolean;
    sorted: boolean;
    onSort(): void;
    sortKey: SortStatus['column'];
    currentSortKey: SortStatus['column'];
    disabled?: boolean;
}

function Th({ children, reversed, sorted, onSort, sortKey, currentSortKey, disabled }: ThProps) {
    const Icon = sorted && currentSortKey === sortKey ? (reversed ? IconChevronUp : IconChevronDown) : IconSelector;
    const isCurrent = sorted && currentSortKey === sortKey;
    return (
        <Table.Th className={classes.th}>
            <UnstyledButton onClick={disabled ? undefined : onSort} className={classes.control} disabled={disabled}>
                <Group justify="space-between" gap={0} data-active-sort={isCurrent || undefined}>
                    <Text fw={500} fz="sm" span>{children}</Text>
                    {!disabled && (
                        <Center className={classes.icon}>
                            <Icon style={{ width: rem(16), height: rem(16), color: isCurrent ? 'var(--mantine-color-blue-filled)' : undefined }} stroke={1.5} />
                        </Center>
                    )}
                </Group>
            </UnstyledButton>
        </Table.Th>
    );
}

// --- Props del Componente CustomerTable ---
interface CustomerTableProps {
    customers: Customer[];
    sortStatus: SortStatus;
    togglingFavoriteId: string | null; // Para el estado de carga del botón favorito
    onSort: (column: SortStatus['column']) => void;
    onToggleFavorite: (customerId: string, currentIsFavorite: boolean) => void;
    onOpenAdjustPoints: (customer: Customer) => void;
    onOpenChangeTier: (customer: Customer) => void;
    onOpenAssignReward: (customer: Customer) => void;
    onViewDetails: (customer: Customer) => void; // Placeholder para acción futura
    onToggleActive: (customer: Customer) => void; // Placeholder para acción futura
}

// --- Componente CustomerTable ---
const CustomerTable: React.FC<CustomerTableProps> = ({
    customers,
    sortStatus,
    togglingFavoriteId,
    onSort,
    onToggleFavorite,
    onOpenAdjustPoints,
    onOpenChangeTier,
    onOpenAssignReward,
    onViewDetails, // Recibimos el callback
    onToggleActive   // Recibimos el callback
}) => {
    const theme = useMantineTheme(); // Necesario para el color de la estrella

    // Mapeo de filas (lógica movida aquí)
    const rows = customers.map((customer) => (
        <Table.Tr key={customer.id}>
            <Table.Td>
                <ActionIcon
                    variant="subtle"
                    onClick={() => onToggleFavorite(customer.id, customer.isFavorite ?? false)}
                    loading={togglingFavoriteId === customer.id}
                    disabled={!!togglingFavoriteId}
                    title={customer.isFavorite ? "Quitar de Favoritos" : "Marcar como Favorito"}
                >
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
                    {/* Conectamos los onClick a los nuevos callbacks */}
                    <ActionIcon variant="subtle" color="gray" title="Ver Detalles" onClick={() => onViewDetails(customer)}>
                        <IconEye size={16} stroke={1.5} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="blue" title="Ajustar Puntos" onClick={() => onOpenAdjustPoints(customer)}>
                        <IconAdjustments size={16} stroke={1.5} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="teal" title="Cambiar Nivel" onClick={() => onOpenChangeTier(customer)}>
                        <IconStairsUp size={16} stroke={1.5} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="grape" title="Asignar Recompensa" onClick={() => onOpenAssignReward(customer)}>
                        <IconGift size={16} stroke={1.5} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="orange" title="Activar/Desactivar" onClick={() => onToggleActive(customer)}>
                        <IconToggleLeft size={16} stroke={1.5} />
                    </ActionIcon>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    // Renderizado de la tabla (JSX movido aquí)
    return (
        <Table.ScrollContainer minWidth={800}>
            <Table striped highlightOnHover withTableBorder verticalSpacing="sm" className={classes.table}>
                <Table.Thead className={classes.thead}>
                    <Table.Tr>
                        {/* Usamos onSort y sortStatus de las props */}
                        <Th sorted={sortStatus.column === 'isFavorite'} reversed={sortStatus.direction === 'desc'} onSort={() => onSort('isFavorite')} sortKey="isFavorite" currentSortKey={sortStatus.column}><IconStar size={14} stroke={1.5}/></Th>
                        <Th sorted={sortStatus.column === 'name'} reversed={sortStatus.direction === 'desc'} onSort={() => onSort('name')} sortKey="name" currentSortKey={sortStatus.column}>Nombre</Th>
                        <Th sorted={sortStatus.column === 'email'} reversed={sortStatus.direction === 'desc'} onSort={() => onSort('email')} sortKey="email" currentSortKey={sortStatus.column}>Email</Th>
                        <Th sorted={sortStatus.column === 'points'} reversed={sortStatus.direction === 'desc'} onSort={() => onSort('points')} sortKey="points" currentSortKey={sortStatus.column}>Puntos</Th>
                        <Th sorted={sortStatus.column === 'currentTier.level'} reversed={sortStatus.direction === 'desc'} onSort={() => onSort('currentTier.level')} sortKey="currentTier.level" currentSortKey={sortStatus.column}>Nivel</Th>
                        <Th sorted={sortStatus.column === 'createdAt'} reversed={sortStatus.direction === 'desc'} onSort={() => onSort('createdAt')} sortKey="createdAt" currentSortKey={sortStatus.column}>Registrado</Th>
                        <Th sorted={sortStatus.column === 'isActive'} reversed={sortStatus.direction === 'desc'} onSort={() => onSort('isActive')} sortKey="isActive" currentSortKey={sortStatus.column}>Estado</Th>
                        <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
            </Table>
        </Table.ScrollContainer>
    );
};

export default CustomerTable;