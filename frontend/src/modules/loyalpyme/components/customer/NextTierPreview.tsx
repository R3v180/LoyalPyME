// filename: frontend/src/components/customer/NextTierPreview.tsx
// Version: 1.0.1 (Remove unused imports/function, use i18n for title)

import React from 'react';
// --- MODIFICACIÓN: Quitar Paper ---
import { Title, List, ThemeIcon, Text, Stack, Box } from '@mantine/core';
// --- MODIFICACIÓN: Quitar iconos no usados ---
import { IconSparkles } from '@tabler/icons-react'; // Mantenemos IconSparkles
// --- FIN MODIFICACIÓN ---
import { useTranslation } from 'react-i18next';

// Importar el tipo desde el archivo de tipos compartido
import { TierBenefitData } from '../../types/customer';

// --- Props del Componente ---
interface NextTierPreviewProps {
    nextTierName: string;
    nextTierBenefits: TierBenefitData[];
}
// --- Fin Props ---

const NextTierPreview: React.FC<NextTierPreviewProps> = ({ nextTierName, nextTierBenefits }) => {
    const { t } = useTranslation(); // Ahora sí se usa t

    if (!nextTierBenefits || nextTierBenefits.length === 0) {
        return null;
    }

    // --- ELIMINADO: Función getBenefitIcon eliminada ---
    // const getBenefitIcon = (type: string) => { ... };
    // --- FIN ELIMINADO ---

    // Función helper para formatear texto de beneficio (se mantiene)
    const formatBenefitText = (benefit: TierBenefitData) => {
        switch (benefit.type) {
            case 'POINTS_MULTIPLIER':
                // TODO: Usar clave i18n
                return <>Multiplicador de Puntos: <Text span fw={700}>x{benefit.value}</Text></>;
            case 'EXCLUSIVE_REWARD_ACCESS':
                 // TODO: Usar clave i18n
                return <>Acceso Exclusivo: <Text span fw={500}>Recompensa ID {benefit.value}</Text></>;
            case 'CUSTOM_BENEFIT':
            default:
                return benefit.value;
        }
    }

    return (
        <Box mt="xl">
            <Stack gap="md">
                {/* --- MODIFICACIÓN: Usar t() para el título --- */}
                <Title order={5} c="dimmed">
                    {t('customerDashboard.nextTierBenefitsTitle', { tierName: nextTierName })}
                    {/* Asegúrate que la clave 'customerDashboard.nextTierBenefitsTitle' existe en tus JSON con valor tipo: "Al alcanzar {{tierName}} tendrás:" */}
                </Title>
                {/* --- FIN MODIFICACIÓN --- */}

                {/* Lista de beneficios futuros */}
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

// End of File: frontend/src/components/customer/NextTierPreview.tsx