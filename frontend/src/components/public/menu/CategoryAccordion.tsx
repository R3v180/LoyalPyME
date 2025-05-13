// frontend/src/components/public/menu/CategoryAccordion.tsx
// Version: 1.0.1 (Fix itemDetails access and use initialQuantity)

import React from 'react';
import { Accordion, Group, Image, Stack, Title, Text } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import {
    PublicMenuCategory,
    PublicMenuItem,
    ModifierUiType
} from '../../../types/menu.types';
import MenuItemCard, { MenuItemCardConfiguringState } from './MenuItemCard';

interface CategoryAccordionProps {
    categories: PublicMenuCategory[];
    activeAccordionItems: string[];
    onAccordionChange: (value: string[]) => void;
    
    // NUEVA PROP: ID del ítem que se está configurando actualmente
    configuringItemId: string | null; 
    configuringItemState: MenuItemCardConfiguringState | null;
    
    onStartConfigureItem: (item: PublicMenuItem) => void;
    onCancelConfiguration: () => void;
    onConfigQuantityChange: (newQuantity: number) => void;
    onConfigModifierSelectionChange: (groupId: string, newSelection: string | string[], groupUiType: ModifierUiType) => void;
    onConfigNotesChange: (newNotes: string) => void;
    onConfigAddToCart: () => void;
    onSimpleAddToCart: (item: PublicMenuItem, quantity: number) => void;
}

const CategoryAccordion: React.FC<CategoryAccordionProps> = ({
    categories,
    activeAccordionItems,
    onAccordionChange,
    configuringItemId, // <<< NUEVA PROP
    configuringItemState,
    onStartConfigureItem,
    onCancelConfiguration,
    onConfigQuantityChange,
    onConfigModifierSelectionChange,
    onConfigNotesChange,
    onConfigAddToCart,
    onSimpleAddToCart,
}) => {
    const { t, i18n } = useTranslation();

    if (!categories || categories.length === 0) {
        return <Text c="dimmed" ta="center">{t('publicMenu.noCategories', 'No hay categorías de menú disponibles.')}</Text>;
    }

    return (
        <Accordion
            variant="separated"
            chevron={<IconChevronDown />}
            multiple
            value={activeAccordionItems}
            onChange={onAccordionChange}
        >
            {categories.map((category: PublicMenuCategory) => (
                <Accordion.Item key={category.id} value={category.id}>
                    <Accordion.Control>
                        <Group wrap="nowrap">
                            {category.imageUrl && (
                                <Image src={category.imageUrl} alt={(i18n.language === 'es' && category.name_es) ? category.name_es : (category.name_en || category.name_es || '')} w={60} h={60} fit="cover" radius="sm" />
                            )}
                            <Stack gap={0}>
                                <Title order={4}>
                                    {i18n.language === 'es' && category.name_es ? category.name_es : category.name_en || category.name_es || t('publicMenu.unnamedCategory', 'Categoría sin nombre')}
                                </Title>
                                {(category.description_es && i18n.language === 'es') && <Text size="sm" c="dimmed" lineClamp={1}>{category.description_es}</Text>}
                                {(category.description_en && i18n.language === 'en') && <Text size="sm" c="dimmed" lineClamp={1}>{category.description_en}</Text>}
                            </Stack>
                        </Group>
                    </Accordion.Control>
                    <Accordion.Panel>
                        {category.items.length > 0 ? (
                            <Stack gap="md" pt="md">
                                {category.items.map((item: PublicMenuItem) => {
                                    // CORRECCIÓN: Usar configuringItemId para determinar si se está configurando este ítem
                                    const isConfiguringThisItem = configuringItemId === item.id;
                                    const itemConfigForCard = isConfiguringThisItem ? configuringItemState : null;
                                    
                                    // Usar la cantidad del estado de configuración si este ítem se está configurando, sino 1
                                    const quantityForCard = isConfiguringThisItem && itemConfigForCard ? itemConfigForCard.quantity : 1;

                                    return (
                                        <MenuItemCard
                                            key={item.id}
                                            item={item}
                                            isConfiguringThisItem={isConfiguringThisItem}
                                            currentConfig={itemConfigForCard ? { // Asegurarse de pasar todos los campos de MenuItemCardConfiguringState
                                                quantity: quantityForCard,
                                                selectedOptionsByGroup: itemConfigForCard.selectedOptionsByGroup,
                                                currentUnitPrice: itemConfigForCard.currentUnitPrice,
                                                itemNotes: itemConfigForCard.itemNotes,
                                                areModifiersValid: itemConfigForCard.areModifiersValid,
                                            } : null}
                                            onStartConfigure={() => onStartConfigureItem(item)}
                                            onCancelConfiguration={onCancelConfiguration}
                                            // Asegurarse que los callbacks para actualizar la config se pasan correctamente
                                            onQuantityChange={onConfigQuantityChange}
                                            onModifierSelectionChange={onConfigModifierSelectionChange}
                                            onNotesChange={onConfigNotesChange}
                                            onAddToCart={isConfiguringThisItem ? onConfigAddToCart : () => {
                                                const quantityInput = document.getElementById(`quantity-${item.id}`) as HTMLInputElement;
                                                const quantity = quantityInput ? parseInt(quantityInput.value, 10) : 1;
                                                onSimpleAddToCart(item, quantity >= 1 ? quantity : 1);
                                            }}
                                        />
                                    );
                                })}
                            </Stack>
                        ) : (
                            <Text c="dimmed">{t('publicMenu.noItemsInCategory', 'No hay ítems en esta categoría.')}</Text>
                        )}
                    </Accordion.Panel>
                </Accordion.Item>
            ))}
        </Accordion>
    );
};

export default CategoryAccordion;