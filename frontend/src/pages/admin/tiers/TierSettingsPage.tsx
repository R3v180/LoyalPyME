// File: frontend/src/pages/admin/tiers/TierSettingsPage.tsx
// Version: 1.0.0 (Initial page for managing Business Tier Settings)

import React, { useState, useEffect, useCallback } from 'react';
import { Paper, Title, Stack, Switch, Select, NumberInput, Button, Loader, Alert, Group, Text, LoadingOverlay } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck, IconDeviceFloppy } from '@tabler/icons-react';
import axiosInstance from '../../../services/axiosInstance'; // Ajusta la ruta si es necesario

// --- Tipos/Enums (Deberían coincidir con los del backend) ---
// Idealmente, estos se compartirían en un paquete common o se generarían desde el schema
enum TierCalculationBasis {
  SPEND = 'SPEND',
  VISITS = 'VISITS',
  POINTS_EARNED = 'POINTS_EARNED'
}

enum TierDowngradePolicy {
  NEVER = 'NEVER',
  PERIODIC_REVIEW = 'PERIODIC_REVIEW',
  AFTER_INACTIVITY = 'AFTER_INACTIVITY'
}

interface TierConfigData {
  tierSystemEnabled: boolean | null;
  tierCalculationBasis: TierCalculationBasis | null;
  tierCalculationPeriodMonths: number | null;
  tierDowngradePolicy: TierDowngradePolicy | null;
  inactivityPeriodMonths: number | null;
}
// --- Fin Tipos/Enums ---


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
// --- Fin de las constantes a añadir ---

