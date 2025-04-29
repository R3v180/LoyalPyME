// filename: frontend/src/pages/admin/tiers/TierSettingsPage.tsx
// Version: 1.1.8 (Remove Edit/Cancel buttons and isEditing state)

import React, { useState, useEffect, useCallback } from 'react';
import {
    Paper, Title, Stack, Switch, Select, NumberInput, Button, Loader, Alert, Group, LoadingOverlay, Text
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
// Remove IconPencil as it's no longer used
import { IconAlertCircle, IconCheck, IconDeviceFloppy } from '@tabler/icons-react';
import axiosInstance from '../../../services/axiosInstance';

// Tipos/Enums (sin cambios)
enum TierCalculationBasis { SPEND = 'SPEND', VISITS = 'VISITS', POINTS_EARNED = 'POINTS_EARNED' }
enum TierDowngradePolicy { NEVER = 'NEVER', PERIODIC_REVIEW = 'PERIODIC_REVIEW', AFTER_INACTIVITY = 'AFTER_INACTIVITY' }
interface TierConfigData {
    tierSystemEnabled: boolean;
    tierCalculationBasis: TierCalculationBasis | null;
    tierCalculationPeriodMonths: number | null;
    tierDowngradePolicy: TierDowngradePolicy;
    inactivityPeriodMonths: number | null;
}

// Mapeo para labels (sin cambios)
const basisLabels: Record<TierCalculationBasis, string> = {
    [TierCalculationBasis.SPEND]: 'Gasto Acumulado (€)',
    [TierCalculationBasis.VISITS]: 'Número de Visitas',
    [TierCalculationBasis.POINTS_EARNED]: 'Puntos Históricos Ganados'
};
const policyLabels: Record<TierDowngradePolicy, string> = {
    [TierDowngradePolicy.NEVER]: 'Nunca Bajar',
    [TierDowngradePolicy.PERIODIC_REVIEW]: 'Revisión Periódica',
    [TierDowngradePolicy.AFTER_INACTIVITY]: 'Tras Inactividad'
};

const TierSettingsPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState<boolean>(true); // Loading inicial
    const [isSaving, setIsSaving] = useState<boolean>(false); // Guardando cambios
    const [error, setError] = useState<string | null>(null); // Error de carga o guardado
    // const [isEditing, setIsEditing] = useState<boolean>(false); // <-- ELIMINADO

    const form = useForm<TierConfigData>({
        initialValues: {
            tierSystemEnabled: false,
            tierCalculationBasis: null,
            tierCalculationPeriodMonths: null,
            tierDowngradePolicy: TierDowngradePolicy.NEVER,
            inactivityPeriodMonths: null,
        },
        // Validación (sin cambios)
        validate: (values) => ({
            tierCalculationBasis: (!values.tierSystemEnabled || values.tierCalculationBasis) ? null : 'Debe seleccionar una base si el sistema está habilitado.',
            tierCalculationPeriodMonths: (!values.tierSystemEnabled || !values.tierCalculationBasis || values.tierCalculationBasis === TierCalculationBasis.POINTS_EARNED) ? null : (values.tierCalculationPeriodMonths === null || values.tierCalculationPeriodMonths <= 0) ? 'Periodo debe ser > 0 para esta base' : null,
            inactivityPeriodMonths: (!values.tierSystemEnabled || values.tierDowngradePolicy !== TierDowngradePolicy.AFTER_INACTIVITY) ? null : (values.inactivityPeriodMonths === null || values.inactivityPeriodMonths <= 0) ? 'Periodo debe ser > 0 para esta política' : null,
        }),
     });

    // fetchConfig (sin cambios respecto a v1.1.7)
    const fetchConfig = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get<TierConfigData>('/tiers/config');
            const fetchedConfig = {
                tierSystemEnabled: response.data.tierSystemEnabled ?? false,
                tierCalculationBasis: response.data.tierCalculationBasis ?? null,
                tierCalculationPeriodMonths: response.data.tierCalculationPeriodMonths ?? null,
                tierDowngradePolicy: response.data.tierDowngradePolicy ?? TierDowngradePolicy.NEVER,
                inactivityPeriodMonths: response.data.inactivityPeriodMonths ?? null,
             };
            form.setValues(fetchedConfig);
            console.log("Config fetched and form set:", fetchedConfig);
        } catch (err: any) {
            console.error("Error fetching tier config:", err);
            const message = err.response?.data?.message || "Error al cargar la configuración de Tiers.";
            setError(message);
            notifications.show({ title: 'Error de Carga', message, color: 'red', icon: <IconAlertCircle size={18} /> });
        } finally {
            setIsLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    // handleSaveChanges (sin cambios en lógica interna)
    const handleSaveChanges = async (values: TierConfigData) => {
        setIsSaving(true);
        setError(null); // Limpiar error anterior al intentar guardar
        const dataToSend = {
             ...values,
             tierCalculationPeriodMonths: values.tierCalculationPeriodMonths || null,
             inactivityPeriodMonths: values.inactivityPeriodMonths || null,
             tierCalculationBasis: values.tierSystemEnabled ? values.tierCalculationBasis : null,
         };
         if (dataToSend.tierCalculationBasis === TierCalculationBasis.POINTS_EARNED) {
             dataToSend.tierCalculationPeriodMonths = null;
         }
         if (dataToSend.tierDowngradePolicy !== TierDowngradePolicy.AFTER_INACTIVITY) {
             dataToSend.inactivityPeriodMonths = null;
         }
        console.log("Saving config:", dataToSend);
        try {
            await axiosInstance.put('/tiers/config', dataToSend);
            notifications.show({ title: 'Configuración Guardada', message: 'Los ajustes se han guardado correctamente.', color: 'green', icon: <IconCheck size={18} /> });
            form.setValues(values); // Actualiza los valores base del formulario
            form.reset(); // Resetea el estado 'dirty' con los nuevos valores base
            // setIsEditing(false); // <-- ELIMINADO
        } catch (err: any) {
            console.error("Error saving tier config:", err);
            const message = err.response?.data?.message || "Error al guardar la configuración.";
            setError(message); // Mostrar error en Alert dentro del form
            notifications.show({ title: 'Error al Guardar', message, color: 'red', icon: <IconAlertCircle size={18} /> });
        } finally {
            setIsSaving(false);
        }
    };

    // Opciones para Selects (sin cambios)
    const basisOptions = Object.values(TierCalculationBasis).map(value => ({ value, label: basisLabels[value] }));
    const policyOptions = Object.values(TierDowngradePolicy).map(value => ({ value, label: policyLabels[value] }));

    // Renderizado
    if (isLoading) {
        return <Group justify="center" mt="xl"><Loader /></Group>;
    }
    // Error de carga inicial (sin cambios)
    if (error && !isLoading && form.values.tierCalculationBasis === null && !form.values.tierSystemEnabled) {
            return <Alert title="Error de Carga" color="red" icon={<IconAlertCircle />}>{error}</Alert>;
    }

    return (
        <Paper shadow="sm" p="lg" withBorder radius="lg" style={{ position: 'relative' }}>
            {/* Loading overlay solo para guardado */}
            <LoadingOverlay visible={isSaving} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
            <Title order={2} mb="xl">Configuración del Sistema de Niveles (Tiers)</Title>
            <Text c="dimmed" size="sm" mb="lg">
                Define aquí cómo funciona globalmente tu sistema de niveles. Los cambios se aplicarán a todos los clientes.
            </Text>

            <form onSubmit={form.onSubmit(handleSaveChanges)}>
                <Stack gap="lg">
                    {/* Los campos ahora solo se deshabilitan si se está guardando */}
                    <Switch
                        label="Habilitar Sistema de Tiers"
                        description="Activa o desactiva el cálculo de niveles y sus beneficios."
                        disabled={isSaving}
                        {...form.getInputProps('tierSystemEnabled', { type: 'checkbox' })}
                    />
                    <Select
                        label="Base para Calcular el Nivel"
                        placeholder={!form.values.tierSystemEnabled ? "N/A (Sistema Deshabilitado)" : "Selecciona cómo se alcanza el nivel"}
                        data={basisOptions}
                        disabled={isSaving || !form.values.tierSystemEnabled}
                        clearable
                        description="Métrica principal usada para determinar el nivel (Gasto, Visitas o Puntos Históricos)."
                        {...form.getInputProps('tierCalculationBasis')}
                    />
                    <NumberInput
                        label="Periodo de Cálculo (Meses)"
                        placeholder={!form.values.tierCalculationBasis || form.values.tierCalculationBasis === TierCalculationBasis.POINTS_EARNED ? "N/A" : "Ej: 12"}
                        description="Meses hacia atrás para calcular métrica (0/vacío = de por vida)."
                        min={0}
                        step={1}
                        allowDecimal={false}
                        disabled={isSaving || !form.values.tierSystemEnabled || !form.values.tierCalculationBasis || form.values.tierCalculationBasis === TierCalculationBasis.POINTS_EARNED}
                        {...form.getInputProps('tierCalculationPeriodMonths')}
                    />
                    <Select
                        label="Política de Descenso de Nivel"
                        placeholder="Selecciona cómo se bajan niveles"
                        data={policyOptions}
                        disabled={isSaving || !form.values.tierSystemEnabled}
                        clearable={false}
                        description="Regla para bajar de nivel (Nunca, Revisión Periódica o Inactividad)."
                        {...form.getInputProps('tierDowngradePolicy')}
                    />
                    {form.values.tierDowngradePolicy === TierDowngradePolicy.AFTER_INACTIVITY && (
                        <NumberInput
                            label="Meses de Inactividad para Descenso"
                            placeholder="Ej: 6"
                            description="Meses sin actividad para bajar de nivel."
                            min={1}
                            step={1}
                            allowDecimal={false}
                            disabled={isSaving || !form.values.tierSystemEnabled}
                            required
                            {...form.getInputProps('inactivityPeriodMonths')}
                        />
                    )}

                    {/* Mostrar error de guardado si existe */}
                    {error && (
                        <Alert title="Error" color="red" icon={<IconAlertCircle size="1rem" />} mt="md" withCloseButton onClose={() => setError(null)}>
                            {error}
                        </Alert>
                     )}

                    {/* Botón de Guardar (siempre visible, se habilita con cambios) */}
                    <Group justify="flex-end" mt="xl">
                         <Button
                            type="submit"
                            disabled={!form.isDirty() || isSaving} // Solo se habilita si hay cambios y no se está guardando
                            loading={isSaving}
                            leftSection={<IconDeviceFloppy size={18} />}
                        >
                            Guardar Cambios
                        </Button>
                     </Group>
                </Stack>
            </form>
        </Paper>
    );
};

export default TierSettingsPage;

// End of File: frontend/src/pages/admin/tiers/TierSettingsPage.tsx