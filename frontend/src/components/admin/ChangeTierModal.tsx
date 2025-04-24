// filename: frontend/src/components/admin/ChangeTierModal.tsx
// Version: 1.1.1 (Fix API GET/PUT URLs - remove leading /api)

import React, { useState, useEffect, FormEvent } from 'react';
import {
    Modal, Button, Stack, Select, Group, Text, LoadingOverlay, Alert
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconAlertCircle, IconStairsUp } from '@tabler/icons-react';
import axiosInstance from '../../services/axiosInstance'; // Ruta corregida
import { AxiosResponse } from 'axios';

// Importar el tipo Customer desde la página padre
import { Customer } from '../../pages/admin/AdminCustomerManagementPage';

// Interfaz TierOption (sin cambios)
interface TierOption { id: string; name: string; level: number; }

// Props (usando Customer importado)
interface ChangeTierModalProps {
    opened: boolean;
    onClose: () => void;
    customer: Customer | null;
    onSuccess: () => void;
}

const ChangeTierModal: React.FC<ChangeTierModalProps> = ({
    opened,
    onClose,
    customer,
    onSuccess
}) => {
    const [availableTiers, setAvailableTiers] = useState<{ value: string; label: string }[]>([]);
    const [loadingTiers, setLoadingTiers] = useState<boolean>(false);
    const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Efecto para cargar los Tiers disponibles
    useEffect(() => {
        if (opened && customer) {
            setLoadingTiers(true); setError(null);

            // --- LLAMADA GET CORREGIDA: SIN /api ---
            axiosInstance.get<TierOption[]>('/tiers/tiers?includeBenefits=false') // Ruta relativa a la baseURL
            // --------------------------------------
                .then((response: AxiosResponse<TierOption[]>) => {
                    const tierOptions = [ { value: 'null', label: '(Quitar Nivel / Básico)' }, ...response.data .sort((a: TierOption, b: TierOption) => a.level - b.level) .map((tier: TierOption) => ({ value: tier.id, label: tier.name })) ];
                    setAvailableTiers(tierOptions); setSelectedTierId(customer.currentTier?.id ?? 'null');
                })
                .catch((err: any) => { console.error("Error fetching available tiers:", err); setError("Error al cargar los niveles disponibles."); setAvailableTiers([{ value: 'null', label: '(Quitar Nivel / Básico)' }]); })
                .finally(() => { setLoadingTiers(false); });
        } else { setAvailableTiers([]); setSelectedTierId(null); setError(null); setIsSubmitting(false); }
    }, [opened, customer]);

    // handleSubmit CORREGIDO
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault(); setError(null);
        if (!customer) { setError('No se ha seleccionado un cliente válido.'); return; }
        const currentAssignedTierId = customer.currentTier?.id ?? null;
        const newSelectedTierId = selectedTierId === 'null' ? null : selectedTierId;
        if (currentAssignedTierId === newSelectedTierId) { notifications.show({ title: 'Sin Cambios', message: 'El nivel seleccionado es el mismo que el actual.', color: 'blue', }); onClose(); return; }
        setIsSubmitting(true);
        try {
            console.log(`[ChangeTier] Sending request for customer ${customer.id}: newTierId=${newSelectedTierId}`);

            // --- LLAMADA PUT CORREGIDA: SIN /api ---
            await axiosInstance.put(
                `/admin/customers/${customer.id}/tier`, // Ruta relativa a la baseURL
                { tierId: newSelectedTierId }
            );
            // --------------------------------------

            notifications.show({ title: 'Éxito', message: `Se ha cambiado el nivel para ${customer.name || customer.email}.`, color: 'green', icon: <IconCheck size={18} />, autoClose: 4000, });
            onSuccess(); onClose();
        } catch (err: any) {
            console.error(`[ChangeTier] Error changing tier for customer ${customer?.id}:`, err);
            const errorMsg = err.response?.data?.message || `Error al cambiar nivel: ${err.message || 'Error desconocido'}`;
            setError(errorMsg); notifications.show({ title: 'Error al Cambiar Nivel', message: errorMsg, color: 'red', icon: <IconX size={18} />, autoClose: 6000, });
        } finally { setIsSubmitting(false); }
    };

    if (!customer) return null;

    // JSX (sin cambios)
    return (
        <Modal opened={opened} onClose={onClose} title={`Cambiar Nivel para ${customer.name || customer.email}`} centered radius="lg" overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}>
            <LoadingOverlay visible={isSubmitting || loadingTiers} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
            <form onSubmit={handleSubmit}>
                <Stack gap="md">
                    <Text size="sm">Nivel Actual: <Text span fw={700}>{customer.currentTier?.name || 'Básico'}</Text></Text>
                    <Select label="Selecciona el Nuevo Nivel" placeholder={loadingTiers ? "Cargando niveles..." : "Selecciona un nivel"} data={availableTiers} value={selectedTierId} onChange={setSelectedTierId} disabled={loadingTiers || isSubmitting} required searchable nothingFoundMessage="No se encontraron niveles" radius="lg"/>
                    {error && (<Alert title="Error" color="red" icon={<IconAlertCircle size={16}/>} radius="lg" withCloseButton onClose={() => setError(null)}>{error}</Alert>)}
                    <Group justify="flex-end" mt="md">
                        <Button variant="light" onClick={onClose} disabled={isSubmitting} radius="lg"> Cancelar </Button>
                        <Button type="submit" loading={isSubmitting} disabled={loadingTiers || selectedTierId === null || (customer.currentTier?.id ?? 'null') === selectedTierId} radius="lg" leftSection={<IconStairsUp size={16}/>}> Confirmar Cambio </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};

export default ChangeTierModal;