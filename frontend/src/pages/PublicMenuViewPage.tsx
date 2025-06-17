// frontend/src/pages/PublicMenuViewPage.tsx
// Version 2.2.0 (Refactored to use usePublicMenuData hook)

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Container, Title, Loader, Alert, Text, Stack, Paper, Image, Group,
    useMantineTheme, Button, useMantineColorScheme
} from '@mantine/core';
import {
    IconAlertCircle, IconShoppingCart, IconCheck, IconInfoCircle
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';

// Tipos
import { SelectedModifierFE } from '../types/publicOrder.types';

// Componentes
import CategoryAccordion from '../components/public/menu/CategoryAccordion';
import { MenuItemCardConfiguringState } from '../components/public/menu/MenuItemCard';
import ShoppingCartModal from '../components/public/menu/ShoppingCartModal';

// Hooks
import { useActiveOrderState } from '../hooks/useActiveOrderState';
import { usePublicOrderCart } from '../hooks/usePublicOrderCart';
import { useMenuItemConfigurator } from '../hooks/useMenuItemConfigurator';
import { usePublicMenuData } from '../hooks/usePublicMenuData'; // <-- NUEVA IMPORTACIÓN

// Servicio
import { handleOrderSubmission } from '../services/publicOrderApiService';


const PublicMenuViewPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const theme = useMantineTheme();
    const { colorScheme } = useMantineColorScheme();
    const { businessSlug, tableIdentifier: tableIdentifierFromParams } = useParams<{ businessSlug: string; tableIdentifier?: string }>();
    const navigate = useNavigate();

    // --- LÓGICA DE DATOS AHORA CENTRALIZADA EN HOOKS ---
    const { menuData, loadingMenu, errorMenu } = usePublicMenuData(businessSlug);
    const {
        activeOrderId, activeOrderNumber, canCurrentlyAddToExistingOrder,
        loadingActiveOrderStatus, clearActiveOrder, setActiveOrderManually,
    } = useActiveOrderState(businessSlug, tableIdentifierFromParams);
    const {
        currentOrderItems, orderNotes, totalCartItems, totalCartAmount,
        addItemToCart, addSimpleItemToCart, updateItemQuantityInCart,
        removeItemFromCart, updateOrderNotes, clearCart, clearCartStorage,
    } = usePublicOrderCart(businessSlug, tableIdentifierFromParams, activeOrderId);
    const {
        configuringItem, startConfiguringItem, cancelConfiguration,
        updateConfigQuantity, updateConfigModifierSelection, updateConfigNotes,
    } = useMenuItemConfigurator();
    
    // --- ESTADO LOCAL SOLO PARA LA UI ---
    const [activeAccordionItems, setActiveAccordionItems] = useState<string[]>([]);
    const [isCartOpen, { open: openCart, close: closeCart }] = useDisclosure(false);
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

    // Efecto para abrir la primera categoría del menú (ahora depende de menuData)
    useEffect(() => {
        if (menuData && menuData.categories.length > 0 && !activeOrderId) {
            setActiveAccordionItems([menuData.categories[0].id]);
        } else if (activeOrderId) {
            setActiveAccordionItems([]);
        }
    }, [menuData, activeOrderId]);

    // Lógica para añadir ítem configurado al carrito (sin cambios)
    const handleConfiguredItemAddToCart = () => {
        if (!configuringItem) return;
        const { itemDetails, quantity, selectedOptionsByGroup, currentUnitPrice, itemNotes, areModifiersValid } = configuringItem;
        if (!areModifiersValid) {
            notifications.show({ title: t('publicMenu.invalidSelectionTitle'), message: t('publicMenu.invalidSelectionMsg'), color: 'orange' });
            return;
        }
        const flatSelectedModifiers: SelectedModifierFE[] = [];
        if (Array.isArray(itemDetails.modifierGroups)) {
            Object.entries(selectedOptionsByGroup).forEach(([groupId, optionSelections]) => {
                const group = itemDetails.modifierGroups!.find(g => g.id === groupId);
                if (!group || !Array.isArray(group.options)) return;
                const ids = Array.isArray(optionSelections) ? optionSelections.filter(s => s && s.trim() !== '') : ((typeof optionSelections === 'string' && optionSelections.trim() !== '') ? [optionSelections.trim()] : []);
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

    // Lógica de envío de pedido (sin cambios)
    const handleSubmitOrderOrAddItems = async () => {
        if (currentOrderItems.length === 0) {
            notifications.show({ title: t('publicMenu.cart.errorTitle'), message: activeOrderId ? t('publicMenu.cart.errorEmptyAddToOrder') : t('publicMenu.cart.errorEmpty'), color: 'orange' });
            return;
        }
        if (!businessSlug) {
            notifications.show({ title: t('common.error'), message: t('error.missingBusinessSlug'), color: 'red' });
            return;
        }
        setIsSubmittingOrder(true);
        try {
            const response = await handleOrderSubmission(
                currentOrderItems,
                orderNotes,
                canCurrentlyAddToExistingOrder ? activeOrderId : null,
                businessSlug,
                tableIdentifierFromParams
            );
            const orderIdToNavigate = response.id;
            const orderNumberToNavigate = response.orderNumber || activeOrderNumber || orderIdToNavigate;
            const successMessage = activeOrderId
                ? t('publicMenu.cart.itemsAddedSuccessMsg', { orderNumber: orderNumberToNavigate })
                : t('publicMenu.cart.orderSuccessMsg', { orderNumber: orderNumberToNavigate });
            notifications.show({
                title: activeOrderId ? t('publicMenu.cart.itemsAddedSuccessTitle') : t('publicMenu.cart.orderSuccessTitle'),
                message: successMessage,
                color: 'green',
                icon: <IconCheck />
            });
            if (!activeOrderId) {
                setActiveOrderManually(orderIdToNavigate, orderNumberToNavigate);
            }
            clearCart();
            clearCartStorage();
            closeCart();
            navigate(`/order-status/${orderIdToNavigate}`, {
                state: { orderNumber: orderNumberToNavigate, businessSlug, tableIdentifier: tableIdentifierFromParams }
            });
        } catch (err: any) {
            const errMsg = err.response?.data?.message || err.message || t('publicMenu.cart.orderErrorMsg');
            notifications.show({
                title: t('publicMenu.cart.orderErrorTitle'),
                message: errMsg,
                color: 'red',
                icon: <IconAlertCircle />
            });
        } finally {
            setIsSubmittingOrder(false);
        }
    };

    // El resto del componente (renderizado) permanece sin cambios...
    const isLoadingPage = loadingMenu || loadingActiveOrderStatus;
    const pageError = errorMenu;

    if (isLoadingPage) {
        return ( <Container size="md" py="xl" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}><Loader size="xl" /></Container> );
    }
    if (pageError) {
        return ( <Container size="md" py="xl"><Alert icon={<IconAlertCircle size="1rem" />} title={t('common.error')} color="red" radius="md">{pageError}</Alert></Container> );
    }
    if (!menuData) {
        return ( <Container size="md" py="xl"><Text ta="center" c="dimmed">{t('publicMenu.menuNotAvailable')}</Text></Container> );
    }
    const menuItemCardConfigState: MenuItemCardConfiguringState | null = configuringItem;
    const topOffsetForCartBar = typeof theme.spacing.md === 'number' ? theme.spacing.md + 10 : 26;
    const cartButtonText = activeOrderId && canCurrentlyAddToExistingOrder ? t('publicMenu.cart.addItemsToOrderButton', { count: totalCartItems, orderNumber: activeOrderNumber }) : t('publicMenu.cart.viewOrderItems', { count: totalCartItems });

    return (
        <>
            <Container size="lg" py="xl">
                <Stack gap="xl">
                    <Group justify="center" align="center" wrap="nowrap">
                        {menuData.businessLogoUrl && ( <Image src={menuData.businessLogoUrl} alt={`${menuData.businessName} logo`} h={50} w="auto" fit="contain" radius="sm" /> )}
                        <Title order={1} ta="center" style={{ flexShrink: 1, minWidth: 0 }}>{menuData.businessName}</Title>
                    </Group>
                    {activeOrderId && canCurrentlyAddToExistingOrder && !configuringItem && (
                        <Paper shadow="md" p="lg" radius="md" withBorder mb="xl" bg={colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.blue[0]}>
                            <Group justify="space-between" align="center">
                                <Group><IconInfoCircle size={24} color={theme.colors.blue[6]} /><Stack gap={0}>
                                    <Text fw={500}>{t('publicMenu.activeOrder.addingToOrderTitle', {orderNumber: activeOrderNumber})}</Text>
                                    <Text size="sm">{t('publicMenu.activeOrder.addingToOrderMsg')}</Text>
                                </Stack></Group>
                                <Button variant="outline" size="xs" component={Link} to={`/order-status/${activeOrderId}`} state={{ orderNumber: activeOrderNumber, businessSlug, tableIdentifier: tableIdentifierFromParams }}>
                                    {t('publicMenu.activeOrder.viewStatusButton')}
                                </Button>
                            </Group>
                        </Paper>
                    )}
                    {activeOrderId && !canCurrentlyAddToExistingOrder && !loadingActiveOrderStatus && !configuringItem && (
                         <Paper shadow="md" p="lg" radius="md" withBorder mb="xl" bg={colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[0]}>
                            <Group justify="space-between" align="center">
                                 <Group><IconAlertCircle size={24} color={theme.colors.orange[6]} /><Stack gap={0}>
                                    <Text fw={500}>{t('publicMenu.activeOrder.cannotAddTitle', {orderNumber: activeOrderNumber})}</Text>
                                    <Text size="sm">{t('publicMenu.activeOrder.cannotAddMsg')}</Text>
                                </Stack></Group>
                                <Button variant="outline" size="xs" onClick={clearActiveOrder}>
                                    {t('publicMenu.activeOrder.startNewButtonAlt')}
                                </Button>
                            </Group>
                        </Paper>
                    )}
                    {totalCartItems > 0 && (!activeOrderId || (activeOrderId && canCurrentlyAddToExistingOrder)) && !configuringItem && (
                        <Paper p={0} shadow="xs" withBorder={false} radius="md" style={{ position: 'sticky', top: topOffsetForCartBar, zIndex: 200 }} >
                            <Button fullWidth size="lg" variant="gradient"
                                gradient={{ from: theme.primaryColor, to: theme.colors[theme.primaryColor][4], deg: 105 }}
                                onClick={openCart}
                                disabled={isCartOpen}
                                styles={{ root: { height: 'auto', padding: `${theme.spacing.sm} ${theme.spacing.md}` }, label: { width: '100%' } }}
                            >
                                <Group justify="space-between" style={{ width: '100%' }}>
                                    <Group gap="xs"><IconShoppingCart size={22} stroke={1.8} /><Text fw={500} inherit> {cartButtonText} </Text></Group>
                                    <Text fw={700} inherit>{t('publicMenu.cart.total')}: {totalCartAmount.toLocaleString(i18n.language, { style: 'currency', currency: 'EUR' })}</Text>
                                </Group>
                            </Button>
                        </Paper>
                    )}
                    <CategoryAccordion
                        categories={menuData.categories}
                        activeAccordionItems={activeAccordionItems}
                        onAccordionChange={setActiveAccordionItems}
                        configuringItemId={configuringItem?.itemDetails.id || null}
                        configuringItemState={menuItemCardConfigState}
                        onStartConfigureItem={startConfiguringItem}
                        onCancelConfiguration={cancelConfiguration}
                        onConfigQuantityChange={updateConfigQuantity}
                        onConfigModifierSelectionChange={updateConfigModifierSelection}
                        onConfigNotesChange={updateConfigNotes}
                        onConfigAddToCart={handleConfiguredItemAddToCart}
                        onSimpleAddToCart={addSimpleItemToCart}
                    />
                </Stack>
            </Container>
            {(!activeOrderId || (activeOrderId && canCurrentlyAddToExistingOrder)) && (
                <ShoppingCartModal
                    opened={isCartOpen} onClose={closeCart}
                    orderItems={currentOrderItems} orderNotes={orderNotes}
                    onUpdateItemQuantity={updateItemQuantityInCart} onRemoveItem={removeItemFromCart}
                    onUpdateOrderNotes={updateOrderNotes} onSubmitOrder={handleSubmitOrderOrAddItems}
                    isSubmittingOrder={isSubmittingOrder} onClearCart={clearCart}
                    isAddingToExistingOrder={!!(activeOrderId && canCurrentlyAddToExistingOrder)}
                    activeOrderNumber={activeOrderNumber}
                />
            )}
        </>
    );
};

export default PublicMenuViewPage;