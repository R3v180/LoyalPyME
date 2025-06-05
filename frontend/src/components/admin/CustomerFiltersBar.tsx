// frontend/src/components/admin/CustomerFiltersBar.tsx
import React from 'react';
import { Paper, Group, Text, TextInput, Select, Checkbox } from '@mantine/core';
import { IconSearch, IconFilter } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

// Tipo para las opciones del Select de Tier (debe coincidir con el de la página principal)
export interface TierOption {
    value: string;
    label: string;
}

interface CustomerFiltersBarProps {
    searchTerm: string;
    onSearchTermChange: (term: string) => void;
    activeFilterValue: string; // '', 'active', 'inactive'
    onActiveFilterChange: (value: string | null) => void;
    isFavoriteFilterChecked: boolean;
    onIsFavoriteFilterChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    tierFilterValue: string; // ID del tier, 'NONE', o '' para todos
    onTierFilterChange: (value: string | null) => void;
    tierOptions: TierOption[]; // Opciones para el selector de Tier
    loadingFilters: boolean; // Para deshabilitar inputs mientras cargan datos (ej. tiers)
    disabled: boolean; // Para deshabilitar todos los filtros si la tabla principal está cargando
}

const CustomerFiltersBar: React.FC<CustomerFiltersBarProps> = ({
    searchTerm,
    onSearchTermChange,
    activeFilterValue,
    onActiveFilterChange,
    isFavoriteFilterChecked,
    onIsFavoriteFilterChange,
    tierFilterValue,
    onTierFilterChange,
    tierOptions,
    loadingFilters, // Usado para deshabilitar select de tier mientras carga
    disabled,       // Usado para deshabilitar todo mientras la tabla carga
}) => {
    const { t } = useTranslation();

    return (
        <Paper p="md" withBorder radius="md" shadow="xs">
            <Group>
                <IconFilter size={18} />
                <Text fw={500} size="sm">{t('adminCustomersPage.filterLabel')}</Text>
                <TextInput
                    placeholder={t('adminCustomersPage.searchPlaceholder')}
                    leftSection={<IconSearch size={16} stroke={1.5} />}
                    value={searchTerm}
                    onChange={(event) => onSearchTermChange(event.currentTarget.value)}
                    radius="md"
                    style={{ flex: 1, minWidth: 200 }} // Darle flexibilidad y un mínimo
                    disabled={disabled}
                />
                <Select
                    placeholder={t('adminCustomersPage.statusFilterPlaceholder')}
                    data={[
                        { value: '', label: t('adminCustomersPage.statusFilterAll') },
                        { value: 'active', label: t('adminCustomersPage.statusFilterActive') },
                        { value: 'inactive', label: t('adminCustomersPage.statusFilterInactive') }
                    ]}
                    value={activeFilterValue}
                    onChange={onActiveFilterChange}
                    clearable={false} // Para que siempre haya una opción (aunque sea 'todos')
                    radius="md"
                    disabled={disabled}
                    style={{ minWidth: 150 }}
                />
                <Checkbox
                    label={t('adminCustomersPage.favoriteFilterLabel')}
                    checked={isFavoriteFilterChecked}
                    onChange={onIsFavoriteFilterChange}
                    disabled={disabled}
                />
                <Select
                    placeholder={t('adminCustomersPage.tierFilterPlaceholder')}
                    data={tierOptions} // Las opciones vienen del componente padre
                    value={tierFilterValue}
                    onChange={onTierFilterChange}
                    disabled={disabled || loadingFilters} // Deshabilitar si los tiers están cargando
                    searchable
                    nothingFoundMessage={t('adminCustomersPage.tierFilterError')} // Reutilizar clave
                    clearable={false} // Para que siempre haya una opción (ej. 'todos')
                    radius="md"
                    style={{ minWidth: 180 }}
                />
            </Group>
        </Paper>
    );
};

export default CustomerFiltersBar;