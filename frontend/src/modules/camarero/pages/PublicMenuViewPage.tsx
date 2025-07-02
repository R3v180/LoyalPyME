// frontend/src/modules/camarero/pages/PublicMenuViewPage.tsx
// VERSIÓN 5.0.7 - Lógica de `location.state` mejorada para evitar re-renderizados indeseados.

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

import { RewardType, DiscountType } from '../../../shared/types/enums';
import { useLayoutUserData } from '../../../shared/hooks/useLayoutUserData';
import CategoryAccordion from '../components/public/menu/CategoryAccordion';
import ShoppingCartModal from '../components/public/menu/ShoppingCartModal';
import ApplyRewardModal, { AppliedSelections } from '../../loyalpyme/components/customer/ApplyRewardModal';
import { useActiveOrderState } from '../hooks/useActiveOrderState';
import { usePublicOrderCart } from '../hooks/usePublicOrderCart';
import { useMenuItemConfigurator } from '../hooks/useMenuItemConfigurator';
import { usePublicMenuData } from '../hooks/usePublicMenuData';
import { useCustomerRewardsData } from '../../loyalpyme/hooks/useCustomerRewardsData';
import { handleOrderSubmission } from '../services/publicOrderApiService';
import type { Reward, DisplayReward } from '../../../shared/types/user.types';
import { OrderItemFE } from '../types/publicOrder.types';

const PublicMenuViewPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const theme = useMantineTheme();
    const { colorScheme } = useMantineColorScheme();
    const { businessSlug, tableIdentifier: tableIdentifierFromParams } = useParams<{ businessSlug: string; tableIdentifier?: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const { menuData, loadingMenu, errorMenu } = usePublicMenuData(businessSlug);
    const { userData } = useLayoutUserData();
    const { redeemableRewards, availableCoupons } = useCustomerRewardsData();
    const { activeOrderId, activeOrderNumber, canCurrentlyAddToExistingOrder, loadingActiveOrderStatus, setActiveOrderManually, activeOrderDetails } = useActiveOrderState(businessSlug, tableIdentifierFromParams);
    
    const {
        currentOrderItems, orderNotes, totalCartItems,
        addItemToCart, addSimpleItemToCart, removeItemFromCart, updateItemQuantityInCart,
        updateOrderNotes, clearCart, clearCartStorage, addFreeItemReward
    } = usePublicOrderCart(businessSlug, tableIdentifierFromParams, activeOrderId);
    
    const { configuringItem, startConfiguringItem, cancelConfiguration, updateConfigQuantity, updateConfigModifierSelection, updateConfigNotes } = useMenuItemConfigurator();
    
    const [activeAccordionItems, setActiveAccordionItems] = useState<string[]>([]);
    const [isCartOpen, { open: openCart, close: closeCart }] = useDisclosure(false);
    const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);
    const [isRewardModalOpen, { open: openRewardModal, close: closeRewardModal }] = useDisclosure(false);
    
    const [appliedRewards, setAppliedRewards] = useState<AppliedSelections>({ discount: null, freeItems: [] });

    // --- NUEVO USE EFFECT PARA MANEJAR EL ESTADO DE NAVEGACIÓN ---
    useEffect(() => {
        const rewardToApply = location.state?.rewardToApply as Reward | undefined;

        // Solo actuar si hay una recompensa en el estado y los datos del menú están cargados
        if (rewardToApply && menuData) {
            console.log("[PublicMenuViewPage] Detected rewardToApply in location state:", rewardToApply);
            
            // Lógica para aplicar la recompensa
            if (rewardToApply.type === RewardType.MENU_ITEM) {
                const menuItem = menuData.categories.flatMap(c => c.items).find(i => i.id === rewardToApply.linkedMenuItemId);
                if (menuItem) {
                    addFreeItemReward(rewardToApply, menuItem);
                }
            } else if (rewardToApply.type === RewardType.DISCOUNT_ON_ITEM || rewardToApply.type === RewardType.DISCOUNT_ON_TOTAL) {
                const displayRewardToApply: DisplayReward = {
                    isGift: false,
                    id: rewardToApply.id, name_es: rewardToApply.name_es, name_en: rewardToApply.name_en,
                    description_es: rewardToApply.description_es, description_en: rewardToApply.description_en,
                    pointsCost: rewardToApply.pointsCost, imageUrl: rewardToApply.imageUrl, type: rewardToApply.type,
                    linkedMenuItemId: rewardToApply.linkedMenuItemId, discountType: rewardToApply.discountType,
                    discountValue: Number(rewardToApply.discountValue) || null,
                };
                setAppliedRewards(prev => ({ ...prev, discount: displayRewardToApply }));
            }

            // MUY IMPORTANTE: Limpiar el estado de la navegación para que no se reaplique al refrescar la página.
            navigate(location.pathname, { replace: true, state: {} });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [menuData, location.state]); // Se ejecuta solo cuando cambian menuData o location.state

    const subtotal = currentOrderItems.reduce((acc, item) => acc + item.totalPriceForItem, 0);

    const calculatedDiscountAmount = useMemo(() => {
        if (!appliedRewards.discount) return 0;
        const discount = appliedRewards.discount;
        const discountValue = discount.discountValue ? Number(discount.discountValue) : 0;
        let baseAmountForDiscount = subtotal;

        if (discount.type === RewardType.DISCOUNT_ON_ITEM && discount.linkedMenuItemId) {
            baseAmountForDiscount = currentOrderItems
                .filter(item => item.menuItemId === discount.linkedMenuItemId)
                .reduce((sum, item) => sum + item.totalPriceForItem, 0);
        }
        let amount = 0;
        if (discount.discountType === DiscountType.PERCENTAGE) {
            amount = baseAmountForDiscount * (discountValue / 100);
        } else if (discount.discountType === DiscountType.FIXED_AMOUNT) {
            amount = discountValue;
        }
        return Math.min(baseAmountForDiscount, amount);
    }, [subtotal, appliedRewards.discount, currentOrderItems]);

    const totalAmountWithDiscount = Math.max(0, subtotal - calculatedDiscountAmount);

    const handleSubmitOrderOrAddItems = useCallback(async () => { /* ... (sin cambios) ... */
        if (currentOrderItems.length === 0 && !appliedRewards.discount) { notifications.show({ title: t('publicMenu.cart.errorTitle'), message: activeOrderId ? t('publicMenu.cart.errorEmptyAddToOrder') : t('publicMenu.cart.errorEmpty'), color: 'orange' }); return; }
        if (!businessSlug) return; setIsSubmittingOrder(true);
        try {
            const discountRewardId = appliedRewards.discount ? appliedRewards.discount.id : null;
            const response = await handleOrderSubmission(currentOrderItems, orderNotes, canCurrentlyAddToExistingOrder ? activeOrderId : null, businessSlug, tableIdentifierFromParams, userData?.id, discountRewardId);
            const orderIdToNavigate = response.id;
            const orderNumberToNavigate = response.orderNumber || activeOrderNumber || orderIdToNavigate;
            const successMessage = activeOrderId ? t('publicMenu.cart.itemsAddedSuccessMsg', { orderNumber: orderNumberToNavigate }) : t('publicMenu.cart.orderSuccessMsg', { orderNumber: orderNumberToNavigate });
            notifications.show({ title: activeOrderId ? t('publicMenu.cart.itemsAddedSuccessTitle') : t('publicMenu.cart.orderSuccessTitle'), message: successMessage, color: 'green', icon: <IconCheck /> });
            if (!activeOrderId) setActiveOrderManually(orderIdToNavigate, orderNumberToNavigate);
            clearCart(); setAppliedRewards({ discount: null, freeItems: [] }); clearCartStorage(); closeCart();
            navigate(`/order-status/${orderIdToNavigate}`, { state: { orderNumber: orderNumberToNavigate, businessSlug, tableIdentifier: tableIdentifierFromParams } });
        } catch (err: any) {
            const errMsg = err.response?.data?.message || err.message || t('publicMenu.cart.orderErrorMsg');
            notifications.show({ title: t('publicMenu.cart.orderErrorTitle'), message: errMsg, color: 'red', icon: <IconAlertCircle /> });
        } finally { setIsSubmittingOrder(false); }
    }, [currentOrderItems, orderNotes, canCurrentlyAddToExistingOrder, activeOrderId, businessSlug, tableIdentifierFromParams, userData?.id, navigate, t, setActiveOrderManually, clearCart, clearCartStorage, closeCart, appliedRewards.discount, activeOrderNumber]);

    useEffect(() => { if (menuData?.categories.length && !activeOrderId) setActiveAccordionItems([menuData.categories[0].id]); }, [menuData, activeOrderId]);

    const handleApplyRewardsFromModal = useCallback((selections: AppliedSelections) => { /* ... (sin cambios) ... */
        if (!menuData) return; setAppliedRewards(selections);
        const selectedFreeItemRewardIds = new Set(selections.freeItems.map(item => item.id));
        currentOrderItems.forEach(cartItem => { if (cartItem.redeemedRewardId && !selectedFreeItemRewardIds.has(cartItem.redeemedRewardId)) { removeItemFromCart(cartItem.cartItemId); } });
        selections.freeItems.forEach(rewardDisplay => {
            const fullReward = redeemableRewards.find(r => r.id === rewardDisplay.id) || availableCoupons.find(c => c.reward.id === rewardDisplay.id)?.reward;
            if (fullReward && !currentOrderItems.some(ci => ci.redeemedRewardId === fullReward.id) && fullReward.type === RewardType.MENU_ITEM && fullReward.linkedMenuItemId) {
                const menuItemToRedeem = menuData.categories.flatMap(c => c.items).find(item => item.id === fullReward.linkedMenuItemId);
                if (menuItemToRedeem) { addFreeItemReward(fullReward, menuItemToRedeem); }
            }
        });
        notifications.show({ title: t('applyRewardModal.success.title'), message: t('applyRewardModal.success.message'), color: 'green' });
        closeRewardModal();
    }, [menuData, currentOrderItems, removeItemFromCart, addFreeItemReward, closeRewardModal, t, redeemableRewards, availableCoupons]);
    
    const handleConfiguredItemAddToCart = () => { /* ... (sin cambios) ... */
        if (!configuringItem) return;
        const { itemDetails, quantity, selectedOptionsByGroup, currentUnitPrice, itemNotes, areModifiersValid } = configuringItem;
        if (!areModifiersValid) { notifications.show({ title: t('publicMenu.invalidSelectionTitle'), message: t('publicMenu.invalidSelectionMsg'), color: 'orange' }); return; }
        const flatSelectedModifiers = Object.entries(selectedOptionsByGroup).flatMap(([groupId, optionSelections]) => {
            const group = itemDetails.modifierGroups.find(g => g.id === groupId); if (!group?.options) return [];
            const ids = Array.isArray(optionSelections) ? optionSelections.filter(Boolean) : (typeof optionSelections === 'string' ? [optionSelections] : []).filter(Boolean);
            return ids.map(optId => {
                const option = group.options.find(o => o.id === optId);
                return option ? { modifierOptionId: option.id, name_es: option.name_es, name_en: option.name_en, priceAdjustment: option.priceAdjustment, modifierGroupName_es: group.name_es, modifierGroupName_en: group.name_en } : null;
            }).filter((mod): mod is NonNullable<typeof mod> => mod !== null);
        });
        const sortedModifierOptionIds = flatSelectedModifiers.map(mod => mod.modifierOptionId).sort().join(',');
        const notesHash = itemNotes ? `_notes-${itemNotes.toLocaleLowerCase().replace(/\s/g, '')}` : '';
        const cartItemId = `${itemDetails.id}${flatSelectedModifiers.length > 0 ? `-[${sortedModifierOptionIds}]` : ''}${notesHash}`;
        const newCartItem: OrderItemFE = { cartItemId, menuItemId: itemDetails.id, menuItemName_es: itemDetails.name_es, menuItemName_en: itemDetails.name_en, quantity, basePrice: itemDetails.price, currentPricePerUnit: currentUnitPrice, totalPriceForItem: currentUnitPrice * quantity, notes: itemNotes || undefined, selectedModifiers: flatSelectedModifiers, redeemedRewardId: null };
        addItemToCart(newCartItem);
        cancelConfiguration();
    };

    const isLoadingPage = loadingMenu || loadingActiveOrderStatus;
    const pageError = errorMenu;
    const cartButtonText = activeOrderId && canCurrentlyAddToExistingOrder ? t('publicMenu.cart.addItemsToOrderButton', { count: totalCartItems, orderNumber: activeOrderNumber }) : t('publicMenu.cart.viewOrderItems', { count: totalCartItems });

    if (isLoadingPage) return <Container size="md" py="xl" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}><Loader size="xl" /></Container>;
    if (pageError || !menuData) return <Container size="md" py="xl"><Alert icon={<IconAlertCircle size="1rem" />} title={t('common.error')} color="red" radius="md">{pageError || t('publicMenu.menuNotAvailable')}</Alert></Container>;

    return (
        <>
            {/* El JSX del return se mantiene igual que en la versión anterior */}
            <Container size="lg" py="xl"><Stack gap="xl"><Group justify="center" align="center" wrap="nowrap"><Image src={menuData.businessLogoUrl || ''} alt={`${menuData.businessName} logo`} h={50} w="auto" fit="contain" radius="sm" /><Title order={1} ta="center" style={{ flexShrink: 1, minWidth: 0 }}>{menuData.businessName}</Title></Group>{menuData.isLoyaltyCoreActive && !userData && (<Paper shadow="xs" p="sm" radius="md" withBorder><Group justify="space-between" align="center"><Group gap="xs"><IconGift size={24} color={theme.colors.blue[6]} /><Text size="sm" fw={500}>¿Quieres ganar puntos y canjear recompensas?</Text></Group><Button component={Link} to="/login" state={{ from: location }} variant="light" size="xs" leftSection={<IconLogin size={14} />}>Inicia Sesión o Regístrate</Button></Group></Paper>)}{menuData.isLoyaltyCoreActive && userData && (<Paper shadow="xs" p="sm" radius="md" withBorder bg={colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.green[0]}><Group justify="space-between" align="center"><Stack gap={0}><Text fw={500}>¡Hola, {userData.name || userData.email}!</Text><Group gap="xs" mt={2}><IconAward size={16} color={theme.colors.yellow[7]} /><Text size="sm" c="dimmed">Tienes <Text span fw={700}>{userData.points ?? 0}</Text> puntos.</Text></Group></Stack><Button component={Link} to="/customer/dashboard" variant="outline" color="gray" size="xs" leftSection={<IconDashboard size={14} />}>Ver mi Panel</Button></Group></Paper>)}{activeOrderId && !configuringItem && (<Paper shadow="md" p="lg" radius="md" withBorder mb="xl" bg={canCurrentlyAddToExistingOrder ? (colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.blue[0]) : (colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[0])}><Group justify="space-between" align="center"><Group><IconInfoCircle size={24} color={canCurrentlyAddToExistingOrder ? theme.colors.blue[6] : theme.colors.orange[6]} /><Stack gap={0}><Text fw={500}>{t(canCurrentlyAddToExistingOrder ? 'publicMenu.activeOrder.addingToOrderTitle' : 'publicMenu.activeOrder.cannotAddTitle', { orderNumber: activeOrderNumber })}</Text><Text size="sm">{t(canCurrentlyAddToExistingOrder ? 'publicMenu.activeOrder.addingToOrderMsg' : 'publicMenu.activeOrder.cannotAddMsg')}</Text></Stack></Group><Button variant="outline" size="xs" component={Link} to={`/order-status/${activeOrderId}`} state={{ orderNumber: activeOrderNumber, businessSlug, tableIdentifier: tableIdentifierFromParams }}>{t('publicMenu.activeOrder.viewStatusButton')}</Button></Group></Paper>)}{(totalCartItems > 0 || appliedRewards.discount) ? (<Paper p={0} shadow="xs" withBorder={false} radius="md" style={{ position: 'sticky', top: `calc(${theme.spacing.md} + 10px)`, zIndex: 200 }} ><Button fullWidth size="lg" variant="gradient" gradient={{ from: theme.primaryColor, to: theme.colors[theme.primaryColor][4], deg: 105 }} onClick={openCart} disabled={isCartOpen} styles={{ root: { height: 'auto', padding: `${theme.spacing.sm} ${theme.spacing.md}` }, label: { width: '100%' } }}><Group justify="space-between" style={{ width: '100%' }}><Group gap="xs"><IconShoppingCart size={22} stroke={1.8} /><Text fw={500} inherit> {cartButtonText} </Text></Group><Text fw={700} inherit>{t('publicMenu.cart.total')}: {totalAmountWithDiscount.toLocaleString(i18n.language, { style: 'currency', currency: 'EUR' })}</Text></Group></Button></Paper>) : null }<CategoryAccordion categories={menuData.categories} activeAccordionItems={activeAccordionItems} onAccordionChange={setActiveAccordionItems} configuringItemId={configuringItem?.itemDetails.id || null} configuringItemState={configuringItem} onStartConfigureItem={startConfiguringItem} onCancelConfiguration={cancelConfiguration} onConfigQuantityChange={updateConfigQuantity} onConfigModifierSelectionChange={updateConfigModifierSelection} onConfigNotesChange={updateConfigNotes} onConfigAddToCart={handleConfiguredItemAddToCart} onSimpleAddToCart={addSimpleItemToCart} /></Stack></Container>
            <ShoppingCartModal opened={isCartOpen} onClose={closeCart} orderItems={currentOrderItems} orderNotes={orderNotes} subtotal={subtotal} totalWithDiscount={totalAmountWithDiscount} appliedDiscount={appliedRewards.discount} onUpdateItemQuantity={updateItemQuantityInCart} onRemoveItem={removeItemFromCart} onUpdateOrderNotes={updateOrderNotes} onSubmitOrder={() => handleSubmitOrderOrAddItems()} isSubmittingOrder={isSubmittingOrder} onClearCart={clearCart} isAddingToExistingOrder={!!(activeOrderId && canCurrentlyAddToExistingOrder)} activeOrderNumber={activeOrderNumber} onOpenRewardModal={openRewardModal} onRemoveDiscount={() => setAppliedRewards(prev => ({ ...prev, discount: null }))}/>
            {userData && (<ApplyRewardModal opened={isRewardModalOpen} onClose={closeRewardModal} userPoints={userData.points ?? 0} availableCoupons={availableCoupons} redeemableRewards={redeemableRewards} initialSelections={appliedRewards} onApply={handleApplyRewardsFromModal} isApplying={isSubmittingOrder} appliedLcoRewardIdOnActiveOrder={activeOrderDetails?.appliedLcoRewardId || null} />)}
        </>
    );
};

export default PublicMenuViewPage;