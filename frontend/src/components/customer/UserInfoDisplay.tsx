// filename: frontend/src/components/customer/UserInfoDisplay.tsx
// Version: 1.4.2 (Remove invalid stroke prop from manual SVG icon)

import React from 'react';
import {
    Paper, Stack, Skeleton, Title, Text, Group, Badge, Alert,
    List, ThemeIcon, Divider, Progress, Box, Grid // Asegúrate que Grid está importado
} from '@mantine/core';
import {
    IconUserCircle, IconAlertCircle, IconAward, IconPercentage, IconLock
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { UserData, TierBenefitData } from '../../types/customer';

// Props actualizadas
interface UserInfoDisplayProps {
    userData: UserData | null;
    loadingUser: boolean;
    errorUser: string | null;
    progressBarData: {
        type: 'progress';
        percentage: number;
        currentValueLabel: string;
        targetValueLabel: string;
        unit: string;
        nextTierName: string;
    } | {
        type: 'max_level';
        currentTierName: string;
    } | null;
    benefits?: TierBenefitData[];
    nextTierName?: string | null;
    nextTierBenefits?: TierBenefitData[];
}

const UserInfoDisplay: React.FC<UserInfoDisplayProps> = ({
    userData,
    loadingUser,
    errorUser,
    progressBarData,
    benefits,
    nextTierName,
    nextTierBenefits
}) => {
    const { t } = useTranslation();

    const shouldShowBenefits = !loadingUser && benefits && benefits.length > 0;
    const shouldShowNextTierPreview = !loadingUser && nextTierName && nextTierBenefits && nextTierBenefits.length > 0;

    // Helper para icono de beneficio actual
    const getBenefitIcon = (type: string): React.ReactNode => {
        switch (type) {
            case 'POINTS_MULTIPLIER':
                return <IconPercentage style={{ width: '70%', height: '70%' }} />;
            case 'EXCLUSIVE_REWARD_ACCESS':
                return <IconLock style={{ width: '70%', height: '70%' }} />;
            case 'CUSTOM_BENEFIT':
            default:
                return <IconAward style={{ width: '70%', height: '70%' }} />;
        }
    };

    // Helper para texto de beneficio
    const formatBenefitText = (benefit: TierBenefitData): React.ReactNode => {
        switch (benefit.type) {
            case 'POINTS_MULTIPLIER':
                return <>Multiplicador de Puntos: <Text span fw={700}>x{benefit.value}</Text></>;
            case 'EXCLUSIVE_REWARD_ACCESS':
                return <>Acceso Exclusivo: <Text span fw={500}>Recompensa ID {benefit.value}</Text></>;
            case 'CUSTOM_BENEFIT':
            default:
                return benefit.value;
        }
    }

    // Helper para icono de beneficio futuro (usando IconSparkles local)
    const getNextBenefitIcon = (): React.ReactNode => {
         return (
             <ThemeIcon color="gray" variant='light' size={24} radius="xl">
                 <IconSparkles style={{ width: '70%', height: '70%' }} />
             </ThemeIcon>
         );
    };


    return (
        <Paper shadow="sm" p="lg" withBorder radius="lg">
            {loadingUser ? (
                 <Stack w="100%">
                    {/* Skeletons */}
                    <Skeleton height={30} width="60%" />
                    <Skeleton height={50} width="40%" />
                    <Skeleton height={25} width="30%" mt="sm" />
                    <Skeleton height={20} width="80%" mt="md" />
                    <Skeleton height={20} width="50%" mt="lg" />
                    <Skeleton height={15} width="70%" mt="xs" />
                </Stack>
            ) : userData ? (
                <Stack gap="md">
                    {/* Info básica usuario + Nivel Actual */}
                     <Group justify="space-between" align="flex-start" wrap="nowrap">
                         {/* ... (info usuario) ... */}
                         <Stack gap={4}>
                             <Title order={3} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                 <IconUserCircle size={28} stroke={1.5} />
                                 {userData.name || userData.email}
                             </Title>
                             <Text size="xl" fw={700} c="blue" ml={36}>
                                 {userData.points} {t('customerDashboard.points')}
                             </Text>
                         </Stack>
                         <Stack align="flex-end" gap={4}>
                            <Text size="sm" fw={500} >{t('customerDashboard.currentTier')}</Text>
                             {userData.currentTier ? (
                                 <Badge color="teal" size="lg" variant="light" radius="sm">
                                     {userData.currentTier.name}
                                 </Badge>
                             ) : (
                                 <Badge color="gray" size="lg" variant="light" radius="sm">
                                     {t('customerDashboard.baseTier')}
                                 </Badge>
                             )}
                         </Stack>
                    </Group>

                    {/* Barra de Progreso o Mensaje Nivel Máximo */}
                    <Box mt="xs">
                        { progressBarData?.type === 'progress' && ( <Stack gap="xs"> <Progress value={progressBarData.percentage} size="lg" radius="xl" striped animated /> <Text ta="center" size="sm" c="dimmed">{t('customerDashboard.progressLabel', { currentValue: progressBarData.currentValueLabel, targetValue: progressBarData.targetValueLabel, unit: progressBarData.unit, nextTierName: progressBarData.nextTierName })}</Text> </Stack> )}
                        { progressBarData?.type === 'max_level' && ( <Stack gap="xs"> <Progress value={100} size="lg" radius="xl" color="teal"/> <Text ta="center" size="sm" fw={500} c="teal">{t('customerDashboard.maxLevelReachedShort', '¡Nivel Máximo Alcanzado!')}</Text> </Stack> )}
                    </Box>

                    {/* =========================================================== */}
                    {/* ======= VERIFICA QUE ESTA SECCIÓN ES IDÉNTICA ========= */}
                    {/* =========================================================== */}
                    { (shouldShowBenefits || shouldShowNextTierPreview) && (
                        <>
                            <Divider my="sm" />
                            <Grid gutter="lg"> {/* <-- INICIO GRID ANIDADO */}
                                {/* Columna Beneficios Actuales */}
                                <Grid.Col span={{ base: 12, sm: 6 }}>
                                    {shouldShowBenefits && (
                                        <Stack gap="sm">
                                            <Title order={5}>
                                                {t('customerDashboard.tierBenefitsTitle', { tierName: userData.currentTier?.name || '?' })}
                                            </Title>
                                            <List spacing="sm" size="sm" center>
                                                {benefits?.map((benefit) => (
                                                    <List.Item
                                                        key={benefit.id}
                                                        icon={
                                                            <ThemeIcon color="teal" size={24} radius="xl">
                                                                {getBenefitIcon(benefit.type)}
                                                            </ThemeIcon>
                                                        }
                                                    >
                                                        <Text span>{formatBenefitText(benefit)}</Text>
                                                        {benefit.description && (
                                                            <Text size="xs" c="dimmed" display="block">
                                                                {benefit.description}
                                                            </Text>
                                                        )}
                                                    </List.Item>
                                                ))}
                                            </List>
                                        </Stack>
                                    )}
                                </Grid.Col>

                                {/* Columna Preview Siguiente Nivel */}
                                <Grid.Col span={{ base: 12, sm: 6 }}>
                                    {shouldShowNextTierPreview && nextTierName && nextTierBenefits && (
                                        <Stack gap="sm">
                                            <Title order={5} c="dimmed">
                                                {t('customerDashboard.nextTierBenefitsTitle', { tierName: nextTierName })}
                                            </Title>
                                            <List
                                                spacing="sm"
                                                size="sm"
                                                center
                                                icon={getNextBenefitIcon()}
                                            >
                                                {nextTierBenefits.map((benefit) => (
                                                    <List.Item key={`next-${benefit.id}`}>
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
                                    )}
                                </Grid.Col>
                            </Grid> {/* <-- FIN GRID ANIDADO */}
                        </>
                    )}
                    {/* =========================================================== */}
                    {/* =========================================================== */}

                </Stack>
            ) : (
                <Alert
                    icon={<IconAlertCircle size="1rem" />}
                    title={t('customerDashboard.errorLoadingProfileTitle')}
                    color="red"
                >
                    {errorUser || t('customerDashboard.errorLoadingProfileDefault')}
                </Alert>
            )}
        </Paper>
    );
};

// Componente SVG local para IconSparkles (corregido)
const IconSparkles = (props: { style?: React.CSSProperties }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" style={props.style}>
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6z" />
  </svg>
);


export default UserInfoDisplay;

// End of File: frontend/src/components/customer/UserInfoDisplay.tsx