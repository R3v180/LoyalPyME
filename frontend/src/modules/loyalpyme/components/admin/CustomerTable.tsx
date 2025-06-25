// filename: frontend/src/components/admin/CustomerTable.tsx
import React from 'react';
import {
    Table, Group, ActionIcon, Text, useMantineTheme, UnstyledButton, Center, rem,
    Checkbox, Badge
} from '@mantine/core';
import {
    IconAdjustments, IconGift, IconEye, IconStar,
    IconStairsUp, IconSelector, IconChevronDown, IconChevronUp,
    IconEyeCheck, IconEyeOff
} from '@tabler/icons-react';
import classes from '../../pages/admin/AdminCustomerManagementPage.module.css';
import { useTranslation } from 'react-i18next'; // Importar hook

// Importar tipos necesarios desde el hook
import { Customer, SortStatus, SortColumn } from '../../hooks/useAdminCustomersData';

// --- Componente Th Auxiliar ---
interface ThProps {
    children: React.ReactNode;
    reversed: boolean;
    sorted: boolean;
    onSort(): void;
    sortKey: SortColumn;
    currentSortKey: SortColumn;
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
// --- Fin Componente Th ---

// --- Props del Componente CustomerTable ---
interface CustomerTableProps {
    customers: Customer[];
    sortStatus: SortStatus;
    togglingFavoriteId: string | null;
    togglingActiveId?: string | null;
    selectedRows: string[];
    onSort: (column: SortColumn) => void;
    onToggleFavorite: (customerId: string, currentIsFavorite: boolean) => void;
    onOpenAdjustPoints: (customer: Customer) => void;
    onOpenChangeTier: (customer: Customer) => void;
    onOpenAssignReward: (customer: Customer) => void;
    onViewDetails: (customer: Customer) => void;
    onToggleActive: (customer: Customer) => void;
    onRowSelectionChange: (selectedIds: string[]) => void;
}
// --- Fin Props ---

// --- COMPONENTE PRINCIPAL: AdminCustomerTable ---
const CustomerTable: React.FC<CustomerTableProps> = ({
    customers,
    sortStatus,
    togglingFavoriteId,
    togglingActiveId,
    selectedRows,
    onSort,
    onToggleFavorite,
    onOpenAdjustPoints,
    onOpenChangeTier,
    onOpenAssignReward,
    onViewDetails,
    onToggleActive,
    onRowSelectionChange
}) => {
    const { t } = useTranslation(); // Hook de traducción
    const theme = useMantineTheme();

    // Lógica de Selección
    const allVisibleSelected = customers.length > 0 && customers.every(customer => selectedRows.includes(customer.id));
    const someVisibleSelected = customers.some(customer => selectedRows.includes(customer.id));
    const indeterminate = someVisibleSelected && !allVisibleSelected;

    const handleSelectAllClick = () => {
        if (allVisibleSelected) {
            const visibleIds = customers.map(c => c.id);
            onRowSelectionChange(selectedRows.filter(id => !visibleIds.includes(id)));
        } else {
            const visibleIds = customers.map(c => c.id);
            onRowSelectionChange(Array.from(new Set([...selectedRows, ...visibleIds])));
        }
    };

    const handleRowCheckboxChange = (customerId: string, checked: boolean) => {
        if (checked) { onRowSelectionChange([...selectedRows, customerId]); }
        else { onRowSelectionChange(selectedRows.filter(id => id !== customerId)); }
    };

    // Mapeo de filas
    const rows = customers.map((customer) => {
        const isActive = customer.isActive ?? false;
        // Usar t() para los títulos de los tooltips de activar/desactivar
        const ToggleIcon = isActive ? IconEyeOff : IconEyeCheck;
        const toggleTitle = isActive ? t('adminCustomersPage.tooltipDeactivateCustomer') : t('adminCustomersPage.tooltipActivateCustomer');
        const toggleColor = isActive ? 'red' : 'green';
        const isTogglingThisActive = togglingActiveId === customer.id;
        const isTogglingThisFavorite = togglingFavoriteId === customer.id;
        const isSelected = selectedRows.includes(customer.id);
        const favoriteTooltip = customer.isFavorite
            ? t('adminCustomersPage.tooltipUnfavorite', 'Quitar de Favoritos')
            : t('adminCustomersPage.tooltipFavorite', 'Marcar como Favorito');

        return (
            <Table.Tr key={customer.id} bg={isSelected ? theme.colors.blue[0] : undefined}>
                <Table.Td>
                    <Checkbox
                        aria-label={t('adminCustomersPage.checkboxAriaLabel', `Seleccionar fila ${customer.id}`)} // Nueva clave i18n
                        checked={isSelected}
                        onChange={(event) => handleRowCheckboxChange(customer.id, event.currentTarget.checked)}
                    />
                </Table.Td>
                <Table.Td>
                    <ActionIcon
                        variant="subtle"
                        onClick={() => onToggleFavorite(customer.id, customer.isFavorite ?? false)}
                        loading={isTogglingThisFavorite}
                        disabled={!!togglingFavoriteId || !!togglingActiveId}
                        title={favoriteTooltip} // Usar variable con clave i18n
                    >
                        <IconStar size={18} stroke={1.5} color={customer.isFavorite ? theme.colors.yellow[6] : theme.colors.gray[4]} fill={customer.isFavorite ? theme.colors.yellow[6] : 'none'} />
                    </ActionIcon>
                </Table.Td>
                <Table.Td>{customer.name || '-'}</Table.Td>
                <Table.Td>{customer.email}</Table.Td>
                <Table.Td ta="right">{customer.points}</Table.Td>
                <Table.Td>{customer.currentTier?.name || t('customerDashboard.baseTier')}</Table.Td>
                <Table.Td>{new Date(customer.createdAt).toLocaleDateString()}</Table.Td>
                <Table.Td> <Badge color={isActive ? 'green' : 'red'} variant="light"> {isActive ? t('common.active') : t('common.inactive')} </Badge> </Table.Td>
                <Table.Td>
                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                        <ActionIcon variant="subtle" color="gray" title={t('adminCustomersPage.tooltipViewDetails')} onClick={() => onViewDetails(customer)} disabled={isTogglingThisActive || isTogglingThisFavorite}><IconEye size={16} stroke={1.5} /></ActionIcon>
                        <ActionIcon variant="subtle" color="blue" title={t('adminCustomersPage.tooltipAdjustPoints')} onClick={() => onOpenAdjustPoints(customer)} disabled={isTogglingThisActive || isTogglingThisFavorite}><IconAdjustments size={16} stroke={1.5} /></ActionIcon>
                        <ActionIcon variant="subtle" color="teal" title={t('adminCustomersPage.tooltipChangeTier')} onClick={() => onOpenChangeTier(customer)} disabled={isTogglingThisActive || isTogglingThisFavorite}><IconStairsUp size={16} stroke={1.5} /></ActionIcon>
                        <ActionIcon variant="subtle" color="grape" title={t('adminCustomersPage.tooltipAssignReward')} onClick={() => onOpenAssignReward(customer)} disabled={isTogglingThisActive || isTogglingThisFavorite}><IconGift size={16} stroke={1.5} /></ActionIcon>
                        <ActionIcon variant="subtle" color={toggleColor} title={toggleTitle} onClick={() => onToggleActive(customer)} loading={isTogglingThisActive} disabled={!!togglingFavoriteId || !!togglingActiveId}><ToggleIcon size={16} stroke={1.5} /></ActionIcon>
                    </Group>
                </Table.Td>
            </Table.Tr>
        );
    });

    // Renderizado de la tabla
    return (
        <Table.ScrollContainer minWidth={800}>
            <Table striped highlightOnHover withTableBorder verticalSpacing="sm" className={classes.table}>
                <Table.Thead className={classes.thead}>
                    <Table.Tr>
                        <Table.Th style={{ width: rem(40) }}>
                            <Checkbox
                                aria-label={t('adminCustomersPage.checkboxSelectAllAriaLabel', 'Seleccionar todas las filas visibles')} // Nueva clave i18n
                                checked={allVisibleSelected}
                                indeterminate={indeterminate}
                                onChange={handleSelectAllClick}
                            />
                        </Table.Th>
                        <Th sorted={sortStatus.column === 'isFavorite'} reversed={sortStatus.direction === 'desc'} onSort={() => onSort('isFavorite')} sortKey="isFavorite" currentSortKey={sortStatus.column}>{t('adminCustomersPage.tableHeaderFavorite')}</Th>
                        <Th sorted={sortStatus.column === 'name'} reversed={sortStatus.direction === 'desc'} onSort={() => onSort('name')} sortKey="name" currentSortKey={sortStatus.column}>{t('adminCustomersPage.tableHeaderName')}</Th>
                        <Th sorted={sortStatus.column === 'email'} reversed={sortStatus.direction === 'desc'} onSort={() => onSort('email')} sortKey="email" currentSortKey={sortStatus.column}>{t('adminCustomersPage.tableHeaderEmail')}</Th>
                        <Th sorted={sortStatus.column === 'points'} reversed={sortStatus.direction === 'desc'} onSort={() => onSort('points')} sortKey="points" currentSortKey={sortStatus.column}>{t('adminCustomersPage.tableHeaderPoints')}</Th>
                        <Th sorted={sortStatus.column === 'currentTier.level'} reversed={sortStatus.direction === 'desc'} onSort={() => onSort('currentTier.level')} sortKey="currentTier.level" currentSortKey={sortStatus.column}>{t('adminCustomersPage.tableHeaderTier')}</Th>
                        <Th sorted={sortStatus.column === 'createdAt'} reversed={sortStatus.direction === 'desc'} onSort={() => onSort('createdAt')} sortKey="createdAt" currentSortKey={sortStatus.column}>{t('adminCustomersPage.tableHeaderRegistered')}</Th>
                        <Th sorted={sortStatus.column === 'isActive'} reversed={sortStatus.direction === 'desc'} onSort={() => onSort('isActive')} sortKey="isActive" currentSortKey={sortStatus.column}>{t('adminCustomersPage.tableHeaderStatus')}</Th>
                        <Table.Th style={{ textAlign: 'right' }}>{t('adminCustomersPage.tableHeaderActions')}</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows.length > 0 ? rows : (
                    <Table.Tr><Table.Td colSpan={9}><Text c="dimmed" ta="center">{t('adminCustomersPage.noResults')}</Text></Table.Td></Table.Tr>
                 )}</Table.Tbody>
            </Table>
        </Table.ScrollContainer>
    );
};

export default CustomerTable;