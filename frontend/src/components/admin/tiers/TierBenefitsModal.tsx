// filename: frontend/src/components/admin/tiers/TierBenefitsModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Modal, Title, Text, Stack, Group, Button, Loader, Alert, Table, ActionIcon,
    Divider, Box, Badge
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { useTranslation } from 'react-i18next'; // Importar hook
import AddTierBenefitForm, { BenefitFormValues, BenefitType } from './AddTierBenefitForm'; // Este componente también necesita i18n
import { notifications } from '@mantine/notifications';
import { IconPencil, IconTrash, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import axiosInstance from '../../../services/axiosInstance';

// --- Tipos ---
interface TierBenefit { id: string; type: BenefitType; value: string; description: string | null; isActive: boolean; }
interface Tier { id: string; name: string; }

// --- Función para crear Schema Zod con t() ---
const createBenefitFormSchema = (t: Function) => z.object({
    type: z.nativeEnum(BenefitType, { errorMap: () => ({ message: t('validation.benefitTypeRequired', 'Selecciona un tipo de beneficio válido.') }) }),
    value: z.string().min(1, { message: t('component.addTierBenefitForm.errorValueRequired', 'El valor es obligatorio') }), // Usando clave del componente hijo (debería estar allí)
    description: z.string().optional(),
    isActive: z.boolean(),
});
// --- FIN ---

// --- Props ---
interface TierBenefitsModalProps {
    opened: boolean;
    onClose: () => void;
    tier: Tier | null;
}
// --- Fin Props ---

const TierBenefitsModal: React.FC<TierBenefitsModalProps> = ({ opened, onClose, tier }) => {
    const { t } = useTranslation(); // Hook de traducción
    const [benefits, setBenefits] = useState<TierBenefit[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Definir etiquetas de tipos de beneficio usando t()
    const benefitTypeLabels: Record<BenefitType, string> = {
        [BenefitType.POINTS_MULTIPLIER]: t('component.addTierBenefitForm.benefitType_POINTS_MULTIPLIER'),
        [BenefitType.EXCLUSIVE_REWARD_ACCESS]: t('component.addTierBenefitForm.benefitType_EXCLUSIVE_REWARD_ACCESS'),
        [BenefitType.CUSTOM_BENEFIT]: t('component.addTierBenefitForm.benefitType_CUSTOM_BENEFIT')
    };

    // useForm usa el schema con t()
    const form = useForm<BenefitFormValues>({
        initialValues: { type: BenefitType.CUSTOM_BENEFIT, value: '', description: '', isActive: true, },
        validate: zodResolver(createBenefitFormSchema(t)),
    });

    // Cargar beneficios
    const fetchBenefits = useCallback(async () => {
        if (!tier?.id || !opened) { setBenefits([]); return; }
        setLoading(true); setError(null);
        try {
            const response = await axiosInstance.get<TierBenefit[]>(`/tiers/tiers/${tier.id}/benefits`);
            setBenefits(response.data);
        } catch (err: any) {
            console.error(`Error fetching benefits for tier ${tier.id}:`, err);
            const message = err.response?.data?.message || t('component.tierBenefitsModal.errorLoading');
            setError(message);
            notifications.show({
                title: t('common.errorLoadingData'), // Título genérico
                message,
                color: 'red',
                icon: <IconAlertCircle />
            });
        } finally { setLoading(false); }
    }, [tier?.id, opened, t]); // Añadir t como dependencia

    useEffect(() => { fetchBenefits(); }, [fetchBenefits]);

    // Handler para AÑADIR beneficio
    const handleAddBenefit = async (values: BenefitFormValues) => {
        if (!tier?.id) return;
        setIsSubmitting(true);
        try {
            await axiosInstance.post(`/tiers/tiers/${tier.id}/benefits`, values);
            notifications.show({
                title: t('component.tierBenefitsModal.addSuccessTitle'),
                message: t('component.tierBenefitsModal.addSuccessMessage'),
                color: 'green',
                icon: <IconCheck />
            });
            form.reset();
            fetchBenefits();
        } catch (err: any) {
            console.error(`Error adding benefit to tier ${tier.id}:`, err);
            notifications.show({
                title: t('component.tierBenefitsModal.addErrorTitle'),
                message: err.response?.data?.message || t('component.tierBenefitsModal.addErrorMessage'),
                color: 'red',
                icon: <IconAlertCircle />
            });
        } finally { setIsSubmitting(false); }
    };

    // Handlers para Editar/Eliminar (Placeholders con t())
    const handleEditBenefit = (benefit: TierBenefit) => {
        console.log("TODO: Edit benefit", benefit);
        notifications.show({
            title: t('common.upcomingFeatureTitle', 'Próximamente'), // Nueva clave
            message: t('component.tierBenefitsModal.editUpcoming'),
            color: 'blue'
        });
    };
    const handleDeleteBenefit = async (benefitId: string) => {
        console.log("TODO: Delete benefit", benefitId);
        notifications.show({
            title: t('common.upcomingFeatureTitle', 'Próximamente'), // Nueva clave
            message: t('component.tierBenefitsModal.deleteUpcoming'),
            color: 'blue'
        });
    };

    // Filas tabla beneficios (Usa benefitTypeLabels local con t())
    const benefitRows = benefits.map((benefit) => (
        <Table.Tr key={benefit.id}>
            <Table.Td>{benefitTypeLabels[benefit.type] || benefit.type}</Table.Td>
            <Table.Td><Text size="sm" truncate style={{ maxWidth: 150 }}>{benefit.value}</Text></Table.Td>
            <Table.Td><Text size="sm" truncate style={{ maxWidth: 200 }}>{benefit.description || '-'}</Text></Table.Td>
            <Table.Td>
                <Badge color={benefit.isActive ? 'green' : 'gray'} variant="light">
                    {benefit.isActive ? t('common.active') : t('common.inactive')}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Group gap="xs" wrap="nowrap">
                    <ActionIcon variant="subtle" color="blue" onClick={() => handleEditBenefit(benefit)} title={t('component.tierBenefitsModal.tooltipEditBenefit')}>
                        <IconPencil size={16} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="red" onClick={() => handleDeleteBenefit(benefit.id)} title={t('component.tierBenefitsModal.tooltipDeleteBenefit')}>
                        <IconTrash size={16} />
                    </ActionIcon>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    // JSX Modal
    return (
        <Modal
            opened={opened}
            onClose={() => { form.reset(); onClose(); }}
            // Usar t() para el título
            title={t('component.tierBenefitsModal.modalTitle', { name: tier?.name || '...' })}
            size="xl" centered
            overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
        >
            <Stack gap="lg">
                {/* Sección añadir */}
                <Box>
                    <Title order={4} mb="sm">{t('component.tierBenefitsModal.addSectionTitle')}</Title>
                    <form onSubmit={form.onSubmit(handleAddBenefit)}>
                        {/* AddTierBenefitForm necesita i18n internamente */}
                        <AddTierBenefitForm form={form} isSubmitting={isSubmitting} />
                        <Group justify="flex-end" mt="md">
                            <Button type="submit" loading={isSubmitting} size="sm">
                                {t('component.tierBenefitsModal.addBenefitButton')}
                            </Button>
                        </Group>
                    </form>
                </Box>

                <Divider my="sm" />

                {/* Sección listar beneficios */}
                <Box>
                    <Title order={4} mb="sm">{t('component.tierBenefitsModal.listSectionTitle')}</Title>
                    {loading && <Group justify="center"><Loader size="sm" /></Group>}
                    {error && !loading &&
                        <Alert title={t('common.error')} color="red" icon={<IconAlertCircle />}>
                            {error}
                        </Alert>
                    }
                    {!loading && !error && benefits.length === 0 && (
                        <Text c="dimmed" ta="center">{t('component.tierBenefitsModal.noBenefits')}</Text>
                    )}
                    {!loading && !error && benefits.length > 0 && (
                        <Table.ScrollContainer minWidth={500}>
                            <Table striped highlightOnHover withTableBorder withColumnBorders verticalSpacing="sm">
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>{t('component.tierBenefitsModal.tableHeaderType')}</Table.Th>
                                        <Table.Th>{t('component.tierBenefitsModal.tableHeaderValue')}</Table.Th>
                                        <Table.Th>{t('component.tierBenefitsModal.tableHeaderDescription')}</Table.Th>
                                        <Table.Th>{t('component.tierBenefitsModal.tableHeaderStatus')}</Table.Th>
                                        <Table.Th>{t('component.tierBenefitsModal.tableHeaderActions')}</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>{benefitRows}</Table.Tbody>
                            </Table>
                        </Table.ScrollContainer>
                    )}
                </Box>

                {/* Botón cerrar */}
                <Group justify="flex-end" mt="lg">
                    <Button variant="default" onClick={() => { form.reset(); onClose(); }}>{t('common.close')}</Button>
                </Group>
            </Stack>
        </Modal>
    );
};

export default TierBenefitsModal;