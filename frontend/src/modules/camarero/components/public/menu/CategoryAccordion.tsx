// frontend/src/modules/camarero/components/public/menu/CategoryAccordion.tsx
// Version 1.3.0 - Final Corrected Version

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

// --- INTERFAZ DE PROPS DEFINITIVA Y CORRECTA ---
interface CategoryAccordionProps {
    categories: PublicMenuCategory[];
    activeAccordionItems: string[];
    onAccordionChange: (value: string[]) => void;
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
    categories, activeAccordionItems, onAccordionChange,
    configuringItemId, configuringItemState, onStartConfigureItem, onCancelConfiguration,
    onConfigQuantityChange, onConfigModifierSelectionChange, onConfigNotesChange,
    onConfigAddToCart, onSimpleAddToCart,
}) => {
    const { t, i18n } = useTranslation();

    if (!categories || categories.length === 0) {
        return <Text c="dimmed" ta="center">{t('publicMenu.noCategories')}</Text>;
    }

    return (
        <Accordion
            variant="separated" chevron={<IconChevronDown />} multiple
            value={activeAccordionItems} onChange={onAccordionChange}
        >
            {categories.map((category) => (
                <Accordion.Item key={category.id} value={category.id}>
                    <Accordion.Control>
                        <Group wrap="nowrap">
                            {category.imageUrl && (<Image src={category.imageUrl} alt={(i18n.language === 'es' && category.name_es) ? category.name_es : (category.name_en || category.name_es || '')} w={60} h={60} fit="cover" radius="sm" />)}
                            <Stack gap={0}>
                                <Title order={4}>{i18n.language === 'es' && category.name_es ? category.name_es : category.name_en || category.name_es || t('publicMenu.unnamedCategory')}</Title>
                                {i18n.language === 'es' && category.description_es && <Text size="sm" c="dimmed" lineClamp={1}>{category.description_es}</Text>}
                                {i18n.language === 'en' && category.description_en && <Text size="sm" c="dimmed" lineClamp={1}>{category.description_en}</Text>}
                            </Stack>
                        </Group>
                    </Accordion.Control>
                    <Accordion.Panel>
                        {category.items.length > 0 ? (
                            <Stack gap="md" pt="md">
                                {category.items.map((item) => {
                                    const isConfiguringThisItem = configuringItemId === item.id;
                                    return (
                                        <MenuItemCard
                                            key={item.id} item={item}
                                            isConfiguringThisItem={isConfiguringThisItem}
                                            currentConfig={isConfiguringThisItem ? configuringItemState : null}
                                            onStartConfigure={() => onStartConfigureItem(item)}
                                            onCancelConfiguration={onCancelConfiguration}
                                            onQuantityChange={onConfigQuantityChange}
                                            onModifierSelectionChange={onConfigModifierSelectionChange}
                                            onNotesChange={onConfigNotesChange}
                                            onAddToCart={isConfiguringThisItem ? onConfigAddToCart : () => onSimpleAddToCart(item, 1)}
                                        />
                                    );
                                })}
                            </Stack>
                        ) : (
                            <Text c="dimmed">{t('publicMenu.noItemsInCategory')}</Text>
                        )}
                    </Accordion.Panel>
                </Accordion.Item>
            ))}
        </Accordion>
    );
};

export default CategoryAccordion;