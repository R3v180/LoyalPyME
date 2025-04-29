// filename: frontend/src/components/admin/ChangeTierModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, Select, Button, Group, Text, Loader, Alert } from '@mantine/core';
import axiosInstance from '../../services/axiosInstance';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react';
import { Customer } from '../../hooks/useAdminCustomersData';
import { useTranslation } from 'react-i18next'; // Importar hook

// Interfaz para los Tiers/Niveles obtenidos de la API
interface Tier {
    id: string;
    name: string;
    level: number; // Útil para ordenar o mostrar
}

interface ChangeTierModalProps {
    opened: boolean;
    onClose: () => void;
    customer: Customer | null;
    onSuccess: () => void; // Callback para refrescar datos
}

const ChangeTierModal: React.FC<ChangeTierModalProps> = ({ opened, onClose, customer, onSuccess }) => {
    const { t } = useTranslation(); // Hook de traducción
    const [tiers, setTiers] = useState<{ value: string; label: string }[]>([]);
    const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
    const [loadingTiers, setLoadingTiers] = useState(false);
    const [loadingChange, setLoadingChange] = useState(false);
    const [errorTiers, setErrorTiers] = useState<string | null>(null);

    // Cargar niveles disponibles cuando se abre el modal
    useEffect(() => {
        if (opened && customer) {
            setLoadingTiers(true);
            setErrorTiers(null);
            setSelectedTierId(customer.currentTier?.id || null);

            axiosInstance.get<Tier[]>('/tiers')
                .then(response => {
                    const sortedTiers = response.data.sort((a, b) => a.level - b.level);
                    // Usar t() para las opciones
                    const availableTiers = [
                        { value: '', label: t('adminCustomersPage.changeTierOptionNone') },
                        ...sortedTiers.map(tier => ({
                            value: tier.id,
                            // Usar t() para el formato del nivel
                            label: `${tier.name} (${t('adminCustomersPage.changeTierOptionLevel', 'Nivel {{level}}', { level: tier.level })})`
                        }))
                    ];
                    setTiers(availableTiers);
                })
                .catch(err => {
                    console.error("Error fetching tiers for modal:", err);
                    const apiError = err.response?.data?.message || err.message || t('common.errorUnknown');
                    // Usar t() para el mensaje de error
                    setErrorTiers(t('adminCustomersPage.changeTierErrorLoadingTiers', 'No se pudieron cargar los niveles: {{error}}', { error: apiError }));
                })
                .finally(() => {
                    setLoadingTiers(false);
                });
        } else if (!opened) {
            setSelectedTierId(null);
            setTiers([]);
            setErrorTiers(null);
        }
     // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened, customer]); // t() no necesita ser dependencia si las claves no cambian dinámicamente

    const handleChangeTier = async () => {
        if (!customer) return;
        const tierIdToSend = selectedTierId === '' ? null : selectedTierId;

        if (tierIdToSend === (customer.currentTier?.id || null)) {
            notifications.show({
                title: t('adminCustomersPage.changeTierNoChangeTitle', "Sin Cambios"), // Nueva clave
                message: t('adminCustomersPage.changeTierNoChange'),
                color:'blue'
            });
            return;
        }

        setLoadingChange(true);
        try {
            await axiosInstance.put(`/admin/customers/${customer.id}/tier`, { tierId: tierIdToSend });
            notifications.show({
                title: t('common.success'),
                message: t('adminCustomersPage.changeTierSuccess', { name: customer.name || customer.email }),
                color: 'green',
                icon: <IconCheck size={18} />,
            });
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Error changing tier:", error);
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
        name: customer?.name || customer?.email || t('common.customer', 'Cliente')
    });
    const currentTierName = customer?.currentTier?.name || t('customerDashboard.baseTier');

    return (
        <Modal opened={opened} onClose={onClose} title={modalTitle} centered>
            {customer && <Text size="sm" mb="xs">{t('adminCustomersPage.changeTierCurrent', { tierName: currentTierName })}</Text>}

            {loadingTiers && <Group justify="center"><Loader /></Group>}
            {errorTiers && !loadingTiers && (
                // Usar t() para el título del Alert
                <Alert title={t('adminCustomersPage.changeTierLoadingErrorTitle', 'Error Cargando Niveles')} color="red" icon={<IconAlertCircle />}>
                    {errorTiers}
                </Alert>
            )}
            {!loadingTiers && !errorTiers && customer && (
                <>
                    <Select
                        label={t('adminCustomersPage.changeTierSelectLabel')}
                        placeholder={t('adminCustomersPage.changeTierSelectPlaceholder')}
                        data={tiers}
                        value={selectedTierId ?? ''}
                        onChange={(value) => setSelectedTierId(value)}
                        searchable
                        nothingFoundMessage={t('adminCustomersPage.changeTierNotFound')}
                        disabled={loadingTiers || loadingChange}
                        mb="md"
                    />
                    <Group justify="flex-end" mt="lg">
                        <Button variant="default" onClick={onClose} disabled={loadingChange}>{t('common.cancel')}</Button>
                        <Button
                            onClick={handleChangeTier}
                            loading={loadingChange}
                            disabled={loadingTiers || (selectedTierId ?? '') === (customer.currentTier?.id || '')}
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