// filename: frontend/src/components/admin/CustomerDetailsModal.tsx
import React, { useState, useEffect } from 'react';
import {
    Modal, LoadingOverlay, Alert, Text, Group, Badge, Divider, Stack, ScrollArea,
    Textarea, Button
} from '@mantine/core';
import { IconAlertCircle, IconDeviceFloppy } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next'; // Importar hook

// Interfaz CustomerDetails
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
    isLoading: boolean;
    error: string | null;
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
    const { t, i18n } = useTranslation(); // Hook de traducción
    const [editedNotes, setEditedNotes] = useState<string>('');
    const [isSaving, setIsSaving] = useState<boolean>(false);

    // Efecto para inicializar/resetear las notas editables
    useEffect(() => {
        if (opened && customerDetails) {
            setEditedNotes(customerDetails.adminNotes || '');
        }
    }, [opened, customerDetails]);

    // Función para formatear fechas usando el idioma actual
    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'N/A';
        try {
            // Usar i18n.language para el locale
            return new Date(dateString).toLocaleDateString(i18n.language, { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch {
            return t('common.invalidDate', 'Fecha inválida'); // Clave i18n
        }
    };

    // Usar t() para el título del modal
    const modalTitle = t('adminCustomersPage.customerDetailsModalTitle', {
        name: customerDetails?.name || customerDetails?.email || t('common.customer', 'Cliente')
    });

    // Handler para Guardar Notas
    const handleSave = async () => {
        if (!customerDetails) return;
        setIsSaving(true);
        try {
            await onSaveNotes(editedNotes.trim() ? editedNotes.trim() : null);
            // Notificaciones y cierre los maneja el padre
        } catch (saveError) {
            console.error("Error during save callback execution in modal:", saveError);
            // El padre debería mostrar la notificación de error
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title={modalTitle} size="lg" centered scrollAreaComponent={ScrollArea.Autosize} >
            <LoadingOverlay visible={isLoading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
            {error && !isLoading && (
                // Usar t() para el título del Alert
                <Alert icon={<IconAlertCircle size="1rem" />} title={t('adminCustomersPage.customerDetailsLoadingError')} color="red">
                    {error}
                </Alert>
            )}

            {!isLoading && !error && customerDetails && (
                <Stack gap="sm">
                    {/* Usar t() para las etiquetas */}
                    <Group justify="space-between"> <Text fw={500}>{t('common.email')}:</Text> <Text>{customerDetails.email}</Text> </Group>
                    <Group justify="space-between"> <Text fw={500}>{t('common.name')}:</Text> <Text>{customerDetails.name || '-'}</Text> </Group>
                    <Divider my="xs" />
                    <Group justify="space-between"> <Text fw={500}>{t('adminCustomersPage.customerDetailsPoints')}</Text> <Text fw={700} c="blue">{customerDetails.points}</Text> </Group>
                    <Group justify="space-between"> <Text fw={500}>{t('adminCustomersPage.customerDetailsTier')}</Text> <Badge color={customerDetails.currentTier ? 'teal' : 'gray'} variant="light"> {customerDetails.currentTier?.name || t('customerDashboard.baseTier')} </Badge> </Group>
                    {customerDetails.currentTier?.description && ( <Text size="sm" c="dimmed"> {customerDetails.currentTier.description} </Text> )}
                    <Group justify="space-between"> <Text fw={500}>{t('adminCustomersPage.customerDetailsTierDate')}</Text> <Text>{formatDate(customerDetails.tierAchievedAt)}</Text> </Group>
                    <Divider my="xs" />
                    <Group justify="space-between"> <Text fw={500}>{t('adminCustomersPage.customerDetailsStatus')}</Text> <Badge color={customerDetails.isActive ? 'green' : 'red'} variant="filled"> {customerDetails.isActive ? t('common.active') : t('common.inactive')} </Badge> </Group>
                    <Group justify="space-between"> <Text fw={500}>{t('adminCustomersPage.customerDetailsFavorite')}</Text> <Text>{customerDetails.isFavorite ? t('common.yes') : t('common.no')}</Text> </Group>
                    <Group justify="space-between"> <Text fw={500}>{t('adminCustomersPage.customerDetailsRegisteredDate')}</Text> <Text>{formatDate(customerDetails.createdAt)}</Text> </Group>

                    <Divider my="sm" />
                    <Textarea
                        label={t('adminCustomersPage.customerDetailsAdminNotesLabel')}
                        placeholder={t('adminCustomersPage.customerDetailsAdminNotesPlaceholder')}
                        value={editedNotes}
                        onChange={(event) => setEditedNotes(event.currentTarget.value)}
                        minRows={4}
                        autosize
                        disabled={isSaving}
                    />
                    <Group justify="flex-end" mt="md">
                        <Button
                            variant="filled"
                            onClick={handleSave}
                            loading={isSaving}
                            leftSection={<IconDeviceFloppy size={16} />}
                            disabled={editedNotes === (customerDetails.adminNotes || '') || isSaving}
                        >
                            {t('adminCustomersPage.customerDetailsSaveNotesButton')}
                        </Button>
                    </Group>
                </Stack>
            )}
            {!isLoading && !error && !customerDetails && (
                <Text c="dimmed">{t('adminCustomersPage.customerDetailsNoDetails')}</Text>
            )}
        </Modal>
    );
};

export default CustomerDetailsModal;