// filename: frontend/src/components/admin/tiers/TierTable.tsx
import React from 'react';
import { Table, Group, ActionIcon, Badge, Text } from '@mantine/core';
import { IconPencil, IconTrash, IconListDetails } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next'; // Importar hook

// Tipos
enum BenefitType { POINTS_MULTIPLIER = 'POINTS_MULTIPLIER', EXCLUSIVE_REWARD_ACCESS = 'EXCLUSIVE_REWARD_ACCESS', CUSTOM_BENEFIT = 'CUSTOM_BENEFIT' }
interface TierBenefit { id: string; isActive: boolean; type: BenefitType; value: string; description: string | null; }
interface Tier { id: string; name: string; level: number; minValue: number; description: string | null; benefitsDescription: string | null; isActive: boolean; benefits: TierBenefit[]; }

// Props
interface TierTableProps {
    tiers: Tier[];
    onEditClick: (tierId: string) => void;
    onDeleteClick: (tierId: string) => void;
    onManageBenefitsClick: (tier: Tier) => void;
}

const TierTable: React.FC<TierTableProps> = ({ tiers, onEditClick, onDeleteClick, onManageBenefitsClick }) => {
    const { t } = useTranslation(); // Hook de traducción

    // Función interna para formatear resumen de beneficios
    const formatBenefitsSummary = (benefits: TierBenefit[]): string => {
        if (!benefits || benefits.length === 0) return t('adminTiersManagePage.benefitsSummaryNone');
        const activeBenefits = benefits.filter(b => b.isActive);
        if (activeBenefits.length === 0) return t('adminTiersManagePage.benefitsSummaryNoneActive');
        // Usar clave con pluralización
        return t('adminTiersManagePage.benefitsSummaryActive', { count: activeBenefits.length });
    };

    // Crear filas de la tabla
    const rows = tiers.map((tier) => (
        <Table.Tr key={tier.id}>
            <Table.Td>{tier.level}</Table.Td>
            <Table.Td fw={500}>{tier.name}</Table.Td>
            <Table.Td>{tier.minValue}</Table.Td>
            <Table.Td>{formatBenefitsSummary(tier.benefits)}</Table.Td>
            <Table.Td>
                <Badge color={tier.isActive ? 'green' : 'gray'} variant="light">
                    {tier.isActive ? t('common.active') : t('common.inactive')}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Group gap="xs" wrap="nowrap">
                    <ActionIcon variant="subtle" color="teal" onClick={() => onManageBenefitsClick(tier)} title={t('adminTiersManagePage.tooltipManageBenefits')}>
                        <IconListDetails size={16} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="blue" onClick={() => onEditClick(tier.id)} title={t('adminTiersManagePage.tooltipEditTier')}>
                        <IconPencil size={16} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="red" onClick={() => onDeleteClick(tier.id)} title={t('adminTiersManagePage.tooltipDeleteTier')}>
                        <IconTrash size={16} />
                    </ActionIcon>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    // Renderizado de la tabla
    return (
        <Table.ScrollContainer minWidth={600}>
            <Table verticalSpacing="sm" striped highlightOnHover withTableBorder withColumnBorders>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>{t('adminTiersManagePage.tableHeaderLevel')}</Table.Th>
                        <Table.Th>{t('adminTiersManagePage.tableHeaderName')}</Table.Th>
                        <Table.Th>{t('adminTiersManagePage.tableHeaderThreshold')}</Table.Th>
                        <Table.Th>{t('adminTiersManagePage.tableHeaderBenefits')}</Table.Th>
                        <Table.Th>{t('adminTiersManagePage.tableHeaderStatus')}</Table.Th>
                        <Table.Th>{t('adminTiersManagePage.tableHeaderActions')}</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {rows.length > 0 ? rows : (
                        <Table.Tr>
                            <Table.Td colSpan={6}>
                                <Text c="dimmed" ta="center">{t('adminTiersManagePage.noTiersDefined')}</Text>
                            </Table.Td>
                        </Table.Tr>
                    )}
                </Table.Tbody>
            </Table>
        </Table.ScrollContainer>
    );
};

export default TierTable;