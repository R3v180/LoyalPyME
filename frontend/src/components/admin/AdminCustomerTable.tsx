// filename: frontend/src/components/admin/AdminCustomerTable.tsx
// Version: 1.0.1 (Include Badge in Mantine imports)

import React from 'react';
import {
    Table, Group, ActionIcon, Badge, Text, useMantineTheme, UnstyledButton, Center, rem // Mantine components for the table - ADDED Badge here
} from '@mantine/core';
import {
    IconStar, IconAdjustments, IconGift, IconEye, IconStairsUp, IconToggleLeft, // Icons for row actions
    IconSelector, IconChevronDown, IconChevronUp // Icons for sorting in Th
} from '@tabler/icons-react';
// We will need these imports from the parent page:
// import { notifications } from '@mantine/notifications';
// import { IconCheck, IconX } from '@tabler/icons-react'; // For actions handlers if they were here

import classes from '../../pages/admin/AdminCustomerManagementPage.module.css'; // Import CSS module

// --- Tipos necesarios para este componente (Copiados temporalmente - IDEALMENTE MOVER A UN ARCHIVO COMPARTIDO) ---
// This should ideally come from a shared types file (e.g., frontend/src/types/customer.ts or frontend/src/types/admin.ts)
export interface Customer { id: string; name?: string | null; email: string; points: number; currentTier?: { id: string; name: string; level?: number; } | null; createdAt: string; isFavorite?: boolean; isActive?: boolean; }
type SortColumn = 'name' | 'email' | 'points' | 'createdAt' | 'isActive' | 'isFavorite' | 'currentTier.level';
interface SortStatus { column: SortColumn; direction: 'asc' | 'desc'; }
// --- Fin Tipos ---


// --- Props para el componente Th (Auxiliar) ---
interface ThProps {
    children: React.ReactNode;
    reversed: boolean;
    sorted: boolean;
    onSort(): void; // Handler provided by the parent table component
    sortKey: SortColumn; // Which column this Th represents for sorting
    currentSortKey: SortColumn; // Current sorting column from parent
    disabled?: boolean; // If sorting is disabled for this column
}
// Componente Th (Extraído de AdminCustomerManagementPage.tsx)
function Th({ children, reversed, sorted, onSort, sortKey, currentSortKey, disabled }: ThProps) {
    const theme = useMantineTheme(); // useMantineTheme needed here for icon color
    // Determine the sort icon based on current state
    const Icon = sorted && currentSortKey === sortKey ? (reversed ? IconChevronUp : IconChevronDown) : IconSelector;
    // Check if this column is the one currently sorted
    const isCurrent = sorted && currentSortKey === sortKey;

    return (
        <Table.Th className={classes.th}>
            {/* UnstyledButton wraps content for click interaction, uses onSort prop */}
            <UnstyledButton onClick={disabled ? undefined : onSort} className={classes.control} disabled={disabled}>
                {/* Group and Text for label */}
                <Group justify="space-between" gap={0} data-active-sort={isCurrent || undefined}>
                    <Text fw={500} fz="sm" span>{children}</Text>
                    {/* Icon for sorting direction, hidden if disabled */}
                    {!disabled && (
                        <Center className={classes.icon}>
                             <Icon style={{ width: rem(16), height: rem(16), color: isCurrent ? theme.colors.blue[6] : undefined }} stroke={1.5} /> {/* Use theme.colors */}
                        </Center>
                    )}
                </Group>
            </UnstyledButton>
        </Table.Th>
    );
}
// --- Fin Componente Th ---


// --- Props para el componente AdminCustomerTable ---
interface AdminCustomerTableProps {
    customers: Customer[]; // Data to display
    sortStatus: SortStatus; // Current sorting state from parent
    onSort: (column: SortColumn) => void; // Handler for sorting clicks, provided by parent
    togglingFavoriteId: string | null; // State from parent for loading indicator on favorite icon

    // Handlers for row actions - these should be provided by the parent page component
    onOpenAdjustPoints: (customer: Customer) => void;
    onOpenChangeTier: (customer: Customer) => void;
    onOpenAssignReward: (customer: Customer) => void;
    onToggleFavorite: (customerId: string, currentIsFavorite: boolean) => Promise<void>; // Async handler
    // TODO: Add handlers for "Ver Detalles" and "Activar/Desactivar" when implemented
    // onViewDetails: (customer: Customer) => void;
    // onToggleActive: (customerId: string, currentIsActive: boolean) => Promise<void>;
}
// --- Fin Props ---


