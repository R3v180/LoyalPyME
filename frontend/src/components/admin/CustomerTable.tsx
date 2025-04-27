// filename: frontend/src/components/admin/CustomerTable.tsx
// Version: 1.1.0 (Add toggle active action button with dynamic icon/state)

import React from 'react';
import {
    Table, Group, ActionIcon, Text, useMantineTheme, UnstyledButton, Center, rem
} from '@mantine/core';
import {
    IconAdjustments, IconGift, IconEye, IconStar,
    IconStairsUp, IconSelector, IconChevronDown, IconChevronUp,
    IconEyeCheck, IconEyeOff // <-- Nuevos iconos importados
    // IconToggleLeft ya no es necesario aquí
} from '@tabler/icons-react';
import classes from '../../pages/admin/AdminCustomerManagementPage.module.css';

// Importamos tipos necesarios
import { Customer, SortStatus } from '../../hooks/useAdminCustomers';

// --- Componente Th (sin cambios) ---
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
    return ( <Table.Th className={classes.th}> <UnstyledButton onClick={disabled ? undefined : onSort} className={classes.control} disabled={disabled}> <Group justify="space-between" gap={0} data-active-sort={isCurrent || undefined}> <Text fw={500} fz="sm" span>{children}</Text> {!disabled && ( <Center className={classes.icon}><Icon style={{ width: rem(16), height: rem(16), color: isCurrent ? 'var(--mantine-color-blue-filled)' : undefined }} stroke={1.5} /></Center> )} </Group> </UnstyledButton> </Table.Th> );
}

// --- Props del Componente CustomerTable ---
interface CustomerTableProps {
    customers: Customer[];
    sortStatus: SortStatus;
    togglingFavoriteId: string | null;
    togglingActiveId?: string | null; // <-- Nueva prop para estado de carga
    onSort: (column: SortStatus['column']) => void;
    onToggleFavorite: (customerId: string, currentIsFavorite: boolean) => void;
    onOpenAdjustPoints: (customer: Customer) => void;
    onOpenChangeTier: (customer: Customer) => void;
    onOpenAssignReward: (customer: Customer) => void;
    onViewDetails: (customer: Customer) => void;
    onToggleActive: (customer: Customer) => void; // Prop existente
}

// --- Componente CustomerTable ---
const CustomerTable: React.FC<CustomerTableProps> = ({
    customers,
    sortStatus,
    togglingFavoriteId,
    togglingActiveId, // <-- Recibir nueva prop
    onSort,
    onToggleFavorite,
    onOpenAdjustPoints,
    onOpenChangeTier,
    onOpenAssignReward,
    onViewDetails,
    onToggleActive
}) => {
    const theme = useMantineTheme();

    // Mapeo de filas (modificamos el ActionIcon de activar/desactivar)
    const rows = customers.map((customer) => {
        // Determinar icono, título y color según el estado isActive
        const isActive = customer.isActive ?? false; // Asumir false si es undefined/null
        const ToggleIcon = isActive ? IconEyeOff : IconEyeCheck;
        const toggleTitle = isActive ? "Desactivar Cliente" : "Activar Cliente";
        const toggleColor = isActive ? 'red' : 'green';
        const isTogglingThis = togglingActiveId === customer.id;

        return (
            <Table.Tr key={customer.id}>
                <Table.Td>
                    <ActionIcon
                        variant="subtle"
                        onClick={() => onToggleFavorite(customer.id, customer.isFavorite ?? false)}
                        loading={togglingFavoriteId === customer.id}
                        disabled={!!togglingFavoriteId || !!togglingActiveId} // Deshabilitar si CUALQUIER toggle está activo
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
                {/* Mostramos el estado textual */}
                <Table.Td>
                   <Text c={isActive ? 'green' : 'red'} fw={500}>
                     {isActive ? 'Activo' : 'Inactivo'}
                   </Text>
                </Table.Td>
                <Table.Td>
                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                        <ActionIcon variant="subtle" color="gray" title="Ver Detalles" onClick={() => onViewDetails(customer)} disabled={isTogglingThis || !!togglingFavoriteId}>
                            <IconEye size={16} stroke={1.5} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="blue" title="Ajustar Puntos" onClick={() => onOpenAdjustPoints(customer)} disabled={isTogglingThis || !!togglingFavoriteId}>
                            <IconAdjustments size={16} stroke={1.5} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="teal" title="Cambiar Nivel" onClick={() => onOpenChangeTier(customer)} disabled={isTogglingThis || !!togglingFavoriteId}>
                            <IconStairsUp size={16} stroke={1.5} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="grape" title="Asignar Recompensa" onClick={() => onOpenAssignReward(customer)} disabled={isTogglingThis || !!togglingFavoriteId}>
                            <IconGift size={16} stroke={1.5} />
                        </ActionIcon>
                        {/* --- ActionIcon Modificado --- */}
                        <ActionIcon
                            variant="subtle"
                            color={toggleColor} // Color dinámico
                            title={toggleTitle}   // Título dinámico
                            onClick={() => onToggleActive(customer)} // Llama al callback
                            loading={isTogglingThis} // Estado de carga específico
                            disabled={!!togglingFavoriteId || !!togglingActiveId} // Deshabilitar si otro toggle está activo
                        >
                            <ToggleIcon size={16} stroke={1.5} /> {/* Icono dinámico */}
                        </ActionIcon>
                        {/* --- Fin ActionIcon Modificado --- */}
                    </Group>
                </Table.Td>
            </Table.Tr>
        );
    });


    // Renderizado de la tabla (sin cambios)
    return (
        <Table.ScrollContainer minWidth={800}>
            <Table striped highlightOnHover withTableBorder verticalSpacing="sm" className={classes.table}>
                <Table.Thead className={classes.thead}>
                    <Table.Tr>
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