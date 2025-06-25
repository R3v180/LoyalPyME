// frontend/src/pages/admin/camarero/WaiterPickupPage.tsx
import React from 'react';
import {
    Container,
    Title,
    Text,
    Loader,
    Alert,
    Paper,
    Stack,
    Group,
    Button,
    Badge,
    ScrollArea,
    Box,
    useMantineTheme,
    List, // <--- AÑADIDO AQUÍ
} from '@mantine/core';
import {
    IconAlertCircle,
    IconChefHat,
    IconClipboardList,
    IconToolsKitchen,
    IconCircleCheck,
    IconReload,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useWaiterPickupItems } from '../../../hooks/useWaiterPickupItems'; // Ajusta la ruta si es necesario
import type { ReadyPickupItem } from '../../../types/camarero.types';
import { OrderItemStatus } from '../../../../../shared/types/user.types';

const WaiterPickupPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const currentLanguage = i18n.language;
    const theme = useMantineTheme();

    const {
        items,
        isLoadingInitial,
        fetchError,
        markingItemId,
        fetchItems,
        handleMarkAsServed,
    } = useWaiterPickupItems();

    const getItemNameForDisplay = (item: ReadyPickupItem): string => {
        return (currentLanguage === 'es' && item.itemNameSnapshot_es)
            ? item.itemNameSnapshot_es
            : (item.itemNameSnapshot_en || item.itemNameSnapshot_es || t('common.item', 'Ítem'));
    };
    
    const getStatusBadge = (status: OrderItemStatus): React.ReactNode => {
        let color = "gray";
        let textKey = '';
        let IconComponent = IconClipboardList;

        switch (status) {
            case OrderItemStatus.READY:
                color = "lime";
                textKey = 'orderStatusPage.itemStatus.ready';
                IconComponent = IconChefHat;
                break;
            case OrderItemStatus.PREPARING:
                color = "blue";
                textKey = 'orderStatusPage.itemStatus.preparing';
                IconComponent = IconToolsKitchen;
                break;
            default:
                textKey = String(status); 
        }
        return <Badge color={color} leftSection={<IconComponent size={14} />} variant="light">{t(textKey, status)}</Badge>;
    };

    if (isLoadingInitial) {
        return (
            <Container size="lg" py="xl" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)' }}>
                <Loader size="xl" />
            </Container>
        );
    }

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                <Group justify="space-between" align="center">
                    <Title order={2}>
                        {t('waiterInterface.pickupPageTitle', 'Pedidos Listos para Recoger y Servir')}
                    </Title>
                    <Button
                        onClick={() => fetchItems(true)}
                        leftSection={<IconReload size={16} />}
                        variant="outline"
                        loading={isLoadingInitial && items.length > 0}
                        disabled={isLoadingInitial || !!markingItemId}
                    >
                        {t('orderStatusPage.refreshButton', 'Actualizar')}
                    </Button>
                </Group>

                {fetchError && (
                    <Alert
                        icon={<IconAlertCircle size="1rem" />}
                        title={t('common.error')}
                        color="red"
                        radius="md"
                        withCloseButton
                        onClose={() => fetchItems(true)} 
                    >
                        {fetchError}
                    </Alert>
                )}

                {!fetchError && items.length === 0 && (
                    <Paper p="xl" shadow="xs" withBorder mt="xl">
                        <Text ta="center" c="dimmed">
                            {t('waiterInterface.noItemsReady', 'No hay ítems listos para recoger en este momento.')}
                        </Text>
                    </Paper>
                )}

                {items.length > 0 && (
                    <ScrollArea style={{ height: 'calc(100vh - 220px)' }} mt="md">
                        <Stack gap="md">
                            {items.map((item) => (
                                <Paper key={item.orderItemId} shadow="sm" p="md" withBorder radius="md">
                                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                                        <Box style={{ flexGrow: 1 }}>
                                            <Title order={4}>{getItemNameForDisplay(item)}</Title>
                                            <Text size="sm">
                                                {t('kdsPage.quantity', 'Cantidad')}: <Text span fw={700}>{item.quantity}</Text>
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                {t('waiterInterface.orderNumber', 'Pedido')}: #{item.orderNumber}
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                {t('orderStatusPage.table', 'Mesa')}: {item.tableIdentifier || t('kdsPage.noTable', 'Sin Mesa')}
                                            </Text>
                                            {item.kdsDestination && (
                                                <Text size="xs" c="dimmed">
                                                    {t('waiterInterface.pickupFrom', 'Recoger de')}: <Badge variant="outline" size="xs">{item.kdsDestination}</Badge>
                                                </Text>
                                            )}
                                            <Text size="xs" c="dimmed">
                                                {t('kdsPage.createdAt', 'Recibido KDS')}: {new Date(item.orderCreatedAt).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                            {item.currentOrderItemStatus && (
                                                <Box mt={4}>{getStatusBadge(item.currentOrderItemStatus)}</Box>
                                            )}
                                        </Box>
                                        <Button
                                            onClick={() => handleMarkAsServed(item.orderItemId)}
                                            loading={markingItemId === item.orderItemId}
                                            disabled={!!markingItemId && markingItemId !== item.orderItemId}
                                            variant="filled"
                                            color="green"
                                            leftSection={<IconCircleCheck size={18} />}
                                        >
                                            {t('waiterInterface.markAsServedButton', 'Marcar como Servido')}
                                        </Button>
                                    </Group>

                                    {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                                        <Box mt="sm" pt="xs" style={{ borderTop: `1px solid ${theme.colors.gray[3]}` }}>
                                            <Text size="xs" fw={500} mb={2}>{t('kdsPage.modifiers', 'Modificadores:')}</Text>
                                            <List listStyleType="none" spacing={2} size="xs" c="dimmed"> {/* <--- Uso de List */}
                                                {item.selectedModifiers.map((mod, index) => (
                                                    <List.Item key={index}> {/* <--- Uso de List.Item */}
                                                        {(currentLanguage === 'es' && mod.optionName_es) ? mod.optionName_es : (mod.optionName_en || mod.optionName_es)}
                                                    </List.Item>
                                                ))}
                                            </List>
                                        </Box>
                                    )}
                                    {item.itemNotes && (
                                        <Box mt="sm" pt="xs" style={{ borderTop: `1px solid ${theme.colors.gray[3]}` }}>
                                            <Text size="xs" fw={500} mb={2}>{t('kdsPage.notes', 'Notas Ítem')}:</Text>
                                            <Text size="xs" c="orange.7" style={{ whiteSpace: 'pre-wrap' }}>{item.itemNotes}</Text>
                                        </Box>
                                    )}
                                </Paper>
                            ))}
                        </Stack>
                    </ScrollArea>
                )}
            </Stack>
        </Container>
    );
};

export default WaiterPickupPage;