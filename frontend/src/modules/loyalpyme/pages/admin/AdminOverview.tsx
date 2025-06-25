// frontend/src/pages/admin/AdminOverview.tsx
import { useEffect, useState, FC } from 'react';
import {
    Container, Title, Text, SimpleGrid, Card, Button, Group, Stack,
    Loader, Alert
} from '@mantine/core';
import {
    IconGift, IconStairsUp, IconQrcode, IconUsers, IconSettings,
    IconUserPlus, IconTicket, IconAlertCircle, IconToolsKitchen
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAdminOverviewStats } from '../../hooks/useAdminOverviewStats';
import StatCard from '../../components/admin/StatCard';
import { useLayoutUserData } from '../../../../shared/hooks/useLayoutUserData';

const AdminOverview: FC = () => {
    const { t } = useTranslation();
    const { userData: layoutUserData, loadingUser: loadingLayoutUser } = useLayoutUserData();
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
        if (layoutUserData) {
            setAdminName(layoutUserData.name || layoutUserData.email || t('adminCommon.adminTitle'));
            // Como discutimos, /api/profile no devuelve el nombre del negocio directamente en layoutUserData.
            // Si quisieras el nombre real del negocio aquí, necesitarías:
            // 1. Que /api/profile (auth.middleware.ts) añada business.name a req.user
            // 2. O hacer una llamada API separada aquí para obtener los detalles del layoutUserData.businessId
            // Por ahora, mantenemos el placeholder.
            setBusinessName(t('adminOverview.defaultBusinessName'));
        } else if (!loadingLayoutUser) {
            setAdminName(t('adminCommon.adminTitle'));
            setBusinessName(t('adminOverview.defaultBusinessName'));
        }
    }, [layoutUserData, loadingLayoutUser, t]);

    const routes = {
        rewards: '/admin/dashboard/rewards',
        generateQr: '/admin/dashboard/generate-qr',
        manageTiers: '/admin/dashboard/tiers/manage',
        settingsTiers: '/admin/dashboard/tiers/settings',
        customers: '/admin/dashboard/customers',
        camareroMenuEditor: "/admin/dashboard/camarero/menu-editor", // Ruta actualizada
    };

    const isLoadingPage = loadingLayoutUser || loadingStats;

    const quickAccessCards = [
        {
            titleKey: 'adminOverview.cardRewardsTitle',
            descriptionKey: 'adminOverview.cardRewardsDesc',
            buttonTextKey: 'adminOverview.cardRewardsButton',
            icon: IconGift,
            color: 'blue',
            to: routes.rewards,
            showCondition: layoutUserData?.isLoyaltyCoreActive === true,
        },
        {
            titleKey: 'adminOverview.cardTiersTitle',
            descriptionKey: 'adminOverview.cardTiersDesc',
            buttonTextKey: 'adminOverview.cardTiersButton',
            icon: IconStairsUp,
            color: 'teal',
            to: routes.manageTiers,
            showCondition: layoutUserData?.isLoyaltyCoreActive === true,
        },
        {
            titleKey: 'adminOverview.cardTierSettingsTitle',
            descriptionKey: 'adminOverview.cardTierSettingsDesc',
            buttonTextKey: 'adminOverview.cardTierSettingsButton',
            icon: IconSettings,
            color: 'orange',
            to: routes.settingsTiers,
            showCondition: layoutUserData?.isLoyaltyCoreActive === true,
        },
        {
            titleKey: 'adminOverview.cardQrTitle',
            descriptionKey: 'adminOverview.cardQrDesc',
            buttonTextKey: 'adminOverview.cardQrButton',
            icon: IconQrcode,
            color: 'grape',
            to: routes.generateQr,
            showCondition: layoutUserData?.isLoyaltyCoreActive === true,
        },
        {
            titleKey: 'adminOverview.cardCustomersTitle',
            descriptionKey: 'adminOverview.cardCustomersDesc',
            buttonTextKey: 'adminOverview.cardCustomersButton',
            icon: IconUsers,
            color: 'indigo',
            to: routes.customers,
            showCondition: layoutUserData?.isLoyaltyCoreActive === true || layoutUserData?.isCamareroActive === true,
        },
        // Tarjeta para Gestión de Menú del Módulo Camarero
        {
            titleKey: 'adminCamarero.manageMenu.title', // Usar clave de título de página para consistencia
            descriptionKey: 'adminCamarero.cardMenuDesc', // Clave para descripción de la tarjeta
            buttonTextKey: 'adminCamarero.cardMenuButton', // Clave para texto del botón
            icon: IconToolsKitchen,
            color: 'lime',
            to: routes.camareroMenuEditor, // Ruta correcta
            showCondition: layoutUserData?.isCamareroActive === true,
        },
    ];

    if (isLoadingPage && !statsData && !layoutUserData) {
        return <Container size="lg" mt="md"><Group justify="center" p="xl"><Loader /></Group></Container>;
    }

    return (
        <Container size="lg" mt="md">
            <Stack gap="xl">
                <Title order={2}>{t('adminOverview.welcome', { name: adminName || t('adminCommon.adminTitle') })}</Title>
                <Text fz="lg">
                    {t('adminOverview.panelIntro')}{' '}
                    <Text span fw={700}>{businessName || '...'}</Text>.
                </Text>
                <Text c="dimmed">{t('adminOverview.panelDescription')}</Text>

                <Title order={3} mt="lg">{t('adminOverview.quickSummaryTitle')}</Title>
                {loadingStats && !statsData && ( <Group justify="center" p="lg"><Loader size="sm" /></Group> )}
                {errorStats && !loadingStats && ( <Alert title={t('common.errorLoadingData')} color="red" icon={<IconAlertCircle size={18} />}>{errorStats}</Alert> )}
                {!loadingStats && !errorStats && statsData && (
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
                        <StatCard title={t('adminOverview.statActiveCustomers')} value={statsData.totalActiveCustomers} icon={<IconUsers size={24} stroke={1.5} />} color="blue" />
                        <StatCard title={t('adminOverview.statNewCustomers')} value={statsData.newCustomersLast7Days} icon={<IconUserPlus size={24} stroke={1.5} />} color="teal" trendValue={newCustomersTrend.trendValue} trendDirection={newCustomersTrend.trendDirection} />
                        <StatCard title={t('adminOverview.statPointsIssued')} value={statsData.pointsIssuedLast7Days} icon={<IconTicket size={24} stroke={1.5} />} color="grape" trendValue={pointsIssuedTrend.trendValue} trendDirection={pointsIssuedTrend.trendDirection} />
                        <StatCard title={t('adminOverview.statRedemptions')} value={statsData.rewardsRedeemedLast7Days} icon={<IconGift size={24} stroke={1.5} />} color="orange" trendValue={rewardsRedeemedTrend.trendValue} trendDirection={rewardsRedeemedTrend.trendDirection} />
                    </SimpleGrid>
                )}
                {!loadingStats && !errorStats && !statsData && ( <Text c="dimmed" ta="center">{t('adminOverview.noStatsAvailable')}</Text> )}

                <Title order={3} mt="lg">{t('adminOverview.quickAccessTitle')}</Title>
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                    {quickAccessCards.filter(card => card.showCondition).map((card) => (
                        <Card shadow="sm" padding="lg" radius="md" withBorder key={card.to}>
                            <Group justify="space-between" mt="md" mb="xs">
                                <Text fw={500}>{t(card.titleKey)}</Text>
                                <card.icon size={24} stroke={1.5} />
                            </Group>
                            <Text size="sm" c="dimmed">{t(card.descriptionKey)}</Text>
                            <Button variant="light" color={card.color} fullWidth mt="md" radius="md" component={Link} to={card.to}>
                                {t(card.buttonTextKey)}
                            </Button>
                        </Card>
                    ))}
                </SimpleGrid>
                {quickAccessCards.filter(card => card.showCondition).length === 0 && !isLoadingPage && (
                    <Text c="dimmed" ta="center">{t('adminOverview.noModulesActivePrompt')}</Text>
                )}
            </Stack>
        </Container>
    );
};

export default AdminOverview;