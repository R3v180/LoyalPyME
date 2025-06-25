// frontend/src/pages/OrderStatusPage.tsx
// Version 1.1.2 (Fix TypeError on items[0] after requesting bill by refetching)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Container, Title, Text, Loader, Alert, Paper, Stack, Group,
    Button, Divider, Badge, List, ThemeIcon, Box
} from '@mantine/core';
import {
    IconAlertCircle, IconClipboardList, IconToolsKitchen, IconChefHat,
    IconCircleCheck, IconCircleX, IconReload, IconArrowLeft, IconShoppingCart,
    IconPlus,
    IconCreditCard
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications';

// Tipos para el estado del pedido
export enum OrderItemStatus {
    PENDING_KDS = 'PENDING_KDS', PREPARING = 'PREPARING', READY = 'READY',
    SERVED = 'SERVED', CANCELLED = 'CANCELLED', CANCELLATION_REQUESTED = 'CANCELLATION_REQUESTED',
}
export enum OrderStatus {
    RECEIVED = 'RECEIVED', IN_PROGRESS = 'IN_PROGRESS', PARTIALLY_READY = 'PARTIALLY_READY',
    ALL_ITEMS_READY = 'ALL_ITEMS_READY', COMPLETED = 'COMPLETED', PENDING_PAYMENT = 'PENDING_PAYMENT',
    PAID = 'PAID', CANCELLED = 'CANCELLED', PAYMENT_FAILED = 'PAYMENT_FAILED',
}
export interface PublicOrderItemStatusInfo {
    id: string; menuItemName_es: string | null; menuItemName_en: string | null;
    quantity: number; status: OrderItemStatus;
}
export interface PublicOrderStatusInfo {
    orderId: string; orderNumber: string; orderStatus: OrderStatus;
    items: PublicOrderItemStatusInfo[]; tableIdentifier?: string | null;
    orderNotes?: string | null; createdAt: string;
    isBillRequested?: boolean;
}

const API_BASE_URL_PUBLIC = import.meta.env.VITE_API_BASE_URL_PUBLIC || 'http://localhost:3000/public';
const POLLING_INTERVAL = 10000;
const ACTIVE_ORDER_INFO_KEY_PREFIX = 'loyalpyme_active_order_info_';
const LOCAL_STORAGE_CART_KEY_PREFIX = 'loyalpyme_public_cart_';
const LOCAL_STORAGE_ORDER_NOTES_KEY_PREFIX = 'loyalpyme_public_order_notes_';

const OrderStatusPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { orderId, tableIdentifier: tableIdFromParams } = useParams<{ orderId: string; tableIdentifier?: string }>();
    const location = useLocation();
    const navigate = useNavigate();

    const navigationState = location.state as { orderNumber?: string; businessSlug?: string, tableIdentifier?: string } | null;
    const displayOrderNumber = navigationState?.orderNumber || orderId;
    const businessSlugForReturn = navigationState?.businessSlug;
    const currentTableIdentifierForReturn = navigationState?.tableIdentifier || tableIdFromParams || undefined;

    const [orderStatusData, setOrderStatusData] = useState<PublicOrderStatusInfo | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const pollingTimeoutRef = useRef<number | null>(null);
    const [isRequestingBill, setIsRequestingBill] = useState<boolean>(false);

    const activeOrderKey = businessSlugForReturn ? `${ACTIVE_ORDER_INFO_KEY_PREFIX}${businessSlugForReturn}${currentTableIdentifierForReturn ? `_${currentTableIdentifierForReturn}` : ''}` : null;

    const isOrderConsideredFinalOrPendingPayment = (status: OrderStatus | undefined): boolean => {
        if (!status) return false;
        return [
            OrderStatus.PAID,
            OrderStatus.CANCELLED,
            OrderStatus.PENDING_PAYMENT,
            OrderStatus.PAYMENT_FAILED
        ].includes(status);
    };

    const canAddMoreItemsToOrder = (status: OrderStatus | undefined): boolean => {
        if (!status) return false;
        return [
            OrderStatus.RECEIVED, OrderStatus.IN_PROGRESS, OrderStatus.PARTIALLY_READY,
            OrderStatus.ALL_ITEMS_READY, OrderStatus.COMPLETED
        ].includes(status);
    };

    const shouldPoll = !isOrderConsideredFinalOrPendingPayment(orderStatusData?.orderStatus) && !loading && !error && !isRequestingBill;

    const fetchOrderStatus = useCallback(async (isInitialFetch = false) => {
        if (!orderId) {
            setError(t('orderStatusPage.error.missingOrderId'));
            if (isInitialFetch) setLoading(false);
            return;
        }
        if (isInitialFetch) {
            setLoading(true);
            setError(null);
        }
        // No mostramos log de fetching si no es inicial para no llenar la consola con el polling
        // console.log(`[OrderStatusPage] Fetching status for order ${orderId}. Initial: ${isInitialFetch}`);
        try {
            const response = await axios.get<PublicOrderStatusInfo>(`${API_BASE_URL_PUBLIC}/order/${orderId}/status`);
            if (response.data) {
                setOrderStatusData(response.data);
                if (error) setError(null); // Limpiar error si el fetch actual es exitoso
            } else {
                // No debería pasar si la API siempre devuelve algo o un error
                throw new Error(t('orderStatusPage.error.noData'));
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || t('common.errorUnknown');
            setError(msg);
            if (err.response?.status === 404) {
                setOrderStatusData(null);
            }
            console.error(`[OrderStatusPage] Error fetching status for order ${orderId}:`, err);
        } finally {
            if (isInitialFetch) setLoading(false);
        }
    }, [orderId, t, error]); // error como dependencia

    useEffect(() => {
        fetchOrderStatus(true);
    }, [fetchOrderStatus]); // Solo fetchOrderStatus como dependencia para la carga inicial

    useEffect(() => {
        if (shouldPoll) {
            // console.log(`[OrderStatusPage] Setting up polling for order ${orderId}... Interval: ${POLLING_INTERVAL}ms`);
            pollingTimeoutRef.current = window.setTimeout(() => {
                // console.log(`[OrderStatusPage] Polling for order ${orderId}...`);
                fetchOrderStatus(false);
            }, POLLING_INTERVAL);
        } else {
             if (pollingTimeoutRef.current) {
                // console.log(`[OrderStatusPage] Clearing polling timeout (condition not met).`);
                clearTimeout(pollingTimeoutRef.current);
                pollingTimeoutRef.current = null;
            }
        }
        return () => {
            if (pollingTimeoutRef.current) {
                clearTimeout(pollingTimeoutRef.current);
                // console.log(`[OrderStatusPage] Polling timeout cleared on unmount/re-render for order ${orderId}.`);
            }
        };
    }, [orderStatusData, shouldPoll, fetchOrderStatus, orderId]); // Añadir orderStatusData para que re-evalúe shouldPoll

    useEffect(() => {
        if (
            (orderStatusData?.orderStatus === OrderStatus.PAID || orderStatusData?.orderStatus === OrderStatus.CANCELLED) &&
            activeOrderKey &&
            orderStatusData?.orderId === orderId
        ) {
            const storedActiveOrderInfo = localStorage.getItem(activeOrderKey);
            if (storedActiveOrderInfo) {
                try {
                    const parsedInfo = JSON.parse(storedActiveOrderInfo);
                    if (parsedInfo.orderId === orderId) {
                        localStorage.removeItem(activeOrderKey);
                        console.log(`[OrderStatusPage] Active order info for ${orderId} (Key: ${activeOrderKey}) removed from localStorage because order is final.`);
                    }
                } catch(e) {
                    console.error("Error parsing or removing active order info from localStorage:", e);
                }
            }
        }
    }, [orderStatusData?.orderStatus, activeOrderKey, orderId]);

    const getOrderItemStatusInfo = (status: OrderItemStatus): { text: string; color: string; icon: React.ReactNode } => {
        switch (status) {
            case OrderItemStatus.PENDING_KDS: return { text: t('orderStatusPage.itemStatus.pending_kds'), color: 'gray', icon: <IconClipboardList size={16}/> };
            case OrderItemStatus.PREPARING: return { text: t('orderStatusPage.itemStatus.preparing'), color: 'blue', icon: <IconToolsKitchen size={16}/> };
            case OrderItemStatus.READY: return { text: t('orderStatusPage.itemStatus.ready'), color: 'lime', icon: <IconChefHat size={16}/> };
            case OrderItemStatus.SERVED: return { text: t('orderStatusPage.itemStatus.served'), color: 'green', icon: <IconCircleCheck size={16}/> };
            case OrderItemStatus.CANCELLED: return { text: t('orderStatusPage.itemStatus.cancelled'), color: 'red', icon: <IconCircleX size={16}/> };
            case OrderItemStatus.CANCELLATION_REQUESTED: return { text: t('orderStatusPage.itemStatus.cancellation_requested'), color: 'orange', icon: <IconAlertCircle size={16}/> };
            default: return { text: String(t(status as string, status as string)), color: 'gray', icon: <IconClipboardList size={16}/> };
        }
    };

    const getOrderStatusText = (status: OrderStatus): string => {
         return String(t(`orderStatusPage.orderStatus.${status.toLowerCase()}`, status as string));
    };

    const handleStartNewOrder = () => {
        const cartKey = businessSlugForReturn ? `${LOCAL_STORAGE_CART_KEY_PREFIX}${businessSlugForReturn}${currentTableIdentifierForReturn ? `_${currentTableIdentifierForReturn}` : ''}` : null;
        const notesKey = businessSlugForReturn ? `${LOCAL_STORAGE_ORDER_NOTES_KEY_PREFIX}${businessSlugForReturn}${currentTableIdentifierForReturn ? `_${currentTableIdentifierForReturn}` : ''}` : null;

        if (activeOrderKey) localStorage.removeItem(activeOrderKey);
        if (cartKey) localStorage.removeItem(cartKey);
        if (notesKey) localStorage.removeItem(notesKey);
        setOrderStatusData(null);

        if (businessSlugForReturn) {
            navigate(`/m/${businessSlugForReturn}${currentTableIdentifierForReturn ? `/${currentTableIdentifierForReturn}` : ''}`, { replace: true });
        } else {
            navigate('/login', { replace: true });
        }
    };

    const handleRequestBill = async () => {
        if (!orderId || !orderStatusData || isRequestingBill) return;

        setIsRequestingBill(true);
        setError(null);
        console.log(`[OrderStatusPage] Client requesting bill for order ${orderId}`);
        try {
            // La respuesta del backend en este caso no incluye 'items', solo 'id', 'orderNumber', 'status', 'isBillRequested'
            // Por lo tanto, no podemos hacer setOrderStatusData(response.data.order) directamente o perderemos los items.
            // En lugar de eso, solo mostramos la notificación y dejamos que el polling actualice el estado completo.
            await axios.post<{order: Pick<PublicOrderStatusInfo, 'orderId' | 'orderNumber' | 'orderStatus' | 'isBillRequested'>}>(
                `${API_BASE_URL_PUBLIC}/order/${orderId}/request-bill`,
                { paymentPreference: undefined }
            );

            notifications.show({
                title: t('common.success'),
                message: t('orderStatusPage.billRequestedSuccess'),
                color: 'green',
                icon: <IconCircleCheck />
            });
            // ---- CORRECCIÓN: Forzar un refetch después de la acción exitosa ----
            // Esto asegura que la UI se actualice con el nuevo estado del pedido (incluyendo items)
            // y el polling se re-evalúe correctamente.
            fetchOrderStatus(false);
            // ---- FIN CORRECCIÓN ----

        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || t('common.errorUnknown');
            setError(msg);
            notifications.show({
                title: t('common.error'),
                message: t('orderStatusPage.errorRequestingBill', { message: msg }),
                color: 'red',
                icon: <IconAlertCircle />
            });
            console.error(`[OrderStatusPage] Error requesting bill for order ${orderId}:`, err);
        } finally {
            setIsRequestingBill(false);
        }
    };

    if (loading && !orderStatusData) {
        return (
            <Container size="sm" py="xl" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 60px)' }}>
                <Loader size="xl" />
            </Container>
        );
    }

    if (error && !orderStatusData) {
        return (
            <Container size="sm" py="xl">
                <Alert icon={<IconAlertCircle size="1rem" />} title={t('common.error')} color="red" radius="md">
                    {error}
                </Alert>
                {businessSlugForReturn && (
                    <Button
                        component={Link}
                        to={`/m/${businessSlugForReturn}${currentTableIdentifierForReturn ? `/${currentTableIdentifierForReturn}`: ''}`}
                        variant="light" mt="lg" leftSection={<IconArrowLeft size={16}/>}>
                        {t('orderStatusPage.backToMenuButton')}
                    </Button>
                )}
                 {!businessSlugForReturn && (
                    <Button
                        onClick={() => navigate('/login')}
                        variant="light" mt="lg" leftSection={<IconArrowLeft size={16}/>}>
                        {t('common.back')}
                    </Button>
                 )}
            </Container>
        );
    }

    if (!orderStatusData) { // Ya no necesitamos && !loading aquí
        return (
            <Container size="sm" py="xl">
                <Text ta="center" c="dimmed">{t('orderStatusPage.error.notFound')}</Text>
                {businessSlugForReturn && (
                     <Group justify="center" mt="xl">
                        <Button
                            component={Link}
                            to={`/m/${businessSlugForReturn}${currentTableIdentifierForReturn ? `/${currentTableIdentifierForReturn}`: ''}`}
                            variant="outline" leftSection={<IconArrowLeft size={16}/>}>
                            {t('orderStatusPage.backToMenuButton')}
                        </Button>
                    </Group>
                )}
                 {!businessSlugForReturn && (
                     <Group justify="center" mt="xl">
                        <Button
                            onClick={() => navigate('/login')}
                            variant="outline" leftSection={<IconArrowLeft size={16}/>}>
                            {t('common.back')}
                        </Button>
                    </Group>
                 )}
            </Container>
        );
    }

    const { orderNumber, orderStatus, items, tableIdentifier: orderTableIdentifier, orderNotes: generalOrderNotes, createdAt } = orderStatusData;
    const isCurrentOrderEffectivelyFinal = isOrderConsideredFinalOrPendingPayment(orderStatus);
    const showAddMoreItemsButton = !isCurrentOrderEffectivelyFinal && canAddMoreItemsToOrder(orderStatus);

    const canRequestBill =
        !isRequestingBill &&
        (
            orderStatus === OrderStatus.RECEIVED ||
            orderStatus === OrderStatus.IN_PROGRESS ||
            orderStatus === OrderStatus.PARTIALLY_READY ||
            orderStatus === OrderStatus.ALL_ITEMS_READY ||
            orderStatus === OrderStatus.COMPLETED
        );

    return (
        <Container size="md" py="xl">
            <Paper shadow="md" p="xl" radius="lg" withBorder>
                <Stack gap="lg">
                    <Title order={2} ta="center">{t('orderStatusPage.title')}</Title>
                    <Text ta="center" fz="xl" fw={700}>#{orderNumber || displayOrderNumber}</Text>

                    {error && !loading && (
                        <Alert icon={<IconAlertCircle size="1rem" />} title={t('common.error')} color="orange" radius="md" withCloseButton onClose={() => setError(null)}>
                            {String(t('orderStatusPage.error.updateFailed', { message: error }))}
                        </Alert>
                    )}

                    <Paper withBorder p="md" radius="sm" bg={i18n.language === 'dark' ? "dark.6" : "gray.0"}>
                        <Group justify="space-between">
                            <Text fw={500}>{t('orderStatusPage.generalStatus')}</Text>
                            <Badge size="lg"
                                // ---- CORRECCIÓN AQUÍ para la guarda de items[0] ----
                                color={getOrderItemStatusInfo( (items && items.length > 0 ? items[0]?.status : undefined) || OrderItemStatus.PENDING_KDS).color}
                                variant="filled"
                            >
                                {getOrderStatusText(orderStatus)}
                            </Badge>
                        </Group>
                        {orderTableIdentifier && (
                            <Text size="sm" mt="xs">
                                {t('orderStatusPage.table')} <Text span fw={500}>{orderTableIdentifier}</Text>
                            </Text>
                        )}
                        <Text size="sm" c="dimmed" mt="xs">
                            {t('orderStatusPage.placedAt')} {new Date(createdAt).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })}
                        </Text>
                    </Paper>

                    <Divider my="sm" label={t('orderStatusPage.itemsTitle')} labelPosition="center" />

                    <Box>
                        {items.length === 0 ? (
                            <Text c="dimmed" ta="center">{t('publicMenu.noItemsInCategory')}</Text>
                        ) : (
                            <List spacing="md" listStyleType="none" p={0}>
                                {items.map((item: PublicOrderItemStatusInfo) => { // <-- Tipo explícito aquí
                                    const statusInfo = getOrderItemStatusInfo(item.status);
                                    const itemName = (i18n.language === 'es' && item.menuItemName_es) ? item.menuItemName_es : (item.menuItemName_en || item.menuItemName_es || 'Ítem');
                                    return (
                                        <List.Item
                                            key={item.id}
                                            icon={
                                                <ThemeIcon color={statusInfo.color} size={24} radius="xl">
                                                    {statusInfo.icon}
                                                </ThemeIcon>
                                            }
                                        >
                                            <Paper p="sm" radius="sm" withBorder style={{ flexGrow: 1 }}>
                                                <Group justify="space-between" wrap="nowrap">
                                                    <Stack gap={2} style={{flexGrow: 1, minWidth: 0}}>
                                                        <Text fw={500} truncate>{itemName}</Text>
                                                        <Text size="sm" c="dimmed">{t('orderStatusPage.quantity')} {item.quantity}</Text>
                                                    </Stack>
                                                    <Text size="sm" c={statusInfo.color} style={{flexShrink: 0}}>{statusInfo.text}</Text>
                                                </Group>
                                            </Paper>
                                        </List.Item>
                                    );
                                })}
                            </List>
                        )}
                    </Box>

                    {generalOrderNotes && (
                        <>
                            <Divider my="sm" label={t('orderStatusPage.orderNotesLabel')} labelPosition="center" />
                            <Paper withBorder p="sm" radius="sm" bg={i18n.language === 'dark' ? "dark.6" : "gray.0"}>
                                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{generalOrderNotes}</Text>
                            </Paper>
                        </>
                    )}

                    <Group justify="space-between" mt="xl" wrap="nowrap">
                        <Group>
                            {showAddMoreItemsButton && businessSlugForReturn && (
                                <Button
                                    component={Link}
                                    to={`/m/${businessSlugForReturn}${currentTableIdentifierForReturn ? `/${currentTableIdentifierForReturn}` : ''}`}
                                    variant="filled"
                                    leftSection={<IconPlus size={16} />}
                                    mr="sm"
                                >
                                    {t('orderStatusPage.addMoreItemsButton')}
                                </Button>
                            )}

                            {canRequestBill && (
                                <Button
                                    variant="gradient"
                                    gradient={{ from: 'orange', to: 'yellow' }}
                                    onClick={handleRequestBill}
                                    loading={isRequestingBill}
                                    disabled={isRequestingBill || loading}
                                    leftSection={<IconCreditCard size={16} />}
                                    mr="sm"
                                >
                                    {t('orderStatusPage.requestBillButton')}
                                </Button>
                            )}

                            {!isCurrentOrderEffectivelyFinal && !canRequestBill && (
                                <Button
                                    variant="outline"
                                    onClick={() => fetchOrderStatus(false)}
                                    leftSection={<IconReload size={16}/>}
                                    loading={loading && !!orderStatusData && !isRequestingBill}
                                    disabled={isRequestingBill || (loading && !orderStatusData)}
                                >
                                    {t('orderStatusPage.refreshButton')}
                                </Button>
                            )}

                            {(orderStatus === OrderStatus.PAID || orderStatus === OrderStatus.CANCELLED) && (
                                <Button
                                    variant="filled"
                                    color="green"
                                    onClick={handleStartNewOrder}
                                    leftSection={<IconShoppingCart size={16} />}
                                >
                                    {t('publicMenu.activeOrder.startNewButton')}
                                </Button>
                            )}
                        </Group>

                        {businessSlugForReturn ? (
                            <Button
                                component={Link}
                                to={`/m/${businessSlugForReturn}${currentTableIdentifierForReturn ? `/${currentTableIdentifierForReturn}`: ''}`}
                                variant="light"
                                leftSection={<IconArrowLeft size={16}/>}
                            >
                                {t('orderStatusPage.backToMenuButton')}
                            </Button>
                        ) : (
                             <Button
                                 onClick={() => navigate('/login')}
                                 variant="light"
                                 leftSection={<IconArrowLeft size={16}/>}
                             >
                                 {t('common.back')}
                             </Button>
                         )}
                    </Group>
                </Stack>
            </Paper>
        </Container>
    );
};

export default OrderStatusPage;