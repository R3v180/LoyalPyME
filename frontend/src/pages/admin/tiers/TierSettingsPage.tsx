// filename: frontend/src/pages/admin/tiers/TierSettingsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Paper, Title, Stack, Switch, Select, NumberInput, Button, Loader, Alert, Group, LoadingOverlay, Text
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck, IconDeviceFloppy } from '@tabler/icons-react';
import axiosInstance from '../../../services/axiosInstance';
import { useTranslation } from 'react-i18next'; // Importar hook

// Tipos/Enums
enum TierCalculationBasis { SPEND = 'SPEND', VISITS = 'VISITS', POINTS_EARNED = 'POINTS_EARNED' }
enum TierDowngradePolicy { NEVER = 'NEVER', PERIODIC_REVIEW = 'PERIODIC_REVIEW', AFTER_INACTIVITY = 'AFTER_INACTIVITY' }

interface TierConfigData {
    tierSystemEnabled: boolean;
    tierCalculationBasis: TierCalculationBasis | null;
    tierCalculationPeriodMonths: number | null;
    tierDowngradePolicy: TierDowngradePolicy;
    inactivityPeriodMonths: number | null;
}

const TierSettingsPage: React.FC = () => {
    const { t } = useTranslation(); // Hook de traducción
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<TierConfigData>({
        initialValues: {
            tierSystemEnabled: false,
            tierCalculationBasis: null,
            tierCalculationPeriodMonths: null,
            tierDowngradePolicy: TierDowngradePolicy.NEVER,
            inactivityPeriodMonths: null,
        },
        // Validación no necesita t() aquí directamente si los mensajes son genéricos o manejados por Mantine/Zod
        validate: (values) => ({
            // Lógica de validación se mantiene, los mensajes se pueden mejorar si es necesario
             tierCalculationBasis: (!values.tierSystemEnabled || values.tierCalculationBasis) ? null : t('common.requiredField'), // Ejemplo genérico
             tierCalculationPeriodMonths: (!values.tierSystemEnabled || !values.tierCalculationBasis || values.tierCalculationBasis === TierCalculationBasis.POINTS_EARNED) ? null : (values.tierCalculationPeriodMonths === null || values.tierCalculationPeriodMonths <= 0) ? t('validation.mustBePositive', 'Debe ser > 0') : null, // Clave nueva propuesta
             inactivityPeriodMonths: (!values.tierSystemEnabled || values.tierDowngradePolicy !== TierDowngradePolicy.AFTER_INACTIVITY) ? null : (values.inactivityPeriodMonths === null || values.inactivityPeriodMonths <= 0) ? t('validation.mustBePositive', 'Debe ser > 0') : null, // Clave nueva propuesta
         }),
    });

    // fetchConfig (usar t() en mensajes de error)
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
            form.resetDirty(fetchedConfig); // Asegurar que el estado inicial no esté 'dirty'
            console.log("Config fetched and form set:", fetchedConfig);
        } catch (err: any) {
            console.error("Error fetching tier config:", err);
            const message = err.response?.data?.message || t('adminTiersSettingsPage.errorLoading');
            setError(message);
            notifications.show({ title: t('common.errorLoadingData'), message, color: 'red', icon: <IconAlertCircle size={18} /> });
        } finally {
            setIsLoading(false);
        }
     // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [t]); // Añadir t como dependencia

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    // handleSaveChanges (usar t() en mensajes de notificación/error)
    const handleSaveChanges = async (values: TierConfigData) => {
        setIsSaving(true);
        setError(null);
        const dataToSend = { /* ... lógica sin cambios ... */
            ...values,
             tierCalculationPeriodMonths: values.tierCalculationPeriodMonths || null,
             inactivityPeriodMonths: values.inactivityPeriodMonths || null,
             tierCalculationBasis: values.tierSystemEnabled ? values.tierCalculationBasis : null,
        };
         if (dataToSend.tierCalculationBasis === TierCalculationBasis.POINTS_EARNED) { dataToSend.tierCalculationPeriodMonths = null; }
         if (dataToSend.tierDowngradePolicy !== TierDowngradePolicy.AFTER_INACTIVITY) { dataToSend.inactivityPeriodMonths = null; }

        console.log("Saving config:", dataToSend);
        try {
            await axiosInstance.put('/tiers/config', dataToSend);
            notifications.show({
                title: t('adminTiersSettingsPage.successSaving'), // Usar título específico
                message: t('adminTiersSettingsPage.successSaving'), // Usar mismo texto como mensaje por ahora
                color: 'green',
                icon: <IconCheck size={18} />
            });
            form.setValues(values);
            form.resetDirty(values); // Resetear dirty con los nuevos valores guardados
        } catch (err: any) {
            console.error("Error saving tier config:", err);
            const message = err.response?.data?.message || t('adminTiersSettingsPage.errorSaving');
            setError(message);
            notifications.show({
                title: t('adminCommon.saveError'), // Título genérico de error
                message,
                color: 'red',
                icon: <IconAlertCircle size={18} />
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Opciones para Selects (usando t())
    const basisOptions = Object.values(TierCalculationBasis).map(value => ({
        value,
        label: t(`adminTiersSettingsPage.basisOption_${value}`)
    }));
    const policyOptions = Object.values(TierDowngradePolicy).map(value => ({
        value,
        label: t(`adminTiersSettingsPage.downgradePolicyOption_${value}`)
    }));

    // Renderizado
    if (isLoading) {
        return <Group justify="center" mt="xl"><Loader /></Group>;
    }
    // Usar t() en título del Alert de error
    if (error && !isLoading && form.values.tierCalculationBasis === null && !form.values.tierSystemEnabled) {
        return <Alert title={t('common.errorLoadingData')} color="red" icon={<IconAlertCircle />}>{error}</Alert>;
    }

    return (
        <Paper shadow="sm" p="lg" withBorder radius="lg" style={{ position: 'relative' }}>
            <LoadingOverlay visible={isSaving} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
            <Title order={2} mb="xl">{t('adminTiersSettingsPage.title')}</Title>
            <Text c="dimmed" size="sm" mb="lg">
                {t('adminTiersSettingsPage.description')}
            </Text>

            <form onSubmit={form.onSubmit(handleSaveChanges)}>
                <Stack gap="lg">
                    {/* Usar t() para labels y descriptions */}
                    <Switch
                        label={t('adminTiersSettingsPage.enableSystemLabel')}
                        description={t('adminTiersSettingsPage.enableSystemDescription')}
                        disabled={isSaving}
                        {...form.getInputProps('tierSystemEnabled', { type: 'checkbox' })}
                    />
                    <Select
                        label={t('adminTiersSettingsPage.basisLabel')}
                        placeholder={!form.values.tierSystemEnabled ? t('adminTiersSettingsPage.basisPlaceholderDisabled') : t('adminTiersSettingsPage.basisPlaceholder')}
                        data={basisOptions}
                        disabled={isSaving || !form.values.tierSystemEnabled}
                        clearable
                        description={t('adminTiersSettingsPage.basisDescription')}
                        {...form.getInputProps('tierCalculationBasis')}
                    />
                    <NumberInput
                        label={t('adminTiersSettingsPage.periodLabel')}
                        placeholder={!form.values.tierCalculationBasis || form.values.tierCalculationBasis === TierCalculationBasis.POINTS_EARNED ? t('adminTiersSettingsPage.periodPlaceholderNA') : t('adminTiersSettingsPage.periodPlaceholder')}
                        description={t('adminTiersSettingsPage.periodDescription')}
                        min={0}
                        step={1}
                        allowDecimal={false}
                        disabled={isSaving || !form.values.tierSystemEnabled || !form.values.tierCalculationBasis || form.values.tierCalculationBasis === TierCalculationBasis.POINTS_EARNED}
                        {...form.getInputProps('tierCalculationPeriodMonths')}
                    />
                    <Select
                        label={t('adminTiersSettingsPage.downgradePolicyLabel')}
                        placeholder={t('adminTiersSettingsPage.downgradePolicyPlaceholder')}
                        data={policyOptions}
                        disabled={isSaving || !form.values.tierSystemEnabled}
                        clearable={false}
                        description={t('adminTiersSettingsPage.downgradePolicyDescription')}
                        {...form.getInputProps('tierDowngradePolicy')}
                    />
                    {form.values.tierDowngradePolicy === TierDowngradePolicy.AFTER_INACTIVITY && (
                        <NumberInput
                            label={t('adminTiersSettingsPage.inactivityLabel')}
                            placeholder={t('adminTiersSettingsPage.inactivityPlaceholder')}
                            description={t('adminTiersSettingsPage.inactivityDescription')}
                            min={1}
                            step={1}
                            allowDecimal={false}
                            disabled={isSaving || !form.values.tierSystemEnabled}
                            required
                            {...form.getInputProps('inactivityPeriodMonths')}
                        />
                    )}

                    {error && (
                        <Alert title={t('common.error')} color="red" icon={<IconAlertCircle size="1rem" />} mt="md" withCloseButton onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    <Group justify="flex-end" mt="xl">
                        <Button
                            type="submit"
                            disabled={!form.isDirty() || isSaving}
                            loading={isSaving}
                            leftSection={<IconDeviceFloppy size={18} />}
                        >
                            {t('adminTiersSettingsPage.saveButton')}
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Paper>
    );
};

export default TierSettingsPage;