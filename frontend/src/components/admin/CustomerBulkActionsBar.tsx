// frontend/src/components/admin/CustomerBulkActionsBar.tsx
import React from 'react';
import { Paper, Group, Text, Button } from '@mantine/core';
import {
    IconPlayerPlay,
    IconPlayerStop,
    IconTrash,
    IconPlusMinus
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface CustomerBulkActionsBarProps {
    selectedRowCount: number;
    onBulkDelete: () => void;
    onBulkActivate: () => void; // Será onBulkToggleActive(true)
    onBulkDeactivate: () => void; // Será onBulkToggleActive(false)
    onOpenBulkAdjustPoints: () => void; // Para abrir el modal de ajuste masivo de puntos
    isPerformingBulkAction: boolean; // Para el estado de carga de los botones
}

const CustomerBulkActionsBar: React.FC<CustomerBulkActionsBarProps> = ({
    selectedRowCount,
    onBulkDelete,
    onBulkActivate,
    onBulkDeactivate,
    onOpenBulkAdjustPoints,
    isPerformingBulkAction,
}) => {
    const { t } = useTranslation();

    if (selectedRowCount === 0) {
        return null; // No mostrar nada si no hay filas seleccionadas
    }

    return (
        <Paper p="xs" mb="md" withBorder shadow="xs">
            <Group justify="space-between">
                <Text fw={500} size="sm">
                    {/* Usar clave i18n con pluralización para el conteo */}
                    {t('adminCustomersPage.selectedCount', { count: selectedRowCount })}
                </Text>
                <Group>
                    <Button
                        size="xs"
                        color="red"
                        variant="filled" // O 'outline' si se prefiere
                        leftSection={<IconTrash size={14} />}
                        onClick={onBulkDelete}
                        loading={isPerformingBulkAction} // Asumimos un solo estado de carga para todas las acciones masivas
                        disabled={isPerformingBulkAction}
                    >
                        {t('adminCustomersPage.bulkDeleteButton')}
                    </Button>
                    <Button
                        size="xs"
                        color="green"
                        variant="outline"
                        leftSection={<IconPlayerPlay size={14} />}
                        onClick={onBulkActivate}
                        loading={isPerformingBulkAction}
                        disabled={isPerformingBulkAction}
                    >
                        {t('adminCustomersPage.bulkActivateButton')}
                    </Button>
                    <Button
                        size="xs"
                        color="red" // Podría ser 'orange' o 'gray' también
                        variant="outline"
                        leftSection={<IconPlayerStop size={14} />}
                        onClick={onBulkDeactivate}
                        loading={isPerformingBulkAction}
                        disabled={isPerformingBulkAction}
                    >
                        {t('adminCustomersPage.bulkDeactivateButton')}
                    </Button>
                    <Button
                        size="xs"
                        color="blue"
                        variant="outline"
                        leftSection={<IconPlusMinus size={14} />}
                        onClick={onOpenBulkAdjustPoints} // Esta prop abre el modal
                        disabled={isPerformingBulkAction} // Se deshabilita si otra acción masiva está en curso
                    >
                        {t('adminCustomersPage.bulkPointsButton')}
                    </Button>
                </Group>
            </Group>
        </Paper>
    );
};

export default CustomerBulkActionsBar;