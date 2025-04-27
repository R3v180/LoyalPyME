// filename: frontend/src/components/admin/CustomerDetailsModal.tsx
// Version: 1.0.1 (Fix: Remove unused Textarea import)

import React from 'react';
import {
    Modal, LoadingOverlay, Alert, Text, Group, Badge, Divider, Stack, ScrollArea
    // Textarea eliminado de esta línea
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

// Definición local o importada del tipo CustomerDetails
// TODO: Mover a un archivo centralizado de tipos (e.g., src/types/customer.ts)
export interface CustomerDetails {
    id: string;
    email: string;
    name?: string | null;
    points: number;
    createdAt: string; // o Date si se transforma
    isActive: boolean;
    isFavorite?: boolean | null;
    tierAchievedAt?: string | null; // o Date
    // lastActivityAt?: string | null; // Si se añade en backend
    // adminNotes?: string | null;   // Si se añade en backend
    businessId: string;
    role: string; // Debería ser 'CUSTOMER_FINAL'
    currentTier?: {
        id: string;
        name: string;
        level: number;
        description?: string | null;
    } | null;
}


interface CustomerDetailsModalProps {
    opened: boolean;
    onClose: () => void;
    customerDetails: CustomerDetails | null; // Los detalles a mostrar
    isLoading: boolean; // Para mostrar overlay de carga
    error: string | null; // Para mostrar mensaje de error
}

const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
    opened,
    onClose,
    customerDetails,
    isLoading,
    error
}) => {

    // Formatear fechas (opcional, pero mejora la legibilidad)
    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleString('es-ES', {
                day: '2-digit', month: '2-digit', year: 'numeric',
             });
        } catch { return 'Fecha inválida'; }
    };

    // Determinar título dinámicamente
    const modalTitle = `Detalles de ${customerDetails?.name || customerDetails?.email || 'Cliente'}`;

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={modalTitle}
            size="lg"
            centered
            scrollAreaComponent={ScrollArea.Autosize}
        >
            <LoadingOverlay visible={isLoading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

            {error && !isLoading && (
                <Alert icon={<IconAlertCircle size="1rem" />} title="Error al Cargar Detalles" color="red">
                    {error}
                </Alert>
            )}

            {!isLoading && !error && customerDetails && (
                <Stack gap="sm">
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
                    {/* Sección Notas Comentada
                    <Divider my="xs" label="Notas del Administrador" labelPosition="center" />
                    <Textarea placeholder="Añadir notas..." readOnly minRows={3}/>
                    */}
                </Stack>
            )}
             {!isLoading && !error && !customerDetails && ( <Text c="dimmed">No se encontraron detalles para este cliente.</Text> )}
        </Modal>
    );
};

export default CustomerDetailsModal;