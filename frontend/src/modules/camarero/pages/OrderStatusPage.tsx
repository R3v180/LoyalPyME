// frontend/src/modules/camarero/pages/OrderStatusPage.tsx
// Version 2.9.7 - Corrected prop name from 'coupons' to 'availableCoupons' in ApplyRewardModal call.

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
    IconPlus, IconCreditCard, IconDiscount2
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';

import axiosInstance from '../../../shared/services/axiosInstance';
import { GrantedReward, OrderStatus, OrderItemStatus } from '../../../shared/types/user.types';
import ApplyRewardModal, { AppliedSelections } from '../../loyalpyme/components/customer/ApplyRewardModal';
import { PublicOrderStatusInfo } from '../types/publicOrder.types';
import OrderBillView from '../components/public/menu/order/OrderBillView';

const API_BASE_URL_PUBLIC = import.meta.env.VITE_API_BASE_URL_PUBLIC || 'http://localhost:3000/public';
const POLLING_INTERVAL = 10000;
const ACTIVE_ORDER_INFO_KEY_PREFIX = 'loyalpyme_active_order_info_';

const OrderStatusPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { orderId } = useParams<{ orderId: string; }>();
    const location = useLocation();
    const navigate = useNavigate();

    const navigationState = location.state as { orderNumber?: string; businessSlug?: string, tableIdentifier?: string } | null;
    const displayOrderNumber = navigationState?.orderNumber || orderId;
    const businessSlugForReturn = navigationState?.businessSlug;
    const currentTableIdentifierForReturn = navigationState?.tableIdentifier;

    const [orderStatusData, setOrderStatusData] = useState<PublicOrderStatusInfo | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const pollingTimeoutRef = useRef<number | null>(null);
    const [isRequestingBill, setIsRequestingBill] = useState<boolean>(false);
    
    const [availableCoupons, setAvailableCoupons] = useState<GrantedReward[]>([]);
    const [loadingCoupons, setLoadingCoupons] = useState(false);
    const [applyModalOpened, { open: openApplyModal, close: closeApplyModal }] = useDisclosure(false);
    const [isApplyingReward, setIsApplyingReward] = useState(false);
    const activeOrderKey = businessSlugForReturn ? `${ACTIVE_ORDER_INFO_KEY_PREFIX}${businessSlugForReturn}${currentTableIdentifierForReturn ? `_${currentTableIdentifierForReturn}` : ''}` : null;

    const isOrderConsideredFinal = (status: OrderStatus | undefined): boolean => {
        if (!status) return false;
        return [ OrderStatus.PAID, OrderStatus.CANCELLED, OrderStatus.PAYMENT_FAILED ].includes(status);
    };

    const canAddMoreItemsToOrder = (status: OrderStatus | undefined): boolean => {
        if (!status) return false;
        return [
            OrderStatus.RECEIVED, OrderStatus.IN_PROGRESS, OrderStatus.PARTIALLY_READY,
            OrderStatus.ALL_ITEMS_READY, OrderStatus.COMPLETED
        ].includes(status);
    };

    const fetchOrderStatus = useCallback(async (isInitialFetch = false) => {
        if (!orderId) { setError(t('orderStatusPage.error.missingOrderId')); if (isInitialFetch) setLoading(false); return; }
        if (isInitialFetch) { setLoading(true); setError(null); }
        try {
            const response = await axios.get<PublicOrderStatusInfo>(`${API_BASE_URL_PUBLIC}/order/${orderId}/status`);
            setOrderStatusData(response.data ?? null);
            if (error) setError(null);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || t('common.errorUnknown');
            setError(msg);
            if (err.response?.status === 404) setOrderStatusData(null);
        } finally { if (isInitialFetch) setLoading(false); }
    }, [orderId, t, error]);
    
    const fetchAvailableCoupons = useCallback(async () => {
        const token = localStorage.getItem('token'); if (!token) return; setLoadingCoupons(true);
        try {
            const response = await axiosInstance.get<GrantedReward[]>('/customer/available-coupons');
            setAvailableCoupons(response.data || []);
        } catch (err) { console.error("Error fetching available coupons:", err); } finally { setLoadingCoupons(false); }
    }, []);

    useEffect(() => {
        fetchOrderStatus(true);
        fetchAvailableCoupons();
    }, [fetchOrderStatus, fetchAvailableCoupons]);

    const shouldPoll = !isOrderConsideredFinal(orderStatusData?.orderStatus) && !loading && !error && !isRequestingBill && !isApplyingReward;

    useEffect(() => {
        if (shouldPoll) { pollingTimeoutRef.current = window.setTimeout(() => fetchOrderStatus(false), POLLING_INTERVAL); }
        return () => { if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current); };
    }, [orderStatusData, shouldPoll, fetchOrderStatus]);

    useEffect(() => {
        if (isOrderConsideredFinal(orderStatusData?.orderStatus) && activeOrderKey && orderStatusData?.orderId === orderId) { localStorage.removeItem(activeOrderKey); }
    }, [orderStatusData?.orderStatus, activeOrderKey, orderId]);

    const handleApplyReward = async (selections: AppliedSelections) => {
        if (!orderId) return;
        const discountToApply = selections.discount;
        if (!discountToApply || !discountToApply.isGift || !discountToApply.grantedRewardId) {
            closeApplyModal(); return;
        }
        const grantedRewardId = discountToApply.grantedRewardId;
        setIsApplyingReward(true);
        closeApplyModal();
        try {
            await axiosInstance.patch(`/public/order/${orderId}/apply-reward`, { grantedRewardId });
            notifications.show({ title: "¡Éxito!", message: "La recompensa se ha aplicado correctamente a tu pedido.", color: 'green', icon: <IconCircleCheck/> });
            await fetchOrderStatus(false);
            await fetchAvailableCoupons();
        } catch (err: any) {
            const msg = err.response?.data?.message || "No se pudo aplicar la recompensa.";
            notifications.show({ title: "Error", message: msg, color: 'red' });
        } finally {
            setIsApplyingReward(false);
        }
    };
    
    const handleRequestBill = async () => {
        if (!orderId || !orderStatusData || isRequestingBill) return;
        setIsRequestingBill(true); setError(null);
        try {
            await axios.post(`${API_BASE_URL_PUBLIC}/order/${orderId}/request-bill`);
            notifications.show({ title: t('common.success'), message: t('orderStatusPage.billRequestedSuccess'), color: 'green', icon: <IconCircleCheck /> });
            fetchOrderStatus(false);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || t('common.errorUnknown');
            setError(msg);
            notifications.show({ title: t('common.error'), message: t('orderStatusPage.errorRequestingBill', { message: msg }), color: 'red', icon: <IconAlertCircle /> });
        } finally { setIsRequestingBill(false); }
    };
    
    const handleStartNewOrder = () => {
        if (activeOrderKey) localStorage.removeItem(activeOrderKey);
        const cartKey = businessSlugForReturn ? `loyalpyme_public_cart_${businessSlugForReturn}${currentTableIdentifierForReturn ? `_${currentTableIdentifierForReturn}` : ''}` : null;
        if (cartKey) localStorage.removeItem(cartKey);
        if (businessSlugForReturn) {
            navigate(`/m/${businessSlugForReturn}${currentTableIdentifierForReturn ? `/${currentTableIdentifierForReturn}` : ''}`, { replace: true });
        } else {
            navigate('/login', { replace: true });
        }
    };

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

    const getOrderStatusText = (status: OrderStatus | undefined): string => {
        if (!status) return t('common.loading');
        return String(t(`orderStatusPage.orderStatus.${status.toLowerCase()}`, status as string));
    };

    if (loading && !orderStatusData) {
        return <Container size="sm" py="xl" style={{ display: 'flex', justifyContent: 'center' }}><Loader size="xl" /></Container>;
    }
    
    if (!orderStatusData) {
        return (
            <Container size="sm" py="xl">
                {error ? (
                     <Alert icon={<IconAlertCircle size="1rem" />} title={t('common.error')} color="red" radius="md">{error}</Alert>
                ) : (
                    <Text ta="center" c="dimmed">{t('orderStatusPage.error.notFound')}</Text>
                )}
            </Container>
        );
    }
    
    const { orderNumber, orderStatus, items, tableIdentifier: orderTableIdentifier, orderNotes: generalOrderNotes, createdAt } = orderStatusData;
    const canRequestBill = orderStatus === OrderStatus.COMPLETED || orderStatus === OrderStatus.ALL_ITEMS_READY;
    const canApplyReward = orderStatus === OrderStatus.PENDING_PAYMENT && availableCoupons.length > 0 && !isApplyingReward;
    const showAddMoreItemsButton = canAddMoreItemsToOrder(orderStatus);
    const showBillView = orderStatus === OrderStatus.PENDING_PAYMENT || orderStatus === OrderStatus.PAID;
    
    return (
        <>
            <Container size="md" py="xl">
                <Paper shadow="md" p="xl" radius="lg" withBorder>
                    <Stack gap="lg">
                        <Title order={2} ta="center">{t('orderStatusPage.title')}</Title>
                        <Text ta="center" fz="xl" fw={700}>#{orderNumber || displayOrderNumber}</Text>
                        <Paper withBorder p="md" radius="sm" bg={i18n.language === 'dark' ? "dark.6" : "gray.0"}>
                            <Group justify="space-between"><Text fw={500}>{t('orderStatusPage.generalStatus')}</Text><Badge size="lg" color="blue" variant="filled">{getOrderStatusText(orderStatus)}</Badge></Group>
                            {orderTableIdentifier && <Text size="sm" mt="xs">{t('orderStatusPage.table')} <Text span fw={500}>{orderTableIdentifier}</Text></Text>}
                            <Text size="sm" c="dimmed" mt="xs">{t('orderStatusPage.placedAt')} {new Date(createdAt).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })}</Text>
                        </Paper>
                        {showBillView ? (<OrderBillView orderData={orderStatusData} />) : ( <> <Divider my="sm" label={t('orderStatusPage.itemsTitle')} labelPosition="center" /> <Box><List spacing="md" listStyleType="none" p={0}>{items.map((item) => { const statusInfo = getOrderItemStatusInfo(item.status); const itemName = item.itemNameSnapshot || 'Ítem sin nombre'; return (<List.Item key={item.id} icon={<ThemeIcon color={statusInfo.color} size={24} radius="xl">{statusInfo.icon}</ThemeIcon>}><Paper p="sm" radius="sm" withBorder style={{ flexGrow: 1 }}><Group justify="space-between" wrap="nowrap"><Stack gap={2} style={{flexGrow: 1, minWidth: 0}}><Text fw={500} truncate>{itemName}</Text><Text size="sm" c="dimmed">{t('orderStatusPage.quantity')} {item.quantity}</Text></Stack><Text size="sm" c={statusInfo.color} style={{flexShrink: 0}}>{statusInfo.text}</Text></Group></Paper></List.Item>); })}</List></Box> </> )}
                        {generalOrderNotes && (<><Divider my="sm" label={t('orderStatusPage.orderNotesLabel')} labelPosition="center" /><Paper withBorder p="sm" radius="sm" bg={i18n.language === 'dark' ? "dark.6" : "gray.0"}><Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{generalOrderNotes}</Text></Paper></>)}
                        <Group justify="space-between" mt="xl" wrap="nowrap">
                            <Group>
                                {showAddMoreItemsButton && businessSlugForReturn && ( <Button component={Link} to={`/m/${businessSlugForReturn}${currentTableIdentifierForReturn ? `/${currentTableIdentifierForReturn}` : ''}`} variant="filled" leftSection={<IconPlus size={16} />} mr="sm">{t('orderStatusPage.addMoreItemsButton')}</Button> )}
                                {canApplyReward && ( <Button variant="filled" color="violet" onClick={openApplyModal} loading={loadingCoupons} disabled={isRequestingBill || isApplyingReward} leftSection={<IconDiscount2 size={16} />}>Aplicar Recompensa</Button> )}
                                {canRequestBill && ( <Button variant="gradient" gradient={{ from: 'orange', to: 'yellow' }} onClick={handleRequestBill} loading={isRequestingBill} leftSection={<IconCreditCard size={16} />}>{t('orderStatusPage.requestBillButton')}</Button> )}
                                {!isOrderConsideredFinal(orderStatus) && ( <Button variant="outline" onClick={() => fetchOrderStatus(false)} leftSection={<IconReload size={16}/>} loading={loading && !!orderStatusData} disabled={isRequestingBill || isApplyingReward}>{t('orderStatusPage.refreshButton')}</Button> )}
                                {isOrderConsideredFinal(orderStatus) && ( <Button variant="filled" color="green" onClick={handleStartNewOrder} leftSection={<IconShoppingCart size={16} />}>{t('publicMenu.activeOrder.startNewButton')}</Button> )}
                            </Group>
                            {businessSlugForReturn ? ( <Button component={Link} to={`/m/${businessSlugForReturn}${currentTableIdentifierForReturn ? `/${currentTableIdentifierForReturn}`: ''}`} variant="light" leftSection={<IconArrowLeft size={16}/>}>{t('orderStatusPage.backToMenuButton')}</Button> ) : ( <Button onClick={() => navigate('/login')} variant="light" leftSection={<IconArrowLeft size={16}/>}> {t('common.back')} </Button> )}
                        </Group>
                    </Stack>
                </Paper>
            </Container>
            
            <ApplyRewardModal
                opened={applyModalOpened}
                onClose={closeApplyModal}
                // --- CORRECCIÓN DE PROP: `coupons` -> `availableCoupons` ---
                availableCoupons={availableCoupons}
                redeemableRewards={[]}
                initialSelections={{ discount: null, freeItems: [] }}
                onApply={handleApplyReward}
                isApplying={isApplyingReward}
                userPoints={0}
                appliedLcoRewardIdOnActiveOrder={orderStatusData.appliedLcoRewardId}
            />
        </>
    );
};

export default OrderStatusPage;