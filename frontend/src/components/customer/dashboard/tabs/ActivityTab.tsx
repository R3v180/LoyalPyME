// filename: frontend/src/components/customer/dashboard/tabs/ActivityTab.tsx
// Version: 2.0.2 (Add explicit type annotation to map callback to satisfy TS6133)

import React from 'react';
import {
    Stack, Loader, Alert, Text, Pagination, Group, Box,
    Timeline, ThemeIcon, Badge,
    Title
} from '@mantine/core';
import {
    IconAlertCircle, IconGift, IconReceipt, IconTicket, IconAdjustments
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useCustomerActivity } from '../../../../hooks/useCustomerActivity';
// Importación de tipos sin cambios (type import sigue siendo bueno)
import type { ActivityLogItem } from '../../../../types/customer';
import { ActivityType } from '../../../../types/customer';


const ActivityTab: React.FC = () => {
    const { t, i18n } = useTranslation();
    const {
        activityLogs,
        loading,
        error,
        currentPage,
        totalPages,
        totalItems,
        setPage,
        // refetch
    } = useCustomerActivity();

    // Función para obtener icono y color (sin cambios)
    const getActivityVisuals = (type: ActivityType): { icon: React.ReactNode; color: string } => {
        switch (type) {
            case 'POINTS_EARNED_QR': return { icon: <IconTicket size={12} />, color: 'green' };
            case 'POINTS_REDEEMED_REWARD': return { icon: <IconReceipt size={12} />, color: 'blue' };
            case 'GIFT_REDEEMED': return { icon: <IconGift size={12} />, color: 'yellow' };
            case 'POINTS_ADJUSTED_ADMIN': return { icon: <IconAdjustments size={12} />, color: 'grape' };
            default: return { icon: <IconTicket size={12} />, color: 'gray' };
        }
    };

    // Función para formatear la fecha (sin cambios)
    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        try { return new Date(dateString).toLocaleString(i18n.language, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return t('common.invalidDate', 'Fecha inválida'); }
    };

    // Contenido principal
    const renderContent = () => {
        if (loading && activityLogs.length === 0) { return <Group justify="center" p="lg"><Loader /></Group>; }
        if (error) { return <Alert title={t('common.error')} color="red" icon={<IconAlertCircle />}>{error}</Alert>; }
        if (activityLogs.length === 0) { return <Text c="dimmed" ta="center">{t('customerDashboard.activityTab.noActivity', 'Aún no tienes actividad registrada.')}</Text>; }

        // Renderizar Timeline si hay datos
        return (
            <Timeline active={-1} bulletSize={20} lineWidth={2}>
                {/* --- ANOTACIÓN DE TIPO AÑADIDA AQUÍ --- */}
                {activityLogs.map((item: ActivityLogItem) => {
                // --- FIN ANOTACIÓN ---
                    const visuals = getActivityVisuals(item.type);
                    const pointsText = item.pointsChanged !== null ? `${item.pointsChanged > 0 ? '+' : ''}${item.pointsChanged}` : null;
                    const pointsColor = item.pointsChanged === null ? 'gray' : (item.pointsChanged > 0 ? 'green' : 'red');
                    return (
                        <Timeline.Item
                            key={item.id}
                            bullet={ <ThemeIcon size={20} variant="light" color={visuals.color} radius="xl"> {visuals.icon} </ThemeIcon> }
                            title={item.description || t(`customerDashboard.activityTab.type_${item.type}`, item.type)}
                        >
                            <Group justify="space-between">
                                <Text c="dimmed" size="xs"> {formatDate(item.createdAt)} </Text>
                                {pointsText && ( <Badge color={pointsColor} variant="light" size="sm"> {pointsText} {t('common.points')} </Badge> )}
                            </Group>
                        </Timeline.Item>
                    );
                })}
            </Timeline>
        );
    };

    return (
        <Stack gap="lg">
            <Title order={3}>{t('customerDashboard.tabActivity', 'Mi Actividad')}</Title>
            <Box style={{ position: 'relative' }}>
                {loading && activityLogs.length > 0 && ( <Box style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.5)', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}> <Loader size="sm" /> </Box> )}
                {renderContent()}
            </Box>
            {totalPages > 1 && !loading && !error && ( <Group justify="center" mt="xl"> <Pagination total={totalPages} value={currentPage} onChange={setPage} disabled={loading} /> </Group> )}
            {totalItems > 0 && !loading && !error && ( <Text size="sm" c="dimmed" ta="center"> {t('customerDashboard.activityTab.totalItems', { count: totalItems })} </Text> )}
        </Stack>
    );
};

export default ActivityTab;