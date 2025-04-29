// filename: frontend/src/components/admin/AssignRewardModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, Select, Button, Group, Text, Loader, Alert } from '@mantine/core';
import axiosInstance from '../../services/axiosInstance';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react';
import { Customer } from '../../hooks/useAdminCustomersData';
import { useTranslation } from 'react-i18next'; // Importar hook

// Interfaz para las recompensas obtenidas de la API
interface Reward {
    id: string;
    name: string;
    pointsCost: number; // Campo necesario para el label
    description?: string | null;
}

interface AssignRewardModalProps {
    opened: boolean;
    onClose: () => void;
    customer: Customer | null;
    onSuccess: () => void;
}

const AssignRewardModal: React.FC<AssignRewardModalProps> = ({ opened, onClose, customer, onSuccess }) => {
    const { t } = useTranslation(); // Hook de traducción
    const [rewards, setRewards] = useState<{ value: string; label: string }[]>([]);
    const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
    const [loadingRewards, setLoadingRewards] = useState(false);
    const [loadingAssign, setLoadingAssign] = useState(false);
    const [errorRewards, setErrorRewards] = useState<string | null>(null);

    // Cargar recompensas disponibles cuando se abre el modal
    useEffect(() => {
        if (opened) {
            setLoadingRewards(true);
            setErrorRewards(null);
            setSelectedRewardId(null);
            axiosInstance.get<Reward[]>('/rewards')
                .then(response => {
                    // Usar t() para formatear la etiqueta de puntos
                    const availableRewards = response.data.map(reward => ({
                        value: reward.id,
                        label: `${reward.name} (${t('adminCustomersPage.assignRewardOptionPoints', '{{points}} pts', { points: reward.pointsCost ?? 'N/A' })})`
                    }));
                    setRewards(availableRewards);
                })
                .catch(err => {
                    console.error("Error fetching rewards for modal:", err);
                    const apiError = err.response?.data?.message || err.message || t('common.errorUnknown');
                    // Usar t() para el mensaje de error
                    setErrorRewards(t('adminCustomersPage.assignRewardErrorLoading', 'No se pudieron cargar las recompensas: {{error}}', { error: apiError }));
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
    }, [opened]); // t no necesita ser dependencia aquí

    // Handler para asignar
    const handleAssign = async () => {
        if (!customer || !selectedRewardId) return;
        setLoadingAssign(true);
        try {
            await axiosInstance.post(`/admin/customers/${customer.id}/assign-reward`, {
                rewardId: selectedRewardId
            });
            notifications.show({
                title: t('common.success'),
                message: t('adminCustomersPage.assignRewardSuccess', { name: customer.name || customer.email }),
                color: 'green',
                icon: <IconCheck size={18} />,
            });
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Error assigning reward:", error);
            const apiError = error.response?.data?.message || error.message || t('common.errorUnknown');
            notifications.show({
                title: t('common.error'),
                message: t('adminCustomersPage.assignRewardError', { error: apiError }),
                color: 'red',
                icon: <IconX size={18} />,
            });
        } finally {
            setLoadingAssign(false);
        }
    };

    const modalTitle = t('adminCustomersPage.assignRewardModalTitle', {
        name: customer?.name || customer?.email || t('common.customer', 'Cliente')
    });

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={modalTitle}
            centered
        >
            {loadingRewards && <Group justify="center"><Loader /></Group>}
            {errorRewards && !loadingRewards && (
                // Usar t() para el título del Alert
                <Alert title={t('adminCustomersPage.assignRewardLoadingErrorTitle', 'Error Cargando Recompensas')} color="red" icon={<IconAlertCircle />}>
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
                        nothingFoundMessage={t('adminCustomersPage.assignRewardNotFound')}
                        required
                        disabled={rewards.length === 0 || loadingAssign}
                        mb="md"
                    />
                    <Group justify="flex-end" mt="lg">
                        <Button variant="default" onClick={onClose} disabled={loadingAssign}>{t('common.cancel')}</Button>
                        <Button
                            onClick={handleAssign}
                            loading={loadingAssign}
                            disabled={!selectedRewardId || loadingRewards}
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