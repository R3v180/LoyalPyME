// filename: frontend/src/components/admin/CustomerDetailsModal.tsx
// Version: 1.2.0 (Enable editing and saving adminNotes)

import React, { useState, useEffect } from 'react'; // Importar useState, useEffect
import {
    Modal, LoadingOverlay, Alert, Text, Group, Badge, Divider, Stack, ScrollArea,
    Textarea, Button // Añadir Button
} from '@mantine/core';
import { IconAlertCircle, IconDeviceFloppy } from '@tabler/icons-react'; // Añadir IconDeviceFloppy

// Interfaz CustomerDetails (sin cambios)
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

// Props del Modal actualizadas
interface CustomerDetailsModalProps {
    opened: boolean;
    onClose: () => void;
    customerDetails: CustomerDetails | null;
    isLoading: boolean; // Carga de los detalles iniciales
    error: string | null; // Error al cargar detalles
    // --- Nueva Prop ---
    // Callback que se llamará al pulsar Guardar. Debe devolver una promesa
    // para que el modal sepa cuándo terminar el estado de carga del botón.
    onSaveNotes: (notes: string | null) => Promise<void>;
}

const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
    opened,
    onClose,
    customerDetails,
    isLoading,
    error,
    onSaveNotes // <-- Recibir nueva prop
}) => {

    // --- NUEVO ESTADO LOCAL ---
    const [editedNotes, setEditedNotes] = useState<string>(''); // Estado para el contenido del textarea
    const [isSaving, setIsSaving] = useState<boolean>(false); // Estado de carga para el botón Guardar
    // ------------------------

    // Efecto para inicializar/resetear las notas editables cuando cambian los detalles o se abre/cierra el modal
    useEffect(() => {
        if (opened && customerDetails) {
            // Inicializa el editor con las notas actuales cuando se abre/cargan datos
            setEditedNotes(customerDetails.adminNotes || '');
        }
        // Resetear si se cierra (opcional, onClose del padre ya limpia selectedCustomerDetails)
        // if (!opened) {
        //   setEditedNotes('');
        // }
    }, [opened, customerDetails]); // Depende de opened y de los detalles cargados

    const formatDate = (dateString: string | null | undefined) => {
        // ... (función sin cambios)
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', });
        } catch { return 'Fecha inválida'; }
    };

    const modalTitle = `Detalles de ${customerDetails?.name || customerDetails?.email || 'Cliente'}`;

    // --- NUEVO HANDLER para Guardar ---
    const handleSave = async () => {
        if (!customerDetails) return; // No debería pasar si el modal está abierto con datos
        setIsSaving(true); // Activar estado de carga del botón
        try {
            // Llama al callback pasado por el padre, pasando el contenido actual del editor
            // Pasa null si el texto está vacío después de quitar espacios al inicio/final
            await onSaveNotes(editedNotes.trim() ? editedNotes.trim() : null);
            // La notificación de éxito/error y el cierre del modal lo maneja el padre (AdminCustomerManagementPage)
            // tras resolver la promesa de onSaveNotes.
        } catch (saveError) {
            // El padre ya muestra notificación, aquí solo logueamos por si acaso
            console.error("Error during save callback execution in modal:", saveError);
        } finally {
            setIsSaving(false); // Desactivar estado de carga del botón
        }
    };
    // ----------------------------------

    return (
        <Modal opened={opened} onClose={onClose} title={modalTitle} size="lg" centered scrollAreaComponent={ScrollArea.Autosize} >
            {/* LoadingOverlay y Alert sin cambios */}
            <LoadingOverlay visible={isLoading && !opened} /* Modificado: solo visible si carga ANTES de abrir? O mantener como estaba? -> isLoading */ zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
             {error && !isLoading && ( <Alert icon={<IconAlertCircle size="1rem" />} title="Error al Cargar Detalles" color="red"> {error} </Alert> )}

            {!isLoading && !error && customerDetails && (
                <Stack gap="sm">
                    {/* ... Campos de solo lectura sin cambios ... */}
                    <Group justify="space-between"> <Text fw={500}>Email:</Text> <Text>{customerDetails.email}</Text> </Group>
                    <Group justify="space-between"> <Text fw={500}>Nombre:</Text> <Text>{customerDetails.name || '-'}</Text> </Group>
                    <Divider my="xs" />
                    <Group justify="space-between"> <Text fw={500}>Puntos Actuales:</Text> <Text fw={700} c="blue">{customerDetails.points}</Text> </Group>
                    <Group justify="space-between"> <Text fw={500}>Nivel Actual:</Text> <Badge color={customerDetails.currentTier ? 'teal' : 'gray'} variant="light"> {customerDetails.currentTier?.name || 'Básico'} </Badge> </Group>
                    {customerDetails.currentTier?.description && ( <Text size="sm" c="dimmed"> {customerDetails.currentTier.description} </Text> )}
                    <Group justify="space-between"> <Text fw={500}>Nivel Conseguido:</Text> <Text>{formatDate(customerDetails.tierAchievedAt)}</Text> </Group>
                    <Divider my="xs" />
                    <Group justify="space-between"> <Text fw={500}>Estado:</Text> <Badge color={customerDetails.isActive ? 'green' : 'red'} variant="filled"> {customerDetails.isActive ? 'Activo' : 'Inactivo'} </Badge> </Group>
                    <Group justify="space-between"> <Text fw={500}>Favorito:</Text> <Text>{customerDetails.isFavorite ? 'Sí' : 'No'}</Text> </Group>
                    <Group justify="space-between"> <Text fw={500}>Fecha Registro:</Text> <Text>{formatDate(customerDetails.createdAt)}</Text> </Group>


                    {/* --- Sección de Notas (Ahora Editable) --- */}
                    <Divider my="sm" />
                    <Textarea
                        label="Notas del Administrador"
                        placeholder="Añadir notas internas sobre este cliente..."
                        value={editedNotes} // Conectado al estado local editable
                        onChange={(event) => setEditedNotes(event.currentTarget.value)} // Actualiza estado local
                        minRows={4} // Aumentamos un poco
                        autosize
                        disabled={isSaving} // Deshabilitado mientras guarda
                    />
                    {/* --- Botón de Guardar --- */}
                    <Group justify="flex-end" mt="md">
                        <Button
                            variant="filled"
                            onClick={handleSave}
                            loading={isSaving} // Estado de carga del botón
                            leftSection={<IconDeviceFloppy size={16} />}
                            // Deshabilitar si las notas no han cambiado respecto al original
                            disabled={editedNotes === (customerDetails.adminNotes || '')}
                        >
                            Guardar Notas
                        </Button>
                    </Group>
                    {/* ----------------------- */}

                </Stack>
            )}
             {!isLoading && !error && !customerDetails && ( <Text c="dimmed">No se encontraron detalles para este cliente.</Text> )}
        </Modal>
    );
};

export default CustomerDetailsModal;