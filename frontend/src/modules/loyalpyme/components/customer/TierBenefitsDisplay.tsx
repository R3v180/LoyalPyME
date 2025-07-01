// frontend/src/modules/loyalpyme/components/customer/TierBenefitsDisplay.tsx
// Version 1.0.3 - Corrected type import path and implemented benefit text formatting.

import React from 'react';
import { Paper, Title, List, ThemeIcon, Text, Stack } from '@mantine/core';
import { IconCircleCheck } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

// --- CORRECCIÓN DE RUTA ---
import { TierBenefitData } from '../../../../shared/types/user.types';
// --- FIN CORRECCIÓN ---

interface TierBenefitsDisplayProps {
    tierName: string;
    benefits: TierBenefitData[];
}

const TierBenefitsDisplay: React.FC<TierBenefitsDisplayProps> = ({ tierName, benefits }) => {
    const { t } = useTranslation();

    if (!benefits || benefits.length === 0) {
        return null;
    }
    
    // --- LÓGICA MEJORADA PARA MOSTRAR BENEFICIOS ---
    const formatBenefitText = (benefit: TierBenefitData) => {
        switch (benefit.type) {
            case 'POINTS_MULTIPLIER':
                return t('benefits.pointsMultiplier', { value: benefit.value });
            case 'EXCLUSIVE_REWARD_ACCESS':
                return t('benefits.exclusiveRewardAccess', { value: benefit.value });
            case 'CUSTOM_BENEFIT':
            default:
                return benefit.value;
        }
    };
    // --- FIN LÓGICA MEJORADA ---

    return (
        <Paper shadow="sm" p="lg" mt="xl" mb="xl" withBorder radius="lg">
            <Stack gap="md">
                <Title order={4}>
                    {t('customerDashboard.tierBenefitsTitle', { tierName })}
                </Title>

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
                            <Text fw={500} span>
                                {formatBenefitText(benefit)}
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