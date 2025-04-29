// filename: frontend/src/components/admin/tiers/AddTierBenefitForm.tsx
// Version: 1.0.1 (Remove unused imports and props)

import React from 'react';
// Quitar imports no usados: Button, Group, useForm, zodResolver
import { TextInput, Textarea, Select, Switch, Stack } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { z } from 'zod'; // z se usa para inferir el tipo BenefitFormValues

// --- Tipos/Enums ---
// TODO: Mover BenefitType a un archivo /types/ compartido
export enum BenefitType {
    POINTS_MULTIPLIER = 'POINTS_MULTIPLIER',
    EXCLUSIVE_REWARD_ACCESS = 'EXCLUSIVE_REWARD_ACCESS',
    CUSTOM_BENEFIT = 'CUSTOM_BENEFIT'
}

const benefitTypeLabels: Record<BenefitType, string> = {
    [BenefitType.POINTS_MULTIPLIER]: 'Multiplicador de Puntos',
    [BenefitType.EXCLUSIVE_REWARD_ACCESS]: 'Acceso a Recompensa Exclusiva',
    [BenefitType.CUSTOM_BENEFIT]: 'Beneficio Personalizado'
};

// Esquema Zod sigue siendo útil para inferir el tipo
const benefitFormSchema = z.object({
    type: z.nativeEnum(BenefitType, { errorMap: () => ({ message: 'Selecciona un tipo de beneficio válido.' }) }),
    value: z.string().min(1, { message: 'El valor es obligatorio' }),
    description: z.string().optional(),
    isActive: z.boolean(),
});

export type BenefitFormValues = z.infer<typeof benefitFormSchema>;
// --- Fin Tipos/Enums ---


// --- Props del Componente (Quitamos onSubmit) ---
interface AddTierBenefitFormProps {
    form: UseFormReturnType<BenefitFormValues>; // Recibe la instancia del form
    isSubmitting: boolean; // Sigue recibiendo el estado de carga
}
// --- Fin Props ---

// Quitamos onSubmit de la desestructuración
const AddTierBenefitForm: React.FC<AddTierBenefitFormProps> = ({ form, isSubmitting }) => {

    // Opciones para el Select
    const typeOptions = Object.values(BenefitType).map(value => ({
        value: value,
        label: benefitTypeLabels[value]
    }));

    return (
        // El tag <form> y el botón de submit estarán en el Modal padre
        <Stack gap="sm">
            <Select
                label="Tipo de Beneficio"
                placeholder="Selecciona un tipo"
                data={typeOptions}
                required
                disabled={isSubmitting}
                {...form.getInputProps('type')}
            />
            <TextInput
                label="Valor"
                placeholder="Ej: 1.5, reward_id, 'Descuento X'"
                description="Valor asociado al tipo (número, ID, texto)"
                required
                disabled={isSubmitting}
                {...form.getInputProps('value')}
            />
            <Textarea
                label="Descripción (Opcional)"
                placeholder="Detalles adicionales del beneficio"
                rows={2}
                disabled={isSubmitting}
                {...form.getInputProps('description')}
            />
            <Switch
                label="Beneficio Activo"
                // El valor inicial se define en el useForm del padre
                disabled={isSubmitting}
                {...form.getInputProps('isActive', { type: 'checkbox' })}
            />
        </Stack>
    );
};

export default AddTierBenefitForm;

// End of File: frontend/src/components/admin/tiers/AddTierBenefitForm.tsx