// frontend/src/modules/camarero/components/public/menu/MenuItemCard.tsx
// VERSIÓN 3.0.0 - Implementa el flujo de doble botón para añadir o canjear.

import React from 'react';
import {
    Paper, Title, Text, Stack, Group, Badge, Box, Image,
    Button, Tooltip
} from '@mantine/core';
import { IconGift, IconShoppingCartPlus } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { PublicMenuItem } from '../../../types/menu.types';

// --- NUEVA INTERFAZ DE PROPS PARA EL DOBLE BOTÓN ---
interface MenuItemCardProps {
    item: PublicMenuItem;
    // Callback para el botón de "Añadir al Carrito" (puede abrir un modal si hay modificadores)
    onAddToCart: (item: PublicMenuItem) => void; 
    // Props para el botón de canje
    isRedeemable: boolean;
    rewardCost?: number;
    canAffordReward?: boolean;
    onRedeem: (item: PublicMenuItem) => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({
    item,
    onAddToCart,
    isRedeemable,
    rewardCost,
    canAffordReward,
    onRedeem,
}) => {
    const { t, i18n } = useTranslation();
    const currentLanguage = i18n.language;

    const displayName = (currentLanguage === 'es' ? item.name_es : item.name_en) || item.name_es || t('publicMenu.unnamedItem');
    const displayDescription = (currentLanguage === 'es' ? item.description_es : item.description_en) || item.description_es;
    
    const hasModifiers = item.modifierGroups && item.modifierGroups.length > 0;

    return (
        <Paper p="md" radius="sm" withBorder>
            <Group wrap="nowrap" align="flex-start" gap="md">
                {item.imageUrl && (
                    <Image src={item.imageUrl} alt={displayName} w={100} h={100} fit="cover" radius="sm" />
                )}
                <Stack gap="xs" style={{ flexGrow: 1 }}>
                    <Title order={5}>{displayName}</Title>
                    
                    {displayDescription && <Text size="sm" c="dimmed" lineClamp={3}>{displayDescription}</Text>}
                    
                    {(item.allergens.length > 0 || item.tags.length > 0) && (
                        <Group gap="xs" mt="sm">
                            {item.allergens.map(allergen => (
                                <Badge key={allergen} variant="outline" color="orange" size="xs">
                                    {t(`adminCamarero.menuItem.allergen.${allergen}`, allergen)}
                                </Badge>
                            ))}
                            {item.tags.map(tag => (
                                <Badge key={tag} variant="light" color="grape" size="xs">
                                    {t(`adminCamarero.menuItem.tag.${tag}`, tag)}
                                </Badge>
                            ))}
                        </Group>
                    )}
                    
                    {/* --- LÓGICA DE DOBLE BOTÓN --- */}
                    <Group mt="md" justify="flex-end" align="center">
                        <Text fw={700} fz="lg" c="blue.7">
                            {item.price.toLocaleString(currentLanguage, { style: 'currency', currency: 'EUR' })}
                        </Text>
                        
                        <Group gap="xs">
                            {/* Botón 1: Comprar con dinero */}
                            <Button 
                                onClick={() => onAddToCart(item)}
                                leftSection={<IconShoppingCartPlus size={16} />}
                                size="sm"
                                variant="filled"
                            >
                                {hasModifiers ? t('publicMenu.customizeButton') : t('publicMenu.addToCart')}
                            </Button>

                            {/* Botón 2: Canjear con puntos (condicional) */}
                            {isRedeemable && (
                                <Tooltip 
                                    label={!canAffordReward ? t('customerDashboard.insufficientPoints') : ''}
                                    color="red"
                                    withArrow
                                    disabled={canAffordReward}
                                >
                                    <Box>
                                        <Button
                                            onClick={() => canAffordReward && onRedeem(item)}
                                            variant="gradient"
                                            gradient={{ from: 'orange', to: 'yellow' }}
                                            size="sm"
                                            leftSection={<IconGift size={16} />}
                                            disabled={!canAffordReward || hasModifiers} // Deshabilitado si tiene modificadores también
                                            title={hasModifiers ? "No se pueden canjear productos con opciones" : undefined}
                                            style={{ cursor: (canAffordReward && !hasModifiers) ? 'pointer' : 'not-allowed' }}
                                        >
                                            {t('customerDashboard.redeemRewardButton')} ({rewardCost} pts)
                                        </Button>
                                    </Box>
                                </Tooltip>
                            )}
                        </Group>
                    </Group>
                </Stack>
            </Group>
        </Paper>
    );
};

export default MenuItemCard;