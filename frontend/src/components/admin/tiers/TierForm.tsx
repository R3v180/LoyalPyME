// filename: frontend/src/components/admin/tiers/TierForm.tsx
import React from 'react';
import { TextInput, NumberInput, Textarea, Switch, Stack } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { z } from 'zod';
import { useTranslation } from 'react-i18next'; // Importar hook

// --- Tipos ---
// Esquema Zod (no necesita 't' aquí ya que los mensajes se definen en el componente padre)
const tierFormSchema = z.object({
    name: z.string().min(1),
    level: z.number().int().min(0),
    minValue: z.number().min(0),
    description: z.string().optional(),
    benefitsDescription: z.string().optional(),
    isActive: z.boolean(),
});

export type TierFormValues = z.infer<typeof tierFormSchema>;
// --- Fin Tipos ---

// --- Props del Componente ---
interface TierFormProps {
    form: UseFormReturnType<TierFormValues>;
    disabled?: boolean;
}
// --- Fin Props ---

const TierForm: React.FC<TierFormProps> = ({ form, disabled }) => {
    const { t } = useTranslation(); // Hook de traducción

    return (
        <Stack gap="md">
            <TextInput
                label={t('component.tierForm.nameLabel')}
                placeholder={t('component.tierForm.namePlaceholder')}
                required
                disabled={disabled}
                {...form.getInputProps('name')}
            />
            <NumberInput
                label={t('component.tierForm.levelLabel')}
                placeholder={t('component.tierForm.levelPlaceholder')}
                description={t('component.tierForm.levelDescription')}
                required
                min={0}
                step={1}
                allowDecimal={false}
                disabled={disabled}
                {...form.getInputProps('level')}
            />
            <NumberInput
                label={t('component.tierForm.minValueLabel')}
                placeholder={t('component.tierForm.minValuePlaceholder')}
                description={t('component.tierForm.minValueDescription')}
                required
                min={0}
                decimalScale={2} // Permite decimales para gasto, pero step=1 si es para visitas/puntos
                // step={1} // Considera ajustar esto según la lógica de minValue
                disabled={disabled}
                {...form.getInputProps('minValue')}
            />
            <Textarea
                label={t('component.tierForm.descriptionLabel')}
                placeholder={t('component.tierForm.descriptionPlaceholder')}
                rows={2}
                disabled={disabled}
                {...form.getInputProps('description')}
            />
            <Textarea
                label={t('component.tierForm.benefitsDescriptionLabel')}
                placeholder={t('component.tierForm.benefitsDescriptionPlaceholder')}
                rows={3}
                disabled={disabled}
                {...form.getInputProps('benefitsDescription')}
            />
            <Switch
                label={t('component.tierForm.activeLabel')}
                description={t('component.tierForm.activeDescription')}
                mt="sm"
                disabled={disabled}
                {...form.getInputProps('isActive', { type: 'checkbox' })}
            />
        </Stack>
    );
};

export default TierForm;