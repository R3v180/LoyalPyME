// filename: frontend/src/components/admin/tiers/DeleteTierModal.tsx
// Version: 1.0.1 (Fix character encoding)

import React from 'react';
import { Modal, Text, Button, Group } from '@mantine/core';

// --- Props del Componente ---
interface DeleteTierModalProps {
    opened: boolean;            // Si el modal está abierto
    onClose: () => void;        // Función para cerrar el modal
    onConfirm: () => void;      // Función a llamar al confirmar la eliminación
    tierName?: string | null;   // Nombre del tier a eliminar (opcional, para mostrar)
    loading?: boolean;          // Estado de carga opcional para deshabilitar botones
}
// --- Fin Props ---

const DeleteTierModal: React.FC<DeleteTierModalProps> = ({ opened, onClose, onConfirm, tierName, loading }) => {
    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="Confirmar Eliminación" // Corregido: Eliminación
            centered
            size="sm"
            overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
        >
            <Text size="sm">
                ¿Estás seguro de que quieres eliminar el nivel {/* Corregido: Estás */}
                {tierName ? ` "${tierName}"` : ' seleccionado'}?
                Esta acción no se puede deshacer. {/* Corregido: acción */}
            </Text>
            <Group justify="flex-end" mt="lg">
                <Button variant="default" onClick={onClose} disabled={loading}>
                    Cancelar
                </Button>
                <Button color="red" onClick={onConfirm} loading={loading}>
                    Eliminar Nivel
                </Button>
            </Group>
        </Modal>
    );
};

export default DeleteTierModal;

// End of File: frontend/src/components/admin/tiers/DeleteTierModal.tsx