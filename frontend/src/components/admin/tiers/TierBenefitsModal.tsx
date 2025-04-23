// File: frontend/src/components/admin/tiers/TierBenefitsModal.tsx
// Version: 1.0.1 (Fix imports and Table prop errors - COMPLETE FILE)

import React, { useState, useEffect, useCallback } from 'react';
import {
    Modal, Title, Text, Stack, Group, Button, Loader, Alert, Table, ActionIcon,
    TextInput, Textarea, Select, Switch, Divider, Box,
    Badge // Importación de Badge añadida
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { notifications } from '@mantine/notifications';
// Imports de Iconos (solo los usados)
import { IconPencil, IconTrash, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import axiosInstance from '../../../services/axiosInstance'; // Ajusta ruta

// --- Tipos/Enums ---
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
}
// Schema Zod para formulario
const benefitFormSchema = z.object({
    type: z.nativeEnum(BenefitType, { errorMap: () => ({ message: 'Selecciona un tipo de beneficio válido.' }) }),
    value: z.string().min(1, { message: 'El valor es obligatorio' }),
    description: z.string().optional(),
    isActive: z.boolean(),
});
type BenefitFormValues = z.infer<typeof benefitFormSchema>;
// --- Fin Tipos ---

// --- NUEVO: Mapeo para traducciones de BenefitType ---
const benefitTypeLabels: Record<BenefitType, string> = {
    [BenefitType.POINTS_MULTIPLIER]: 'Multiplicador de Puntos',
    [BenefitType.EXCLUSIVE_REWARD_ACCESS]: 'Acceso a Recompensa Exclusiva',
    [BenefitType.CUSTOM_BENEFIT]: 'Beneficio Personalizado'
    // Añade aquí futuras traducciones si creas más BenefitType
};
// --- FIN NUEVO ---

// --- Props ---
interface TierBenefitsModalProps {
    opened: boolean;
    onClose: () => void;
    tier: Tier | null;
}
// --- Fin Props ---

const TierBenefitsModal: React.FC<TierBenefitsModalProps> = ({ opened, onClose, tier }) => {
    const [benefits, setBenefits] = useState<TierBenefit[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Formulario añadir
    const form = useForm<BenefitFormValues>({
        initialValues: { type: BenefitType.CUSTOM_BENEFIT, value: '', description: '', isActive: true, },
        validate: zodResolver(benefitFormSchema),
    });

    // Cargar beneficios (IMPLEMENTACIÓN COMPLETA)
    const fetchBenefits = useCallback(async () => {
        if (!tier?.id || !opened) {
             setBenefits([]);
            return;
        }
        setLoading(true);
        setError(null);
        console.log(`Fetching benefits for tier ID: ${tier.id}`);
        try {
            const response = await axiosInstance.get<TierBenefit[]>(`/tiers/tiers/${tier.id}/benefits`);
            setBenefits(response.data);
        } catch (err: any) {
            console.error(`Error fetching benefits for tier ${tier.id}:`, err);
            const message = err.response?.data?.message || "Error al cargar los beneficios.";
            setError(message);
            notifications.show({ title: 'Error de Carga', message, color: 'red', icon: <IconAlertCircle /> });
        } finally {
            setLoading(false);
        }
    }, [tier?.id, opened]);

    // Cargar al abrir/cambiar tier
    useEffect(() => {
        fetchBenefits();
    }, [fetchBenefits]);

    // Añadir beneficio (IMPLEMENTACIÓN COMPLETA)
    const handleAddBenefit = async (values: BenefitFormValues) => {
        if (!tier?.id) return;
        setIsSubmitting(true);
        try {
            await axiosInstance.post(`/tiers/tiers/${tier.id}/benefits`, values);
            notifications.show({ title: 'Beneficio Añadido', message: 'El nuevo beneficio se ha añadido correctamente.', color: 'green', icon: <IconCheck /> });
            form.reset();
            fetchBenefits(); // Recargar lista
        } catch (err: any) {
            console.error(`Error adding benefit to tier ${tier.id}:`, err);
            notifications.show({ title: 'Error al Añadir', message: err.response?.data?.message || 'No se pudo añadir el beneficio.', color: 'red', icon: <IconAlertCircle /> });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Editar beneficio (Placeholder)
    const handleEditBenefit = (benefit: TierBenefit) => {
        console.log("TODO: Edit benefit", benefit);
        notifications.show({ title: 'Próximamente', message: 'Edición de beneficios aún no implementada.', color: 'blue' });
    };
    // Eliminar beneficio (Placeholder)
    const handleDeleteBenefit = async (benefitId: string) => {
         console.log("TODO: Delete benefit", benefitId);
         notifications.show({ title: 'Próximamente', message: 'Eliminación de beneficios aún no implementada.', color: 'blue' });
         // const confirm = window.confirm("Seguro?"); if (!confirm) return;
         // try { await axiosInstance.delete(...); fetchBenefits(); } catch ...
    };


    // Filas tabla beneficios (IMPLEMENTACIÓN COMPLETA)
    const benefitRows = benefits.map((benefit) => (
        <Table.Tr key={benefit.id}>
            <Table.Td>{benefit.type}</Table.Td>
            <Table.Td>
                 <Text size="sm" truncate style={{ maxWidth: 150 }}>{benefit.value}</Text>
            </Table.Td>
            <Table.Td>
                <Text size="sm" truncate style={{ maxWidth: 200 }}>{benefit.description || '-'}</Text>
            </Table.Td>
            <Table.Td>
                <Badge color={benefit.isActive ? 'green' : 'gray'} variant="light">
                    {benefit.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Group gap="xs" wrap="nowrap">
                    <ActionIcon variant="subtle" color="blue" onClick={() => handleEditBenefit(benefit)} title="Editar Beneficio">
                        <IconPencil size={16} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="red" onClick={() => handleDeleteBenefit(benefit.id)} title="Eliminar Beneficio">
                        <IconTrash size={16} />
                    </ActionIcon>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    // JSX Modal (COMPLETO)
    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={`Gestionar Beneficios - Nivel: ${tier?.name || '...'}`}
            size="xl"
            centered
            overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
        >
            <Stack gap="lg">
                {/* Sección añadir */}
                <Box>
                    <Title order={4} mb="sm">Añadir Nuevo Beneficio</Title>
                    <form onSubmit={form.onSubmit(handleAddBenefit)}>
                        <Stack gap="sm">
                        <Select
    label="Tipo de Beneficio"
    placeholder="Selecciona un tipo"
    // --- LÍNEA MODIFICADA ---
    data={Object.values(BenefitType).map(value => ({
        value: value,              // Valor interno (Enum key)
        label: benefitTypeLabels[value] // Etiqueta traducida
    }))}
    // --- FIN MODIFICACIÓN ---
    required
    {...form.getInputProps('type')}
/>
                             <TextInput label="Valor" placeholder="Ej: 1.5, reward_id, 'Descuento X'" description="Valor asociado al tipo (número, ID, texto)" required {...form.getInputProps('value')} />
                             <Textarea label="Descripción (Opcional)" placeholder="Detalles adicionales del beneficio" rows={2} {...form.getInputProps('description')} />
                             <Switch label="Beneficio Activo" defaultChecked={true} {...form.getInputProps('isActive', { type: 'checkbox' })} />
                            <Group justify="flex-end" mt="xs">
                                <Button type="submit" loading={isSubmitting} size="xs"> Añadir Beneficio </Button>
                            </Group>
                        </Stack>
                    </form>
                </Box>

                <Divider my="sm" />

                {/* Sección listar */}
                 <Box>
                     <Title order={4} mb="sm">Beneficios Actuales</Title>
                    {loading && <Group justify="center"><Loader size="sm" /></Group>}
                    {error && !loading && <Alert title="Error" color="red" icon={<IconAlertCircle />}>{error}</Alert>}
                    {!loading && !error && benefits.length === 0 && (
                        <Text c="dimmed" ta="center">Este nivel no tiene beneficios definidos.</Text>
                    )}
                     {!loading && !error && benefits.length > 0 && (
                         <Table.ScrollContainer minWidth={500}>
                            <Table striped highlightOnHover withTableBorder withColumnBorders>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Tipo</Table.Th>
                                        <Table.Th>Valor</Table.Th>
                                        <Table.Th>Descripción</Table.Th>
                                        <Table.Th>Estado</Table.Th>
                                        <Table.Th>Acciones</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>{benefitRows}</Table.Tbody>
                            </Table>
                        </Table.ScrollContainer>
                    )}
                 </Box>

                 {/* Botón cerrar */}
                 <Group justify="flex-end" mt="lg">
                    <Button variant="default" onClick={onClose}>Cerrar</Button>
                 </Group>
            </Stack>
        </Modal>
    );
};

export default TierBenefitsModal;

// End of File: frontend/src/components/admin/tiers/TierBenefitsModal.tsx