// filename: frontend/src/components/admin/ChangeTierModal.tsx
// Version: 1.1.0 (Fix: Update Customer import path)

import React, { useState, useEffect } from 'react';
import { Modal, Select, Button, Group, Text, Loader, Alert } from '@mantine/core';
import axiosInstance from '../../services/axiosInstance';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react';

// Importar Customer desde la ubicación correcta (el hook)
import { Customer } from '../../hooks/useAdminCustomers'; // <-- Ruta actualizada

// Interfaz para los Tiers/Niveles obtenidos de la API
interface Tier {
    id: string;
    name: string;
    level: number; // Asumiendo que el nivel se usa para ordenar o mostrar
    // Otros campos si son necesarios
}

interface ChangeTierModalProps {
    opened: boolean;
    onClose: () => void;
    customer: Customer | null;
    onSuccess: () => void; // Callback para refrescar datos
}

const ChangeTierModal: React.FC<ChangeTierModalProps> = ({ opened, onClose, customer, onSuccess }) => {
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
            // Inicializar con el nivel actual del cliente si está disponible
            setSelectedTierId(customer.currentTier?.id || null);

            axiosInstance.get<Tier[]>('/tiers') // Asume endpoint /api/tiers para obtener todos los niveles
                .then(response => {
                    // Ordenar tiers por nivel para el Select
                    const sortedTiers = response.data.sort((a, b) => a.level - b.level);
                    const availableTiers = sortedTiers.map(tier => ({
                        value: tier.id,
                        label: `${tier.name} (Nivel ${tier.level})`
                    }));
                    setTiers(availableTiers);
                })
                .catch(err => {
                    console.error("Error fetching tiers for modal:", err);
                    setErrorTiers(`No se pudieron cargar los niveles: ${err.response?.data?.message || err.message}`);
                })
                .finally(() => {
                    setLoadingTiers(false);
                });
        } else if (!opened) {
             // Resetear estado si el modal se cierra
             setSelectedTierId(null);
             setTiers([]);
        }
    }, [opened, customer]);

    const handleChangeTier = async () => {
        if (!customer || !selectedTierId) return;
        setLoadingChange(true);
        try {
            // Endpoint para que el admin cambie manualmente el nivel de un cliente
            await axiosInstance.patch(`/admin/customers/${customer.id}/change-tier`, {
                newTierId: selectedTierId
            });
            notifications.show({
                title: 'Éxito',
                message: `Nivel cambiado correctamente para ${customer.name || customer.email}.`,
                color: 'green',
                icon: <IconCheck size={18} />,
            });
            onSuccess(); // Llama al callback para refrescar
            onClose(); // Cierra el modal
        } catch (error: any) {
            console.error("Error changing tier:", error);
            notifications.show({
                title: 'Error',
                message: `No se pudo cambiar el nivel: ${error.response?.data?.message || error.message}`,
                color: 'red',
                icon: <IconX size={18} />,
            });
        } finally {
            setLoadingChange(false);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={`Cambiar Nivel Manualmente para ${customer?.name || customer?.email || 'Cliente'}`}
            centered
        >
             {customer && <Text size="sm" mb="xs">Nivel actual: {customer.currentTier?.name || 'Básico'}</Text>}

            {loadingTiers && <Group justify="center"><Loader /></Group>}
            {errorTiers && !loadingTiers && (
                <Alert title="Error Cargando Niveles" color="red" icon={<IconAlertCircle />}>
                    {errorTiers}
                </Alert>
            )}
            {!loadingTiers && !errorTiers && customer && (
                <>
                    <Select
                        label="Selecciona el Nuevo Nivel"
                        placeholder="Elige un nivel de la lista"
                        data={tiers}
                        value={selectedTierId}
                        onChange={setSelectedTierId}
                        searchable
                        nothingFoundMessage="No hay niveles disponibles o no se encontraron."
                        required
                        disabled={tiers.length === 0} // Deshabilitar si no hay niveles
                        mb="md"
                    />
                    <Group justify="flex-end" mt="lg">
                        <Button variant="default" onClick={onClose} disabled={loadingChange}>Cancelar</Button>
                        <Button
                            onClick={handleChangeTier}
                            loading={loadingChange}
                            disabled={!selectedTierId || selectedTierId === (customer.currentTier?.id || null)} // Deshabilitar si no se selecciona o es el mismo nivel
                        >
                            Cambiar Nivel
                        </Button>
                    </Group>
                </>
            )}
             {!loadingTiers && !errorTiers && !customer && (
                 <Text c="dimmed">No se ha seleccionado ningún cliente.</Text>
             )}
        </Modal>
    );
};

export default ChangeTierModal;