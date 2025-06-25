// frontend/src/components/admin/ChangeTierModal.tsx
// Version 1.1.0 (Use adminCustomerService for API call)

import React, { useState, useEffect } from 'react';
import { Modal, Select, Button, Group, Text, Loader, Alert } from '@mantine/core';
// axiosInstance ya no es necesario aquí directamente
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react';
import { Customer } from '../../hooks/useAdminCustomersData';
import { useTranslation } from 'react-i18next';

// --- NUEVO: Importar el servicio ---
import * as adminCustomerService from '../../services/adminCustomerService';
import axiosInstance from '../../../../shared/services/axiosInstance'; // Aún necesario para fetchTiers

// Interfaz para los Tiers (se mantiene igual)
interface TierOption {
    value: string;
    label: string;
}
interface TierFromApi { // Para la respuesta de la API de tiers
    id: string;
    name: string;
    level: number;
}

interface ChangeTierModalProps {
    opened: boolean;
    onClose: () => void;
    customer: Customer | null;
    onSuccess: () => void;
}

const ChangeTierModal: React.FC<ChangeTierModalProps> = ({ opened, onClose, customer, onSuccess }) => {
    const { t } = useTranslation();
    const [tiers, setTiers] = useState<TierOption[]>([]);
    const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
    const [loadingTiers, setLoadingTiers] = useState(false);
    const [loadingChange, setLoadingChange] = useState(false);
    const [errorTiers, setErrorTiers] = useState<string | null>(null);

    useEffect(() => {
        if (opened && customer) {
            setLoadingTiers(true);
            setErrorTiers(null);
            // Inicializar con el tier actual del cliente o '' para "Sin Nivel"
            setSelectedTierId(customer.currentTier?.id || '');

            axiosInstance.get<TierFromApi[]>('/tiers') // La ruta es /api/tiers (el servicio de admin para obtener todos los tiers)
                .then(response => {
                    const sortedTiers = response.data.sort((a, b) => a.level - b.level);
                    const availableTiers: TierOption[] = [
                        { value: '', label: t('adminCustomersPage.changeTierOptionNone') }, // Opción para quitar tier
                        ...sortedTiers.map(tier => ({
                            value: tier.id,
                            label: `${tier.name} (${t('adminCustomersPage.changeTierOptionLevel', { level: tier.level })})`
                        }))
                    ];
                    setTiers(availableTiers);
                })
                .catch(err => {
                    console.error("Error fetching tiers for modal:", err);
                    const apiError = err.response?.data?.message || err.message || t('common.errorUnknown');
                    setErrorTiers(t('adminCustomersPage.changeTierErrorLoadingTiers', { error: apiError }));
                })
                .finally(() => {
                    setLoadingTiers(false);
                });
        } else if (!opened) {
            // Resetear al cerrar
            setSelectedTierId(null);
            setTiers([]);
            setErrorTiers(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened, customer, t]); // t como dependencia por si las claves cambian

    const handleChangeTier = async () => {
        if (!customer) return;

        const tierIdToSend = selectedTierId === '' ? null : selectedTierId; // '' representa "Sin Nivel"

        if (tierIdToSend === (customer.currentTier?.id || null)) {
            notifications.show({
                title: t('adminCustomersPage.changeTierNoChangeTitle'),
                message: t('adminCustomersPage.changeTierNoChange'),
                color: 'blue'
            });
            return;
        }

        setLoadingChange(true);
        try {
            // --- CAMBIO: Llamar al servicio en lugar de axiosInstance directamente ---
            await adminCustomerService.changeCustomerTierApi(customer.id, tierIdToSend);
            // --- FIN CAMBIO ---

            notifications.show({
                title: t('common.success'),
                message: t('adminCustomersPage.changeTierSuccess', { name: customer.name || customer.email }),
                color: 'green',
                icon: <IconCheck size={18} />,
            });
            onSuccess(); // Refrescar datos en la página principal
            onClose();   // Cerrar el modal
        } catch (error: any) {
            console.error("Error changing tier via modal:", error);
            const apiError = error.response?.data?.message || error.message || t('common.errorUnknown');
            notifications.show({
                title: t('common.error'),
                message: t('adminCustomersPage.changeTierError', { error: apiError }),
                color: 'red',
                icon: <IconX size={18} />,
            });
        } finally {
            setLoadingChange(false);
        }
    };

    const modalTitle = t('adminCustomersPage.changeTierModalTitle', {
        name: customer?.name || customer?.email || t('common.customer')
    });
    const currentTierName = customer?.currentTier?.name || t('customerDashboard.baseTier');

    return (
        <Modal
            opened={opened}
            onClose={() => { if (!loadingChange) onClose(); }}
            title={modalTitle}
            centered
            trapFocus
            closeOnClickOutside={!loadingChange}
            closeOnEscape={!loadingChange}
        >
            {customer && (
                <Text size="sm" mb="xs">
                    {t('adminCustomersPage.changeTierCurrent', { tierName: currentTierName })}
                </Text>
            )}

            {loadingTiers && <Group justify="center"><Loader /></Group>}
            {errorTiers && !loadingTiers && (
                <Alert title={t('adminCustomersPage.changeTierLoadingErrorTitle')} color="red" icon={<IconAlertCircle />}>
                    {errorTiers}
                </Alert>
            )}

            {!loadingTiers && !errorTiers && customer && (
                <>
                    <Select
                        label={t('adminCustomersPage.changeTierSelectLabel')}
                        placeholder={t('adminCustomersPage.changeTierSelectPlaceholder')}
                        data={tiers}
                        value={selectedTierId ?? ''} // Usar '' si es null para que coincida con la opción "Sin Nivel"
                        onChange={(value) => setSelectedTierId(value)} // Select de Mantine devuelve string | null
                        searchable
                        nothingFoundMessage={t('adminCustomersPage.changeTierNotFound')}
                        disabled={loadingTiers || loadingChange || tiers.length === 0}
                        mb="md"
                        clearable={false} // La opción "Sin Nivel" maneja la "limpieza"
                    />
                    <Group justify="flex-end" mt="lg">
                        <Button variant="default" onClick={onClose} disabled={loadingChange}>
                            {t('common.cancel')}
                        </Button>
                        <Button
                            onClick={handleChangeTier}
                            loading={loadingChange}
                            disabled={loadingTiers || (selectedTierId ?? '') === (customer.currentTier?.id || '') || tiers.length === 0}
                        >
                            {t('adminCustomersPage.changeTierButton')}
                        </Button>
                    </Group>
                </>
            )}
            {!loadingTiers && !errorTiers && !customer && (
                <Text c="dimmed">{t('adminCustomersPage.noCustomerSelected')}</Text>
            )}
        </Modal>
    );
};

export default ChangeTierModal;