// frontend/src/pages/PublicMenuViewPage.tsx
// Version: 2.0.13 (Fix orderNumberToNavigate type assignment)

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

import { PublicDigitalMenuData } from '../types/menu.types';
import { OrderItemFE, SelectedModifierFE, CreateOrderPayloadDto, AddItemsToOrderPayloadDto } from '../types/publicOrder.types';

import CategoryAccordion from '../components/public/menu/CategoryAccordion';
import { MenuItemCardConfiguringState } from '../components/public/menu/MenuItemCard';
import ShoppingCartModal from '../components/public/menu/ShoppingCartModal';

import { useActiveOrderState } from '../hooks/useActiveOrderState';
import { usePublicOrderCart } from '../hooks/usePublicOrderCart';
import { useMenuItemConfigurator } from '../hooks/useMenuItemConfigurator';
import { submitNewOrder, addItemsToExistingOrderApi } from '../services/publicOrderApiService';
import axios from 'axios';

const API_MENU_BASE_URL = import.meta.env.VITE_API_BASE_URL_PUBLIC || 'http://localhost:3000/public';

const PublicMenuViewPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const theme = useMantineTheme();
    const { colorScheme } = useMantineColorScheme();
    const { businessSlug, tableIdentifier: tableIdentifierFromParams } = useParams<{ businessSlug: string; tableIdentifier?: string }>();
    const navigate = useNavigate();

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

    const [menuData, setMenuData] = useState<PublicDigitalMenuData | null>(null);
    const [loadingMenu, setLoadingMenu] = useState<boolean>(true);
    const [errorMenu, setErrorMenu] = useState<string | null>(null);
    const [activeAccordionItems, setActiveAccordionItems] = useState<string[]>([]);
    const [isCartOpen, { open: openCart, close: closeCart }] = useDisclosure(false);
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

    useEffect(() => {
        const fetchMenu = async () => {
            if (!businessSlug) { setErrorMenu(t('error.missingBusinessSlug')); setLoadingMenu(false); return; }
            setLoadingMenu(true); setErrorMenu(null);
            try {
                const response = await axios.get<PublicDigitalMenuData>(`${API_MENU_BASE_URL}/menu/business/${businessSlug}`);
                if (response.data) {
                    const parsedMenuData = {
                        ...response.data,
                        categories: response.data.categories.map(c => ({
                            ...c,
                            items: c.items.map(i => ({
                                ...i,
                                price: parseFloat(String(i.price)),
                                modifierGroups: Array.isArray(i.modifierGroups) ? i.modifierGroups.map(g => ({
                                    ...g,
                                    options: Array.isArray(g.options) ? g.options.map(o => ({ ...o, priceAdjustment: parseFloat(String(o.priceAdjustment)) })) : []
                                })) : []
                            }))
                        }))
                    };
                    setMenuData(parsedMenuData);
                    if (parsedMenuData.categories.length > 0 && !activeOrderId) {
                        setActiveAccordionItems([parsedMenuData.categories[0].id]);
                    } else if (activeOrderId) {
                        setActiveAccordionItems([]);
                    }
                } else { throw new Error(t('error.noMenuDataReceived')); }
            } catch (err: any) { setErrorMenu(err.response?.data?.message || err.message || t('common.errorUnknown')); setMenuData(null); }
            finally { setLoadingMenu(false); }
        };
        fetchMenu();
    }, [businessSlug, t, activeOrderId]);

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
                    if (option) {
                        flatSelectedModifiers.push({
                            modifierOptionId: option.id, name_es: option.name_es, name_en: option.name_en,
                            priceAdjustment: option.priceAdjustment,
                            modifierGroupName_es: group.name_es, modifierGroupName_en: group.name_en,
                        });
                    }
                });
            });
        }
        const sortedModifierOptionIds = flatSelectedModifiers.map(m => m.modifierOptionId).sort().join(',');
        const notesHash = itemNotes ? `_notes-${itemNotes.toLocaleLowerCase().replace(/\s/g, '')}` : '';
        const cartItemId = `${itemDetails.id}${flatSelectedModifiers.length > 0 ? `-[${sortedModifierOptionIds}]` : ''}${notesHash}`;

        const newCartItem: OrderItemFE = {
            cartItemId, menuItemId: itemDetails.id,
            menuItemName_es: itemDetails.name_es, menuItemName_en: itemDetails.name_en,
            quantity, basePrice: itemDetails.price, currentPricePerUnit: currentUnitPrice,
            totalPriceForItem: currentUnitPrice * quantity, notes: itemNotes || undefined,
            selectedModifiers: flatSelectedModifiers,
        };
        addItemToCart(newCartItem);
        cancelConfiguration();
    };

    const getProcessedNotesValue = (notesInput: string | null | undefined): string | null => {
        if (notesInput === null || notesInput === undefined) {
            return null;
        }
        const trimmed = notesInput.trim();
        return trimmed === "" ? null : trimmed;
    };

    const handleSubmitOrderOrAddItems = async () => {
        if (currentOrderItems.length === 0) {
            notifications.show({ title: t('publicMenu.cart.errorTitle'), message: activeOrderId && canCurrentlyAddToExistingOrder ? t('publicMenu.cart.errorEmptyAddToExisting') : t('publicMenu.cart.errorEmpty'), color: 'orange' });
            return;
        }
        setIsSubmittingOrder(true);

        const dtoItems = currentOrderItems.map(feItem => ({
            menuItemId: feItem.menuItemId,
            quantity: feItem.quantity,
            notes: (typeof feItem.notes === 'string' ? feItem.notes.trim() : "") || null,
            selectedModifierOptions: feItem.selectedModifiers.length > 0
                ? feItem.selectedModifiers.map(sm => ({ modifierOptionId: sm.modifierOptionId }))
                : null,
        }));

        let customerIdForPayload: string | null = null;
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser?.id && parsedUser.role === 'CUSTOMER_FINAL') {
                    customerIdForPayload = parsedUser.id;
                }
            } catch (e) {
                console.error("Error parsing user from localStorage for order payload:", e);
            }
        }

        try {
            let orderIdToNavigate: string;
            let orderNumberToNavigate: string | null = null; // Tipo: string | null

            if (activeOrderId && canCurrentlyAddToExistingOrder && businessSlug) {
                const processedCustomerNotes = getProcessedNotesValue(orderNotes);
                const payloadForAdd: AddItemsToOrderPayloadDto = {
                    items: dtoItems,
                    customerNotes: processedCustomerNotes,
                };
                const response = await addItemsToExistingOrderApi(activeOrderId, businessSlug, payloadForAdd);
                orderIdToNavigate = activeOrderId;
                // CORRECCIÓN LÍNEA 188 (aproximada):
                orderNumberToNavigate = activeOrderNumber || (response.orderNumber ?? null);
                notifications.show({
                    title: t('publicMenu.cart.itemsAddedSuccessTitle'),
                    message: t('publicMenu.cart.itemsAddedSuccessMsg', { orderNumber: orderNumberToNavigate || orderIdToNavigate }),
                    color: 'green',
                    icon: <IconCheck />
                });
            } else if (businessSlug) {
                const processedOrderNotes = getProcessedNotesValue(orderNotes);
                const payloadForCreate: CreateOrderPayloadDto = {
                    items: dtoItems,
                    orderNotes: processedOrderNotes,
                    tableIdentifier: tableIdentifierFromParams ? tableIdentifierFromParams : null,
                    customerId: customerIdForPayload,
                };
                const response = await submitNewOrder(businessSlug, payloadForCreate);
                orderIdToNavigate = response.id;
                // CORRECCIÓN LÍNEA 205 (aproximada):
                orderNumberToNavigate = response.orderNumber ?? null;
                notifications.show({
                    title: t('publicMenu.cart.orderSuccessTitle'),
                    message: t('publicMenu.cart.orderSuccessMsg', { orderNumber: orderNumberToNavigate || orderIdToNavigate }),
                    color: 'green',
                    icon: <IconCheck />
                });
                setActiveOrderManually(orderIdToNavigate, orderNumberToNavigate || orderIdToNavigate);
            } else {
                throw new Error("Business context (slug) is required.");
            }

            clearCart();
            clearCartStorage();
            closeCart();
            navigate(`/order-status/${orderIdToNavigate}`, {
                state: {
                    orderNumber: orderNumberToNavigate,
                    businessSlug,
                    tableIdentifier: tableIdentifierFromParams
                }
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

    const isLoadingPage = loadingMenu || loadingActiveOrderStatus;
    const pageError = errorMenu;

    if (isLoadingPage) {
        return (
            <Container size="md" py="xl" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <Loader size="xl" />
            </Container>
        );
    }

    if (pageError) {
        return (
            <Container size="md" py="xl">
                <Alert icon={<IconAlertCircle size="1rem" />} title={t('common.error')} color="red" radius="md">
                    {pageError}
                </Alert>
            </Container>
        );
    }

    if (!menuData) {
        return (
            <Container size="md" py="xl">
                <Text ta="center" c="dimmed">{t('publicMenu.menuNotAvailable')}</Text>
            </Container>
        );
    }

    const menuItemCardConfigState: MenuItemCardConfiguringState | null = configuringItem;
    const topOffsetForCartBar = typeof theme.spacing.md === 'number' ? theme.spacing.md + 10 : 26;

    const cartButtonText = activeOrderId && canCurrentlyAddToExistingOrder
        ? t('publicMenu.cart.addItemsToOrderButton', { count: totalCartItems, orderNumber: activeOrderNumber })
        : t('publicMenu.cart.viewOrderItems', { count: totalCartItems });

    return (
        <>
            <Container size="lg" py="xl">
                <Stack gap="xl">
                    <Group justify="center" align="center" wrap="nowrap">
                        {menuData.businessLogoUrl && (
                            <Image src={menuData.businessLogoUrl} alt={`${menuData.businessName} logo`} h={50} w="auto" fit="contain" radius="sm" />
                        )}
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
                    opened={isCartOpen}
                    onClose={closeCart}
                    orderItems={currentOrderItems}
                    orderNotes={orderNotes}
                    onUpdateItemQuantity={updateItemQuantityInCart}
                    onRemoveItem={removeItemFromCart}
                    onUpdateOrderNotes={updateOrderNotes}
                    onSubmitOrder={handleSubmitOrderOrAddItems}
                    isSubmittingOrder={isSubmittingOrder}
                    onClearCart={clearCart}
                    isAddingToExistingOrder={!!(activeOrderId && canCurrentlyAddToExistingOrder)}
                    activeOrderNumber={activeOrderNumber}
                />
            )}
        </>
    );
};

export default PublicMenuViewPage;