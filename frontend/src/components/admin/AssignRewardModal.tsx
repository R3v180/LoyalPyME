// frontend/src/components/admin/AssignRewardModal.tsx
// Version 1.2.0 (Use adminCustomerService for API call)

import React, { useState, useEffect } from 'react';
import { Modal, Select, Button, Group, Text, Loader, Alert } from '@mantine/core';
// axiosInstance ya no se usa aquí para la acción principal
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react';
import type { Customer } from '../../hooks/useAdminCustomersData';
import { useTranslation } from 'react-i18next';

// --- NUEVO: Importar el servicio ---
import * as adminCustomerService from '../../services/adminCustomerService';
import axiosInstance from '../../services/axiosInstance'; // Aún necesario para fetchRewards

// Importar el tipo Reward de nuestro archivo centralizado
import type { Reward } from '../../types/customer';

interface AssignRewardModalProps {
    opened: boolean;
    onClose: () => void;
    customer: Customer | null;
    onSuccess: () => void; // Para refrescar la lista de clientes o detalles si es necesario
}

const AssignRewardModal: React.FC<AssignRewardModalProps> = ({ opened, onClose, customer, onSuccess }) => {
    const { t, i18n } = useTranslation();
    const currentLanguage = i18n.language;

    const [rewards, setRewards] = useState<{ value: string; label: string }[]>([]);
    const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
    const [loadingRewards, setLoadingRewards] = useState(false);
    const [loadingAssign, setLoadingAssign] = useState(false);
    const [errorRewards, setErrorRewards] = useState<string | null>(null);

    useEffect(() => {
        if (opened && customer) {
            setLoadingRewards(true);
            setErrorRewards(null);
            setSelectedRewardId(null); // Resetear selección al abrir

            // La API /rewards devuelve todos, filtramos las activas en el frontend para este modal
            axiosInstance.get<Reward[]>('/rewards')
                .then(response => {
                    const activeRewards = response.data?.filter(r => r.isActive) ?? [];
                    const availableRewards = activeRewards.map(reward => {
                        const displayName = (currentLanguage === 'es' ? reward.name_es : reward.name_en) || reward.name_es || reward.name_en || `ID: ${reward.id}`;
                        return {
                            value: reward.id,
                            label: `${displayName} (${t('adminCustomersPage.assignRewardOptionPoints', { points: reward.pointsCost ?? 0 })})`
                        };
                    });
                    setRewards(availableRewards);
                })
                .catch(err => {
                    console.error("Error fetching rewards for modal:", err);
                    const apiError = err.response?.data?.message || err.message || t('common.errorUnknown');
                    setErrorRewards(t('adminCustomersPage.assignRewardErrorLoading', { error: apiError }));
                })
                .finally(() => {
                    setLoadingRewards(false);
                });
        } else if (!opened) {
            setSelectedRewardId(null);
            setRewards([]);
            setErrorRewards(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened, customer, t, currentLanguage]); // Añadir t y currentLanguage

    const handleAssign = async () => {
        if (!customer || !selectedRewardId) return;
        setLoadingAssign(true);
        try {
            // --- CAMBIO: Llamar al servicio en lugar de axiosInstance directamente ---
            await adminCustomerService.assignRewardToCustomerApi(customer.id, selectedRewardId);
            // --- FIN CAMBIO ---

            notifications.show({
                title: t('common.success'),
                message: t('adminCustomersPage.assignRewardSuccess', { name: customer.name || customer.email }),
                color: 'green',
                icon: <IconCheck size={18} />
            });
            onSuccess(); // Refrescar datos en la página principal
            onClose();   // Cerrar el modal
        } catch (error: any) {
            console.error("Error assigning reward via modal:", error);
            const apiError = error.response?.data?.message || error.message || t('common.errorUnknown');
            notifications.show({
                title: t('common.error'),
                message: t('adminCustomersPage.assignRewardError', { error: apiError }),
                color: 'red',
                icon: <IconX size={18} />
            });
        } finally {
            setLoadingAssign(false);
        }
    };

    const modalTitle = t('adminCustomersPage.assignRewardModalTitle', {
        name: customer?.name || customer?.email || t('common.customer')
    });

    return (
        <Modal
            opened={opened}
            onClose={() => { if (!loadingAssign) onClose(); }}
            title={modalTitle}
            centered
            trapFocus
            closeOnClickOutside={!loadingAssign}
            closeOnEscape={!loadingAssign}
        >
            {loadingRewards && <Group justify="center"><Loader /></Group>}
            {errorRewards && !loadingRewards && (
                <Alert title={t('adminCustomersPage.assignRewardLoadingErrorTitle')} color="red" icon={<IconAlertCircle />}>
                    {errorRewards}
                </Alert>
            )}

            {!loadingRewards && !errorRewards && customer && (
                <>
                    <Select
                        label={t('adminCustomersPage.assignRewardSelectLabel')}
                        placeholder={t('adminCustomersPage.assignRewardSelectPlaceholder')}
                        data={rewards}
                        value={selectedRewardId}
                        onChange={setSelectedRewardId}
                        searchable
                        nothingFoundMessage={rewards.length === 0 && !loadingRewards ? t('adminCustomersPage.assignRewardNotFound') : t('common.noResults')}
                        required
                        disabled={rewards.length === 0 || loadingRewards || loadingAssign}
                        mb="md"
                        data-autofocus
                    />
                    <Group justify="flex-end" mt="lg">
                        <Button variant="default" onClick={onClose} disabled={loadingAssign}>
                            {t('common.cancel')}
                        </Button>
                        <Button
                            onClick={handleAssign}
                            loading={loadingAssign}
                            disabled={!selectedRewardId || loadingRewards || rewards.length === 0}
                        >
                            {t('adminCustomersPage.assignRewardButton')}
                        </Button>
                    </Group>
                </>
            )}
            {!loadingRewards && !errorRewards && !customer && (
                <Text c="dimmed">{t('adminCustomersPage.noCustomerSelected')}</Text>
            )}
        </Modal>
    );
};

export default AssignRewardModal;