// frontend/src/modules/loyalpyme/components/customer/NextTierPreview.tsx
// Version 1.0.2 - Corrected type import path

import React from 'react';
import { Title, List, ThemeIcon, Text, Stack, Box } from '@mantine/core';
import { IconSparkles } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

// --- CORRECCIÓN DE RUTA ---
import { TierBenefitData } from '../../../../shared/types/user.types';
// --- FIN CORRECCIÓN ---


interface NextTierPreviewProps {
    nextTierName: string;
    nextTierBenefits: TierBenefitData[];
}

const NextTierPreview: React.FC<NextTierPreviewProps> = ({ nextTierName, nextTierBenefits }) => {
    const { t } = useTranslation();

    if (!nextTierBenefits || nextTierBenefits.length === 0) {
        return null;
    }

    const formatBenefitText = (benefit: TierBenefitData) => {
        switch (benefit.type) {
            case 'POINTS_MULTIPLIER':
                return <>{t('benefits.pointsMultiplier', { value: benefit.value })}</>;
            case 'EXCLUSIVE_REWARD_ACCESS':
                return <>{t('benefits.exclusiveRewardAccess', { value: benefit.value })}</>;
            case 'CUSTOM_BENEFIT':
            default:
                return benefit.value;
        }
    }

    return (
        <Box mt="xl">
            <Stack gap="md">
                <Title order={5} c="dimmed">
                    {t('customerDashboard.nextTierBenefitsTitle', { tierName: nextTierName })}
                </Title>

                <List
                    spacing="sm"
                    size="sm"
                    center
                    icon={
                        <ThemeIcon color="gray" variant='light' size={24} radius="xl">
                            <IconSparkles style={{ width: '70%', height: '70%' }} />
                        </ThemeIcon>
                    }
                >
                    {nextTierBenefits.map((benefit) => (
                        <List.Item key={benefit.id}>
                            <Text span c="dimmed">
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
        </Box>
    );
};

export default NextTierPreview;