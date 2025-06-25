// frontend/src/components/admin/camarero/menu/ModifierOptionsManagementModal.tsx
import React, { useState, useEffect } from 'react';
import {
    Modal, Button, Stack, Group, Title, Text, Loader, Alert,
    Table, ActionIcon, Badge, Tooltip, TextInput, NumberInput, Switch,
    Paper, Divider, NativeScrollArea
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import {
    IconPlus, IconAlertCircle, IconPencil, IconTrash, IconDeviceFloppy, IconCurrencyEuro,
    IconPlayerPlay, IconPlayerStop
} from '@tabler/icons-react';
import { useAdminModifierOptions } from '../../../hooks/useAdminModifierOptions';
import { ModifierOptionData, ModifierOptionFormData } from '../../../types/menu.types';
import { useTranslation } from 'react-i18next'; // Asegurarse de importar

// Schema de validación Zod usando la función t
const createModifierOptionSchema = (t: Function) => z.object({
    name_es: z.string().min(1, { message: t('adminCamarero.modifierOptionForm.validation.nameEsRequired') }),
    name_en: z.string().nullable().optional(),
    priceAdjustment: z.coerce.number().default(0),
    position: z.coerce.number().min(0).default(0),
    isDefault: z.boolean().default(false),
    isAvailable: z.boolean().default(true),
});

type ModifierOptionFormValues = z.infer<ReturnType<typeof createModifierOptionSchema>>;

interface ModifierOptionsManagementModalProps {
    opened: boolean;
    onClose: () => void;
    modifierGroupId: string | null;
    modifierGroupName: string;
}

const ModifierOptionsManagementModal: React.FC<ModifierOptionsManagementModalProps> = ({
    opened,
    onClose,
    modifierGroupId,
    modifierGroupName,
}) => {
    const { t, i18n } = useTranslation(); // Añadir i18n para currentLanguage si es necesario
    const currentLanguage = i18n.language;

    const {
        modifierOptions,
        loading: loadingOptions,
        error: errorOptions,
        addModifierOption,
        updateModifierOption,
        deleteModifierOption,
        fetchModifierOptions,
    } = useAdminModifierOptions(modifierGroupId);

    const [showOptionForm, setShowOptionForm] = useState(false);
    const [editingOption, setEditingOption] = useState<ModifierOptionData | null>(null);
    const [isSubmittingOptionForm, setIsSubmittingOptionForm] = useState(false);
    const [isDeletingOptionId, setIsDeletingOptionId] = useState<string | null>(null);
    const [isTogglingStatusOptionId, setIsTogglingStatusOptionId] = useState<string | null>(null);

    const form = useForm<ModifierOptionFormValues>({
        initialValues: {
            name_es: '', name_en: null, priceAdjustment: 0,
            position: 0, isDefault: false, isAvailable: true,
        },
        validate: zodResolver(createModifierOptionSchema(t)), // Pasar t al resolver
    });

    useEffect(() => {
        if (opened && modifierGroupId) {
            fetchModifierOptions();
        }
        if (!opened) {
            setShowOptionForm(false);
            setEditingOption(null);
            form.reset();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened, modifierGroupId]);

    const handleOpenAddOptionForm = () => {
        setEditingOption(null);
        form.reset();
        form.setFieldValue('position', modifierOptions.length > 0 ? Math.max(...modifierOptions.map(o => o.position)) + 1 : 0);
        setShowOptionForm(true);
    };

    const handleOpenEditOptionForm = (option: ModifierOptionData) => {
        setEditingOption(option);
        form.setValues({
            name_es: option.name_es,
            name_en: option.name_en || null,
            priceAdjustment: Number(option.priceAdjustment),
            position: Number(option.position),
            isDefault: option.isDefault,
            isAvailable: option.isAvailable,
        });
        setShowOptionForm(true);
    };

    const handleOptionFormSubmit = async (values: ModifierOptionFormValues) => {
        if (!modifierGroupId) return;
        setIsSubmittingOptionForm(true);
        const formData: ModifierOptionFormData = {
            name_es: values.name_es,
            name_en: values.name_en || null,
            priceAdjustment: values.priceAdjustment,
            position: values.position,
            isDefault: values.isDefault,
            isAvailable: values.isAvailable,
        };
        let success = false;
        if (editingOption) {
            const result = await updateModifierOption(editingOption.id, formData);
            if (result) success = true;
        } else {
            const result = await addModifierOption(formData);
            if (result) success = true;
        }
        if (success) {
            setShowOptionForm(false);
            setEditingOption(null);
            form.reset();
        }
        setIsSubmittingOptionForm(false);
    };

    const handleDeleteOption = async (optionId: string) => {
        setIsDeletingOptionId(optionId);
        await deleteModifierOption(optionId); // El hook maneja la notificación
        setIsDeletingOptionId(null);
    };

    const handleToggleOptionAvailable = async (option: ModifierOptionData) => {
        setIsTogglingStatusOptionId(option.id);
        const newStatus = !option.isAvailable;
        try {
            await updateModifierOption(option.id, { isAvailable: newStatus });
        } catch (error) {
            console.error(`Error toggling availability for option ${option.id}:`, error);
        } finally {
            setIsTogglingStatusOptionId(null);
        }
    };


    const optionRows = modifierOptions.map((option) => {
        const optionDisplayName = (currentLanguage === 'es' && option.name_es) ? option.name_es : (option.name_en || option.name_es || t('common.nameNotAvailable'));
        const isLoadingThisStatus = isTogglingStatusOptionId === option.id;
        const isLoadingThisDelete = isDeletingOptionId === option.id;
        const disableActionsGeneral = isSubmittingOptionForm || !!isDeletingOptionId || !!isTogglingStatusOptionId;
        const optionAvailabilityText = option.isAvailable ? t('adminCamarero.modifierOption.statusAvailable') : t('adminCamarero.modifierOption.statusNotAvailable');
        const tooltipToggleAvailable = option.isAvailable ? t('adminCamarero.modifierOption.tooltipMarkNotAvailable') : t('adminCamarero.modifierOption.tooltipMarkAvailable');

        return (
            <Table.Tr key={option.id}>
                <Table.Td>
                    <Text fw={500}>{optionDisplayName}</Text>
                    {optionDisplayName !== option.name_es && option.name_es && <Text size="xs" c="dimmed">ES: {option.name_es}</Text>}
                    {optionDisplayName !== option.name_en && option.name_en && <Text size="xs" c="dimmed">EN: {option.name_en}</Text>}
                </Table.Td>
                <Table.Td ta="right">
                    {option.priceAdjustment.toLocaleString(undefined, { style: 'currency', currency: 'EUR' })}
                </Table.Td>
                <Table.Td>{option.position}</Table.Td>
                <Table.Td>{option.isDefault ? t('common.yes') : t('common.no')}</Table.Td>
                <Table.Td>
                    <Badge color={option.isAvailable ? 'green' : 'gray'} variant="light">
                        {optionAvailabilityText}
                    </Badge>
                </Table.Td>
                <Table.Td>
                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                        <Tooltip label={t('adminCamarero.modifierOption.tooltipEditOption')} withArrow>
                            <ActionIcon variant="subtle" color="blue"
                                onClick={() => handleOpenEditOptionForm(option)}
                                disabled={disableActionsGeneral || isLoadingThisStatus || isLoadingThisDelete}
                            >
                                <IconPencil size={16} />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label={tooltipToggleAvailable} withArrow>
                            <ActionIcon
                                variant="subtle"
                                color={option.isAvailable ? "orange" : "teal"}
                                onClick={() => handleToggleOptionAvailable(option)}
                                loading={isLoadingThisStatus}
                                disabled={disableActionsGeneral || isLoadingThisDelete || (isTogglingStatusOptionId !== null && isTogglingStatusOptionId !== option.id)}
                            >
                                {option.isAvailable ? <IconPlayerStop size={16} /> : <IconPlayerPlay size={16} />}
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label={t('adminCamarero.modifierOption.tooltipDeleteOption')} withArrow>
                            <ActionIcon variant="subtle" color="red"
                                onClick={() => handleDeleteOption(option.id)}
                                loading={isLoadingThisDelete}
                                disabled={disableActionsGeneral || isLoadingThisStatus || (isDeletingOptionId !== null && isDeletingOptionId !== option.id)}
                            >
                                <IconTrash size={16} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Table.Td>
            </Table.Tr>
        );
    });

    return (
        <Modal
            opened={opened && !!modifierGroupId}
            onClose={onClose}
            title={t('adminCamarero.modifierOptionsModal.title', { groupName: modifierGroupName })}
            size="lg"
            centered
            scrollAreaComponent={NativeScrollArea}
            overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
        >
            <Stack gap="lg">
                {!showOptionForm ? (
                    <>
                        <Group justify="space-between">
                            <Title order={5}>{t('adminCamarero.modifierOptionsModal.existingOptionsTitle')}</Title>
                            <Button leftSection={<IconPlus size={16} />} onClick={handleOpenAddOptionForm} disabled={loadingOptions}>
                                {t('adminCamarero.modifierOptionsModal.createNewOptionButton')}
                            </Button>
                        </Group>

                        {loadingOptions && <Group justify="center" mt="md"><Loader /></Group>}
                        {errorOptions && !loadingOptions && <Alert title={t('common.error')} color="red" icon={<IconAlertCircle />}>{errorOptions}</Alert>}
                        {!loadingOptions && !errorOptions && modifierOptions.length === 0 && <Text c="dimmed" ta="center" mt="md">{t('adminCamarero.modifierOptionsModal.noOptionsForGroup')}</Text>}
                        {!loadingOptions && !errorOptions && modifierOptions.length > 0 && (
                            <Table.ScrollContainer minWidth={500}>
                                <Table striped highlightOnHover withTableBorder verticalSpacing="sm">
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>{t('adminCamarero.modifierOptionsModal.tableHeaderName')}</Table.Th>
                                            <Table.Th ta="right">{t('adminCamarero.modifierOptionsModal.tableHeaderPriceAdjustment')}</Table.Th>
                                            <Table.Th>{t('adminCamarero.modifierOptionsModal.tableHeaderPosition')}</Table.Th>
                                            <Table.Th>{t('adminCamarero.modifierOptionsModal.tableHeaderDefault')}</Table.Th>
                                            <Table.Th>{t('adminCamarero.modifierOptionsModal.tableHeaderAvailable')}</Table.Th>
                                            <Table.Th style={{ textAlign: 'right' }}>{t('common.actions')}</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>{optionRows}</Table.Tbody>
                                </Table>
                            </Table.ScrollContainer>
                        )}
                    </>
                ) : (
                    <Paper withBorder p="md" radius="md">
                        <Title order={5} mb="md">{editingOption ? t('adminCamarero.modifierOptionsModal.formEditTitle', { optionName: (currentLanguage === 'es' && editingOption.name_es) ? editingOption.name_es : (editingOption.name_en || editingOption.name_es || '') }) : t('adminCamarero.modifierOptionsModal.formCreateTitle')}</Title>
                        <form onSubmit={form.onSubmit(handleOptionFormSubmit)}>
                            <Stack gap="sm">
                                <TextInput label={t('adminCamarero.modifierOptionForm.nameEsLabel')} required {...form.getInputProps('name_es')} disabled={isSubmittingOptionForm} />
                                <TextInput label={t('adminCamarero.modifierOptionForm.nameEnLabel')} {...form.getInputProps('name_en')} disabled={isSubmittingOptionForm} />
                                <NumberInput
                                    label={t('adminCamarero.modifierOptionForm.priceAdjustmentLabel')}
                                    description={t('adminCamarero.modifierOptionForm.priceAdjustmentDescription')}
                                    decimalScale={2}
                                    fixedDecimalScale
                                    step={0.10}
                                    leftSection={<IconCurrencyEuro size={16} />}
                                    {...form.getInputProps('priceAdjustment')}
                                    disabled={isSubmittingOptionForm}
                                />
                                <NumberInput
                                    label={t('adminCamarero.modifierOptionForm.positionLabel')}
                                    min={0}
                                    step={1}
                                    allowDecimal={false}
                                    {...form.getInputProps('position')}
                                    disabled={isSubmittingOptionForm}
                                />
                                <Switch label={t('adminCamarero.modifierOptionForm.isDefaultLabel')} {...form.getInputProps('isDefault', { type: 'checkbox' })} disabled={isSubmittingOptionForm} />
                                <Switch label={t('adminCamarero.modifierOptionForm.isAvailableLabel')} {...form.getInputProps('isAvailable', { type: 'checkbox' })} disabled={isSubmittingOptionForm} />

                                <Group justify="flex-end" mt="md">
                                    <Button variant="default" onClick={() => { setShowOptionForm(false); setEditingOption(null); form.reset(); }} disabled={isSubmittingOptionForm}>
                                        {t('common.cancel')}
                                    </Button>
                                    <Button type="submit" loading={isSubmittingOptionForm} leftSection={<IconDeviceFloppy size={16} />}>
                                        {editingOption ? t('common.saveChanges') : t('adminCamarero.modifierOptionsModal.formCreateButton')}
                                    </Button>
                                </Group>
                            </Stack>
                        </form>
                    </Paper>
                )}
                 <Divider mt="lg" />
                <Group justify="flex-end" mt="md">
                    <Button variant="outline" onClick={onClose}>{t('adminCamarero.modifierOptionsModal.closeButton')}</Button>
                </Group>
            </Stack>
        </Modal>
    );
};

export default ModifierOptionsManagementModal;