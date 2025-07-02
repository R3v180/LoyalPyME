// frontend/src/modules/camarero/pages/PublicMenuViewPage.tsx
// VERSIÓN 8.0.0 - FINAL. Lógica de descuentos eliminada.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import {
    Container, Title, Loader, Alert, Text, Stack, Paper, Image, Group,
    useMantineTheme, Button, useMantineColorScheme
} from '@mantine/core';
import {
    IconAlertCircle, IconShoppingCart, IconCheck, IconInfoCircle, IconGift, IconLogin,
    IconDashboard, IconAward
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';

// Hooks y Servicios
import { RewardType } from '../../../shared/types/enums';
import { useLayoutUserData } from '../../../shared/hooks/useLayoutUserData';
import { useActiveOrderState } from '../hooks/useActiveOrderState';
import { usePublicOrderCart } from '../hooks/usePublicOrderCart';
import { usePublicMenuData } from '../hooks/usePublicMenuData';
import { useCustomerRewardsData } from '../../loyalpyme/hooks/useCustomerRewardsData';
import { handleOrderSubmission } from '../services/publicOrderApiService';

// Componentes
import CategoryAccordion from '../components/public/menu/CategoryAccordion';
import ShoppingCartModal from '../components/public/menu/ShoppingCartModal';

// Tipos
import type { Reward } from '../../../shared/types/user.types';
import { OrderItemFE } from '../types/publicOrder.types';
import { PublicMenuItem } from '../types/menu.types';

const PublicMenuViewPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const theme = useMantineTheme();
    const { colorScheme } = useMantineColorScheme();
    const { businessSlug, tableIdentifier: tableIdentifierFromParams } = useParams<{ businessSlug: string; tableIdentifier?: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const { menuData, loadingMenu, errorMenu } = usePublicMenuData(businessSlug);
    const { userData } = useLayoutUserData();
    const { redeemableRewards } = useCustomerRewardsData();
    
    const { activeOrderId, activeOrderNumber, canCurrentlyAddToExistingOrder, loadingActiveOrderStatus, setActiveOrderManually } = useActiveOrderState(businessSlug, tableIdentifierFromParams);
    
    const {
        currentOrderItems, orderNotes, totalCartItems,
        addSimpleItemToCart,
        updateItemQuantityInCart, removeItemFromCart, updateOrderNotes,
        clearCart, clearCartStorage, addFreeItemReward
    } = usePublicOrderCart(businessSlug, tableIdentifierFromParams, activeOrderId);
    
    const [activeAccordionItems, setActiveAccordionItems] = useState<string[]>([]);
    const [isCartOpen, { open: openCart, close: closeCart }] = useDisclosure(false);
    const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);
    
    const redeemableItemsMap = useMemo(() => {
        const map = new Map<string, Reward>();
        if (redeemableRewards) {
            redeemableRewards.forEach(reward => {
                if (reward.type === RewardType.MENU_ITEM && reward.linkedMenuItemId) {
                    map.set(reward.linkedMenuItemId, reward);
                }
            });
        }
        return map;
    }, [redeemableRewards]);
    
    const handleRedeemItem = useCallback((itemToRedeem: PublicMenuItem) => {
        const reward = redeemableItemsMap.get(itemToRedeem.id);
        if (!reward || !userData || (userData.points ?? 0) < reward.pointsCost) {
            notifications.show({ title: t('common.error'), message: t('customerDashboard.insufficientPoints'), color: 'red' });
            return;
        }
        addFreeItemReward(itemToRedeem, reward);
    }, [redeemableItemsMap, userData, addFreeItemReward, t]);

    const handleAddToCart = (item: PublicMenuItem) => {
        if (item.modifierGroups && item.modifierGroups.length > 0) {
            notifications.show({
                title: t('common.upcomingFeatureTitle'),
                message: 'La personalización de ítems con opciones se añadirá próximamente.',
                color: 'blue'
            });
        } else {
            addSimpleItemToCart(item, 1);
        }
    };
    
    const handleSubmitOrderOrAddItems = useCallback(async () => {
        if (currentOrderItems.length === 0) { notifications.show({ title: t('publicMenu.cart.errorTitle'), message: activeOrderId ? t('publicMenu.cart.errorEmptyAddToOrder') : t('publicMenu.cart.errorEmpty'), color: 'orange' }); return; }
        if (!businessSlug) return;
        setIsSubmittingOrder(true);
        try {
            const response = await handleOrderSubmission(currentOrderItems, orderNotes, canCurrentlyAddToExistingOrder ? activeOrderId : null, businessSlug, tableIdentifierFromParams, userData?.id, null);
            const orderIdToNavigate = response.id; const orderNumberToNavigate = response.orderNumber || activeOrderNumber || orderIdToNavigate;
            const successMessage = activeOrderId ? t('publicMenu.cart.itemsAddedSuccessMsg', { orderNumber: orderNumberToNavigate }) : t('publicMenu.cart.orderSuccessMsg', { orderNumber: orderNumberToNavigate });
            notifications.show({ title: activeOrderId ? t('publicMenu.cart.itemsAddedSuccessTitle') : t('publicMenu.cart.orderSuccessTitle'), message: successMessage, color: 'green', icon: <IconCheck /> });
            if (!activeOrderId) setActiveOrderManually(orderIdToNavigate, orderNumberToNavigate);
            clearCart(); clearCartStorage(); closeCart();
            navigate(`/order-status/${orderIdToNavigate}`, { state: { orderNumber: orderNumberToNavigate, businessSlug, tableIdentifier: tableIdentifierFromParams } });
        } catch (err: any) { const errMsg = err.response?.data?.message || err.message || t('publicMenu.cart.orderErrorMsg'); notifications.show({ title: t('publicMenu.cart.orderErrorTitle'), message: errMsg, color: 'red', icon: <IconAlertCircle /> });
        } finally { setIsSubmittingOrder(false); }
    }, [currentOrderItems, orderNotes, canCurrentlyAddToExistingOrder, activeOrderId, businessSlug, tableIdentifierFromParams, userData?.id, navigate, t, setActiveOrderManually, clearCart, clearCartStorage, closeCart, activeOrderNumber]);
    
    useEffect(() => { if (menuData?.categories.length && !activeOrderId) setActiveAccordionItems([menuData.categories[0].id]); }, [menuData, activeOrderId]);

    const isLoadingPage = loadingMenu || loadingActiveOrderStatus;
    const pageError = errorMenu;
    
    const subtotal = useMemo(() => currentOrderItems.reduce((acc: number, item: OrderItemFE) => acc + item.totalPriceForItem, 0), [currentOrderItems]);
    
    const cartButtonText = activeOrderId && canCurrentlyAddToExistingOrder ? t('publicMenu.cart.addItemsToOrderButton', { count: totalCartItems, orderNumber: activeOrderNumber }) : t('publicMenu.cart.viewOrderItems', { count: totalCartItems });

    if (isLoadingPage) return <Container size="md" py="xl" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}><Loader size="xl" /></Container>;
    if (pageError || !menuData) return <Container size="md" py="xl"><Alert icon={<IconAlertCircle size="1rem" />} title={t('common.error')} color="red" radius="md">{pageError || t('publicMenu.menuNotAvailable')}</Alert></Container>;

    return (
        <>
            <Container size="lg" py="xl">
                <Stack gap="xl">
                    <Group justify="center" align="center" wrap="nowrap"><Image src={menuData.businessLogoUrl || ''} alt={`${menuData.businessName} logo`} h={50} w="auto" fit="contain" radius="sm" /><Title order={1} ta="center" style={{ flexShrink: 1, minWidth: 0 }}>{menuData.businessName}</Title></Group>
                    {menuData.isLoyaltyCoreActive && !userData && (<Paper shadow="xs" p="sm" radius="md" withBorder><Group justify="space-between" align="center"><Group gap="xs"><IconGift size={24} color={theme.colors.blue[6]} /><Text size="sm" fw={500}>¿Quieres ganar puntos y canjear recompensas?</Text></Group><Button component={Link} to="/login" state={{ from: location }} variant="light" size="xs" leftSection={<IconLogin size={14} />}>Inicia Sesión o Regístrate</Button></Group></Paper>)}
                    {menuData.isLoyaltyCoreActive && userData && (<Paper shadow="xs" p="sm" radius="md" withBorder bg={colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.green[0]}><Group justify="space-between" align="center"><Stack gap={0}><Text fw={500}>¡Hola, {userData.name || userData.email}!</Text><Group gap="xs" mt={2}><IconAward size={16} color={theme.colors.yellow[7]} /><Text size="sm" c="dimmed">Tienes <Text span fw={700}>{userData.points ?? 0}</Text> puntos.</Text></Group></Stack><Button component={Link} to="/customer/dashboard" variant="outline" color="gray" size="xs" leftSection={<IconDashboard size={14} />}>Ver mi Panel</Button></Group></Paper>)}
                    {activeOrderId && (<Paper shadow="md" p="lg" radius="md" withBorder mb="xl" bg={canCurrentlyAddToExistingOrder ? (colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.blue[0]) : (colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[0])}><Group justify="space-between" align="center"><Group><IconInfoCircle size={24} color={canCurrentlyAddToExistingOrder ? theme.colors.blue[6] : theme.colors.orange[6]} /><Stack gap={0}><Text fw={500}>{t(canCurrentlyAddToExistingOrder ? 'publicMenu.activeOrder.addingToOrderTitle' : 'publicMenu.activeOrder.cannotAddTitle', { orderNumber: activeOrderNumber })}</Text><Text size="sm">{t(canCurrentlyAddToExistingOrder ? 'publicMenu.activeOrder.addingToOrderMsg' : 'publicMenu.activeOrder.cannotAddMsg')}</Text></Stack></Group><Button variant="outline" size="xs" component={Link} to={`/order-status/${activeOrderId}`} state={{ orderNumber: activeOrderNumber, businessSlug, tableIdentifier: tableIdentifierFromParams }}>{t('publicMenu.activeOrder.viewStatusButton')}</Button></Group></Paper>)}
                    {(totalCartItems > 0) && (<Paper p={0} shadow="xs" withBorder={false} radius="md" style={{ position: 'sticky', top: `calc(${theme.spacing.md} + 10px)`, zIndex: 200 }} ><Button fullWidth size="lg" variant="gradient" gradient={{ from: theme.primaryColor, to: theme.colors[theme.primaryColor][4], deg: 105 }} onClick={openCart} disabled={isCartOpen} styles={{ root: { height: 'auto', padding: `${theme.spacing.sm} ${theme.spacing.md}` }, label: { width: '100%' } }}><Group justify="space-between" style={{ width: '100%' }}><Group gap="xs"><IconShoppingCart size={22} stroke={1.8} /><Text fw={500} inherit> {cartButtonText} </Text></Group><Text fw={700} inherit>{t('publicMenu.cart.total')}: {subtotal.toLocaleString(i18n.language, { style: 'currency', currency: 'EUR' })}</Text></Group></Button></Paper>)}
                    
                    <CategoryAccordion
                        categories={menuData.categories}
                        activeAccordionItems={activeAccordionItems}
                        onAccordionChange={setActiveAccordionItems}
                        redeemableItemsMap={redeemableItemsMap}
                        userData={userData}
                        onAddToCart={handleAddToCart}
                        onRedeem={handleRedeemItem}
                    />
                </Stack>
            </Container>
            <ShoppingCartModal
                opened={isCartOpen} onClose={closeCart}
                orderItems={currentOrderItems} orderNotes={orderNotes}
                onUpdateItemQuantity={updateItemQuantityInCart} onRemoveItem={removeItemFromCart}
                onUpdateOrderNotes={updateOrderNotes} onSubmitOrder={handleSubmitOrderOrAddItems}
                isSubmittingOrder={isSubmittingOrder} onClearCart={clearCart}
                isAddingToExistingOrder={!!(activeOrderId && canCurrentlyAddToExistingOrder)}
                activeOrderNumber={activeOrderNumber}
            />
        </>
    );
};

export default PublicMenuViewPage;