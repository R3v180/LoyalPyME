// frontend/src/pages/PublicMenuViewPage.tsx
// Version: 1.3.3 (Attempt to fix infinite loop and i18n missing keys)

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
    Container, Title, Loader, Alert, Text, Stack, Paper, Image, Group,
    useMantineTheme,
} from '@mantine/core';
import {
    IconAlertCircle, IconShoppingCartPlus
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications';

import {
    PublicDigitalMenuData,
    PublicMenuItem,
    ModifierUiType,
} from '../types/menu.types';

import CategoryAccordion from '../components/public/menu/CategoryAccordion';
import { MenuItemCardConfiguringState } from '../components/public/menu/MenuItemCard';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_PUBLIC || 'http://localhost:3000/public';

interface SelectedModifierFE {
    modifierOptionId: string;
    name_es?: string | null;
    name_en?: string | null;
    priceAdjustment: number;
    modifierGroupName_es?: string | null;
    modifierGroupName_en?: string | null;
}

interface OrderItemFE {
    cartItemId: string;
    menuItemId: string;
    menuItemName_es: string | null;
    menuItemName_en: string | null;
    quantity: number;
    basePrice: number;
    currentPricePerUnit: number;
    totalPriceForItem: number;
    notes?: string | null;
    selectedModifiers: SelectedModifierFE[];
}

interface ConfiguringItemState {
    itemDetails: PublicMenuItem;
    quantity: number;
    selectedOptionsByGroup: Record<string, string[] | string>; // groupId -> optionId[] or optionId
    currentUnitPrice: number;
    itemNotes: string;
    areModifiersValid: boolean;
}

const PublicMenuViewPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const theme = useMantineTheme();
    const { businessSlug, tableIdentifier: _tableIdentifier } = useParams<{ businessSlug: string; tableIdentifier?: string }>();

    const [menuData, setMenuData] = useState<PublicDigitalMenuData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeAccordionItems, setActiveAccordionItems] = useState<string[]>([]);
    const [currentOrderItems, setCurrentOrderItems] = useState<OrderItemFE[]>([]);
    const [configuringItem, setConfiguringItem] = useState<ConfiguringItemState | null>(null);

    const fetchPublicMenu = useCallback(async () => {
        // ... (sin cambios en fetchPublicMenu)
        if (!businessSlug) {
            setError(t('error.missingBusinessSlug', 'Error: Slug del negocio no proporcionado.'));
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const endpointUrl = `${API_BASE_URL}/menu/business/${businessSlug}`;
            const response = await axios.get<PublicDigitalMenuData>(endpointUrl);
            
            if (response.data) {
                const parsedMenuData = {
                    ...response.data,
                    categories: response.data.categories.map(category => ({
                        ...category,
                        items: category.items.map(item => ({
                            ...item,
                            price: parseFloat(String(item.price)), // Asegurar que sea número
                            modifierGroups: item.modifierGroups.map(group => ({
                                ...group,
                                options: group.options.map(option => ({
                                    ...option,
                                    priceAdjustment: parseFloat(String(option.priceAdjustment)) // Asegurar que sea número
                                }))
                            }))
                        }))
                    }))
                };
                setMenuData(parsedMenuData);
                if (parsedMenuData.categories.length > 0) {
                    setActiveAccordionItems([parsedMenuData.categories[0].id]);
                }
            } else {
                throw new Error(t('error.noMenuDataReceived', 'No se recibieron datos del menú.'));
            }
        } catch (err: any) {
            const errMsg = err.response?.data?.message || err.message || t('common.errorUnknown');
            setError(errMsg);
            setMenuData(null);
        } finally {
            setLoading(false);
        }
    }, [businessSlug, t]);

    useEffect(() => {
        fetchPublicMenu();
    }, [fetchPublicMenu]);

    // --- LÓGICA DE CÁLCULO Y VALIDACIÓN REFACTORIZADA ---
    const calculatePriceAndValidate = (
        itemDetails: PublicMenuItem,
        selectedOptions: Record<string, string[] | string>
    ): { newPrice: number; isValid: boolean } => {
        let newPrice = itemDetails.price;
        let isValid = true;

        if (itemDetails.modifierGroups) {
            for (const group of itemDetails.modifierGroups) {
                const selections = selectedOptions[group.id];
                const count = Array.isArray(selections) ? selections.length : (selections ? 1 : 0);

                if (group.isRequired && count < group.minSelections) {
                    isValid = false;
                }
                if (count > group.maxSelections) {
                    isValid = false;
                }
                 if (group.uiType === ModifierUiType.RADIO && count > 1) { // Aunque esto no debería pasar con Radio.Group
                    isValid = false;
                }

                const idsToSum = Array.isArray(selections) ? selections : (selections ? [selections] : []);
                idsToSum.forEach(optionId => {
                    const option = group.options.find(opt => opt.id === optionId);
                    if (option) {
                        newPrice += option.priceAdjustment;
                    } else {
                        // Opción seleccionada no encontrada, podría ser un error
                        console.warn(`Option ID ${optionId} not found in group ${group.id}`);
                    }
                });
            }
        }
        return { newPrice, isValid };
    };

    // Actualizar el estado de `configuringItem` cuando cambian las selecciones o la cantidad
    useEffect(() => {
        if (configuringItem) {
            const { newPrice, isValid } = calculatePriceAndValidate(
                configuringItem.itemDetails,
                configuringItem.selectedOptionsByGroup
            );
            // Solo actualizar si el precio o la validez realmente cambiaron para evitar bucles sutiles
            if (newPrice !== configuringItem.currentUnitPrice || isValid !== configuringItem.areModifiersValid) {
                setConfiguringItem(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        currentUnitPrice: newPrice,
                        areModifiersValid: isValid,
                    };
                });
            }
        }
    }, [configuringItem?.itemDetails, configuringItem?.selectedOptionsByGroup]); // Depender solo de las partes que realmente usa calculatePriceAndValidate

    // (El useEffect para [currentOrderItems] no causa bucle, se mantiene)
     useEffect(() => { console.log("[CART ITEMS]", currentOrderItems); }, [currentOrderItems]);

    // --- FIN LÓGICA REFACTORIZADA ---


    const handleStartConfigureItem = (item: PublicMenuItem) => {
        // ... (lógica sin cambios, pero usará la nueva calculatePriceAndValidate indirectamente vía useEffect)
        const initialSelectedOptions: Record<string, string[] | string> = {};
        if (item.modifierGroups) {
            item.modifierGroups.forEach(group => {
                const defaultOptions = group.options.filter(opt => opt.isDefault);
                if (group.uiType === ModifierUiType.RADIO) {
                    const defaultRadioOptionId = defaultOptions.length > 0 ? defaultOptions[0].id : (group.options.length > 0 && group.isRequired && group.minSelections === 1 ? group.options[0].id : '');
                    initialSelectedOptions[group.id] = defaultRadioOptionId;
                } else { // CHECKBOX
                    initialSelectedOptions[group.id] = defaultOptions.map(opt => opt.id);
                }
            });
        }
        // Calcular precio inicial y validez
        const {newPrice, isValid} = calculatePriceAndValidate(item, initialSelectedOptions);
        setConfiguringItem({
            itemDetails: item, quantity: 1, selectedOptionsByGroup: initialSelectedOptions,
            currentUnitPrice: newPrice, itemNotes: '', areModifiersValid: isValid
        });
    };

    const handleCancelConfiguration = () => {
        setConfiguringItem(null);
    };

    const handleConfigQuantityChange = (newQuantity: number) => {
        setConfiguringItem(prev => prev ? { ...prev, quantity: newQuantity } : null);
    };

    const handleConfigModifierSelectionChange = (groupId: string, newSelection: string | string[], _groupUiType: ModifierUiType) => {
        setConfiguringItem(prev => {
            if (!prev) return null;
            const newSelectedOptions = { ...prev.selectedOptionsByGroup, [groupId]: newSelection };
            // El useEffect se encargará de recalcular precio y validez
            return { ...prev, selectedOptionsByGroup: newSelectedOptions };
        });
    };

    const handleConfigNotesChange = (newNotes: string) => {
        setConfiguringItem(prev => prev ? { ...prev, itemNotes: newNotes } : null);
    };
    
    const handleConfigAddToCart = () => {
        // ... (lógica sin cambios)
        if (!configuringItem || !configuringItem.areModifiersValid) {
            notifications.show({
                title: t('publicMenu.invalidSelectionTitle'),
                message: t('publicMenu.invalidSelectionMsg'),
                color: 'orange'
            });
            return;
        }
        const { itemDetails, quantity, selectedOptionsByGroup, currentUnitPrice, itemNotes } = configuringItem;
        const flatSelectedModifiers: SelectedModifierFE[] = [];
        if(itemDetails.modifierGroups){
            Object.entries(selectedOptionsByGroup).forEach(([groupId, optionSelections]) => {
                const group = itemDetails.modifierGroups!.find(g => g.id === groupId);
                if (!group || !group.options) return;
                const ids = Array.isArray(optionSelections) ? optionSelections : (optionSelections ? [optionSelections] : []);
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
        const cartItemId = `${itemDetails.id}${flatSelectedModifiers.length > 0 ? `-[${sortedModifierOptionIds}]` : ''}`;
        const existingCartItemIndex = currentOrderItems.findIndex(ci => ci.cartItemId === cartItemId);

        if (existingCartItemIndex > -1) {
            const updatedItems = [...currentOrderItems];
            const existing = updatedItems[existingCartItemIndex];
            existing.quantity += quantity; 
            existing.notes = itemNotes || existing.notes; 
            existing.totalPriceForItem = existing.currentPricePerUnit * existing.quantity;
            setCurrentOrderItems(updatedItems);
        } else {
            const newCartItem: OrderItemFE = {
                cartItemId: cartItemId, menuItemId: itemDetails.id,
                menuItemName_es: itemDetails.name_es, menuItemName_en: itemDetails.name_en,
                quantity: quantity, basePrice: itemDetails.price,
                currentPricePerUnit: currentUnitPrice, totalPriceForItem: currentUnitPrice * quantity,
                notes: itemNotes || undefined, selectedModifiers: flatSelectedModifiers,
            };
            setCurrentOrderItems(prev => [...prev, newCartItem]);
        }
        notifications.show({
            title: t('publicMenu.itemAddedTitle'),
            message: t('publicMenu.itemAddedMessage', { itemName: itemDetails.name_es || itemDetails.name_en || 'Ítem', quantity: quantity }),
            color: 'green', icon: <IconShoppingCartPlus size={18} />
        });
        setConfiguringItem(null);
    };

    const handleSimpleAddToCart = (item: PublicMenuItem, quantity: number) => {
        // ... (lógica sin cambios)
        const cartItemId = item.id;
        const existingCartItemIndex = currentOrderItems.findIndex(ci => ci.cartItemId === cartItemId && (!ci.selectedModifiers || ci.selectedModifiers.length === 0));
        
        if (existingCartItemIndex > -1) {
            const updatedItems = [...currentOrderItems];
            const existing = updatedItems[existingCartItemIndex];
            existing.quantity += quantity;
            existing.totalPriceForItem = existing.currentPricePerUnit * existing.quantity;
            setCurrentOrderItems(updatedItems);
        } else {
            const newCartItem: OrderItemFE = {
                cartItemId: cartItemId, menuItemId: item.id,
                menuItemName_es: item.name_es, menuItemName_en: item.name_en,
                quantity: quantity, basePrice: item.price,
                currentPricePerUnit: item.price, totalPriceForItem: item.price * quantity,
                selectedModifiers: [],
            };
            setCurrentOrderItems(prev => [...prev, newCartItem]);
        }
         notifications.show({
            title: t('publicMenu.itemAddedTitle'),
            message: t('publicMenu.itemAddedMessage', { itemName: item.name_es || item.name_en || 'Ítem', quantity: quantity }),
            color: 'green', icon: <IconShoppingCartPlus size={18} />
        });
    };
    
    if (loading) { return ( <Container size="md" py="xl" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}> <Loader size="xl" /> </Container> ); }
    if (error) { return ( <Container size="md" py="xl"> <Alert icon={<IconAlertCircle size="1rem" />} title={t('common.error')} color="red" radius="md"> {error} </Alert> </Container> ); }
    if (!menuData) { return ( <Container size="md" py="xl"> <Text ta="center" c="dimmed">{t('publicMenu.menuNotAvailable')}</Text> </Container> ); }

    const menuItemCardConfigState: MenuItemCardConfiguringState | null = configuringItem
        ? {
            quantity: configuringItem.quantity,
            selectedOptionsByGroup: configuringItem.selectedOptionsByGroup,
            currentUnitPrice: configuringItem.currentUnitPrice,
            itemNotes: configuringItem.itemNotes,
            areModifiersValid: configuringItem.areModifiersValid,
          }
        : null;

    return (
        <Container size="lg" py="xl">
            <Stack gap="xl">
                <Group justify="center" align="center" wrap="nowrap">
                    {menuData.businessLogoUrl && (
                        <Image src={menuData.businessLogoUrl} alt={`${menuData.businessName} logo`} h={50} w="auto" fit="contain" radius="sm" />
                    )}
                    <Title order={1} ta="center" style={{ flexShrink: 1, minWidth: 0 }}>{menuData.businessName}</Title>
                </Group>

                {currentOrderItems.length > 0 && (
                    <Paper p="md" shadow="xs" withBorder radius="md" style={{ position: 'sticky', top: 10, zIndex: 100, backgroundColor: theme.white }}>
                        <Group justify="space-between">
                            <Text fw={700}>{t('publicMenu.cart.title')}</Text>
                            <Text fw={700}>
                                {t('publicMenu.cart.total')}: {currentOrderItems.reduce((acc, itemFE) => acc + itemFE.totalPriceForItem, 0).toLocaleString(i18n.language, { style: 'currency', currency: 'EUR' })}
                            </Text>
                        </Group>
                        {/* Aquí podrías añadir un botón "Ver Carrito / Pagar" en el futuro */}
                    </Paper>
                )}
                
                <CategoryAccordion
                    categories={menuData.categories}
                    activeAccordionItems={activeAccordionItems}
                    onAccordionChange={setActiveAccordionItems}
                    configuringItemId={configuringItem?.itemDetails.id || null}
                    configuringItemState={menuItemCardConfigState}
                    onStartConfigureItem={handleStartConfigureItem}
                    onCancelConfiguration={handleCancelConfiguration}
                    onConfigQuantityChange={handleConfigQuantityChange}
                    onConfigModifierSelectionChange={handleConfigModifierSelectionChange}
                    onConfigNotesChange={handleConfigNotesChange}
                    onConfigAddToCart={handleConfigAddToCart}
                    onSimpleAddToCart={handleSimpleAddToCart}
                />

            </Stack>
        </Container>
    );
};

export default PublicMenuViewPage;