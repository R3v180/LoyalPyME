// filename: frontend/src/components/admin/tiers/DeleteTierModal.tsx
import React from 'react';
import { Modal, Text, Button, Group } from '@mantine/core';
import { useTranslation } from 'react-i18next'; // Importar hook

// --- Props del Componente ---
interface DeleteTierModalProps {
    opened: boolean;
    onClose: () => void;
    onConfirm: () => void;
    tierName?: string | null;
    loading?: boolean;
}
// --- Fin Props ---

const DeleteTierModal: React.FC<DeleteTierModalProps> = ({ opened, onClose, onConfirm, tierName, loading }) => {
    const { t } = useTranslation(); // Hook de traducción

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={t('adminTiersManagePage.deleteModalTitle')} // Usar t() para el título
            centered
            size="sm"
            overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
        >
            {/* Usar t() para el mensaje, pasando el nombre del tier */}
            <Text size="sm">
                {t('adminTiersManagePage.deleteModalMessage', { name: tierName || '' })}
            </Text>
            <Group justify="flex-end" mt="lg">
                <Button variant="default" onClick={onClose} disabled={loading}>
                    {t('common.cancel')}
                </Button>
                <Button color="red" onClick={onConfirm} loading={loading}>
                    {t('adminTiersManagePage.deleteModalConfirm')}
                </Button>
            </Group>
        </Modal>
    );
};

export default DeleteTierModal;