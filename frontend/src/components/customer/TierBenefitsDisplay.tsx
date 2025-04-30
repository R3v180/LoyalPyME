// filename: frontend/src/components/customer/TierBenefitsDisplay.tsx
// Version: 1.0.1 (Use t for title)

import React from 'react';
import { Paper, Title, List, ThemeIcon, Text, Stack } from '@mantine/core';
import { IconCircleCheck } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

// Importar el tipo desde el archivo de tipos compartido
import { TierBenefitData } from '../../types/customer'; // Ajusta la ruta si es necesario

// --- Props del Componente ---
interface TierBenefitsDisplayProps {
    tierName: string;                   // Nombre del nivel actual
    benefits: TierBenefitData[];       // Array de beneficios activos para este nivel
}
// --- Fin Props ---

const TierBenefitsDisplay: React.FC<TierBenefitsDisplayProps> = ({ tierName, benefits }) => {
    const { t } = useTranslation(); // Ahora sí se usa

    // Si no hay beneficios (aunque el componente padre ya debería filtrar esto), no renderizar nada
    if (!benefits || benefits.length === 0) {
        return null;
    }

    return (
        <Paper shadow="sm" p="lg" mt="xl" mb="xl" withBorder radius="lg">
            <Stack gap="md">
                {/* Título de la sección, usando el nombre del tier */}
                <Title order={4}>
                    {/* Usar t() para el título */}
                    {t('customerDashboard.tierBenefitsTitle', `Beneficios del Nivel: {{tierName}}`, { tierName })}
                    {/* TODO: Añadir 'customerDashboard.tierBenefitsTitle' a los JSON de traducción */}
                </Title>

                {/* Lista de beneficios */}
                <List
                    spacing="xs"
                    size="sm"
                    center
                    icon={
                        <ThemeIcon color="teal" size={20} radius="xl">
                            <IconCircleCheck style={{ width: '70%', height: '70%' }} />
                        </ThemeIcon>
                    }
                >
                    {benefits.map((benefit) => (
                        <List.Item key={benefit.id}>
                            {/* Mostrar el valor o una descripción basada en el tipo */}
                            {/* TODO: Mejorar la visualización según el 'benefit.type' */}
                            <Text fw={500} span>
                                {benefit.type === 'POINTS_MULTIPLIER' ? `Multiplicador x${benefit.value}` :
                                 benefit.type === 'EXCLUSIVE_REWARD_ACCESS' ? `Acceso a Recompensa Exclusiva (ID: ${benefit.value})` :
                                 benefit.value} {/* Mostrar valor para CUSTOM o como fallback */}
                            </Text>
                            {benefit.description && (
                                <Text size="xs" c="dimmed" display="block">
                                    {benefit.description}
                                </Text>
                            )}
                        </List.Item>
                    ))}
                </List>
            </Stack>
        </Paper>
    );
};

export default TierBenefitsDisplay;

// End of File: frontend/src/components/customer/TierBenefitsDisplay.tsx