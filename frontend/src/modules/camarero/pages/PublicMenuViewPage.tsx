// frontend/src/modules/camarero/pages/PublicMenuViewPage.tsx
// Version 2.3.1 - Final Corrected Version with All Imports, Logic, and Types

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

// Tipos
import { SelectedModifierFE } from '../types/publicOrder.types';
import { DisplayReward } from '../../../shared/types/user.types';
import { RewardType } from '../../../shared/types/enums';

// Componentes
import CategoryAccordion from '../components/public/menu/CategoryAccordion';
import ShoppingCartModal from '../components/public/menu/ShoppingCartModal';

// Hooks
import { useActiveOrderState } from '../hooks/useActiveOrderState';
import { usePublicOrderCart } from '../hooks/usePublicOrderCart';
import { useMenuItemConfigurator } from '../hooks/useMenuItemConfigurator';
import { usePublicMenuData } from '../hooks/usePublicMenuData';
import { useLayoutUserData } from '../../../shared/hooks/useLayoutUserData';
import { useCustomerRewardsData } from '../../loyalpyme/hooks/useCustomerRewardsData';

// Servicio
import { handleOrderSubmission } from '../services/publicOrderApiService';

const PublicMenuViewPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const theme = useMantineTheme();
    const { colorScheme } = useMantineColorScheme();
    const { businessSlug, tableIdentifier: tableIdentifierFromParams } = useParams<{ businessSlug: string; tableIdentifier?: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const { menuData, loadingMenu, errorMenu } = usePublicMenuData(businessSlug);
    const { userData } = useLayoutUserData();
    const { displayRewards, errorRewards } = useCustomerRewardsData();
    const {
        activeOrderId, activeOrderNumber, canCurrentlyAddToExistingOrder,
        loadingActiveOrderStatus, clearActiveOrder, setActiveOrderManually,
    } = useActiveOrderState(businessSlug, tableIdentifierFromParams);
    const {
        currentOrderItems, orderNotes, totalCartItems,
        addItemToCart, addSimpleItemToCart, updateItemQuantityInCart,
        removeItemFromCart, updateOrderNotes, clearCart, clearCartStorage,
    } = usePublicOrderCart(businessSlug, tableIdentifierFromParams, activeOrderId);
    const {
        configuringItem, startConfiguringItem, cancelConfiguration,
        updateConfigQuantity, updateConfigModifierSelection, updateConfigNotes,
    } = useMenuItemConfigurator();
    
    const [activeAccordionItems, setActiveAccordionItems] = useState<string[]>([]);
    const [isCartOpen, { open: openCart, close: closeCart }] = useDisclosure(false);
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
    const [appliedDiscount, setAppliedDiscount] = useState<DisplayReward | null>(null);

    useEffect(() => {
        if (menuData?.categories.length) {
            setActiveAccordionItems(activeOrderId ? [] : [menuData.categories[0].id]);
        }
    }, [menuData, activeOrderId]);

    const handleRedeemFreeItem = useCallback((reward: DisplayReward) => {
        if (reward.isGift || reward.type !== RewardType.MENU_ITEM || !reward.linkedMenuItemId) return;
        const menuItemToRedeem = menuData?.categories.flatMap(c => c.items).find(item => item.id === reward.linkedMenuItemId);
        if (!menuItemToRedeem) {
            notifications.show({ title: 'Error', message: 'El producto de esta recompensa no está disponible.', color: 'orange' });
            return;
        }
        addItemToCart({
            cartItemId: `reward-${reward.id}`, menuItemId: menuItemToRedeem.id,
            menuItemName_es: menuItemToRedeem.name_es, menuItemName_en: menuItemToRedeem.name_en,
            quantity: 1, basePrice: 0, currentPricePerUnit: 0, totalPriceForItem: 0,
            selectedModifiers: [], redeemedRewardId: reward.id,
        });
        notifications.show({ title: 'Recompensa Añadida', message: `${reward.name_es} añadido al carrito.`, color: 'green', icon: <IconGift /> });
    }, [menuData, addItemToCart]);

    const handleApplyDiscount = useCallback((reward: DisplayReward) => {
        if (appliedDiscount) {
            notifications.show({ title: 'Información', message: 'Ya tienes un descuento aplicado.', color: 'blue' });
            return;
        }
        setAppliedDiscount(reward);
        notifications.show({ title: 'Descuento Aplicado', message: `${reward.name_es} aplicado a tu pedido.`, color: 'green', icon: <IconCheck/> });
    }, [appliedDiscount]);

    const onRemoveDiscount = useCallback(() => { setAppliedDiscount(null); }, []);

    const affordableRewards = useMemo(() => {
        if (!userData || !displayRewards || userData.points === undefined) return [];
        const redeemedItemRewardIds = new Set(currentOrderItems.filter(item => item.redeemedRewardId).map(item => item.redeemedRewardId));
        return displayRewards.filter(reward => {
            if (reward.isGift) return false;
            if (redeemedItemRewardIds.has(reward.id)) return false;
            if (appliedDiscount?.id === reward.id) return false;
            return userData.points! >= reward.pointsCost;
        });
    }, [userData, displayRewards, currentOrderItems, appliedDiscount]);

    const handleConfiguredItemAddToCart = () => {
        if (!configuringItem) return;
        const { itemDetails, quantity, selectedOptionsByGroup, currentUnitPrice, itemNotes, areModifiersValid } = configuringItem;
        if (!areModifiersValid) {
            notifications.show({ title: t('publicMenu.invalidSelectionTitle'), message: t('publicMenu.invalidSelectionMsg'), color: 'orange' });
            return;
        }
        const flatSelectedModifiers: SelectedModifierFE[] = [];
        if (itemDetails.modifierGroups) {
            Object.entries(selectedOptionsByGroup).forEach(([groupId, optionSelections]) => {
                const group = itemDetails.modifierGroups.find(g => g.id === groupId);
                if (!group?.options) return;
                const ids = Array.isArray(optionSelections) ? optionSelections.filter(Boolean) : (typeof optionSelections === 'string' ? [optionSelections] : []).filter(Boolean);
                ids.forEach(optId => {
                    const option = group.options.find(o => o.id === optId);
                    if (option) { flatSelectedModifiers.push({ modifierOptionId: option.id, name_es: option.name_es, name_en: option.name_en, priceAdjustment: option.priceAdjustment, modifierGroupName_es: group.name_es, modifierGroupName_en: group.name_en }); }
                });
            });
        }
        const sortedModifierOptionIds = flatSelectedModifiers.map(m => m.modifierOptionId).sort().join(',');
        const notesHash = itemNotes ? `_notes-${itemNotes.toLocaleLowerCase().replace(/\s/g, '')}` : '';
        const cartItemId = `${itemDetails.id}${flatSelectedModifiers.length > 0 ? `-[${sortedModifierOptionIds}]` : ''}${notesHash}`;
        addItemToCart({ cartItemId, menuItemId: itemDetails.id, menuItemName_es: itemDetails.name_es, menuItemName_en: itemDetails.name_en, quantity, basePrice: itemDetails.price, currentPricePerUnit: currentUnitPrice, totalPriceForItem: currentUnitPrice * quantity, notes: itemNotes || undefined, selectedModifiers: flatSelectedModifiers });
        cancelConfiguration();
    };

    const handleSubmitOrderOrAddItems = async () => {
        if (currentOrderItems.length === 0) {
            notifications.show({ title: t('publicMenu.cart.errorTitle'), message: activeOrderId ? t('publicMenu.cart.errorEmptyAddToOrder') : t('publicMenu.cart.errorEmpty'), color: 'orange' });
            return;
        }
        if (!businessSlug) return;
        setIsSubmittingOrder(true);
        try {
            const response = await handleOrderSubmission(
                currentOrderItems, orderNotes,
                canCurrentlyAddToExistingOrder ? activeOrderId : null,
                businessSlug, tableIdentifierFromParams, userData?.id,
                appliedDiscount?.id || null
            );
            const orderIdToNavigate = response.id;
            const orderNumberToNavigate = response.orderNumber || activeOrderNumber || orderIdToNavigate;
            const successMessage = activeOrderId ? t('publicMenu.cart.itemsAddedSuccessMsg', { orderNumber: orderNumberToNavigate }) : t('publicMenu.cart.orderSuccessMsg', { orderNumber: orderNumberToNavigate });
            notifications.show({ title: activeOrderId ? t('publicMenu.cart.itemsAddedSuccessTitle') : t('publicMenu.cart.orderSuccessTitle'), message: successMessage, color: 'green', icon: <IconCheck /> });
            if (!activeOrderId) setActiveOrderManually(orderIdToNavigate, orderNumberToNavigate);
            clearCart(); setAppliedDiscount(null); clearCartStorage(); closeCart();
            navigate(`/order-status/${orderIdToNavigate}`, { state: { orderNumber: orderNumberToNavigate, businessSlug, tableIdentifier: tableIdentifierFromParams } });
        } catch (err: any) {
            const errMsg = err.response?.data?.message || err.message || t('publicMenu.cart.orderErrorMsg');
            notifications.show({ title: t('publicMenu.cart.orderErrorTitle'), message: errMsg, color: 'red', icon: <IconAlertCircle /> });
        } finally {
            setIsSubmittingOrder(false);
        }
    };

    const isLoadingPage = loadingMenu || loadingActiveOrderStatus;
    const pageError = errorMenu || errorRewards;

    if (isLoadingPage) return ( <Container size="md" py="xl" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}><Loader size="xl" /></Container> );
    if (pageError || !menuData) return ( <Container size="md" py="xl"><Alert icon={<IconAlertCircle size="1rem" />} title={t('common.error')} color="red" radius="md">{pageError || t('publicMenu.menuNotAvailable')}</Alert></Container> );
    
    const totalAmountWithDiscount = Math.max(0, currentOrderItems.reduce((acc, item) => acc + item.totalPriceForItem, 0) - (appliedDiscount && !appliedDiscount.isGift ? (appliedDiscount.discountType === 'PERCENTAGE' ? (currentOrderItems.reduce((acc, item) => acc + item.totalPriceForItem, 0) * (Number(appliedDiscount.discountValue) / 100)) : Number(appliedDiscount.discountValue)) : 0));
    const cartButtonText = activeOrderId && canCurrentlyAddToExistingOrder ? t('publicMenu.cart.addItemsToOrderButton', { count: totalCartItems, orderNumber: activeOrderNumber }) : t('publicMenu.cart.viewOrderItems', { count: totalCartItems });

    return (
        <>
            <Container size="lg" py="xl">
                <Stack gap="xl">
                    <Group justify="center" align="center" wrap="nowrap">
                        {menuData.businessLogoUrl && ( <Image src={menuData.businessLogoUrl} alt={`${menuData.businessName} logo`} h={50} w="auto" fit="contain" radius="sm" /> )}
                        <Title order={1} ta="center" style={{ flexShrink: 1, minWidth: 0 }}>{menuData.businessName}</Title>
                    </Group>

                    {menuData.isLoyaltyCoreActive && !userData && (
                        <Paper shadow="xs" p="sm" radius="md" withBorder>
                            <Group justify="space-between" align="center">
                                <Group gap="xs"><IconGift size={24} color={theme.colors.blue[6]} /><Text size="sm" fw={500}>¿Quieres ganar puntos y canjear recompensas?</Text></Group>
                                <Button component={Link} to="/login" state={{ from: location }} variant="light" size="xs" leftSection={<IconLogin size={14} />}>Inicia Sesión o Regístrate</Button>
                            </Group>
                        </Paper>
                    )}
                    {menuData.isLoyaltyCoreActive && userData && (
                        <Paper shadow="xs" p="sm" radius="md" withBorder bg={colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.green[0]}>
                            <Group justify="space-between" align="center">
                                <Stack gap={0}><Text fw={500}>¡Hola, {userData.name || userData.email}!</Text><Group gap="xs" mt={2}><IconAward size={16} color={theme.colors.yellow[7]} /><Text size="sm" c="dimmed">Tienes <Text span fw={700}>{userData.points ?? 0}</Text> puntos.</Text></Group></Stack>
                                <Button component={Link} to="/customer/dashboard" variant="outline" color="gray" size="xs" leftSection={<IconDashboard size={14} />}>Ver mi Panel</Button>
                            </Group>
                        </Paper>
                    )}

                    {activeOrderId && canCurrentlyAddToExistingOrder && !configuringItem && (
                        <Paper shadow="md" p="lg" radius="md" withBorder mb="xl" bg={colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.blue[0]}>
                            <Group justify="space-between" align="center"><Group><IconInfoCircle size={24} color={theme.colors.blue[6]} /><Stack gap={0}><Text fw={500}>{t('publicMenu.activeOrder.addingToOrderTitle', {orderNumber: activeOrderNumber})}</Text><Text size="sm">{t('publicMenu.activeOrder.addingToOrderMsg')}</Text></Stack></Group><Button variant="outline" size="xs" component={Link} to={`/order-status/${activeOrderId}`} state={{ orderNumber: activeOrderNumber, businessSlug, tableIdentifier: tableIdentifierFromParams }}>{t('publicMenu.activeOrder.viewStatusButton')}</Button></Group>
                        </Paper>
                    )}
                    {activeOrderId && !canCurrentlyAddToExistingOrder && !loadingActiveOrderStatus && !configuringItem && (
                        <Paper shadow="md" p="lg" radius="md" withBorder mb="xl" bg={colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[0]}>
                            <Group justify="space-between" align="center"><Group><IconAlertCircle size={24} color={theme.colors.orange[6]} /><Stack gap={0}><Text fw={500}>{t('publicMenu.activeOrder.cannotAddTitle', {orderNumber: activeOrderNumber})}</Text><Text size="sm">{t('publicMenu.activeOrder.cannotAddMsg')}</Text></Stack></Group><Button variant="outline" size="xs" onClick={clearActiveOrder}>{t('publicMenu.activeOrder.startNewButtonAlt')}</Button></Group>
                        </Paper>
                    )}
                    
                    {totalCartItems > 0 && (!activeOrderId || (activeOrderId && canCurrentlyAddToExistingOrder)) && !configuringItem && (
                        <Paper p={0} shadow="xs" withBorder={false} radius="md" style={{ position: 'sticky', top: `calc(${theme.spacing.md} + 10px)`, zIndex: 200 }} ><Button fullWidth size="lg" variant="gradient" gradient={{ from: theme.primaryColor, to: theme.colors[theme.primaryColor][4], deg: 105 }} onClick={openCart} disabled={isCartOpen} styles={{ root: { height: 'auto', padding: `${theme.spacing.sm} ${theme.spacing.md}` }, label: { width: '100%' } }}><Group justify="space-between" style={{ width: '100%' }}><Group gap="xs"><IconShoppingCart size={22} stroke={1.8} /><Text fw={500} inherit> {cartButtonText} </Text></Group><Text fw={700} inherit>{t('publicMenu.cart.total')}: {totalAmountWithDiscount.toLocaleString(i18n.language, { style: 'currency', currency: 'EUR' })}</Text></Group></Button></Paper>
                    )}
                    
                    <CategoryAccordion
                        categories={menuData.categories} activeAccordionItems={activeAccordionItems} onAccordionChange={setActiveAccordionItems}
                        configuringItemId={configuringItem?.itemDetails.id || null} configuringItemState={configuringItem}
                        onStartConfigureItem={startConfiguringItem} onCancelConfiguration={cancelConfiguration}
                        onConfigQuantityChange={updateConfigQuantity} onConfigModifierSelectionChange={updateConfigModifierSelection}
                        onConfigNotesChange={updateConfigNotes}
                        onConfigAddToCart={handleConfiguredItemAddToCart}
                        onSimpleAddToCart={addSimpleItemToCart}
                    />
                </Stack>
            </Container>
            <ShoppingCartModal
                opened={isCartOpen} onClose={closeCart} orderItems={currentOrderItems} orderNotes={orderNotes}
                onUpdateItemQuantity={updateItemQuantityInCart} onRemoveItem={removeItemFromCart}
                onUpdateOrderNotes={updateOrderNotes} onSubmitOrder={handleSubmitOrderOrAddItems}
                isSubmittingOrder={isSubmittingOrder} onClearCart={clearCart}
                isAddingToExistingOrder={!!(activeOrderId && canCurrentlyAddToExistingOrder)} activeOrderNumber={activeOrderNumber}
                availableRewards={affordableRewards}
                onRedeemFreeItem={handleRedeemFreeItem}
                onApplyDiscount={handleApplyDiscount}
                onRemoveDiscount={onRemoveDiscount}
                appliedDiscount={appliedDiscount}
            />
        </>
    );
};

export default PublicMenuViewPage;