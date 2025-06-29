// frontend/src/modules/loyalpyme/components/customer/AvailableCouponsList.tsx
// NEW COMPONENT - Version 1.0.0

import React from 'react';
import { SimpleGrid, Paper, Text, Group, ThemeIcon, Stack, Alert } from '@mantine/core';
import { IconTicket, IconAlertCircle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { GrantedReward } from '../../../../shared/types/user.types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AvailableCouponsListProps {
    coupons: GrantedReward[];
    loading: boolean;
    error: string | null;
}

const AvailableCouponsList: React.FC<AvailableCouponsListProps> = ({ coupons, loading, error }) => {
    const { t, i18n } = useTranslation();

    if (loading) {
        return <Text>{t('common.loading', 'Cargando...')}</Text>;
    }

    if (error) {
        return (
            <Alert title={t('common.error')} color="red" icon={<IconAlertCircle size="1rem" />}>
                {error}
            </Alert>
        );
    }

    if (coupons.length === 0) {
        return (
            <Paper withBorder p="lg" radius="md" style={{ borderStyle: 'dashed' }}>
                <Text c="dimmed" ta="center">
                    {t('customerDashboard.noAvailableCoupons', 'No tienes cupones disponibles. ¡Canjea tus puntos en el catálogo para obtenerlos!')}
                </Text>
            </Paper>
        );
    }

    return (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {coupons.map((coupon) => (
                <Paper key={coupon.id} withBorder p="md" radius="md">
                    <Group wrap="nowrap" align="flex-start">
                        <ThemeIcon size="lg" variant="light" radius="md">
                            <IconTicket size={24} />
                        </ThemeIcon>
                        <Stack gap={0}>
                            <Text fw={500}>{i18n.language === 'es' ? coupon.reward.name_es : coupon.reward.name_en}</Text>
                            <Text size="sm" c="dimmed">
                                {i18n.language === 'es' ? coupon.reward.description_es : coupon.reward.description_en}
                            </Text>
                            {coupon.expiresAt && (
                                <Text size="xs" c="dimmed" mt="xs">
                                    {t('customerDashboard.couponExpires', 'Caduca el:')} {format(new Date(coupon.expiresAt), 'dd/MM/yyyy', { locale: es })}
                                </Text>
                            )}
                        </Stack>
                    </Group>
                </Paper>
            ))}
        </SimpleGrid>
    );
};

export default AvailableCouponsList;