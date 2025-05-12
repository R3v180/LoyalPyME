// frontend/src/components/admin/camarero/menu/ModifierGroupsManagementModal.tsx
import React, { useState, useEffect } from 'react';
import {
    Modal, Button, Stack, Group, Title, Text, Loader, Alert,
    Table, ActionIcon, Badge, Tooltip, TextInput, Select, NumberInput, Switch,
    Paper, Divider, NativeScrollArea
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks'; // <--- AÑADIDO useDisclosure
import { z } from 'zod';
import { 
    IconPlus, IconAlertCircle, IconPencil, IconTrash, IconDeviceFloppy, IconSettings 
} from '@tabler/icons-react';
import { useAdminModifierGroups } from '../../../../hooks/useAdminModifierGroups';
import { ModifierGroupData, ModifierGroupFormData, ModifierUiType } from '../../../../types/menu.types';
// import { notifications } from '@mantine/notifications'; // Ya no se usa aquí si el hook las maneja

// --- AÑADIR IMPORTACIÓN DEL MODAL DE OPCIONES ---
import ModifierOptionsManagementModal from './ModifierOptionsManagementModal'; 
// --- FIN IMPORTACIÓN ---


const modifierGroupSchema = z.object({
    name_es: z.string().min(1, { message: "El nombre en español es obligatorio." }),
    name_en: z.string().nullable().optional(),
    uiType: z.nativeEnum(ModifierUiType, { errorMap: () => ({ message: "Selecciona un tipo de UI válido."}) }),
    minSelections: z.number().min(0, "Debe ser 0 o más.").default(0),
    maxSelections: z.number().min(1, "Debe ser 1 o más.").default(1),
    position: z.number().min(0).default(0),
    isRequired: z.boolean().default(false),
}).refine(data => data.minSelections <= data.maxSelections, {
    message: "Mínimo no puede ser mayor que máximo.",
    path: ["maxSelections"],
});

type ModifierGroupFormValues = z.infer<typeof modifierGroupSchema>;

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

    // --- ESTADOS PARA EL MODAL DE OPCIONES ---
    const [optionsModalOpened, { open: openOptionsModal, close: closeOptionsModal }] = useDisclosure(false);
    const [selectedGroupForOptions, setSelectedGroupForOptions] = useState<ModifierGroupData | null>(null);
    // --- FIN ESTADOS MODAL OPCIONES ---

    const form = useForm<ModifierGroupFormValues>({
        initialValues: {
            name_es: '', name_en: null, uiType: ModifierUiType.RADIO,
            minSelections: 0, maxSelections: 1, position: 0, isRequired: false,
        },
        validate: zodResolver(modifierGroupSchema),
    });

    useEffect(() => {
        if (opened && menuItemId) {
            fetchModifierGroups(); 
        }
        if (!opened) {
            setShowForm(false);
            setEditingGroup(null);
            form.reset();
            // También cerrar el modal de opciones si el de grupos se cierra
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
        await deleteModifierGroup(groupId);
        setIsDeletingGroupId(null);
    };
    
    // --- ACTUALIZAR handleManageOptions ---
    const handleManageOptions = (group: ModifierGroupData) => {
        setSelectedGroupForOptions(group);
        openOptionsModal();
    };
    // --- FIN ACTUALIZACIÓN ---


    const groupRows = modifierGroups.map((group) => (
        <Table.Tr key={group.id}>
            <Table.Td>
                <Text fw={500}>{group.name_es}</Text>
                {group.name_en && <Text size="xs" c="dimmed">EN: {group.name_en}</Text>}
            </Table.Td>
            <Table.Td><Badge color="cyan" variant="light">{group.uiType}</Badge></Table.Td>
            <Table.Td>{group.minSelections} - {group.maxSelections}</Table.Td>
            <Table.Td>{group.isRequired ? 'Sí' : 'No'}</Table.Td>
            <Table.Td>{group.position}</Table.Td>
            <Table.Td>
                <Group gap="xs" justify="flex-end" wrap="nowrap">
                    <Tooltip label="Gestionar Opciones" withArrow>
                        <ActionIcon variant="subtle" color="green" onClick={() => handleManageOptions(group)} disabled={!!isDeletingGroupId}>
                            <IconSettings size={16} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Editar Grupo" withArrow>
                        <ActionIcon variant="subtle" color="blue" onClick={() => handleOpenEditForm(group)} disabled={!!isDeletingGroupId}>
                            <IconPencil size={16} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Eliminar Grupo" withArrow>
                        <ActionIcon variant="subtle" color="red" onClick={() => handleDeleteGroup(group.id)} loading={isDeletingGroupId === group.id} disabled={!!isDeletingGroupId && isDeletingGroupId !== group.id}>
                            <IconTrash size={16} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <> {/* Envolver en Fragment para el modal hermano */}
            <Modal
                opened={opened && !!menuItemId}
                onClose={onClose}
                title={`Gestionar Grupos de Modificadores para: "${menuItemName}"`}
                size="xl" 
                centered
                scrollAreaComponent={NativeScrollArea}
                overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
            >
                <Stack gap="lg">
                    {!showForm ? (
                        <>
                            <Group justify="space-between">
                                <Title order={5}>Grupos Existentes</Title>
                                <Button leftSection={<IconPlus size={16} />} onClick={handleOpenAddForm} disabled={loadingGroups}>
                                    Crear Nuevo Grupo
                                </Button>
                            </Group>

                            {loadingGroups && <Group justify="center" mt="md"><Loader /></Group>}
                            {errorGroups && !loadingGroups && <Alert title="Error" color="red" icon={<IconAlertCircle />}>{errorGroups}</Alert>}
                            {!loadingGroups && !errorGroups && modifierGroups.length === 0 && <Text c="dimmed" ta="center" mt="md">No hay grupos de modificadores para este ítem.</Text>}
                            {!loadingGroups && !errorGroups && modifierGroups.length > 0 && (
                                <Table.ScrollContainer minWidth={600}>
                                    <Table striped highlightOnHover withTableBorder verticalSpacing="sm">
                                        <Table.Thead>
                                            <Table.Tr>
                                                <Table.Th>Nombre (ES)</Table.Th>
                                                <Table.Th>Tipo UI</Table.Th>
                                                <Table.Th>Sel. (Min-Max)</Table.Th>
                                                <Table.Th>Requerido</Table.Th>
                                                <Table.Th>Pos.</Table.Th>
                                                <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                                            </Table.Tr>
                                        </Table.Thead>
                                        <Table.Tbody>{groupRows}</Table.Tbody>
                                    </Table>
                                </Table.ScrollContainer>
                            )}
                        </>
                    ) : (
                        <Paper withBorder p="md" radius="md">
                            <Title order={5} mb="md">{editingGroup ? `Editando Grupo: ${editingGroup.name_es}` : "Crear Nuevo Grupo de Modificadores"}</Title>
                            <form onSubmit={form.onSubmit(handleFormSubmit)}>
                                <Stack gap="sm">
                                    <TextInput label="Nombre (ES)" required {...form.getInputProps('name_es')} disabled={isSubmittingForm} />
                                    <TextInput label="Nombre (EN)" {...form.getInputProps('name_en')} disabled={isSubmittingForm} />
                                    <Select
                                        label="Tipo de Interfaz de Usuario (UI)"
                                        data={Object.values(ModifierUiType).map(type => ({ value: type, label: type }))}
                                        required
                                        {...form.getInputProps('uiType')}
                                        disabled={isSubmittingForm}
                                    />
                                    <Group grow>
                                        <NumberInput label="Mínimo Selecciones" min={0} {...form.getInputProps('minSelections')} disabled={isSubmittingForm} />
                                        <NumberInput label="Máximo Selecciones" min={1} {...form.getInputProps('maxSelections')} disabled={isSubmittingForm} />
                                    </Group>
                                    <NumberInput label="Posición (Orden)" min={0} {...form.getInputProps('position')} disabled={isSubmittingForm} />
                                    <Switch label="Es Requerido" {...form.getInputProps('isRequired', { type: 'checkbox' })} disabled={isSubmittingForm} />

                                    <Group justify="flex-end" mt="md">
                                        <Button variant="default" onClick={() => { setShowForm(false); setEditingGroup(null); form.reset(); }} disabled={isSubmittingForm}>
                                            Cancelar
                                        </Button>
                                        <Button type="submit" loading={isSubmittingForm} leftSection={<IconDeviceFloppy size={16} />}>
                                            {editingGroup ? "Guardar Cambios" : "Crear Grupo"}
                                        </Button>
                                    </Group>
                                </Stack>
                            </form>
                        </Paper>
                    )}
                    <Divider mt="lg" />
                    <Group justify="flex-end" mt="md">
                        <Button variant="outline" onClick={onClose}>Cerrar Gestión de Grupos</Button>
                    </Group>
                </Stack>
            </Modal>

            {/* --- RENDERIZAR MODAL DE OPCIONES --- */}
            {selectedGroupForOptions && (
                <ModifierOptionsManagementModal
                    opened={optionsModalOpened}
                    onClose={() => {
                        closeOptionsModal();
                        setSelectedGroupForOptions(null);
                        fetchModifierGroups(); // Opcional: Refrescar la lista de grupos por si algo cambió en las opciones que afecte al grupo (ej: contador de opciones)
                    }}
                    modifierGroupId={selectedGroupForOptions.id}
                    modifierGroupName={selectedGroupForOptions.name_es} // O el nombre en el idioma actual
                />
            )}
            {/* --- FIN RENDERIZAR MODAL DE OPCIONES --- */}
        </>
    );
};

export default ModifierGroupsManagementModal;