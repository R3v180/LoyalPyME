// filename: frontend/src/components/admin/ChangeTierModal.tsx
// Version: 1.1.1 (Fix: Use PUT method and correct path for changing tier)

import React, { useState, useEffect } from 'react';
import { Modal, Select, Button, Group, Text, Loader, Alert } from '@mantine/core';
import axiosInstance from '../../services/axiosInstance';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react';

// Importar Customer desde la ubicación correcta (el hook)
import { Customer } from '../../hooks/useAdminCustomers'; // Ruta actualizada

// Interfaz para los Tiers/Niveles obtenidos de la API
interface Tier {
    id: string;
    name: string;
    level: number;
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
            setSelectedTierId(customer.currentTier?.id || null);

            // La llamada GET /tiers ya debería funcionar por la corrección anterior
            axiosInstance.get<Tier[]>('/tiers')
                .then(response => {
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
             setSelectedTierId(null);
             setTiers([]);
             setErrorTiers(null); // Limpiar error al cerrar
        }
    }, [opened, customer]);

    const handleChangeTier = async () => {
        if (!customer || !selectedTierId) return;
        setLoadingChange(true);
        try {
            // --- CORRECCIÓN: Cambiar método a PUT y ruta a /tier ---
            await axiosInstance.put(`/admin/customers/${customer.id}/tier`, {
                tierId: selectedTierId // El backend espera 'tierId' en el body según definimos antes
            });
            // --- FIN CORRECCIÓN ---
            notifications.show({
                title: 'Éxito',
                message: `Nivel cambiado correctamente para ${customer.name || customer.email}.`,
                color: 'green',
                icon: <IconCheck size={18} />,
            });
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Error changing tier:", error);
            notifications.show({
                title: 'Error',
                message: `No se pudo cambiar el nivel: ${error.response?.data?.message || error.message}`,
                color: 'red',
                icon: <IconX size={18} />, // Mantener IconX para errores
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
                        disabled={tiers.length === 0 || loadingChange} // Deshabilitar si carga o si no hay tiers
                        mb="md"
                    />
                    <Group justify="flex-end" mt="lg">
                        <Button variant="default" onClick={onClose} disabled={loadingChange}>Cancelar</Button>
                        <Button
                            onClick={handleChangeTier}
                            loading={loadingChange}
                            disabled={!selectedTierId || selectedTierId === (customer.currentTier?.id || null) || loadingTiers} // Deshabilitar si no se selecciona, es el mismo, o aún cargan tiers
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