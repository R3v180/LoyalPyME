// frontend/src/pages/admin/camarero/KitchenDisplayPage.tsx
// Version: 1.1.0 (Add action buttons for KDS item status update)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Container,
    Title,
    Text,
    Loader,
    Alert,
    Paper,
    List,
    Stack,
    Group,
    Badge,
    SegmentedControl,
    Box,
    Button,
} from '@mantine/core';
import { 
    IconAlertCircle, 
    IconReload,
    IconCheck, // Añadido para notificaciones
    //IconX,     // Añadido para notificaciones
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { 
    KdsListItem, 
    getItemsForKds, 
    updateOrderItemKdsStatus // Importar función de actualización
} from '../../../services/kdsService'; 
import { OrderItemStatus } from '../../OrderStatusPage'; // Usar enum existente
import { notifications } from '@mantine/notifications'; // Importar notificaciones

// Configuración
const DEFAULT_KDS_DESTINATION = 'COCINA';
const POLLING_INTERVAL_MS = 15000; 

const KitchenDisplayPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [items, setItems] = useState<KdsListItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentDestination, setCurrentDestination] = useState<string>(DEFAULT_KDS_DESTINATION);
    
    const pollingTimeoutRef = useRef<number | null>(null);
    const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

    const fetchKdsItems = useCallback(async (isInitialFetch = false) => {
        if (isInitialFetch) {
            setLoading(true);
            setError(null);
        }
        console.log(`[KDS Page] Fetching items for destination: ${currentDestination}. Initial: ${isInitialFetch}`);
        try {
            const fetchedItems = await getItemsForKds(currentDestination, [
                OrderItemStatus.PENDING_KDS,
                OrderItemStatus.PREPARING,
            ]);
            setItems(fetchedItems);
            if (error && !isInitialFetch) setError(null); 
        } catch (err: any) {
            const errMsg = err.response?.data?.message || err.message || t('common.errorFetchingData');
            setError(errMsg);
            console.error(`[KDS Page] Error fetching KDS items for ${currentDestination}:`, err);
        } finally {
            if (isInitialFetch) {
                setLoading(false);
            }
        }
    }, [currentDestination, t, error]);

    useEffect(() => {
        fetchKdsItems(true); 
    }, [fetchKdsItems]); 

    useEffect(() => {
        if (pollingTimeoutRef.current) {
            clearTimeout(pollingTimeoutRef.current);
        }
        if (!updatingItemId) { // Solo hacer polling si no hay una actualización en curso
            pollingTimeoutRef.current = window.setTimeout(() => {
                console.log(`[KDS Page] Polling for destination: ${currentDestination}...`);
                fetchKdsItems(false); 
            }, POLLING_INTERVAL_MS);
        } else {
            console.log(`[KDS Page] Polling paused due to item update in progress.`);
        }

        return () => {
            if (pollingTimeoutRef.current) {
                clearTimeout(pollingTimeoutRef.current);
                console.log(`[KDS Page] Polling timeout cleared for ${currentDestination}.`);
            }
        };
    }, [items, fetchKdsItems, currentDestination, updatingItemId]); // Añadir updatingItemId a las dependencias

    const getItemName = (item: KdsListItem | undefined): string => {
        if (!item) return t('kdsPage.unknownItem', 'Ítem Desconocido');
        return (i18n.language === 'es' && item.menuItemName_es) ? item.menuItemName_es : (item.menuItemName_en || item.menuItemName_es || t('kdsPage.unknownItem', 'Ítem Desconocido'));
    };

    const getOrderItemDisplayInfo = (status: OrderItemStatus): { textKey: string; color: string } => {
        switch (status) {
            case OrderItemStatus.PENDING_KDS: return { textKey: 'orderStatusPage.itemStatus.pending_kds', color: 'gray' };
            case OrderItemStatus.PREPARING: return { textKey: 'orderStatusPage.itemStatus.preparing', color: 'blue' };
            case OrderItemStatus.READY: return { textKey: 'orderStatusPage.itemStatus.ready', color: 'lime' };
            case OrderItemStatus.SERVED: return { textKey: 'orderStatusPage.itemStatus.served', color: 'green' };
            case OrderItemStatus.CANCELLED: return { textKey: 'orderStatusPage.itemStatus.cancelled', color: 'red' };
            case OrderItemStatus.CANCELLATION_REQUESTED: return { textKey: 'orderStatusPage.itemStatus.cancellation_requested', color: 'orange' };
            default: return { textKey: String(status), color: 'gray' };
        }
    };

    const handleUpdateStatus = async (itemId: string, newStatus: OrderItemStatus) => {
        if (updatingItemId) {
            notifications.show({
                title: t('kdsPage.updateInProgressTitle', 'Actualización en Progreso'),
                message: t('kdsPage.updateInProgressMsg', 'Espera a que finalice la acción actual.'),
                color: 'yellow'
            });
            return;
        }

        const itemBeingUpdated = items.find(i => i.id === itemId);
        const itemNameForNotif = getItemName(itemBeingUpdated);
        const newStatusText = t(`orderStatusPage.itemStatus.${newStatus.toLowerCase()}`, newStatus);

        setUpdatingItemId(itemId);
        try {
            await updateOrderItemKdsStatus(itemId, newStatus);
            notifications.show({
                title: t('kdsPage.statusUpdateSuccessTitle', 'Estado Actualizado'),
                message: t('kdsPage.statusUpdateSuccessMsg', { itemName: itemNameForNotif , status: newStatusText }),
                color: 'green',
                icon: <IconCheck size={18} />
            });
            await fetchKdsItems(false); 
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.message || t('kdsPage.statusUpdateErrorMsg', 'Error al actualizar estado');
            notifications.show({
                title: t('common.error'),
                message: errorMsg,
                color: 'red',
                icon: <IconAlertCircle size={18} />
            });
            console.error(`[KDS Page] Error updating status for item ${itemId} to ${newStatus}:`, err);
        } finally {
            setUpdatingItemId(null);
        }
    };

    if (loading && items.length === 0) { 
        return <Container style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><Loader size="xl" /></Container>;
    }

    return (
        <Container fluid p="md">
            <Stack gap="lg">
                <Title order={2} ta="center">{t('kdsPage.title', 'Pantalla de Cocina (KDS)')} - {currentDestination}</Title>

                <SegmentedControl
                    value={currentDestination}
                    onChange={(value) => {
                        if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
                        setCurrentDestination(value);
                        setItems([]); 
                    }}
                    data={[
                        { label: t('kdsPage.destination.kitchen', 'COCINA'), value: 'COCINA' },
                        { label: t('kdsPage.destination.bar', 'BARRA'), value: 'BARRA' },
                    ]}
                    fullWidth
                    mb="md"
                />

                {error && (
                    <Alert icon={<IconAlertCircle size="1rem" />} title={t('common.error')} color="red" withCloseButton onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {items.length === 0 && !loading && !error && (
                    <Paper p="xl" shadow="xs" withBorder>
                        <Text ta="center" c="dimmed">{t('kdsPage.noItems', 'No hay ítems pendientes para este destino.')}</Text>
                    </Paper>
                )}

                {items.length > 0 && (
                    <List spacing="sm" listStyleType="none">
                        {items.map((item) => {
                            const displayInfo = getOrderItemDisplayInfo(item.status);
                            const isThisItemUpdating = updatingItemId === item.id;
                            const disableOtherItemsActions = !!updatingItemId && !isThisItemUpdating;

                            return (
                                <List.Item key={item.id}>
                                    <Paper withBorder p="md" radius="sm" shadow="xs">
                                        <Group justify="space-between">
                                            <Stack gap={0}>
                                                <Text fw={500} size="lg">{getItemName(item)}</Text>
                                                <Text size="sm" c="dimmed">{t('kdsPage.quantity', 'Cantidad')}: {item.quantity}</Text>
                                                {item.notes && <Text size="xs" c="orange">{t('kdsPage.notes', 'Notas')}: {item.notes}</Text>}
                                                <Text size="xs" c="dimmed">#{item.orderInfo.orderNumber} ({item.orderInfo.tableIdentifier || t('kdsPage.noTable', 'Sin Mesa')})</Text>
                                                 <Text size="xs" c="dimmed">{t('kdsPage.createdAt', 'Recibido KDS')}: {new Date(item.orderInfo.createdAt).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}</Text>
                                            </Stack>
                                            <Badge color={displayInfo.color} variant="filled">
                                                {t(displayInfo.textKey, item.status)}
                                            </Badge>
                                        </Group>
                                        {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                                            <Box mt="xs" pl="sm" style={{ borderLeft: '2px solid #ccc', marginLeft: '4px'}}>
                                                <Text size="xs" fw={500} mb={2}>{t('kdsPage.modifiers', 'Modificadores:')}</Text>
                                                <List listStyleType="disc" size="xs" c="dimmed" spacing={2}>
                                                    {item.selectedModifiers.map((mod, index) => (
                                                        <List.Item key={index}>
                                                            {(i18n.language === 'es' && mod.optionName_es) ? mod.optionName_es : (mod.optionName_en || mod.optionName_es)}
                                                        </List.Item>
                                                    ))}
                                                </List>
                                            </Box>
                                        )}
                                        <Group justify="flex-end" mt="md">
                                            {item.status === OrderItemStatus.PENDING_KDS && (
                                                <Button
                                                    size="xs"
                                                    color="blue"
                                                    onClick={() => handleUpdateStatus(item.id, OrderItemStatus.PREPARING)}
                                                    loading={isThisItemUpdating}
                                                    disabled={disableOtherItemsActions}
                                                >
                                                    {t('kdsPage.action.startPreparing', 'Empezar Preparación')}
                                                </Button>
                                            )}
                                            {item.status === OrderItemStatus.PREPARING && (
                                                <Button
                                                    size="xs"
                                                    color="green"
                                                    onClick={() => handleUpdateStatus(item.id, OrderItemStatus.READY)}
                                                    loading={isThisItemUpdating}
                                                    disabled={disableOtherItemsActions}
                                                >
                                                    {t('kdsPage.action.markReady', 'Marcar como Listo')}
                                                </Button>
                                            )}
                                            {(item.status === OrderItemStatus.PENDING_KDS || item.status === OrderItemStatus.PREPARING) && (
                                                <Button
                                                    size="xs"
                                                    color="red"
                                                    variant="outline"
                                                    onClick={() => handleUpdateStatus(item.id, OrderItemStatus.CANCELLED)}
                                                    loading={isThisItemUpdating}
                                                    disabled={disableOtherItemsActions}
                                                >
                                                    {t('kdsPage.action.cancelItem', 'Cancelar Ítem')}
                                                </Button>
                                            )}
                                        </Group>
                                    </Paper>
                                </List.Item>
                            );
                        })}
                    </List>
                )}
                <Group justify="center" mt="md">
                    <Button onClick={() => fetchKdsItems(true)} leftSection={<IconReload size={16}/>} variant="outline" loading={loading && items.length > 0}>
                        {t('kdsPage.refreshManual', 'Refrescar Manualmente')}
                    </Button>
                </Group>
            </Stack>
        </Container>
    );
};

export default KitchenDisplayPage;