const TierSettingsPage: React.FC = () => {
    const [config, setConfig] = useState<TierConfigData | null>(null);
    const [initialConfig, setInitialConfig] = useState<TierConfigData | null>(null); // Para detectar cambios
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Opciones para los Selects
    // --- Reemplaza las líneas anteriores por estas ---
    const basisOptions = Object.values(TierCalculationBasis).map(value => ({
        value: value, // El valor interno sigue siendo el Enum en inglés
        label: basisLabels[value] // La etiqueta visible es la traducción
    }));
    const policyOptions = Object.values(TierDowngradePolicy).map(value => ({
        value: value,
        label: policyLabels[value]
    }));
    // --- Fin del reemplazo ---
    // Cargar configuración inicial
    const fetchConfig = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get<TierConfigData>('/tiers/config');
            // Inicializar valores si son null desde la API para evitar inputs no controlados
            const fetchedConfig = {
                tierSystemEnabled: response.data.tierSystemEnabled ?? false,
                tierCalculationBasis: response.data.tierCalculationBasis ?? null,
                tierCalculationPeriodMonths: response.data.tierCalculationPeriodMonths ?? null,
                tierDowngradePolicy: response.data.tierDowngradePolicy ?? TierDowngradePolicy.NEVER,
                inactivityPeriodMonths: response.data.inactivityPeriodMonths ?? null,
            };
            setConfig(fetchedConfig);
            setInitialConfig(fetchedConfig); // Guardar copia inicial
             console.log("Config fetched:", fetchedConfig);
        } catch (err: any) {
            console.error("Error fetching tier config:", err);
            setError(err.response?.data?.message || "Error al cargar la configuración de Tiers.");
            notifications.show({
                 title: 'Error de Carga',
                 message: err.response?.data?.message || "No se pudo cargar la configuración.",
                 color: 'red',
                 icon: <IconAlertCircle size={18} />
             });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    // Manejar cambios en el formulario
    const handleInputChange = (field: keyof TierConfigData, value: any) => {
        // Convertir string vacío de NumberInput a null
        if ((field === 'tierCalculationPeriodMonths' || field === 'inactivityPeriodMonths') && value === '') {
            value = null;
        }
        setConfig(prev => prev ? { ...prev, [field]: value } : null);
    };

    // Guardar cambios
    const handleSaveChanges = async () => {
        if (!config) return;
        setIsSaving(true);
        setError(null);

        // Validaciones básicas del lado cliente
        if (config.tierCalculationBasis && config.tierCalculationBasis !== TierCalculationBasis.POINTS_EARNED && (config.tierCalculationPeriodMonths === null || config.tierCalculationPeriodMonths <= 0)) {
             notifications.show({ title: 'Configuración Incompleta', message: 'Se requiere un periodo de cálculo válido (meses > 0) para las bases SPEND o VISITS.', color: 'orange' });
             setIsSaving(false);
             return;
         }
         if (config.tierDowngradePolicy === TierDowngradePolicy.AFTER_INACTIVITY && (config.inactivityPeriodMonths === null || config.inactivityPeriodMonths <= 0)) {
             notifications.show({ title: 'Configuración Incompleta', message: 'Se requiere un periodo de inactividad válido (meses > 0) para la política AFTER_INACTIVITY.', color: 'orange' });
             setIsSaving(false);
             return;
         }

        // Preparar datos (asegurarse de que los null son null y no string vacíos)
        const dataToSend: Partial<TierConfigData> = {
            tierSystemEnabled: config.tierSystemEnabled,
            tierCalculationBasis: config.tierCalculationBasis,
            // Enviar null si no aplica o es 0, el backend debería manejarlo
            tierCalculationPeriodMonths: config.tierCalculationPeriodMonths,
            tierDowngradePolicy: config.tierDowngradePolicy,
            inactivityPeriodMonths: config.inactivityPeriodMonths,
        };


        console.log("Saving config:", dataToSend);

        try {
            await axiosInstance.put('/tiers/config', dataToSend);
            notifications.show({
                 title: 'Configuración Guardada',
                 message: 'Los ajustes del sistema de Tiers se han guardado correctamente.',
                 color: 'green',
                 icon: <IconCheck size={18} />
             });
             setInitialConfig(config); // Actualizar estado inicial tras guardar
        } catch (err: any) {
            console.error("Error saving tier config:", err);
             setError(err.response?.data?.message || "Error al guardar la configuración.");
             notifications.show({
                 title: 'Error al Guardar',
                 message: err.response?.data?.message || "No se pudieron guardar los cambios.",
                 color: 'red',
                 icon: <IconAlertCircle size={18} />
             });
        } finally {
            setIsSaving(false);
        }
    };

    // Comprobar si hay cambios sin guardar
    const hasChanges = JSON.stringify(config) !== JSON.stringify(initialConfig);

    if (isLoading) {
        return <Group justify="center" mt="xl"><Loader /></Group>;
    }

    if (error && !config) { // Si hay error y no se pudo cargar config inicial
        return <Alert title="Error" color="red" icon={<IconAlertCircle />}>{error}</Alert>;
    }

    if (!config) { // Si no está cargando, no hay error, pero no hay config (raro)
        return <Text>No se pudo cargar la configuración.</Text>;
    }


    // Renderizado del formulario
    return (
        <Paper shadow="sm" p="lg" withBorder radius="lg" style={{ position: 'relative' }}>
             <LoadingOverlay visible={isSaving} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
            <Title order={2} mb="xl">Configuración del Sistema de Niveles (Tiers)</Title>

            <Stack gap="lg">
                 <Switch
                     label="Habilitar Sistema de Tiers"
                     checked={config.tierSystemEnabled ?? false}
                     onChange={(event) => handleInputChange('tierSystemEnabled', event.currentTarget.checked)}
                     description="Activa o desactiva el cálculo de niveles y sus beneficios para los clientes."
                 />

                 <Select
                     label="Base para Calcular el Nivel"
                     placeholder="Selecciona cómo se alcanza el nivel"
                     data={basisOptions}
                     value={config.tierCalculationBasis}
                     onChange={(value) => handleInputChange('tierCalculationBasis', value as TierCalculationBasis | null)}
                     disabled={!config.tierSystemEnabled}
                     clearable // Permitir limpiar la selección (volver a null)
                     description="Métrica principal usada para determinar el nivel (Gasto, Visitas o Puntos Históricos)."
                 />

                 <NumberInput
                     label="Periodo de Cálculo (Meses)"
                     placeholder="Ej: 12"
                     description="Número de meses hacia atrás para calcular la métrica (0 o vacío = de por vida)."
                     value={config.tierCalculationPeriodMonths ?? ''} // Usar '' para que NumberInput muestre placeholder
                     onChange={(value) => handleInputChange('tierCalculationPeriodMonths', value)}
                     min={0}
                     step={1}
                     allowDecimal={false}
                     disabled={!config.tierSystemEnabled || !config.tierCalculationBasis}
                 />

                 <Select
                     label="Política de Descenso de Nivel"
                     placeholder="Selecciona cómo se bajan niveles"
                     data={policyOptions}
                     value={config.tierDowngradePolicy}
                     onChange={(value) => handleInputChange('tierDowngradePolicy', value as TierDowngradePolicy | null)}
                     disabled={!config.tierSystemEnabled}
                     clearable={false} // Forzar a tener una política (NEVER por defecto)
                     description="Regla para bajar de nivel (Nunca, Revisión Periódica o Inactividad)."
                 />

                 {/* Mostrar campo de meses de inactividad solo si la política es AFTER_INACTIVITY */}
                 {config.tierDowngradePolicy === TierDowngradePolicy.AFTER_INACTIVITY && (
                     <NumberInput
                         label="Meses de Inactividad para Descenso"
                         placeholder="Ej: 6"
                         description="Número de meses sin actividad para bajar de nivel."
                         value={config.inactivityPeriodMonths ?? ''}
                         onChange={(value) => handleInputChange('inactivityPeriodMonths', value)}
                         min={1} // Mínimo 1 mes de inactividad
                         step={1}
                         allowDecimal={false}
                         disabled={!config.tierSystemEnabled}
                         required // Requerido si se elige esta política
                     />
                 )}

                 <Group justify="flex-end" mt="xl">
                     <Button
                         onClick={handleSaveChanges}
                         disabled={!hasChanges || isSaving} // Deshabilitar si no hay cambios o está guardando
                         loading={isSaving}
                         leftSection={<IconDeviceFloppy size={18} />}
                     >
                         Guardar Cambios
                     </Button>
                 </Group>

            </Stack>
        </Paper>
    );
};

export default TierSettingsPage;

// End of File: frontend/src/pages/admin/tiers/TierSettingsPage.tsx