// frontend/src/components/admin/camarero/menu/ModifierGroupsManagementModal.tsx
import React, { useState, useEffect } from 'react';
import {
    Modal, Button, Stack, Group, Title, Text, Loader, Alert,
    Table, ActionIcon, Badge, Tooltip, TextInput, Select, NumberInput, Switch,
    Paper, Divider, NativeScrollArea
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { z } from 'zod';
import {
    IconPlus, IconAlertCircle, IconPencil, IconTrash, IconDeviceFloppy, IconSettings
} from '@tabler/icons-react';
import { useAdminModifierGroups } from '../../../hooks/useAdminModifierGroups';
import { ModifierGroupData, ModifierGroupFormData, ModifierUiType } from '../../../types/menu.types';
import ModifierOptionsManagementModal from './ModifierOptionsManagementModal';
import { useTranslation } from 'react-i18next'; // Asegurarse de importar

const createModifierGroupSchema = (t: Function) => z.object({
    name_es: z.string().min(1, { message: t('adminCamarero.modifierGroupForm.validation.nameEsRequired') }),
    name_en: z.string().nullable().optional(),
    uiType: z.nativeEnum(ModifierUiType, { errorMap: () => ({ message: t('adminCamarero.modifierGroupForm.validation.uiTypeInvalid') }) }),
    minSelections: z.number().min(0, { message: t('adminCamarero.modifierGroupForm.validation.minSelectionsInvalid') }).default(0),
    maxSelections: z.number().min(1, { message: t('adminCamarero.modifierGroupForm.validation.maxSelectionsInvalid') }).default(1),
    position: z.number().min(0).default(0),
    isRequired: z.boolean().default(false),
}).refine(data => data.minSelections <= data.maxSelections, {
    message: t('adminCamarero.modifierGroupForm.validation.minMaxMismatch'),
    path: ["maxSelections"],
});

type ModifierGroupFormValues = z.infer<ReturnType<typeof createModifierGroupSchema>>;

interface ModifierGroupsManagementModalProps {
    opened: boolean;
    onClose: () => void;
    menuItemId: string | null;
    menuItemName: string;
}

const ModifierGroupsManagementModal: React.FC<ModifierGroupsManagementModalProps> = ({
    opened,
    onClose,
    menuItemId,
    menuItemName,
}) => {
    const { t, i18n } = useTranslation(); // Añadir i18n para currentLanguage si es necesario
    const currentLanguage = i18n.language;

    const {
        modifierGroups,
        loading: loadingGroups,
        error: errorGroups,
        addModifierGroup,
        updateModifierGroup,
        deleteModifierGroup,
        fetchModifierGroups,
    } = useAdminModifierGroups(menuItemId);

    const [showForm, setShowForm] = useState(false);
    const [editingGroup, setEditingGroup] = useState<ModifierGroupData | null>(null);
    const [isSubmittingForm, setIsSubmittingForm] = useState(false);
    const [isDeletingGroupId, setIsDeletingGroupId] = useState<string | null>(null);

    const [optionsModalOpened, { open: openOptionsModal, close: closeOptionsModal }] = useDisclosure(false);
    const [selectedGroupForOptions, setSelectedGroupForOptions] = useState<ModifierGroupData | null>(null);

    const form = useForm<ModifierGroupFormValues>({
        initialValues: {
            name_es: '', name_en: null, uiType: ModifierUiType.RADIO,
            minSelections: 0, maxSelections: 1, position: 0, isRequired: false,
        },
        validate: zodResolver(createModifierGroupSchema(t)),
    });

    useEffect(() => {
        if (opened && menuItemId) {
            fetchModifierGroups();
        }
        if (!opened) {
            setShowForm(false);
            setEditingGroup(null);
            form.reset();
            closeOptionsModal();
            setSelectedGroupForOptions(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened, menuItemId, closeOptionsModal]);

    const handleOpenAddForm = () => {
        setEditingGroup(null);
        form.reset();
        form.setFieldValue('position', modifierGroups.length > 0 ? Math.max(...modifierGroups.map(g => g.position)) + 1 : 0);
        setShowForm(true);
    };

    const handleOpenEditForm = (group: ModifierGroupData) => {
        setEditingGroup(group);
        form.setValues({
            name_es: group.name_es,
            name_en: group.name_en || null,
            uiType: group.uiType,
            minSelections: group.minSelections,
            maxSelections: group.maxSelections,
            position: group.position,
            isRequired: group.isRequired,
        });
        setShowForm(true);
    };

    const handleFormSubmit = async (values: ModifierGroupFormValues) => {
        if (!menuItemId) return;
        setIsSubmittingForm(true);
        const formData: ModifierGroupFormData = {
            name_es: values.name_es,
            name_en: values.name_en || null,
            uiType: values.uiType,
            minSelections: values.minSelections,
            maxSelections: values.maxSelections,
            position: values.position,
            isRequired: values.isRequired,
        };

        let success = false;
        if (editingGroup) {
            const result = await updateModifierGroup(editingGroup.id, formData);
            if (result) success = true;
        } else {
            const result = await addModifierGroup(formData);
            if (result) success = true;
        }

        if (success) {
            setShowForm(false);
            setEditingGroup(null);
            form.reset();
        }
        setIsSubmittingForm(false);
    };

    const handleDeleteGroup = async (groupId: string) => {
        setIsDeletingGroupId(groupId);
        await deleteModifierGroup(groupId); // El hook se encarga de la notificación
        setIsDeletingGroupId(null);
    };

    const handleManageOptions = (group: ModifierGroupData) => {
        setSelectedGroupForOptions(group);
        openOptionsModal();
    };

    const groupRows = modifierGroups.map((group) => {
        const groupDisplayName = (currentLanguage === 'es' && group.name_es) ? group.name_es : (group.name_en || group.name_es || t('common.nameNotAvailable'));
        return (
            <Table.Tr key={group.id}>
                <Table.Td>
                    <Text fw={500}>{groupDisplayName}</Text>
                    {groupDisplayName !== group.name_es && group.name_es && <Text size="xs" c="dimmed">ES: {group.name_es}</Text>}
                    {groupDisplayName !== group.name_en && group.name_en && <Text size="xs" c="dimmed">EN: {group.name_en}</Text>}
                </Table.Td>
                <Table.Td><Badge color="cyan" variant="light">{group.uiType}</Badge></Table.Td>
                <Table.Td>{group.minSelections} - {group.maxSelections}</Table.Td>
                <Table.Td>{group.isRequired ? t('common.yes') : t('common.no')}</Table.Td>
                <Table.Td>{group.position}</Table.Td>
                <Table.Td>
                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                        <Tooltip label={t('adminCamarero.modifierGroupsModal.tooltipManageOptions')} withArrow>
                            <ActionIcon variant="subtle" color="green" onClick={() => handleManageOptions(group)} disabled={!!isDeletingGroupId}>
                                <IconSettings size={16} />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label={t('adminCamarero.modifierGroupsModal.tooltipEditGroup')} withArrow>
                            <ActionIcon variant="subtle" color="blue" onClick={() => handleOpenEditForm(group)} disabled={!!isDeletingGroupId}>
                                <IconPencil size={16} />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label={t('adminCamarero.modifierGroupsModal.tooltipDeleteGroup')} withArrow>
                            <ActionIcon variant="subtle" color="red" onClick={() => handleDeleteGroup(group.id)} loading={isDeletingGroupId === group.id} disabled={!!isDeletingGroupId && isDeletingGroupId !== group.id}>
                                <IconTrash size={16} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Table.Td>
            </Table.Tr>
        );
    });

    const uiTypeOptions = Object.values(ModifierUiType).map(type => ({
        value: type,
        label: t(`adminCamarero.modifierGroupForm.uiType.${type}`, type) // Claves como 'adminCamarero.modifierGroupForm.uiType.RADIO'
    }));


    return (
        <>
            <Modal
                opened={opened && !!menuItemId}
                onClose={onClose}
                title={t('adminCamarero.modifierGroupsModal.title', { itemName: menuItemName })}
                size="xl"
                centered
                scrollAreaComponent={NativeScrollArea}
                overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
            >
                <Stack gap="lg">
                    {!showForm ? (
                        <>
                            <Group justify="space-between">
                                <Title order={5}>{t('adminCamarero.modifierGroupsModal.existingGroupsTitle')}</Title>
                                <Button leftSection={<IconPlus size={16} />} onClick={handleOpenAddForm} disabled={loadingGroups}>
                                    {t('adminCamarero.modifierGroupsModal.createNewGroupButton')}
                                </Button>
                            </Group>

                            {loadingGroups && <Group justify="center" mt="md"><Loader /></Group>}
                            {errorGroups && !loadingGroups && <Alert title={t('common.error')} color="red" icon={<IconAlertCircle />}>{errorGroups}</Alert>}
                            {!loadingGroups && !errorGroups && modifierGroups.length === 0 && <Text c="dimmed" ta="center" mt="md">{t('adminCamarero.modifierGroupsModal.noGroupsForItem')}</Text>}
                            {!loadingGroups && !errorGroups && modifierGroups.length > 0 && (
                                <Table.ScrollContainer minWidth={600}>
                                    <Table striped highlightOnHover withTableBorder verticalSpacing="sm">
                                        <Table.Thead>
                                            <Table.Tr>
                                                <Table.Th>{t('adminCamarero.modifierGroupsModal.tableHeaderName')}</Table.Th>
                                                <Table.Th>{t('adminCamarero.modifierGroupsModal.tableHeaderUiType')}</Table.Th>
                                                <Table.Th>{t('adminCamarero.modifierGroupsModal.tableHeaderSelections')}</Table.Th>
                                                <Table.Th>{t('adminCamarero.modifierGroupsModal.tableHeaderRequired')}</Table.Th>
                                                <Table.Th>{t('adminCamarero.modifierGroupsModal.tableHeaderPosition')}</Table.Th>
                                                <Table.Th style={{ textAlign: 'right' }}>{t('common.actions')}</Table.Th>
                                            </Table.Tr>
                                        </Table.Thead>
                                        <Table.Tbody>{groupRows}</Table.Tbody>
                                    </Table>
                                </Table.ScrollContainer>
                            )}
                        </>
                    ) : (
                        <Paper withBorder p="md" radius="md">
                            <Title order={5} mb="md">{editingGroup ? t('adminCamarero.modifierGroupsModal.formEditTitle', { groupName: (currentLanguage === 'es' && editingGroup.name_es) ? editingGroup.name_es : (editingGroup.name_en || editingGroup.name_es || '') }) : t('adminCamarero.modifierGroupsModal.formCreateTitle')}</Title>
                            <form onSubmit={form.onSubmit(handleFormSubmit)}>
                                <Stack gap="sm">
                                    <TextInput label={t('adminCamarero.modifierGroupForm.nameEsLabel')} required {...form.getInputProps('name_es')} disabled={isSubmittingForm} />
                                    <TextInput label={t('adminCamarero.modifierGroupForm.nameEnLabel')} {...form.getInputProps('name_en')} disabled={isSubmittingForm} />
                                    <Select
                                        label={t('adminCamarero.modifierGroupForm.uiTypeLabel')}
                                        data={uiTypeOptions}
                                        required
                                        {...form.getInputProps('uiType')}
                                        disabled={isSubmittingForm}
                                    />
                                    <Group grow>
                                        <NumberInput label={t('adminCamarero.modifierGroupForm.minSelectionsLabel')} min={0} {...form.getInputProps('minSelections')} disabled={isSubmittingForm} />
                                        <NumberInput label={t('adminCamarero.modifierGroupForm.maxSelectionsLabel')} min={1} {...form.getInputProps('maxSelections')} disabled={isSubmittingForm} />
                                    </Group>
                                    <NumberInput label={t('adminCamarero.modifierGroupForm.positionLabel')} min={0} {...form.getInputProps('position')} disabled={isSubmittingForm} />
                                    <Switch label={t('adminCamarero.modifierGroupForm.isRequiredLabel')} {...form.getInputProps('isRequired', { type: 'checkbox' })} disabled={isSubmittingForm} />

                                    <Group justify="flex-end" mt="md">
                                        <Button variant="default" onClick={() => { setShowForm(false); setEditingGroup(null); form.reset(); }} disabled={isSubmittingForm}>
                                            {t('common.cancel')}
                                        </Button>
                                        <Button type="submit" loading={isSubmittingForm} leftSection={<IconDeviceFloppy size={16} />}>
                                            {editingGroup ? t('common.saveChanges') : t('adminCamarero.modifierGroupsModal.formCreateButton')}
                                        </Button>
                                    </Group>
                                </Stack>
                            </form>
                        </Paper>
                    )}
                    <Divider mt="lg" />
                    <Group justify="flex-end" mt="md">
                        <Button variant="outline" onClick={onClose}>{t('adminCamarero.modifierGroupsModal.closeButton')}</Button>
                    </Group>
                </Stack>
            </Modal>

            {selectedGroupForOptions && (
                <ModifierOptionsManagementModal
                    opened={optionsModalOpened}
                    onClose={() => {
                        closeOptionsModal();
                        setSelectedGroupForOptions(null);
                        fetchModifierGroups();
                    }}
                    modifierGroupId={selectedGroupForOptions.id}
                    modifierGroupName={(currentLanguage === 'es' && selectedGroupForOptions.name_es) ? selectedGroupForOptions.name_es : (selectedGroupForOptions.name_en || selectedGroupForOptions.name_es || t('common.nameNotAvailable'))}
                />
            )}
        </>
    );
};

export default ModifierGroupsManagementModal;