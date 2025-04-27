// filename: frontend/src/components/admin/AssignRewardModal.tsx
// Version: 1.1.0 (Fix: Update Customer import path)

import React, { useState, useEffect } from 'react';
import { Modal, Select, Button, Group, Text, Loader, Alert } from '@mantine/core';
import axiosInstance from '../../services/axiosInstance';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react';

// Importar Customer desde la ubicación correcta (el hook)
import { Customer } from '../../hooks/useAdminCustomers'; // <-- Ruta actualizada

// Interfaz para las recompensas obtenidas de la API
interface Reward {
    id: string;
    name: string;
    pointsRequired: number;
    description?: string | null;
    // Añade otros campos si son necesarios para la lógica de asignación
}

interface AssignRewardModalProps {
    opened: boolean;
    onClose: () => void;
    customer: Customer | null;
    onSuccess: () => void; // Callback (actualmente no refresca, ver nota)
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
            setSelectedRewardId(null); // Resetear selección
            axiosInstance.get<Reward[]>('/rewards') // Asume endpoint /api/rewards para obtener todas las recompensas
                .then(response => {
                    const availableRewards = response.data.map(reward => ({
                        value: reward.id,
                        label: `${reward.name} (${reward.pointsRequired} pts)`
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
        }
    }, [opened]);

    const handleAssign = async () => {
        if (!customer || !selectedRewardId) return;
        setLoadingAssign(true);
        try {
            // Endpoint para que el admin asigne una recompensa como regalo
            await axiosInstance.post(`/admin/customers/${customer.id}/grant-reward`, {
                rewardId: selectedRewardId
            });
            notifications.show({
                title: 'Éxito',
                message: `Recompensa asignada correctamente a ${customer.name || customer.email}.`,
                color: 'green',
                icon: <IconCheck size={18} />,
            });
            onSuccess(); // Llama al callback (actualmente no hace nada en la página)
            onClose(); // Cierra el modal
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
                        disabled={rewards.length === 0} // Deshabilitar si no hay recompensas
                        mb="md"
                    />
                    <Group justify="flex-end" mt="lg">
                        <Button variant="default" onClick={onClose} disabled={loadingAssign}>Cancelar</Button>
                        <Button onClick={handleAssign} loading={loadingAssign} disabled={!selectedRewardId}>
                            Asignar Recompensa
                        </Button>
                    </Group>
                </>
            )}
             {!loadingRewards && !errorRewards && !customer && (
                 <Text c="dimmed">No se ha seleccionado ningún cliente.</Text>
             )}
        </Modal>
    );
};

export default AssignRewardModal;