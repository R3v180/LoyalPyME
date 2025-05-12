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
    IconPlayerPlay, IconPlayerStop // <--- AÑADIR ICONOS
} from '@tabler/icons-react';
import { useAdminModifierOptions } from '../../../../hooks/useAdminModifierOptions';
import { ModifierOptionData, ModifierOptionFormData } from '../../../../types/menu.types';
// import { notifications } from '@mantine/notifications'; // Ya no se usa aquí

const modifierOptionSchema = z.object({
    name_es: z.string().min(1, { message: "El nombre en español es obligatorio." }),
    name_en: z.string().nullable().optional(),
    priceAdjustment: z.coerce.number().default(0),
    position: z.coerce.number().min(0).default(0),
    isDefault: z.boolean().default(false),
    isAvailable: z.boolean().default(true),
});

type ModifierOptionFormValues = z.infer<typeof modifierOptionSchema>;

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
    // --- NUEVO ESTADO PARA TOGGLE ---
    const [isTogglingStatusOptionId, setIsTogglingStatusOptionId] = useState<string | null>(null);
    // --- FIN NUEVO ESTADO ---

    const form = useForm<ModifierOptionFormValues>({
        initialValues: {
            name_es: '', name_en: null, priceAdjustment: 0,
            position: 0, isDefault: false, isAvailable: true,
        },
        validate: zodResolver(modifierOptionSchema),
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

    const handleOpenAddOptionForm = () => { /* ... sin cambios ... */ 
        setEditingOption(null);
        form.reset();
        form.setFieldValue('position', modifierOptions.length > 0 ? Math.max(...modifierOptions.map(o => o.position)) + 1 : 0);
        setShowOptionForm(true);
    };
    const handleOpenEditOptionForm = (option: ModifierOptionData) => { /* ... sin cambios ... */ 
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
    const handleOptionFormSubmit = async (values: ModifierOptionFormValues) => { /* ... sin cambios ... */ 
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
    const handleDeleteOption = async (optionId: string) => { /* ... sin cambios ... */ 
        setIsDeletingOptionId(optionId);
        await deleteModifierOption(optionId);
        setIsDeletingOptionId(null);
    };

    // --- NUEVO HANDLER PARA TOGGLE STATUS ---
    const handleToggleOptionAvailable = async (option: ModifierOptionData) => {
        setIsTogglingStatusOptionId(option.id);
        const newStatus = !option.isAvailable;
        try {
            // Solo actualizamos el campo isAvailable
            await updateModifierOption(option.id, { isAvailable: newStatus });
            // La notificación de éxito ya la maneja el hook updateModifierOption
        } catch (error) {
            // La notificación de error ya la maneja el hook updateModifierOption
            console.error(`Error toggling availability for option ${option.id}:`, error);
        } finally {
            setIsTogglingStatusOptionId(null);
        }
    };
    // --- FIN NUEVO HANDLER ---


    const optionRows = modifierOptions.map((option) => {
        // --- LÓGICA PARA BOTONES DE ACCIÓN ---
        const isLoadingThisStatus = isTogglingStatusOptionId === option.id;
        const isLoadingThisDelete = isDeletingOptionId === option.id;
        const disableActionsGeneral = isSubmittingOptionForm || !!isDeletingOptionId || !!isTogglingStatusOptionId;

        return (
            <Table.Tr key={option.id}>
                <Table.Td>
                    <Text fw={500}>{option.name_es}</Text>
                    {option.name_en && <Text size="xs" c="dimmed">EN: {option.name_en}</Text>}
                </Table.Td>
                <Table.Td ta="right">
                    {option.priceAdjustment.toLocaleString(undefined, { style: 'currency', currency: 'EUR' })}
                </Table.Td>
                <Table.Td>{option.position}</Table.Td>
                <Table.Td>{option.isDefault ? 'Sí' : 'No'}</Table.Td>
                <Table.Td>
                    <Badge color={option.isAvailable ? 'green' : 'gray'} variant="light">
                        {option.isAvailable ? 'Disponible' : 'No Disp.'}
                    </Badge>
                </Table.Td>
                <Table.Td>
                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                        <Tooltip label="Editar Opción" withArrow>
                            <ActionIcon variant="subtle" color="blue" 
                                onClick={() => handleOpenEditOptionForm(option)} 
                                disabled={disableActionsGeneral || isLoadingThisStatus || isLoadingThisDelete}
                            >
                                <IconPencil size={16} />
                            </ActionIcon>
                        </Tooltip>
                        {/* --- NUEVO BOTÓN TOGGLE --- */}
                        <Tooltip label={option.isAvailable ? "Marcar No Disponible" : "Marcar Disponible"} withArrow>
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
                        {/* --- FIN NUEVO BOTÓN TOGGLE --- */}
                        <Tooltip label="Eliminar Opción" withArrow>
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
            title={`Opciones para Grupo: "${modifierGroupName}"`}
            size="lg"
            centered
            scrollAreaComponent={NativeScrollArea}
            overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
        >
            <Stack gap="lg">
                {!showOptionForm ? (
                    <>
                        <Group justify="space-between">
                            <Title order={5}>Opciones Existentes</Title>
                            <Button leftSection={<IconPlus size={16} />} onClick={handleOpenAddOptionForm} disabled={loadingOptions}>
                                Crear Nueva Opción
                            </Button>
                        </Group>

                        {loadingOptions && <Group justify="center" mt="md"><Loader /></Group>}
                        {errorOptions && !loadingOptions && <Alert title="Error" color="red" icon={<IconAlertCircle />}>{errorOptions}</Alert>}
                        {!loadingOptions && !errorOptions && modifierOptions.length === 0 && <Text c="dimmed" ta="center" mt="md">No hay opciones para este grupo.</Text>}
                        {!loadingOptions && !errorOptions && modifierOptions.length > 0 && (
                            <Table.ScrollContainer minWidth={500}>
                                <Table striped highlightOnHover withTableBorder verticalSpacing="sm">
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>Nombre (ES)</Table.Th>
                                            <Table.Th ta="right">Ajuste Precio</Table.Th>
                                            <Table.Th>Pos.</Table.Th>
                                            <Table.Th>Default</Table.Th>
                                            <Table.Th>Disponible</Table.Th>
                                            <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>{optionRows}</Table.Tbody>
                                </Table>
                            </Table.ScrollContainer>
                        )}
                    </>
                ) : (
                    <Paper withBorder p="md" radius="md">
                        <Title order={5} mb="md">{editingOption ? `Editando Opción: ${editingOption.name_es}` : "Crear Nueva Opción de Modificador"}</Title>
                        <form onSubmit={form.onSubmit(handleOptionFormSubmit)}>
                            <Stack gap="sm">
                                <TextInput label="Nombre (ES)" required {...form.getInputProps('name_es')} disabled={isSubmittingOptionForm} />
                                <TextInput label="Nombre (EN)" {...form.getInputProps('name_en')} disabled={isSubmittingOptionForm} />
                                <NumberInput
                                    label="Ajuste de Precio (€)"
                                    description="Positivo para aumentar, negativo para disminuir, 0 sin cambio."
                                    decimalScale={2}
                                    fixedDecimalScale 
                                    step={0.10}
                                    leftSection={<IconCurrencyEuro size={16} />}
                                    {...form.getInputProps('priceAdjustment')}
                                    disabled={isSubmittingOptionForm}
                                />
                                <NumberInput 
                                    label="Posición (Orden)" 
                                    min={0} 
                                    step={1}
                                    allowDecimal={false}
                                    {...form.getInputProps('position')} 
                                    disabled={isSubmittingOptionForm} 
                                />
                                <Switch label="Seleccionada por Defecto" {...form.getInputProps('isDefault', { type: 'checkbox' })} disabled={isSubmittingOptionForm} />
                                <Switch label="Opción Disponible" {...form.getInputProps('isAvailable', { type: 'checkbox' })} disabled={isSubmittingOptionForm} />

                                <Group justify="flex-end" mt="md">
                                    <Button variant="default" onClick={() => { setShowOptionForm(false); setEditingOption(null); form.reset(); }} disabled={isSubmittingOptionForm}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" loading={isSubmittingOptionForm} leftSection={<IconDeviceFloppy size={16} />}>
                                        {editingOption ? "Guardar Cambios" : "Crear Opción"}
                                    </Button>
                                </Group>
                            </Stack>
                        </form>
                    </Paper>
                )}
                 <Divider mt="lg" />
                <Group justify="flex-end" mt="md">
                    <Button variant="outline" onClick={onClose}>Cerrar Gestión de Opciones</Button>
                </Group>
            </Stack>
        </Modal>
    );
};

export default ModifierOptionsManagementModal;