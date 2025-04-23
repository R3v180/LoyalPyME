// File: frontend/src/components/admin/tiers/TierTable.tsx
// Version: 1.0.0 (Component to display the list of Tiers in a table)

import React from 'react';
import { Table, Group, ActionIcon, Badge, Text } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';

// --- Tipos (Importar o definir aquí, deben coincidir con los usados en la página) ---
enum BenefitType {
    POINTS_MULTIPLIER = 'POINTS_MULTIPLIER',
    EXCLUSIVE_REWARD_ACCESS = 'EXCLUSIVE_REWARD_ACCESS',
    CUSTOM_BENEFIT = 'CUSTOM_BENEFIT'
}

interface TierBenefit {
    id: string;
    type: BenefitType;
    value: string;
    description: string | null;
    isActive: boolean;
}

interface Tier {
    id: string;
    name: string;
    level: number;
    minValue: number;
    description: string | null;
    benefitsDescription: string | null;
    isActive: boolean;
    benefits: TierBenefit[];
}
// --- Fin Tipos ---

// --- Props del Componente ---
interface TierTableProps {
    tiers: Tier[];                      // La lista de tiers a mostrar
    onEditClick: (tierId: string) => void; // Función a llamar al pulsar editar
    onDeleteClick: (tierId: string) => void; // Función a llamar al pulsar borrar
}
// --- Fin Props ---


const TierTable: React.FC<TierTableProps> = ({ tiers, onEditClick, onDeleteClick }) => {

    // Función auxiliar para formatear resumen de beneficios
    const formatBenefitsSummary = (benefits: TierBenefit[]): string => {
        if (!benefits || benefits.length === 0) return 'Ninguno';
        const activeBenefits = benefits.filter(b => b.isActive);
        if (activeBenefits.length === 0) return 'Ninguno activo';
        return `${activeBenefits.length} beneficio(s) activo(s)`;
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
                    {tier.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Group gap="xs" wrap="nowrap">
                    {/* Llamar a las funciones pasadas por props al hacer clic */}
                    <ActionIcon variant="subtle" color="blue" onClick={() => onEditClick(tier.id)} title="Editar Nivel">
                        <IconPencil size={16} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="red" onClick={() => onDeleteClick(tier.id)} title="Eliminar Nivel">
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
                        <Table.Th>Nivel (Orden)</Table.Th>
                        <Table.Th>Nombre</Table.Th>
                        <Table.Th>Umbral Mínimo</Table.Th>
                        <Table.Th>Beneficios</Table.Th>
                        <Table.Th>Estado</Table.Th>
                        <Table.Th>Acciones</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {rows.length > 0 ? rows : (
                         <Table.Tr>
                            <Table.Td colSpan={6}>
                                <Text c="dimmed" ta="center">No se encontraron niveles.</Text>
                            </Table.Td>
                        </Table.Tr>
                    )}
                </Table.Tbody>
            </Table>
        </Table.ScrollContainer>
    );
};

export default TierTable;

// End of File: frontend/src/components/admin/tiers/TierTable.tsx