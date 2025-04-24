// filename: frontend/src/components/admin/AssignRewardModal.tsx
// Version: 1.0.2 (Use CORRECT axiosInstance import path: ../../)

import React, { useState, useEffect, FormEvent } from 'react';
import {
    Modal, Button, Stack, Select, Group, Text, LoadingOverlay, Alert, Loader
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconAlertCircle, IconGift } from '@tabler/icons-react';
// --- RUTA DE IMPORTACIÓN CORREGIDA (según tu indicación) ---
import axiosInstance from '../../services/axiosInstance';
// --------------------------------------------------------
import { AxiosResponse } from 'axios';
import { Customer } from '../../pages/admin/AdminCustomerManagementPage'; // Importar tipo Customer

// Interfaces (sin cambios)
interface RewardOption { id: string; name: string; pointsCost: number; }
interface AssignRewardModalProps { opened: boolean; onClose: () => void; customer: Customer | null; onSuccess: () => void; }

const AssignRewardModal: React.FC<AssignRewardModalProps> = ({
    opened,
    onClose,
    customer,
    onSuccess
}) => {
    const [availableRewards, setAvailableRewards] = useState<{ value: string; label: string }[]>([]);
    const [loadingRewards, setLoadingRewards] = useState<boolean>(false);
    const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // useEffect para cargar Tiers (Sin cambios funcionales, solo usa axiosInstance con path relativo a baseURL)
    useEffect(() => {
        if (opened && customer) {
            setLoadingRewards(true); setError(null); setSelectedRewardId(null);
            axiosInstance.get<RewardOption[]>('/rewards?isActive=true') // Llamada relativa a baseURL
                .then((response: AxiosResponse<RewardOption[]>) => {
                    if (!response.data || response.data.length === 0) { setError("No hay recompensas activas para asignar."); setAvailableRewards([]); return; }
                    const rewardOptions = response.data.map((reward: RewardOption) => ({ value: reward.id, label: `${reward.name} (${reward.pointsCost} pts)` }));
                    setAvailableRewards(rewardOptions);
                })
                .catch((err: any) => { console.error("Error fetching available rewards:", err); setError("Error al cargar las recompensas disponibles."); setAvailableRewards([]); })
                .finally(() => { setLoadingRewards(false); });
        } else { setAvailableRewards([]); setSelectedRewardId(null); setError(null); setIsSubmitting(false); setLoadingRewards(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened, customer]);

    // handleSubmit (Sin cambios funcionales, solo usa axiosInstance con path relativo a baseURL)
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault(); setError(null);
        if (!customer) { setError('No se ha seleccionado un cliente válido.'); return; }
        if (!selectedRewardId) { setError('Debes seleccionar una recompensa para asignar.'); return; }
        setIsSubmitting(true);
        try {
            console.log(`[AssignReward] Sending request for customer ${customer.id}: rewardId=${selectedRewardId}`);
            await axiosInstance.post(`/admin/customers/${customer.id}/assign-reward`, { rewardId: selectedRewardId }); // Llamada relativa a baseURL
            const assignedReward = availableRewards.find(r => r.value === selectedRewardId);
            const rewardName = assignedReward ? assignedReward.label.split('(')[0].trim() : 'seleccionada';
            notifications.show({ title: 'Recompensa Asignada', message: `Recompensa "${rewardName}" asignada a ${customer.name || customer.email}. El cliente ya puede canjearla.`, color: 'green', icon: <IconCheck size={18} />, autoClose: 5000, });
            onSuccess(); onClose();
        } catch (err: any) {
            console.error(`[AssignReward] Error assigning reward ${selectedRewardId} to customer ${customer?.id}:`, err);
            const errorMsg = err.response?.data?.message || `Error al asignar recompensa: ${err.message || 'Error desconocido'}`;
            setError(errorMsg); notifications.show({ title: 'Error al Asignar', message: errorMsg, color: 'red', icon: <IconX size={18} />, autoClose: 6000, });
        } finally { setIsSubmitting(false); }
    };

    if (!customer) return null;

    // JSX (sin cambios funcionales)
    return (
        <Modal opened={opened} onClose={onClose} title={`Asignar Recompensa a ${customer.name || customer.email}`} centered radius="lg" overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}>
            <LoadingOverlay visible={isSubmitting || loadingRewards} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
            <form onSubmit={handleSubmit}>
                <Stack gap="md">
                    <Text size="sm">Selecciona la recompensa que quieres regalar a este cliente. Podrá canjearla sin coste de puntos.</Text>
                    {loadingRewards && <Group justify="center" p="sm"><Loader size="sm" /> Cargando recompensas...</Group>}
                    {!loadingRewards && availableRewards.length > 0 && (
                         <Select label="Recompensa a Asignar" placeholder="Elige una recompensa..." data={availableRewards} value={selectedRewardId} onChange={setSelectedRewardId} disabled={isSubmitting || loadingRewards} required searchable nothingFoundMessage="No se encontraron recompensas activas" radius="lg" comboboxProps={{ transitionProps: { transition: 'pop', duration: 200 } }} />
                    )}
                    {!loadingRewards && availableRewards.length === 0 && !error && ( <Text c="dimmed" ta="center" size="sm">No hay recompensas activas para asignar.</Text> )}
                    {error && (<Alert title="Error" color="red" icon={<IconAlertCircle size={16}/>} radius="lg" withCloseButton onClose={() => setError(null)}>{error}</Alert>)}
                    <Group justify="flex-end" mt="md">
                        <Button variant="light" onClick={onClose} disabled={isSubmitting} radius="lg"> Cancelar </Button>
                        <Button type="submit" loading={isSubmitting} disabled={loadingRewards || !selectedRewardId || isSubmitting} radius="lg" leftSection={<IconGift size={16}/>}> Confirmar Asignación </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};

export default AssignRewardModal;