// --- COMPONENTE PRINCIPAL: AdminCustomerTable ---
const AdminCustomerTable: React.FC<AdminCustomerTableProps> = ({
    customers,
    sortStatus,
    onSort,
    togglingFavoriteId,
    onOpenAdjustPoints,
    onOpenChangeTier,
    onOpenAssignReward,
    onToggleFavorite,
    // TODO: Add handlers for ViewDetails and ToggleActive
}) => {
    const theme = useMantineTheme(); // useMantineTheme needed here for ActionIcons color

    // Renderizado de filas de la tabla (Lógica movida aquí)
    const rows = customers.map((customer) => (
        <Table.Tr key={customer.id}>
            {/* Favorite Toggle Icon */}
            <Table.Td>
                <ActionIcon
                    variant="subtle"
                    onClick={() => onToggleFavorite(customer.id, customer.isFavorite ?? false)}
                    loading={togglingFavoriteId === customer.id} // Use prop for loading
                    disabled={!!togglingFavoriteId} // Disable other icons while one is loading
                    title={customer.isFavorite ? "Quitar de Favoritos" : "Marcar como Favorito"}
                    color={customer.isFavorite ? 'yellow' : 'gray'} // Color based on state
                >
                     {/* Icon color and fill based on state */}
                     <IconStar size={18} stroke={1.5} color={customer.isFavorite ? theme.colors.yellow[6] : theme.colors.gray[4]} fill={customer.isFavorite ? theme.colors.yellow[6] : 'none'} />
                </ActionIcon>
            </Table.Td>
            {/* Data Cells */}
            <Table.Td>{customer.name || '-'}</Table.Td>
            <Table.Td>{customer.email}</Table.Td>
            <Table.Td ta="right">{customer.points}</Table.Td>
            <Table.Td>{customer.currentTier?.name || 'Básico'}</Table.Td>
            <Table.Td>{new Date(customer.createdAt).toLocaleDateString()}</Table.Td>
            {/* State Badge - NOW using the imported Badge component */}
            <Table.Td>
                <Badge color={customer.isActive ? 'green' : 'gray'} variant="light"> {/* Use Badge component */}
                    {customer.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
            </Table.Td>
            {/* Action Icons Group */}
            <Table.Td>
                 <Group gap="xs" justify="flex-end" wrap="nowrap">
                     {/* View Details (TODO: Implement handler) */}
                     <ActionIcon variant="subtle" color="gray" title="Ver Detalles" disabled={!!togglingFavoriteId}/* onClick={() => onViewDetails(customer)}*/>
                         <IconEye size={16} stroke={1.5} />
                     </ActionIcon>
                     {/* Adjust Points */}
                     <ActionIcon variant="subtle" color="blue" title="Ajustar Puntos" onClick={() => onOpenAdjustPoints(customer)} disabled={!!togglingFavoriteId}>
                         <IconAdjustments size={16} stroke={1.5} />
                     </ActionIcon>
                     {/* Change Tier */}
                     <ActionIcon variant="subtle" color="teal" title="Cambiar Nivel" onClick={() => onOpenChangeTier(customer)} disabled={!!togglingFavoriteId}>
                         <IconStairsUp size={16} stroke={1.5} />
                     </ActionIcon>
                     {/* Assign Reward */}
                     <ActionIcon variant="subtle" color="grape" title="Asignar Recompensa" onClick={() => onOpenAssignReward(customer)} disabled={!!togglingFavoriteId}>
                         <IconGift size={16} stroke={1.5} />
                     </ActionIcon>
                     {/* Toggle Active Status (TODO: Implement handler) */}
                     <ActionIcon variant="subtle" color="orange" title="Activar/Desactivar" disabled={!!togglingFavoriteId}/* onClick={() => onToggleActive(customer.id, customer.isActive ?? true)}*/>
                         <IconToggleLeft size={16} stroke={1.5} /> {/* Use appropriate icon */}
                     </ActionIcon>
                 </Group>
            </Table.Td>
        </Table.Tr>
    ));
    // --- Fin Renderizado de filas ---


    // --- Renderizado de la Tabla ---
    return (
        <Table.ScrollContainer minWidth={800}>
            <Table striped highlightOnHover withTableBorder verticalSpacing="sm" className={classes.table}>
                <Table.Thead className={classes.thead}>
                    <Table.Tr>
                         {/* Table Headers using the Th component and onSort prop */}
                         {/* Pass sortStatus and onSort from props */}
                        <Th sorted={sortStatus.column === 'isFavorite'} reversed={sortStatus.direction === 'desc'} onSort={() => onSort('isFavorite')} sortKey="isFavorite" currentSortKey={sortStatus.column} disabled={!!togglingFavoriteId}><IconStar size={14} stroke={1.5}/></Th> {/* Sorting disabled during favorite toggle */}
                        <Th sorted={sortStatus.column === 'name'} reversed={sortStatus.direction === 'desc'} onSort={() => onSort('name')} sortKey="name" currentSortKey={sortStatus.column}>Nombre</Th>
                        <Th sorted={sortStatus.column === 'email'} reversed={sortStatus.direction === 'desc'} onSort={() => onSort('email')} sortKey="email" currentSortKey={sortStatus.column}>Email</Th>
                        <Th sorted={sortStatus.column === 'points'} reversed={sortStatus.direction === 'desc'} onSort={() => onSort('points')} sortKey="points" currentSortKey={sortStatus.column}>Puntos</Th>
                        <Th sorted={sortStatus.column === 'currentTier.level'} reversed={sortStatus.direction === 'desc'} onSort={() => onSort('currentTier.level')} sortKey="currentTier.level" currentSortKey={sortStatus.column}>Nivel</Th>
                        <Th sorted={sortStatus.column === 'createdAt'} reversed={sortStatus.direction === 'desc'} onSort={() => onSort('createdAt')} sortKey="createdAt" currentSortKey={sortStatus.column}>Registrado</Th>
                        <Th sorted={sortStatus.column === 'isActive'} reversed={sortStatus.direction === 'desc'} onSort={() => onSort('isActive')} sortKey="isActive" currentSortKey={sortStatus.column}>Estado</Th>
                        <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                     {/* Conditional rendering for empty state */}
                     {customers.length > 0 ? rows : (
                         <Table.Tr>
                             <Table.Td colSpan={8}> {/* Adjust colspan based on number of columns */}
                                 <Text c="dimmed" ta="center">No se encontraron clientes.</Text>
                             </Table.Td>
                         </Table.Tr>
                     )}
                 </Table.Tbody>
            </Table>
        </Table.ScrollContainer>
    );
    // --- Fin Renderizado de la Tabla ---
};

export default AdminCustomerTable;