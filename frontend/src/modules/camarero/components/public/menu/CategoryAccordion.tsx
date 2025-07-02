// frontend/src/modules/camarero/components/public/menu/CategoryAccordion.tsx
// VERSIÓN 1.5.1 - CORREGIDO para pasar la firma de función correcta a onAddToCart.

import React from 'react';
import { Accordion, Group, Image, Stack, Title, Text } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { PublicMenuCategory, PublicMenuItem } from '../../../types/menu.types';
import MenuItemCard from './MenuItemCard';
import type { Reward, UserData } from '../../../../../shared/types/user.types';

// --- INTERFAZ DE PROPS CORREGIDA ---
interface CategoryAccordionProps {
    categories: PublicMenuCategory[];
    activeAccordionItems: string[];
    onAccordionChange: (value: string[]) => void;
    redeemableItemsMap: Map<string, Reward>;
    userData: UserData | null;
    // La firma de onAddToCart ahora coincide con la de MenuItemCard
    onAddToCart: (item: PublicMenuItem) => void; 
    onRedeem: (item: PublicMenuItem) => void;
}

const CategoryAccordion: React.FC<CategoryAccordionProps> = ({
    categories,
    activeAccordionItems,
    onAccordionChange,
    redeemableItemsMap,
    userData,
    onAddToCart,
    onRedeem,
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
                                <Title order={4}>{(i18n.language === 'es' ? category.name_es : category.name_en) || category.name_es || t('publicMenu.unnamedCategory')}</Title>
                                {i18n.language === 'es' && category.description_es && <Text size="sm" c="dimmed" lineClamp={1}>{category.description_es}</Text>}
                                {i18n.language !== 'es' && category.description_en && <Text size="sm" c="dimmed" lineClamp={1}>{category.description_en}</Text>}
                            </Stack>
                        </Group>
                    </Accordion.Control>
                    <Accordion.Panel>
                        {category.items.length > 0 ? (
                            <Stack gap="md" pt="md">
                                {category.items.map((item) => {
                                    const isRedeemable = redeemableItemsMap.has(item.id);
                                    const rewardInfo = isRedeemable ? redeemableItemsMap.get(item.id) : undefined;
                                    const canAfford = rewardInfo ? (userData?.points ?? 0) >= rewardInfo.pointsCost : false;
                                    
                                    return (
                                        <MenuItemCard
                                            key={item.id}
                                            item={item}
                                            // onAddToCart ahora se pasa directamente, ya que la firma coincide
                                            onAddToCart={onAddToCart}
                                            isRedeemable={isRedeemable}
                                            rewardCost={rewardInfo?.pointsCost}
                                            canAffordReward={canAfford}
                                            onRedeem={onRedeem}
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