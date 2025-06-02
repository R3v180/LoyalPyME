// frontend/src/pages/OrderStatusPage.tsx
// Version 1.0.7 (Add "Add More Items" button)

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
    IconPlus // <-- Icono Nuevo
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

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
    
    const activeOrderKey = businessSlugForReturn ? `${ACTIVE_ORDER_INFO_KEY_PREFIX}${businessSlugForReturn}${currentTableIdentifierForReturn ? `_${currentTableIdentifierForReturn}` : ''}` : null;

    const isOrderConsideredFinal = (status: OrderStatus | undefined): boolean => {
        if (!status) return false;
        return [OrderStatus.PAID, OrderStatus.CANCELLED, OrderStatus.PENDING_PAYMENT, OrderStatus.PAYMENT_FAILED].includes(status);
    };

    // NUEVA FUNCIÓN para determinar si se pueden añadir más ítems
    const canAddMoreItemsToOrder = (status: OrderStatus | undefined): boolean => {
        if (!status) return false;
        return [
            OrderStatus.RECEIVED,
            OrderStatus.IN_PROGRESS,
            OrderStatus.PARTIALLY_READY,
            OrderStatus.ALL_ITEMS_READY,
            OrderStatus.COMPLETED 
        ].includes(status);
    };
    
    const shouldPoll = !isOrderConsideredFinal(orderStatusData?.orderStatus) && !loading && !error;

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
        console.log(`[OrderStatusPage] Fetching status for order ${orderId}. Initial: ${isInitialFetch}`);
        try {
            const response = await axios.get<PublicOrderStatusInfo>(`${API_BASE_URL_PUBLIC}/order/${orderId}/status`);
            if (response.data) {
                setOrderStatusData(response.data);
                if (isInitialFetch || error) setError(null);
            } else {
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
    }, [orderId, t, error]);

    useEffect(() => {
        fetchOrderStatus(true); 
    }, [fetchOrderStatus]);

    useEffect(() => {
        if (shouldPoll) {
            console.log(`[OrderStatusPage] Setting up polling for order ${orderId}... Interval: ${POLLING_INTERVAL}ms`);
            pollingTimeoutRef.current = window.setTimeout(() => { 
                console.log(`[OrderStatusPage] Polling for order ${orderId}...`);
                fetchOrderStatus(false); 
            }, POLLING_INTERVAL);
        } else {
             if (pollingTimeoutRef.current) {
                console.log(`[OrderStatusPage] Clearing polling timeout (condition not met).`);
                clearTimeout(pollingTimeoutRef.current);
                pollingTimeoutRef.current = null;
            }
        }
        return () => {
            if (pollingTimeoutRef.current) {
                clearTimeout(pollingTimeoutRef.current);
                console.log(`[OrderStatusPage] Polling timeout cleared on unmount/re-render for order ${orderId}.`);
            }
        };
    }, [shouldPoll, fetchOrderStatus, orderId]);

    useEffect(() => {
        const currentOrderIsFinal = isOrderConsideredFinal(orderStatusData?.orderStatus);
        if (currentOrderIsFinal && activeOrderKey && orderStatusData?.orderId === orderId) {
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
        // ... (sin cambios en esta función)
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
        // ... (sin cambios en esta función)
        const cartKey = businessSlugForReturn ? `${LOCAL_STORAGE_CART_KEY_PREFIX}${businessSlugForReturn}${currentTableIdentifierForReturn ? `_${currentTableIdentifierForReturn}` : ''}` : null;
        const notesKey = businessSlugForReturn ? `${LOCAL_STORAGE_ORDER_NOTES_KEY_PREFIX}${businessSlugForReturn}${currentTableIdentifierForReturn ? `_${currentTableIdentifierForReturn}` : ''}` : null;

        if (activeOrderKey) {
            localStorage.removeItem(activeOrderKey);
            console.log(`[OrderStatusPage] Cleared active order info (Key: ${activeOrderKey})`);
        }
        if (cartKey) {
            localStorage.removeItem(cartKey);
            console.log(`[OrderStatusPage] Cleared cart items (Key: ${cartKey})`);
        }
        if (notesKey) {
            localStorage.removeItem(notesKey);
            console.log(`[OrderStatusPage] Cleared order notes (Key: ${notesKey})`);
        }
        setOrderStatusData(null); 

        if (businessSlugForReturn) {
            navigate(`/m/${businessSlugForReturn}${currentTableIdentifierForReturn ? `/${currentTableIdentifierForReturn}` : ''}`, { replace: true });
        } else {
            navigate('/login', { replace: true }); 
        }
    };

    if (loading && !orderStatusData) { 
        return <Container size="sm" py="xl" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 60px)' }}><Loader size="xl" /></Container>;
    }

    if (error && !orderStatusData) { 
        // ... (sin cambios en este bloque)
        return (
            <Container size="sm" py="xl">
                <Alert icon={<IconAlertCircle size="1rem" />} title={t('common.error')} color="red" radius="md">{error}</Alert>
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
    
    if (!orderStatusData && !loading) { 
        // ... (sin cambios en este bloque)
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
    
    const { orderNumber, orderStatus, items, tableIdentifier: orderTableIdentifier, orderNotes: generalOrderNotes, createdAt } = orderStatusData!;
    const isCurrentOrderFinal = isOrderConsideredFinal(orderStatus);
    const showAddMoreItemsButton = !isCurrentOrderFinal && canAddMoreItemsToOrder(orderStatus);


    return (
        <Container size="md" py="xl">
            <Paper shadow="md" p="xl" radius="lg" withBorder>
                <Stack gap="lg">
                    <Title order={2} ta="center">{t('orderStatusPage.title')}</Title>
                    <Text ta="center" fz="xl" fw={700}>#{orderNumber || displayOrderNumber}</Text>
                    
                    {error && (
                        <Alert icon={<IconAlertCircle size="1rem" />} title={t('common.error')} color="orange" radius="md" withCloseButton onClose={() => setError(null)}>
                            {String(t('orderStatusPage.error.updateFailed', { message: error }))}
                        </Alert>
                    )}

                    <Paper withBorder p="md" radius="sm" bg={i18n.language === 'dark' ? "dark.6" : "gray.0"}>
                        {/* ... (sin cambios en la info del pedido) */}
                        <Group justify="space-between">
                            <Text fw={500}>{t('orderStatusPage.generalStatus')}</Text>
                            <Badge size="lg" color={getOrderItemStatusInfo(items[0]?.status || OrderItemStatus.PENDING_KDS).color} variant="filled">
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
                        {/* ... (sin cambios en la lista de ítems) */}
                        <List spacing="md" listStyleType="none" p={0}>
                            {items.map(item => {
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
                    </Box>

                    {generalOrderNotes && (
                        // ... (sin cambios en las notas del pedido)
                        <>
                            <Divider my="sm" label={t('orderStatusPage.orderNotesLabel')} labelPosition="center" />
                            <Paper withBorder p="sm" radius="sm" bg={i18n.language === 'dark' ? "dark.6" : "gray.0"}>
                                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{generalOrderNotes}</Text>
                            </Paper>
                        </>
                    )}

                    {/* --- SECCIÓN DE BOTONES MODIFICADA --- */}
                    <Group justify="space-between" mt="xl">
                        <Box> {/* Contenedor para botones del lado izquierdo */}
                            {showAddMoreItemsButton && businessSlugForReturn && (
                                <Button
                                    component={Link}
                                    to={`/m/${businessSlugForReturn}${currentTableIdentifierForReturn ? `/${currentTableIdentifierForReturn}` : ''}`}
                                    variant="filled" // Botón primario para esta acción
                                    leftSection={<IconPlus size={16} />}
                                    mr="md" // Margen si hay más botones a la derecha de este
                                >
                                    {t('orderStatusPage.addMoreItemsButton', 'Añadir más ítems')}
                                </Button>
                            )}

                            {!isCurrentOrderFinal ? (
                                <Button
                                    variant="outline"
                                    onClick={() => fetchOrderStatus(false)} 
                                    leftSection={<IconReload size={16}/>}
                                    loading={loading && !!orderStatusData} 
                                    disabled={loading && !orderStatusData} 
                                >
                                    {t('orderStatusPage.refreshButton')}
                                </Button>
                            ) : (
                                <Button
                                    variant="filled"
                                    color="green" 
                                    onClick={handleStartNewOrder}
                                    leftSection={<IconShoppingCart size={16} />}
                                >
                                    {t('publicMenu.activeOrder.startNewButton', 'Empezar Nuevo Pedido')} 
                                </Button>
                            )}
                        </Box>
                        
                        {/* Botón "Volver al Menú" o "Volver" a la derecha, si no se muestra "Añadir más" o como opción secundaria */}
                        {/* Podríamos hacer que "Volver al Menú" solo aparezca si NO se muestra "Añadir más ítems" para evitar redundancia,
                            o mantenerlo si su propósito es solo "ver menú" sin necesariamente "añadir".
                            Por ahora, lo mantenemos como estaba, pero "Añadir más ítems" es más específico.
                        */}
                        {businessSlugForReturn && !showAddMoreItemsButton && ( // Solo muestra si no está el de "Añadir más"
                            <Button
                                component={Link}
                                to={`/m/${businessSlugForReturn}${currentTableIdentifierForReturn ? `/${currentTableIdentifierForReturn}`: ''}`}
                                variant="light"
                                leftSection={<IconArrowLeft size={16}/>}
                            >
                                {t('orderStatusPage.backToMenuButton')}
                            </Button>
                        )}
                        {!businessSlugForReturn && ( 
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