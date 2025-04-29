// filename: frontend/src/components/admin/tiers/AddTierBenefitForm.tsx
import React from 'react';
import { TextInput, Textarea, Select, Switch, Stack } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { z } from 'zod';
import { useTranslation } from 'react-i18next'; // Importar hook

// --- Tipos/Enums ---
export enum BenefitType {
    POINTS_MULTIPLIER = 'POINTS_MULTIPLIER',
    EXCLUSIVE_REWARD_ACCESS = 'EXCLUSIVE_REWARD_ACCESS',
    CUSTOM_BENEFIT = 'CUSTOM_BENEFIT'
}

// Este schema no se usa directamente aquí para validar, pero define el tipo
const benefitFormSchema = z.object({
    type: z.nativeEnum(BenefitType),
    value: z.string().min(1),
    description: z.string().optional(),
    isActive: z.boolean(),
});
export type BenefitFormValues = z.infer<typeof benefitFormSchema>;
// --- Fin Tipos/Enums ---


// --- Props del Componente ---
interface AddTierBenefitFormProps {
    form: UseFormReturnType<BenefitFormValues>;
    isSubmitting: boolean;
}
// --- Fin Props ---

const AddTierBenefitForm: React.FC<AddTierBenefitFormProps> = ({ form, isSubmitting }) => {
    const { t } = useTranslation(); // Hook de traducción

    // Las etiquetas para las opciones del Select se generan en el componente padre (TierBenefitsModal)
    // usando t(), aquí solo necesitamos los valores del enum.
    const typeOptions = Object.values(BenefitType).map(value => ({
        value: value,
        label: t(`component.addTierBenefitForm.benefitType_${value}`) // Usar t() para la etiqueta si fuera necesario aquí, pero se hace en el padre
    }));

    return (
        <Stack gap="sm">
            <Select
                label={t('component.addTierBenefitForm.typeLabel')}
                placeholder={t('component.addTierBenefitForm.typePlaceholder')}
                data={typeOptions} // Las etiquetas ya vienen traducidas del padre
                required
                disabled={isSubmitting}
                {...form.getInputProps('type')}
            />
            <TextInput
                label={t('component.addTierBenefitForm.valueLabel')}
                placeholder={t('component.addTierBenefitForm.valuePlaceholder')}
                description={t('component.addTierBenefitForm.valueDescription')}
                required
                disabled={isSubmitting}
                {...form.getInputProps('value')}
            />
            <Textarea
                label={t('component.addTierBenefitForm.descriptionLabel')}
                placeholder={t('component.addTierBenefitForm.descriptionPlaceholder')}
                rows={2}
                disabled={isSubmitting}
                {...form.getInputProps('description')}
            />
            <Switch
                label={t('component.addTierBenefitForm.activeLabel')}
                disabled={isSubmitting}
                {...form.getInputProps('isActive', { type: 'checkbox' })}
            />
        </Stack>
    );
};

export default AddTierBenefitForm;