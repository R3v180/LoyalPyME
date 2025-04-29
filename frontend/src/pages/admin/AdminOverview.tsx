// filename: frontend/src/pages/admin/AdminOverview.tsx
import { useEffect, useState } from 'react';
import {
    Container, Title, Text, SimpleGrid, Card, Button, Group, Stack,
    Loader, Alert
} from '@mantine/core';
import {
    IconGift, IconStairsUp, IconQrcode, IconUsers, IconSettings,
    IconUserPlus, IconTicket, IconAlertCircle
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Importar el hook de estadísticas
import { useAdminOverviewStats } from '../../hooks/useAdminOverviewStats';
// Importar el componente StatCard
import StatCard from '../../components/admin/StatCard';


function AdminOverview() {
    const { t } = useTranslation();
    const [adminName, setAdminName] = useState<string | null>(null);
    const [businessName, setBusinessName] = useState<string | null>(null);

    const {
        statsData,
        loadingStats,
        errorStats,
        newCustomersTrend,
        pointsIssuedTrend,
        rewardsRedeemedTrend,
    } = useAdminOverviewStats();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setAdminName(parsedUser.name || parsedUser.email || 'Admin');
                // Intenta obtener el nombre del negocio de diferentes posibles ubicaciones
                setBusinessName(parsedUser.business?.name || parsedUser.businessName || t('adminOverview.defaultBusinessName', 'tu Negocio'));
            } catch (e) {
                console.error("Error parsing user data for admin overview", e);
                setAdminName('Admin');
                setBusinessName(t('adminOverview.defaultBusinessName', 'tu Negocio'));
            }
        } else {
            setAdminName('Admin');
            setBusinessName(t('adminOverview.defaultBusinessName', 'tu Negocio'));
        }
    }, [t]); // Añadir t como dependencia por si la clave default cambia

    const routes = {
        rewards: '/admin/dashboard/rewards',
        generateQr: '/admin/dashboard/generate-qr',
        manageTiers: '/admin/dashboard/tiers/manage',
        settingsTiers: '/admin/dashboard/tiers/settings',
        customers: '/admin/dashboard/customers',
    };

    return (
        <Container size="lg" mt="md">
            <Stack gap="xl">
                {/* Saludo e Intro */}
                <Title order={2}>{t('adminOverview.welcome', { name: adminName || 'Admin' })}</Title>
                <Text fz="lg">
                    {t('adminOverview.panelIntro')}{' '}
                    <Text span fw={700}>{businessName || '...'}</Text>.
                </Text>
                <Text c="dimmed">
                    {t('adminOverview.panelDescription')}
                </Text>

                {/* Sección Estadísticas Clave */}
                <Title order={3} mt="lg">{t('adminOverview.quickSummaryTitle')}</Title>
                {loadingStats && (
                    <Group justify="center" p="lg"><Loader /></Group>
                )}
                {errorStats && !loadingStats && (
                    <Alert title={t('common.errorLoadingData')} color="red" icon={<IconAlertCircle size={18} />}>
                        {errorStats}
                    </Alert>
                )}
                {!loadingStats && !errorStats && statsData && (
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
                        <StatCard
                            title={t('adminOverview.statActiveCustomers')}
                            value={statsData.totalActiveCustomers}
                            icon={<IconUsers size={24} stroke={1.5} />}
                            loading={loadingStats}
                            color="blue"
                        />
                        <StatCard
                            title={t('adminOverview.statNewCustomers')}
                            value={statsData.newCustomersLast7Days}
                            icon={<IconUserPlus size={24} stroke={1.5} />}
                            loading={loadingStats}
                            color="teal"
                            trendValue={newCustomersTrend.trendValue}
                            trendDirection={newCustomersTrend.trendDirection}
                        />
                        <StatCard
                            title={t('adminOverview.statPointsIssued')}
                            value={statsData.pointsIssuedLast7Days}
                            icon={<IconTicket size={24} stroke={1.5} />}
                            loading={loadingStats}
                            color="grape"
                            trendValue={pointsIssuedTrend.trendValue}
                            trendDirection={pointsIssuedTrend.trendDirection}
                        />
                        <StatCard
                            title={t('adminOverview.statRedemptions')}
                            value={statsData.rewardsRedeemedLast7Days}
                            icon={<IconGift size={24} stroke={1.5} />}
                            loading={loadingStats}
                            color="orange"
                            trendValue={rewardsRedeemedTrend.trendValue}
                            trendDirection={rewardsRedeemedTrend.trendDirection}
                        />
                    </SimpleGrid>
                )}
                {!loadingStats && !errorStats && !statsData && (
                    <Text c="dimmed" ta="center">{t('adminOverview.noStatsAvailable')}</Text>
                )}

                {/* Sección Accesos Rápidos */}
                <Title order={3} mt="lg">{t('adminOverview.quickAccessTitle')}</Title>
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Group justify="space-between" mt="md" mb="xs">
                            <Text fw={500}>{t('adminOverview.cardRewardsTitle')}</Text>
                            <IconGift size={24} stroke={1.5} />
                        </Group>
                        <Text size="sm" c="dimmed">
                            {t('adminOverview.cardRewardsDesc')}
                        </Text>
                        <Button variant="light" color="blue" fullWidth mt="md" radius="md" component={Link} to={routes.rewards}>
                            {t('adminOverview.cardRewardsButton')}
                        </Button>
                    </Card>
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Group justify="space-between" mt="md" mb="xs">
                            <Text fw={500}>{t('adminOverview.cardTiersTitle')}</Text>
                            <IconStairsUp size={24} stroke={1.5} />
                        </Group>
                        <Text size="sm" c="dimmed">
                            {t('adminOverview.cardTiersDesc')}
                        </Text>
                        <Button variant="light" color="teal" fullWidth mt="md" radius="md" component={Link} to={routes.manageTiers}>
                            {t('adminOverview.cardTiersButton')}
                        </Button>
                    </Card>
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Group justify="space-between" mt="md" mb="xs">
                            <Text fw={500}>{t('adminOverview.cardTierSettingsTitle')}</Text>
                            <IconSettings size={24} stroke={1.5} />
                        </Group>
                        <Text size="sm" c="dimmed">
                            {t('adminOverview.cardTierSettingsDesc')}
                        </Text>
                        <Button variant="light" color="orange" fullWidth mt="md" radius="md" component={Link} to={routes.settingsTiers}>
                            {t('adminOverview.cardTierSettingsButton')}
                        </Button>
                    </Card>
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Group justify="space-between" mt="md" mb="xs">
                            <Text fw={500}>{t('adminOverview.cardQrTitle')}</Text>
                            <IconQrcode size={24} stroke={1.5} />
                        </Group>
                        <Text size="sm" c="dimmed">
                            {t('adminOverview.cardQrDesc')}
                        </Text>
                        <Button variant="light" color="grape" fullWidth mt="md" radius="md" component={Link} to={routes.generateQr}>
                            {t('adminOverview.cardQrButton')}
                        </Button>
                    </Card>
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Group justify="space-between" mt="md" mb="xs">
                            <Text fw={500}>{t('adminOverview.cardCustomersTitle')}</Text>
                            <IconUsers size={24} stroke={1.5} />
                        </Group>
                        <Text size="sm" c="dimmed">
                            {t('adminOverview.cardCustomersDesc')}
                        </Text>
                        <Button variant="light" color="indigo" fullWidth mt="md" radius="md" component={Link} to={routes.customers}>
                            {t('adminOverview.cardCustomersButton')}
                        </Button>
                    </Card>
                </SimpleGrid>
            </Stack>
        </Container>
    );
}

export default AdminOverview;