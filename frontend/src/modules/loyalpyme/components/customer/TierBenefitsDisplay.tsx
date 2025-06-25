// filename: frontend/src/components/customer/TierBenefitsDisplay.tsx
// Version: 1.0.2 (Use i18n key for title)

import React from 'react';
import { Paper, Title, List, ThemeIcon, Text, Stack } from '@mantine/core';
import { IconCircleCheck } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

// Importar el tipo desde el archivo de tipos compartido
import { TierBenefitData } from '../../types/customer';

// --- Props del Componente ---
interface TierBenefitsDisplayProps {
    tierName: string;
    benefits: TierBenefitData[];
}
// --- Fin Props ---

const TierBenefitsDisplay: React.FC<TierBenefitsDisplayProps> = ({ tierName, benefits }) => {
    const { t } = useTranslation();

    if (!benefits || benefits.length === 0) {
        return null;
    }

    return (
        <Paper shadow="sm" p="lg" mt="xl" mb="xl" withBorder radius="lg">
            <Stack gap="md">
                {/* --- MODIFICACIÓN: Usar t() para el título --- */}
                <Title order={4}>
                    {t('customerDashboard.tierBenefitsTitle', { tierName })}
                </Title>
                {/* --- FIN MODIFICACIÓN --- */}

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
                            {/* TODO: Mejorar la visualización según el 'benefit.type' */}
                            <Text fw={500} span>
                                {benefit.type === 'POINTS_MULTIPLIER' ? `Multiplicador x${benefit.value}` :
                                 benefit.type === 'EXCLUSIVE_REWARD_ACCESS' ? `Acceso a Recompensa Exclusiva (ID: ${benefit.value})` :
                                 benefit.value}
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