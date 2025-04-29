// filename: frontend/src/components/admin/AssignRewardModal.tsx
// Version: 1.1.4 (Fix encoding, import, comments)

import React, { useState, useEffect } from 'react';
import { Modal, Select, Button, Group, Text, Loader, Alert } from '@mantine/core';
import axiosInstance from '../../services/axiosInstance';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react';

// --- FIX: Importar Customer desde el hook correcto ---
import { Customer } from '../../hooks/useAdminCustomersData';
// --- FIN FIX ---

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
    onSuccess: () => void; // Callback para indicar éxito (podría usarse para refetch si fuera necesario)
}

const AssignRewardModal: React.FC<AssignRewardModalProps> = ({ opened, onClose, customer, onSuccess }) => {
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
            // La API devuelve objetos Reward completos
            axiosInstance.get<Reward[]>('/rewards')
                .then(response => {
                    const availableRewards = response.data.map(reward => ({
                        value: reward.id,
                        // Usar reward.pointsCost para el label
                        label: `${reward.name} (${reward.pointsCost ?? 'N/A'} pts)`
                    }));
                    setRewards(availableRewards);
                })
                .catch(err => {
                    console.error("Error fetching rewards for modal:", err);
                    setErrorRewards(`No se pudieron cargar las recompensas: ${err.response?.data?.message || err.message}`);
                })
                .finally(() => {
                    setLoadingRewards(false);
                });
        } else if (!opened) {
             // Limpiar estado al cerrar
             setSelectedRewardId(null);
             setRewards([]);
             setErrorRewards(null);
        }
    }, [opened]); // Dependencia solo de 'opened'

    // Handler para asignar
    const handleAssign = async () => {
        if (!customer || !selectedRewardId) return;
        setLoadingAssign(true);
        try {
            await axiosInstance.post(`/admin/customers/${customer.id}/assign-reward`, {
                rewardId: selectedRewardId
            });
            notifications.show({
                title: 'Éxito', // Corregido: Éxito
                message: `Recompensa asignada correctamente a ${customer.name || customer.email}.`, // Corregido: correctamente
                color: 'green',
                icon: <IconCheck size={18} />,
            });
            onSuccess(); // Llamar callback de éxito
            onClose(); // Cerrar modal
        } catch (error: any) {
            console.error("Error assigning reward:", error);
            notifications.show({
                title: 'Error',
                message: `No se pudo asignar la recompensa: ${error.response?.data?.message || error.message}`,
                color: 'red',
                icon: <IconX size={18} />,
            });
        } finally {
            setLoadingAssign(false);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={`Asignar Recompensa como Regalo a ${customer?.name || customer?.email || 'Cliente'}`}
            centered
        >
            {loadingRewards && <Group justify="center"><Loader /></Group>}
            {errorRewards && !loadingRewards && (
                <Alert title="Error Cargando Recompensas" color="red" icon={<IconAlertCircle />}>
                    {errorRewards}
                </Alert>
            )}
            {!loadingRewards && !errorRewards && customer && (
                <>
                    <Select
                        label="Selecciona una Recompensa"
                        placeholder="Elige una recompensa de la lista"
                        data={rewards}
                        value={selectedRewardId}
                        onChange={setSelectedRewardId}
                        searchable
                        nothingFoundMessage="No hay recompensas disponibles o no se encontraron."
                        required
                        disabled={rewards.length === 0 || loadingAssign}
                        mb="md"
                    />
                    <Group justify="flex-end" mt="lg">
                        <Button variant="default" onClick={onClose} disabled={loadingAssign}>Cancelar</Button>
                        <Button
                            onClick={handleAssign}
                            loading={loadingAssign}
                            disabled={!selectedRewardId || loadingRewards}
                        >
                            Asignar Recompensa
                        </Button>
                    </Group>
                </>
            )}
             {!loadingRewards && !errorRewards && !customer && (
                 <Text c="dimmed">No se ha seleccionado ningún cliente.</Text> // Corregido: ningún
             )}
        </Modal>
    );
};

export default AssignRewardModal;

// End of File: frontend/src/components/admin/AssignRewardModal.tsx