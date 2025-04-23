// File: frontend/src/components/admin/tiers/DeleteTierModal.tsx
// Version: 1.0.0 (Modal component for confirming Tier deletion)

import React from 'react';
import { Modal, Text, Button, Group } from '@mantine/core';

// --- Props del Componente ---
interface DeleteTierModalProps {
    opened: boolean;                // Si el modal está abierto
    onClose: () => void;            // Función para cerrar el modal
    onConfirm: () => void;          // Función a llamar al confirmar la eliminación
    tierName?: string | null;       // Nombre del tier a eliminar (opcional, para mostrar)
    // Podríamos añadir un prop 'loading' si la operación tarda
    // loading?: boolean;
}
// --- Fin Props ---

const DeleteTierModal: React.FC<DeleteTierModalProps> = ({ opened, onClose, onConfirm, tierName/*, loading*/ }) => {
    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="Confirmar Eliminación"
            centered
            size="sm"
            overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
        >
            <Text size="sm">
                ¿Estás seguro de que quieres eliminar el nivel
                {tierName ? ` "${tierName}"` : ' seleccionado'}?
                Esta acción no se puede deshacer.
            </Text>
            <Group justify="flex-end" mt="lg">
                <Button variant="default" onClick={onClose} /*disabled={loading}*/>
                    Cancelar
                </Button>
                <Button color="red" onClick={onConfirm} /*loading={loading}*/>
                    Eliminar Nivel
                </Button>
            </Group>
        </Modal>
    );
};

export default DeleteTierModal;

// End of File: frontend/src/components/admin/tiers/DeleteTierModal.tsx