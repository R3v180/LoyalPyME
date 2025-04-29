// filename: frontend/src/components/admin/CustomerDetailsModal.tsx
// Version: 1.2.1 (Fix encoding, clean comments)

import React, { useState, useEffect } from 'react';
import {
    Modal, LoadingOverlay, Alert, Text, Group, Badge, Divider, Stack, ScrollArea,
    Textarea, Button
} from '@mantine/core';
import { IconAlertCircle, IconDeviceFloppy } from '@tabler/icons-react';

// Interfaz CustomerDetails (Considerar mover a /types/)
export interface CustomerDetails {
    id: string;
    email: string;
    name?: string | null;
    points: number;
    createdAt: string;
    isActive: boolean;
    isFavorite?: boolean | null;
    tierAchievedAt?: string | null;
    adminNotes?: string | null;
    businessId: string;
    role: string;
    currentTier?: {
        id: string;
        name: string;
        level: number;
        description?: string | null;
    } | null;
}

// Props del Modal
interface CustomerDetailsModalProps {
    opened: boolean;
    onClose: () => void;
    customerDetails: CustomerDetails | null;
    isLoading: boolean; // Carga de los detalles iniciales
    error: string | null; // Error al cargar detalles
    // Callback que se llamará al pulsar Guardar. Debe devolver una promesa
    onSaveNotes: (notes: string | null) => Promise<void>;
}

const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
    opened,
    onClose,
    customerDetails,
    isLoading,
    error,
    onSaveNotes
}) => {

    const [editedNotes, setEditedNotes] = useState<string>(''); // Estado para el contenido del textarea
    const [isSaving, setIsSaving] = useState<boolean>(false); // Estado de carga para el botón Guardar

    // Efecto para inicializar/resetear las notas editables
    useEffect(() => {
        if (opened && customerDetails) {
            // Inicializa el editor con las notas actuales
            setEditedNotes(customerDetails.adminNotes || '');
        }
        // No es necesario resetear al cerrar si el padre limpia el `customerDetails` prop
    }, [opened, customerDetails]);

    // Función para formatear fechas (sin cambios)
    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', });
        } catch { return 'Fecha inválida'; } // Corregido: inválida
    };

    const modalTitle = `Detalles de ${customerDetails?.name || customerDetails?.email || 'Cliente'}`;

    // Handler para Guardar Notas
    const handleSave = async () => {
        if (!customerDetails) return;
        setIsSaving(true);
        try {
            // Llama al callback, pasa null si el texto está vacío tras trim()
            await onSaveNotes(editedNotes.trim() ? editedNotes.trim() : null);
            // Notificación y cierre los maneja el componente padre
        } catch (saveError) {
            console.error("Error during save callback execution in modal:", saveError);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title={modalTitle} size="lg" centered scrollAreaComponent={ScrollArea.Autosize} >
            {/* Overlay y Alert sin cambios */}
            <LoadingOverlay visible={isLoading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
             {error && !isLoading && ( <Alert icon={<IconAlertCircle size="1rem" />} title="Error al Cargar Detalles" color="red"> {error} </Alert> )}

            {!isLoading && !error && customerDetails && (
                <Stack gap="sm">
                    {/* Campos de solo lectura */}
                    <Group justify="space-between"> <Text fw={500}>Email:</Text> <Text>{customerDetails.email}</Text> </Group>
                    <Group justify="space-between"> <Text fw={500}>Nombre:</Text> <Text>{customerDetails.name || '-'}</Text> </Group>
                    <Divider my="xs" />
                    <Group justify="space-between"> <Text fw={500}>Puntos Actuales:</Text> <Text fw={700} c="blue">{customerDetails.points}</Text> </Group>
                    <Group justify="space-between"> <Text fw={500}>Nivel Actual:</Text> <Badge color={customerDetails.currentTier ? 'teal' : 'gray'} variant="light"> {customerDetails.currentTier?.name || 'Básico'} </Badge> </Group>
                    {customerDetails.currentTier?.description && ( <Text size="sm" c="dimmed"> {customerDetails.currentTier.description} </Text> )}
                    <Group justify="space-between"> <Text fw={500}>Nivel Conseguido:</Text> <Text>{formatDate(customerDetails.tierAchievedAt)}</Text> </Group>
                    <Divider my="xs" />
                    <Group justify="space-between"> <Text fw={500}>Estado:</Text> <Badge color={customerDetails.isActive ? 'green' : 'red'} variant="filled"> {customerDetails.isActive ? 'Activo' : 'Inactivo'} </Badge> </Group>
                    <Group justify="space-between"> <Text fw={500}>Favorito:</Text> <Text>{customerDetails.isFavorite ? 'Sí' : 'No'}</Text> </Group> {/* Corregido: Sí */}
                    <Group justify="space-between"> <Text fw={500}>Fecha Registro:</Text> <Text>{formatDate(customerDetails.createdAt)}</Text> </Group>

                    {/* Notas Editables */}
                    <Divider my="sm" />
                    <Textarea
                        label="Notas del Administrador"
                        placeholder="Añadir notas internas sobre este cliente..."
                        value={editedNotes}
                        onChange={(event) => setEditedNotes(event.currentTarget.value)}
                        minRows={4}
                        autosize
                        disabled={isSaving}
                    />
                    {/* Botón de Guardar */}
                    <Group justify="flex-end" mt="md">
                        <Button
                            variant="filled"
                            onClick={handleSave}
                            loading={isSaving}
                            leftSection={<IconDeviceFloppy size={16} />}
                            // Deshabilitar si las notas no han cambiado
                            disabled={editedNotes === (customerDetails.adminNotes || '') || isSaving}
                        >
                            Guardar Notas
                        </Button>
                    </Group>

                </Stack>
            )}
             {!isLoading && !error && !customerDetails && ( <Text c="dimmed">No se encontraron detalles para este cliente.</Text> )}
        </Modal>
    );
};

export default CustomerDetailsModal;

// End of File: frontend/src/components/admin/CustomerDetailsModal.tsx