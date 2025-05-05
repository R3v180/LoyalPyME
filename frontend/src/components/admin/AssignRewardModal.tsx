// filename: frontend/src/components/admin/AssignRewardModal.tsx
// Version: 1.1.0 (Use i18n reward fields for Select options)

import React, { useState, useEffect } from 'react';
import { Modal, Select, Button, Group, Text, Loader, Alert } from '@mantine/core';
import axiosInstance from '../../services/axiosInstance';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react';
import type { Customer } from '../../hooks/useAdminCustomersData'; // Importar Customer si se usa en props
import { useTranslation } from 'react-i18next';

// --- IMPORTAR TIPO REWARD CORRECTO ---
import type { Reward } from '../../types/customer'; // Importar desde types/customer
// --- FIN IMPORTACIÓN ---


interface AssignRewardModalProps {
    opened: boolean;
    onClose: () => void;
    customer: Customer | null; // Asumiendo que Customer viene del hook o es similar a UserData
    onSuccess: () => void;
}

const AssignRewardModal: React.FC<AssignRewardModalProps> = ({ opened, onClose, customer, onSuccess }) => {
    // --- Usar t e i18n ---
    const { t, i18n } = useTranslation();
    const currentLanguage = i18n.language;
    // --- Fin ---

    const [rewards, setRewards] = useState<{ value: string; label: string }[]>([]);
    const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
    const [loadingRewards, setLoadingRewards] = useState(false);
    const [loadingAssign, setLoadingAssign] = useState(false);
    const [errorRewards, setErrorRewards] = useState<string | null>(null);

    // Cargar recompensas (Modificado para usar name_es/en)
    useEffect(() => {
        if (opened) {
            setLoadingRewards(true);
            setErrorRewards(null);
            setSelectedRewardId(null);
            // La API ahora devuelve Reward con name_es/en
            axiosInstance.get<Reward[]>('/rewards')
                .then(response => {
                    // Filtrar solo las activas aquí podría ser buena idea
                    const activeRewards = response.data?.filter(r => r.isActive) ?? [];

                    const availableRewards = activeRewards.map(reward => {
                        // --- Seleccionar nombre según idioma ---
                        const displayName = (currentLanguage === 'es' ? reward.name_es : reward.name_en) || reward.name_es || reward.name_en || `ID: ${reward.id}`;
                        // --- Fin Selección ---
                        return {
                            value: reward.id,
                            // Mostrar nombre + puntos en la etiqueta
                            label: `${displayName} (${t('adminCustomersPage.assignRewardOptionPoints', { points: reward.pointsCost ?? 'N/A' })})`
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
            // Resetear estado al cerrar
            setSelectedRewardId(null);
            setRewards([]);
            setErrorRewards(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened, customer, t, currentLanguage]); // Añadir t y currentLanguage a dependencias


    // Handler para asignar (sin cambios funcionales)
    const handleAssign = async () => {
        if (!customer || !selectedRewardId) return;
        setLoadingAssign(true);
        try {
            await axiosInstance.post(`/admin/customers/${customer.id}/assign-reward`, { rewardId: selectedRewardId });
            notifications.show({ title: t('common.success'), message: t('adminCustomersPage.assignRewardSuccess', { name: customer.name || customer.email }), color: 'green', icon: <IconCheck size={18} /> });
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Error assigning reward:", error);
            const apiError = error.response?.data?.message || error.message || t('common.errorUnknown');
            notifications.show({ title: t('common.error'), message: t('adminCustomersPage.assignRewardError', { error: apiError }), color: 'red', icon: <IconX size={18} /> });
        } finally {
            setLoadingAssign(false);
        }
    };

    // JSX (sin cambios estructurales, usa textos traducidos)
    const modalTitle = t('adminCustomersPage.assignRewardModalTitle', { name: customer?.name || customer?.email || t('common.customer', 'Cliente') });
    return (
        <Modal opened={opened} onClose={onClose} title={modalTitle} centered >
            {loadingRewards && <Group justify="center"><Loader /></Group>}
            {errorRewards && !loadingRewards && ( <Alert title={t('adminCustomersPage.assignRewardLoadingErrorTitle')} color="red" icon={<IconAlertCircle />}> {errorRewards} </Alert> )}
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
                        <Button onClick={handleAssign} loading={loadingAssign} disabled={!selectedRewardId || loadingRewards}> {t('adminCustomersPage.assignRewardButton')} </Button>
                    </Group>
                </>
            )}
            {!loadingRewards && !errorRewards && !customer && ( <Text c="dimmed">{t('adminCustomersPage.noCustomerSelected')}</Text> )}
        </Modal>
    );
};

export default AssignRewardModal;