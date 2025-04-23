// File: frontend/src/components/admin/tiers/TierForm.tsx
// Version: 1.0.0 (Reusable form fields for Tier Create/Edit)

import React from 'react';
import { TextInput, NumberInput, Textarea, Switch, Stack } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form'; // Tipo para la instancia del form
import { z } from 'zod'; // Importar Zod si usamos el tipo inferido

// --- Tipos (Asegurarse que coinciden con los usados en la página/modal) ---
// Esquema Zod (definido también en TierManagementPage por ahora)
const tierFormSchema = z.object({
    name: z.string().min(1, { message: 'El nombre es obligatorio' }),
    level: z.number().int().min(0, { message: 'El nivel debe ser 0 o mayor' }),
    minValue: z.number().min(0, { message: 'El valor mínimo debe ser 0 o mayor' }),
    description: z.string().optional(),
    benefitsDescription: z.string().optional(),
    isActive: z.boolean(),
});
type TierFormValues = z.infer<typeof tierFormSchema>;
// --- Fin Tipos ---


// --- Props del Componente ---
interface TierFormProps {
    form: UseFormReturnType<TierFormValues>; // Recibe la instancia de useForm
    // Podríamos añadir un prop 'disabled' si queremos deshabilitar todo el form fácilmente
    // disabled?: boolean;
}
// --- Fin Props ---

const TierForm: React.FC<TierFormProps> = ({ form /*, disabled */ }) => {
    return (
        <Stack gap="md">
            <TextInput
                label="Nombre del Nivel"
                placeholder="Ej: Oro"
                required
                // disabled={disabled}
                {...form.getInputProps('name')}
            />
            <NumberInput
                label="Nivel (Orden)"
                placeholder="Ej: 3"
                description="Número para ordenar los niveles (0 o mayor)."
                required
                min={0}
                step={1}
                allowDecimal={false}
                // disabled={disabled}
                {...form.getInputProps('level')}
            />
            <NumberInput
                label="Valor Mínimo para Alcanzar"
                placeholder="Ej: 1500"
                description="Gasto (€), Visitas o Puntos necesarios (según config. negocio)."
                required
                min={0}
                decimalScale={2} // Permitir decimales por si es Gasto (€)
                // disabled={disabled}
                {...form.getInputProps('minValue')}
            />
            <Textarea
                label="Descripción (Opcional)"
                placeholder="Breve descripción del nivel"
                rows={2}
                // disabled={disabled}
                {...form.getInputProps('description')}
            />
            <Textarea
                label="Resumen Beneficios (Opcional)"
                placeholder="Texto resumen de los beneficios principales para el cliente"
                rows={3}
                // disabled={disabled}
                {...form.getInputProps('benefitsDescription')}
            />
            <Switch
                label="Nivel Activo"
                description="Si está inactivo, los clientes no podrán alcanzarlo ni ver sus beneficios."
                mt="sm"
                // disabled={disabled}
                {...form.getInputProps('isActive', { type: 'checkbox' })}
            />
        </Stack>
        // NOTA: No incluimos el botón de submit aquí, eso va en el Modal/Componente padre
    );
};

export default TierForm;

// End of File: frontend/src/components/admin/tiers/TierForm.tsx