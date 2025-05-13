// frontend/src/pages/PublicMenuViewPage.tsx
// Version: 1.3.2 (COMPLETE FILE - Fix type issues for configuringItem, clean up unused imports)

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
    Container, Title, Loader, Alert, Text, Stack, Paper, Image, Group,
    useMantineTheme,
    // Componentes que ahora están en CategoryAccordion o MenuItemCard
    // Accordion, NumberInput, Button, Radio, Checkbox, TextInput, Badge, Box, ThemeIcon
} from '@mantine/core';
import {
    IconAlertCircle, IconShoppingCartPlus
    // IconChevronDown, IconPoint, IconNotes, IconListDetails // Usados en componentes hijos
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications';

import {
    PublicDigitalMenuData,
    PublicMenuItem,
    ModifierUiType,
    PublicMenuModifierGroup,
} from '../types/menu.types';

// Importar el nuevo componente
import CategoryAccordion from '../components/public/menu/CategoryAccordion';
// Importar el tipo de estado de configuración que MenuItemCard espera
import { MenuItemCardConfiguringState } from '../components/public/menu/MenuItemCard';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_PUBLIC || 'http://localhost:3000/public';

// Interfaces para el Carrito
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

// Estado para el ítem que se está configurando actualmente
interface ConfiguringItemState {
    itemDetails: PublicMenuItem;
    quantity: number;
    selectedOptionsByGroup: Record<string, string[] | string>;
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
                            price: parseFloat(String(item.price)),
                            modifierGroups: item.modifierGroups.map(group => ({
                                ...group,
                                options: group.options.map(option => ({
                                    ...option,
                                    priceAdjustment: parseFloat(String(option.priceAdjustment))
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

    const checkAllModifierRules = useCallback((groups: PublicMenuModifierGroup[] | undefined, selected: Record<string, string[] | string>): boolean => {
        if (!groups || groups.length === 0) return true;
        for (const group of groups) {
            const selections = selected[group.id];
            const count = Array.isArray(selections) ? selections.length : (selections ? 1 : 0);
            if (group.isRequired && count < group.minSelections) return false;
            if (count > group.maxSelections) return false;
        }
        return true;
    }, []);

    const recalculatePriceAndValidateModifiers = useCallback(() => {
        if (!configuringItem) return;
        let newPrice = configuringItem.itemDetails.price;
        if (configuringItem.itemDetails.modifierGroups) {
            for (const groupId in configuringItem.selectedOptionsByGroup) {
                const selections = configuringItem.selectedOptionsByGroup[groupId];
                const group = configuringItem.itemDetails.modifierGroups.find(g => g.id === groupId);
                if (!group || !group.options) continue;
                const idsToSum = Array.isArray(selections) ? selections : (selections ? [selections] : []);
                idsToSum.forEach(optionId => {
                    const option = group.options.find(opt => opt.id === optionId);
                    if (option) { newPrice += option.priceAdjustment; }
                });
            }
        }
        const isValid = checkAllModifierRules(configuringItem.itemDetails.modifierGroups, configuringItem.selectedOptionsByGroup);
        setConfiguringItem(prev => prev ? ({ ...prev, currentUnitPrice: newPrice, areModifiersValid: isValid }) : null);
    }, [configuringItem, checkAllModifierRules]);

    useEffect(() => {
        if (configuringItem) { recalculatePriceAndValidateModifiers(); }
    }, [configuringItem?.selectedOptionsByGroup, recalculatePriceAndValidateModifiers]);

    const handleStartConfigureItem = (item: PublicMenuItem) => {
        const initialSelectedOptions: Record<string, string[] | string> = {};
        let initialPrice = item.price;
        if (item.modifierGroups) {
            item.modifierGroups.forEach(group => {
                const defaultOptions = group.options.filter(opt => opt.isDefault);
                if (group.uiType === ModifierUiType.RADIO) {
                    const defaultRadioOptionId = defaultOptions.length > 0 ? defaultOptions[0].id : (group.options.length > 0 && group.isRequired && group.minSelections === 1 ? group.options[0].id : ''); // Pre-seleccionar la primera si es radio requerido y sin default
                    initialSelectedOptions[group.id] = defaultRadioOptionId;
                    if (defaultRadioOptionId) {
                        const opt = group.options.find(o => o.id === defaultRadioOptionId);
                        if (opt) initialPrice += opt.priceAdjustment;
                    }
                } else { // CHECKBOX
                    const defaultCheckboxOptionIds = defaultOptions.map(opt => opt.id);
                    initialSelectedOptions[group.id] = defaultCheckboxOptionIds;
                    defaultCheckboxOptionIds.forEach(optId => {
                        const opt = group.options.find(o => o.id === optId);
                        if (opt) initialPrice += opt.priceAdjustment;
                    });
                }
            });
        }
        const allRequiredSatisfied = checkAllModifierRules(item.modifierGroups, initialSelectedOptions);
        setConfiguringItem({
            itemDetails: item, quantity: 1, selectedOptionsByGroup: initialSelectedOptions,
            currentUnitPrice: initialPrice, itemNotes: '', areModifiersValid: allRequiredSatisfied
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
            const newSelected = { ...prev.selectedOptionsByGroup, [groupId]: newSelection };
            return { ...prev, selectedOptionsByGroup: newSelected };
        });
    };

    const handleConfigNotesChange = (newNotes: string) => {
        setConfiguringItem(prev => prev ? { ...prev, itemNotes: newNotes } : null);
    };
    
    const handleConfigAddToCart = () => {
        if (!configuringItem || !configuringItem.areModifiersValid) {
            notifications.show({
                title: t('publicMenu.invalidSelectionTitle', 'Selección Inválida'),
                message: t('publicMenu.invalidSelectionMsg', 'Por favor, completa todas las opciones obligatorias de los modificadores.'),
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
            existing.quantity += quantity; // Sumar la cantidad que se está configurando
            existing.notes = itemNotes || existing.notes; // Actualizar notas si se proveyeron
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
            title: t('publicMenu.itemAddedTitle', '¡Añadido!'),
            message: t('publicMenu.itemAddedMessage', { itemName: itemDetails.name_es || itemDetails.name_en || 'Ítem', quantity: quantity }),
            color: 'green', icon: <IconShoppingCartPlus size={18} />
        });
        setConfiguringItem(null);
    };

    const handleSimpleAddToCart = (item: PublicMenuItem, quantity: number) => {
        const cartItemId = item.id;
        const existingCartItemIndex = currentOrderItems.findIndex(ci => ci.cartItemId === cartItemId && (!ci.selectedModifiers || ci.selectedModifiers.length === 0)); // Asegurar que es el ítem simple
        
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
            title: t('publicMenu.itemAddedTitle', '¡Añadido!'),
            message: t('publicMenu.itemAddedMessage', { itemName: item.name_es || item.name_en || 'Ítem', quantity: quantity }),
            color: 'green', icon: <IconShoppingCartPlus size={18} />
        });
    };
    
    useEffect(() => { console.log("[CART ITEMS]", currentOrderItems); }, [currentOrderItems]);

    if (loading) { return ( <Container size="md" py="xl" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}> <Loader size="xl" /> </Container> ); }
    if (error) { return ( <Container size="md" py="xl"> <Alert icon={<IconAlertCircle size="1rem" />} title={t('common.error')} color="red" radius="md"> {error} </Alert> </Container> ); }
    if (!menuData) { return ( <Container size="md" py="xl"> <Text ta="center" c="dimmed">{t('publicMenu.menuNotAvailable', 'Menú no disponible o no encontrado.')}</Text> </Container> ); }

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
                            <Text fw={700}>{t('publicMenu.cart.title', 'Tu Pedido')}</Text>
                            <Text fw={700}>
                                {t('publicMenu.cart.total', 'Total')}: {currentOrderItems.reduce((acc, itemFE) => acc + itemFE.totalPriceForItem, 0).toLocaleString(i18n.language, { style: 'currency', currency: 'EUR' })}
                            </Text>
                        </Group>
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