// frontend/src/components/public/menu/MenuItemCard.tsx
// Version: 1.0.3 (Improved quantity handling for simple add vs. configuring)

import React, { useState, useEffect } from 'react'; // Añadido useState y useEffect
import {
    Paper, Title, Text, Stack, Group, Badge, Box, Image,
    NumberInput, Button as MantineButton, TextInput as MantineTextInput
} from '@mantine/core';
import { IconShoppingCartPlus, IconNotes, IconListDetails } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import {
    PublicMenuItem,
    ModifierUiType,
    PublicMenuModifierGroup,
} from '../../../types/menu.types';
import ModifierGroupInteractiveRenderer from './ModifierGroupInteractiveRenderer';

export interface MenuItemCardConfiguringState {
    quantity: number;
    selectedOptionsByGroup: Record<string, string[] | string>;
    currentUnitPrice: number;
    itemNotes: string;
    areModifiersValid: boolean;
}

interface MenuItemCardProps {
    item: PublicMenuItem;
    isConfiguringThisItem: boolean;
    currentConfig: MenuItemCardConfiguringState | null;
    onStartConfigure: () => void;
    onCancelConfiguration: () => void;
    onQuantityChange: (newQuantity: number) => void; // Para cuando se está configurando
    onModifierSelectionChange: (groupId: string, newSelection: string | string[], groupUiType: ModifierUiType) => void;
    onNotesChange: (newNotes: string) => void;
    onAddToCart: (quantityIfSimple?: number) => void; // Modificado para aceptar cantidad
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({
    item,
    isConfiguringThisItem,
    currentConfig,
    onStartConfigure,
    onCancelConfiguration,
    onQuantityChange,
    onModifierSelectionChange,
    onNotesChange,
    onAddToCart,
}) => {
    const { t, i18n } = useTranslation();

    // Estado local para la cantidad cuando NO se está configurando y no hay modificadores
    const [simpleQuantity, setSimpleQuantity] = useState<number>(1);

    useEffect(() => {
        // Si empezamos a configurar este ítem, y currentConfig tiene una cantidad,
        // podríamos querer resetear simpleQuantity o no, dependiendo del flujo deseado.
        // Por ahora, si se está configurando, la cantidad viene de currentConfig.
        // Si dejamos de configurar, reseteamos simpleQuantity a 1.
        if (!isConfiguringThisItem) {
            setSimpleQuantity(1);
        }
    }, [isConfiguringThisItem]);


    const displayPrice = isConfiguringThisItem && currentConfig ? currentConfig.currentUnitPrice : item.price;
    const displayQuantity = isConfiguringThisItem && currentConfig ? currentConfig.quantity : simpleQuantity;
    
    let mainButtonText: string;
    let mainButtonAction: () => void;
    let mainButtonDisabled = false;

    if (isConfiguringThisItem && currentConfig) {
        mainButtonAction = () => onAddToCart(); // El padre usará configuringItem
        mainButtonText = t('publicMenu.confirmAndAddToCart', 'Confirmar y Añadir');
        mainButtonDisabled = !currentConfig.areModifiersValid;
    } else if (item.modifierGroups && item.modifierGroups.length > 0) {
        mainButtonAction = onStartConfigure;
        mainButtonText = t('publicMenu.customizeAndAdd', 'Personalizar y Añadir');
    } else {
        mainButtonAction = () => onAddToCart(simpleQuantity); // Pasar la cantidad simple
        mainButtonText = t('publicMenu.addToCart', 'Añadir');
    }

    const handleNumberInputChange = (value: number | string) => {
        const newQty = Number(value) < 1 ? 1 : Number(value);
        if (isConfiguringThisItem) {
            onQuantityChange(newQty);
        } else {
            setSimpleQuantity(newQty);
        }
    };

    return (
        <Paper p="md" radius="sm" withBorder>
            <Group wrap="nowrap" align="flex-start" gap="md">
                {item.imageUrl && (
                    <Image src={item.imageUrl} alt={(i18n.language === 'es' && item.name_es) ? item.name_es : (item.name_en || item.name_es || '')} w={100} h={100} fit="cover" radius="sm" />
                )}
                <Stack gap="xs" style={{ flexGrow: 1 }}>
                    <Title order={5}>
                        {i18n.language === 'es' && item.name_es ? item.name_es : item.name_en || item.name_es || t('publicMenu.unnamedItem', 'Ítem sin nombre')}
                    </Title>
                    <Text c="blue.7" fw={700} fz="lg">
                        {displayPrice.toLocaleString(i18n.language, { style: 'currency', currency: 'EUR' })}
                    </Text>
                    {(item.description_es && i18n.language === 'es') && <Text size="sm" c="dimmed" lineClamp={3}>{item.description_es}</Text>}
                    {(item.description_en && i18n.language === 'en') && <Text size="sm" c="dimmed" lineClamp={3}>{item.description_en}</Text>}

                    {!isConfiguringThisItem && item.modifierGroups && item.modifierGroups.length > 0 && (
                        <MantineButton 
                            variant="subtle" 
                            size="xs" 
                            onClick={onStartConfigure}
                            leftSection={<IconListDetails size={14}/>}
                            mt="xs"
                        >
                            {t('publicMenu.customizeButton', 'Personalizar')}
                        </MantineButton>
                    )}

                    {isConfiguringThisItem && currentConfig && item.modifierGroups && item.modifierGroups.length > 0 && (
                        <Box mt="sm" pl="xs">
                            <Title order={6} c="dimmed" tt="uppercase" fz="xs" mb="xs">{t('publicMenu.optionsTitle', 'Personaliza tu elección:')}</Title>
                            {item.modifierGroups.map((group: PublicMenuModifierGroup) => (
                                <ModifierGroupInteractiveRenderer
                                    key={group.id}
                                    group={group}
                                    selectedOptionsForThisGroup={currentConfig.selectedOptionsByGroup[group.id] || (group.uiType === ModifierUiType.RADIO ? '' : [])}
                                    onSelectionChange={(newSelection) => onModifierSelectionChange(group.id, newSelection, group.uiType)}
                                />
                            ))}
                            <MantineTextInput
                                label={t('publicMenu.itemNotesLabel', 'Notas para este ítem (opcional)')}
                                placeholder={t('publicMenu.itemNotesPlaceholder', 'Ej: Sin cebolla, extra picante...')}
                                value={currentConfig.itemNotes}
                                onChange={(event) => onNotesChange(event.currentTarget.value)}
                                mt="sm"
                                rightSection={<IconNotes size={16} />}
                            />
                        </Box>
                    )}
                    
                    {(item.allergens.length > 0 || item.tags.length > 0) && (
                        <Group gap="xs" mt="sm">
                            {item.allergens.map(allergen => <Badge key={allergen} variant="outline" color="orange" size="xs">{t(`menuItem.allergen.${allergen}`, allergen)}</Badge>)}
                            {item.tags.map(tag => <Badge key={tag} variant="light" color="grape" size="xs">{t(`menuItem.tag.${tag}`, tag)}</Badge>)}
                        </Group>
                    )}

                    <Group mt="md" justify="flex-end" align="flex-end">
                        <NumberInput
                            // id={`quantity-${item.id}`} // Ya no es estrictamente necesario si no leemos del DOM
                            label={t('publicMenu.quantity', 'Cantidad')}
                            value={displayQuantity} // Usa la cantidad correcta según el modo
                            onChange={handleNumberInputChange} // Nuevo handler unificado
                            min={1} max={20} step={1} size="xs"
                            style={{ width: '100px' }}
                            // No es readOnly si no se está configurando Y no tiene modificadores, O si se está configurando.
                            readOnly={!isConfiguringThisItem && !!(item.modifierGroups && item.modifierGroups.length > 0)}
                        />
                        <MantineButton 
                            onClick={mainButtonAction}
                            leftSection={<IconShoppingCartPlus size={16} />}
                            size="sm"
                            variant="filled"
                            disabled={mainButtonDisabled}
                        >
                            {mainButtonText}
                        </MantineButton>
                        {isConfiguringThisItem && (
                            <MantineButton variant="subtle" size="sm" onClick={onCancelConfiguration}>
                                {t('common.cancel')}
                            </MantineButton>
                        )}
                    </Group>
                </Stack>
            </Group>
        </Paper>
    );
};

export default MenuItemCard;