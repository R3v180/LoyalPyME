// filename: frontend/src/components/admin/ChangeTierModal.tsx
// Version: 1.1.2 (Fix encoding, import, comments)

import React, { useState, useEffect } from 'react';
import { Modal, Select, Button, Group, Text, Loader, Alert } from '@mantine/core';
import axiosInstance from '../../services/axiosInstance';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react';

// --- FIX: Importar Customer desde el hook correcto ---
import { Customer } from '../../hooks/useAdminCustomersData';
// --- FIN FIX ---

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
            // Establecer el valor inicial del select al nivel actual del cliente
            setSelectedTierId(customer.currentTier?.id || null); // Si no tiene tier, es null

            // La llamada GET /tiers obtiene la lista de Tiers del negocio
            axiosInstance.get<Tier[]>('/tiers') // Asume que /tiers devuelve la lista para el admin
                .then(response => {
                    const sortedTiers = response.data.sort((a, b) => a.level - b.level);
                    // Crear opciones, añadir "Sin Nivel" explícitamente
                    const availableTiers = [
                        { value: '', label: 'Quitar Nivel (Básico)'}, // Opción para poner a null
                         ...sortedTiers.map(tier => ({
                            value: tier.id,
                            label: `${tier.name} (Nivel ${tier.level})`
                        }))
                    ];
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
             // Limpiar estado al cerrar
             setSelectedTierId(null);
             setTiers([]);
             setErrorTiers(null);
        }
    }, [opened, customer]); // Depende de opened y customer

    const handleChangeTier = async () => {
        if (!customer) return;
        // Permitir enviar null si selectedTierId es '' (nuestra opción "Quitar Nivel")
        const tierIdToSend = selectedTierId === '' ? null : selectedTierId;

        // Evitar llamada si no hay cambio real
        if (tierIdToSend === (customer.currentTier?.id || null)) {
            notifications.show({title: "Sin Cambios", message: "El nivel seleccionado es el mismo que el actual.", color:'blue'});
            return;
        }

        setLoadingChange(true);
        try {
            // La ruta PUT /admin/customers/:customerId/tier actualiza el tier
            await axiosInstance.put(`/admin/customers/${customer.id}/tier`, {
                tierId: tierIdToSend // Enviar null si se seleccionó "Quitar Nivel"
            });
            notifications.show({
                title: 'Éxito', // Corregido: Éxito
                message: `Nivel cambiado correctamente para ${customer.name || customer.email}.`, // Corregido: correctamente
                color: 'green',
                icon: <IconCheck size={18} />,
            });
            onSuccess(); // Refrescar datos en la página principal
            onClose(); // Cerrar modal
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
                        value={selectedTierId ?? ''} // Usar '' si es null para que coincida con la opción "Quitar Nivel"
                        onChange={(value) => setSelectedTierId(value)} // onChange devuelve string | null
                        searchable
                        nothingFoundMessage="No hay niveles disponibles o no se encontraron."
                        // No es estrictamente required si queremos permitir quitar el nivel
                        // required
                        disabled={loadingTiers || loadingChange}
                        mb="md"
                    />
                    <Group justify="flex-end" mt="lg">
                        <Button variant="default" onClick={onClose} disabled={loadingChange}>Cancelar</Button>
                        <Button
                            onClick={handleChangeTier}
                            loading={loadingChange}
                            // Deshabilitar si no se ha cargado, o si el valor seleccionado es el mismo que el actual
                            disabled={loadingTiers || (selectedTierId ?? '') === (customer.currentTier?.id || '')}
                        >
                            Cambiar Nivel
                        </Button>
                    </Group>
                </>
            )}
             {!loadingTiers && !errorTiers && !customer && (
                 <Text c="dimmed">No se ha seleccionado ningún cliente.</Text> // Corregido: ningún
             )}
        </Modal>
    );
};

export default ChangeTierModal;

// End of File: frontend/src/components/admin/ChangeTierModal.tsx