// filename: frontend/src/pages/admin/tiers/TierSettingsPage.tsx
// Version: 1.1.1 (Remove unused Text import)

import React, { useState, useEffect } from 'react';
import {
    Paper, Title, Stack, Switch, Select, NumberInput, Button, Loader, Alert, Group, LoadingOverlay // <-- Eliminado Text
} from '@mantine/core';
import { useForm } from '@mantine/form'; // Import useForm
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck, IconDeviceFloppy } from '@tabler/icons-react';
import axiosInstance from '../../../services/axiosInstance';

// --- Tipos/Enums ---
// TODO: Mover Enums a un archivo /types/ compartido
enum TierCalculationBasis { SPEND = 'SPEND', VISITS = 'VISITS', POINTS_EARNED = 'POINTS_EARNED' }
enum TierDowngradePolicy { NEVER = 'NEVER', PERIODIC_REVIEW = 'PERIODIC_REVIEW', AFTER_INACTIVITY = 'AFTER_INACTIVITY' }
interface TierConfigData { tierSystemEnabled: boolean; tierCalculationBasis: TierCalculationBasis | null; tierCalculationPeriodMonths: number | null; tierDowngradePolicy: TierDowngradePolicy; inactivityPeriodMonths: number | null; }
// --- Fin Tipos/Enums ---

// Mapeo para labels
const basisLabels: Record<TierCalculationBasis, string> = { [TierCalculationBasis.SPEND]: 'Gasto Acumulado (€)', [TierCalculationBasis.VISITS]: 'Número de Visitas', [TierCalculationBasis.POINTS_EARNED]: 'Puntos Históricos Ganados' };
const policyLabels: Record<TierDowngradePolicy, string> = { [TierDowngradePolicy.NEVER]: 'Nunca Bajar', [TierDowngradePolicy.PERIODIC_REVIEW]: 'Revisión Periódica', [TierDowngradePolicy.AFTER_INACTIVITY]: 'Tras Inactividad' };


const TierSettingsPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null); // Error general de carga/guardado

    // --- useForm Hook ---
    const form = useForm<TierConfigData>({
        initialValues: {
            tierSystemEnabled: false, tierCalculationBasis: null, tierCalculationPeriodMonths: null,
            tierDowngradePolicy: TierDowngradePolicy.NEVER, inactivityPeriodMonths: null,
        },
        validate: (values) => ({
            tierCalculationBasis: (!values.tierSystemEnabled || values.tierCalculationBasis) ? null : 'Debe seleccionar una base si el sistema está habilitado.',
            tierCalculationPeriodMonths: (!values.tierSystemEnabled || !values.tierCalculationBasis || values.tierCalculationBasis === TierCalculationBasis.POINTS_EARNED) ? null : (values.tierCalculationPeriodMonths === null || values.tierCalculationPeriodMonths <= 0) ? 'Periodo debe ser > 0 para esta base' : null,
            inactivityPeriodMonths: (!values.tierSystemEnabled || values.tierDowngradePolicy !== TierDowngradePolicy.AFTER_INACTIVITY) ? null : (values.inactivityPeriodMonths === null || values.inactivityPeriodMonths <= 0) ? 'Periodo debe ser > 0 para esta política' : null,
        }),
    });

    // Cargar configuración inicial
    useEffect(() => {
        const fetchConfig = async () => { /* ... código interno igual que v1.1.0 ... */
            setIsLoading(true); setError(null); try { const response = await axiosInstance.get<TierConfigData>('/tiers/config'); const fetchedConfig = { tierSystemEnabled: response.data.tierSystemEnabled ?? false, tierCalculationBasis: response.data.tierCalculationBasis ?? null, tierCalculationPeriodMonths: response.data.tierCalculationPeriodMonths ?? null, tierDowngradePolicy: response.data.tierDowngradePolicy ?? TierDowngradePolicy.NEVER, inactivityPeriodMonths: response.data.inactivityPeriodMonths ?? null, }; form.setValues(fetchedConfig); form.reset(); console.log("Config fetched and form set:", fetchedConfig); } catch (err: any) { console.error("Error fetching tier config:", err); const message = err.response?.data?.message || "Error al cargar la configuración de Tiers."; setError(message); notifications.show({ title: 'Error de Carga', message, color: 'red', icon: <IconAlertCircle size={18} /> }); } finally { setIsLoading(false); } };
        fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Guardar cambios
    const handleSaveChanges = async (values: TierConfigData) => { /* ... código interno igual que v1.1.0 ... */
        setIsSaving(true); setError(null);
        const dataToSend = { ...values, tierCalculationPeriodMonths: values.tierCalculationPeriodMonths || null, inactivityPeriodMonths: values.inactivityPeriodMonths || null, tierCalculationBasis: values.tierSystemEnabled ? values.tierCalculationBasis : null, };
        if (dataToSend.tierCalculationBasis === TierCalculationBasis.POINTS_EARNED) { dataToSend.tierCalculationPeriodMonths = null; }
        if (dataToSend.tierDowngradePolicy !== TierDowngradePolicy.AFTER_INACTIVITY) { dataToSend.inactivityPeriodMonths = null; }
        console.log("Saving config:", dataToSend);
        try { await axiosInstance.put('/tiers/config', dataToSend); notifications.show({ title: 'Configuración Guardada', message: 'Los ajustes del sistema de Tiers se han guardado correctamente.', color: 'green', icon: <IconCheck size={18} /> }); form.reset(); }
        catch (err: any) { console.error("Error saving tier config:", err); const message = err.response?.data?.message || "Error al guardar la configuración."; setError(message); notifications.show({ title: 'Error al Guardar', message, color: 'red', icon: <IconAlertCircle size={18} /> }); }
        finally { setIsSaving(false); } };

    // Opciones para Selects
    const basisOptions = Object.values(TierCalculationBasis).map(value => ({ value, label: basisLabels[value] }));
    const policyOptions = Object.values(TierDowngradePolicy).map(value => ({ value, label: policyLabels[value] }));

    if (isLoading) { return <Group justify="center" mt="xl"><Loader /></Group>; }
    if (error && !form.values.tierSystemEnabled) { return <Alert title="Error" color="red" icon={<IconAlertCircle />}>{error}</Alert>; }

    // Renderizado del formulario
    return (
        <Paper shadow="sm" p="lg" withBorder radius="lg" style={{ position: 'relative' }}>
            <LoadingOverlay visible={isSaving} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
            <Title order={2} mb="xl">Configuración del Sistema de Niveles (Tiers)</Title>
            <form onSubmit={form.onSubmit(handleSaveChanges)}>
                <Stack gap="lg">
                    <Switch label="Habilitar Sistema de Tiers" description="Activa o desactiva el cálculo de niveles y sus beneficios para los clientes." {...form.getInputProps('tierSystemEnabled', { type: 'checkbox' })} />
                    <Select label="Base para Calcular el Nivel" placeholder="Selecciona cómo se alcanza el nivel" data={basisOptions} disabled={!form.values.tierSystemEnabled} clearable description="Métrica principal usada para determinar el nivel (Gasto, Visitas o Puntos Históricos)." {...form.getInputProps('tierCalculationBasis')} />
                    <NumberInput label="Periodo de Cálculo (Meses)" placeholder="Ej: 12" description="Número de meses hacia atrás para calcular la métrica (0 o vacío = de por vida)." min={0} step={1} allowDecimal={false} disabled={!form.values.tierSystemEnabled || !form.values.tierCalculationBasis || form.values.tierCalculationBasis === TierCalculationBasis.POINTS_EARNED} {...form.getInputProps('tierCalculationPeriodMonths')} />
                    <Select label="Política de Descenso de Nivel" placeholder="Selecciona cómo se bajan niveles" data={policyOptions} disabled={!form.values.tierSystemEnabled} clearable={false} description="Regla para bajar de nivel (Nunca, Revisión Periódica o Inactividad)." {...form.getInputProps('tierDowngradePolicy')} />
                    {form.values.tierDowngradePolicy === TierDowngradePolicy.AFTER_INACTIVITY && (
                        <NumberInput label="Meses de Inactividad para Descenso" placeholder="Ej: 6" description="Número de meses sin actividad para bajar de nivel." min={1} step={1} allowDecimal={false} disabled={!form.values.tierSystemEnabled} required {...form.getInputProps('inactivityPeriodMonths')} />
                    )}
                    {error && !isSaving && ( <Alert title="Error al cargar/guardar" color="red" icon={<IconAlertCircle size="1rem" />} mt="md">{error}</Alert> )}
                    <Group justify="flex-end" mt="xl">
                        <Button type="submit" disabled={!form.isDirty() || isSaving} loading={isSaving} leftSection={<IconDeviceFloppy size={18} />}> Guardar Cambios </Button>
                    </Group>
                </Stack>
            </form>
        </Paper>
    );
};

export default TierSettingsPage;

// End of File: frontend/src/pages/admin/tiers/TierSettingsPage.tsx