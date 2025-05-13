// frontend/src/pages/PublicMenuViewPage.tsx
// Version: 1.0.4 (Fix theme error, remove unused icon import, refined modifier display)

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
    Container, Title, Loader, Alert, Text, Stack, Paper, Image, Group, Badge, Box,
    Accordion, ThemeIcon, useMantineTheme // <<--- AÑADIDO useMantineTheme
} from '@mantine/core';
import {
    IconAlertCircle, IconChevronDown, IconPoint // <<--- IconListDetails ELIMINADO
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import {
    PublicDigitalMenuData,
    PublicMenuCategory,
    PublicMenuItem,
    PublicMenuModifierGroup,
    PublicMenuModifierOption,
    ModifierUiType
} from '../types/menu.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_PUBLIC || 'http://localhost:3000/public';

const PublicMenuViewPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const theme = useMantineTheme(); // <<--- OBTENER EL TEMA AQUÍ
    const { businessSlug, tableIdentifier } = useParams<{ businessSlug: string; tableIdentifier?: string }>();

    const [menuData, setMenuData] = useState<PublicDigitalMenuData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeAccordionItems, setActiveAccordionItems] = useState<string[]>([]);


    const fetchPublicMenu = useCallback(async () => {
        if (!businessSlug) {
            setError(t('error.missingBusinessSlug', 'Error: Slug del negocio no proporcionado.'));
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        console.log(`[PublicMenuViewPage] Fetching menu for slug: ${businessSlug}, table: ${tableIdentifier || 'N/A'}`);
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
                console.log("[PublicMenuViewPage] Menu data received and parsed:", parsedMenuData);
            } else {
                throw new Error(t('error.noMenuDataReceived', 'No se recibieron datos del menú.'));
            }
        } catch (err: any) {
            console.error("[PublicMenuViewPage] Error fetching public menu:", err);
            const errMsg = err.response?.data?.message || err.message || t('common.errorUnknown');
            setError(errMsg);
            setMenuData(null);
        } finally {
            setLoading(false);
        }
    }, [businessSlug, tableIdentifier, t]);

    useEffect(() => {
        fetchPublicMenu();
    }, [fetchPublicMenu]);

    const getModifierGroupSelectionText = (group: PublicMenuModifierGroup): string => {
        const { isRequired, uiType, minSelections, maxSelections } = group;
    
        if (isRequired) {
            if (uiType === ModifierUiType.RADIO) { // Implica min 1, max 1
                return t('publicMenu.modifier.chooseOneRequired', 'Elige 1 (obligatorio)');
            }
            if (minSelections === 1 && maxSelections === 1) {
                 return t('publicMenu.modifier.chooseOneRequired', 'Elige 1 (obligatorio)');
            }
            if (minSelections === 1 && maxSelections > 1) {
                return t('publicMenu.modifier.chooseAtLeastOneUpToMax', { max: maxSelections, context: 'required' });
            }
            if (minSelections > 0 && maxSelections >= minSelections) {
                 return t('publicMenu.modifier.chooseMinUpToMax', { min: minSelections, max: maxSelections, context: 'required' });
            }
        } else { // Opcional
            if (uiType === ModifierUiType.RADIO && maxSelections === 1) { // Radio opcional (puede no seleccionar nada o uno)
                return t('publicMenu.modifier.chooseOneOptional', 'Elige 1 (opcional)');
            }
            if (maxSelections > 0) {
                return t('publicMenu.modifier.chooseUpToMaxOptional', { max: maxSelections });
            }
        }
        return t('publicMenu.modifier.chooseOptional', 'Opcional'); // Fallback genérico
    };


    if (loading) {
        return (
            <Container size="md" py="xl" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <Loader size="xl" />
            </Container>
        );
    }

    if (error) {
        return (
            <Container size="md" py="xl">
                <Alert icon={<IconAlertCircle size="1rem" />} title={t('common.error')} color="red" radius="md">
                    {error}
                </Alert>
            </Container>
        );
    }

    if (!menuData) {
        return (
            <Container size="md" py="xl">
                <Text ta="center" c="dimmed">{t('publicMenu.menuNotAvailable', 'Menú no disponible o no encontrado.')}</Text>
            </Container>
        );
    }

    return (
        <Container size="lg" py="xl">
            <Stack gap="xl">
                <Group justify="center" align="center" wrap="nowrap">
                    {menuData.businessLogoUrl && (
                        <Image src={menuData.businessLogoUrl} alt={`${menuData.businessName} logo`} h={50} w="auto" fit="contain" radius="sm" />
                    )}
                    <Title order={1} ta="center" style={{ flexShrink: 1, minWidth: 0 }}>{menuData.businessName}</Title>
                </Group>

                <Accordion
                    variant="separated"
                    chevron={<IconChevronDown />}
                    multiple
                    value={activeAccordionItems}
                    onChange={setActiveAccordionItems}
                >
                    {menuData.categories.map((category: PublicMenuCategory) => (
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
                                        {category.items.map((item: PublicMenuItem) => (
                                            <Paper key={item.id} p="md" radius="sm" withBorder>
                                                <Group wrap="nowrap" align="flex-start" gap="md">
                                                    {item.imageUrl && (
                                                        <Image src={item.imageUrl} alt={(i18n.language === 'es' && item.name_es) ? item.name_es : (item.name_en || item.name_es || '')} w={100} h={100} fit="cover" radius="sm" />
                                                    )}
                                                    <Stack gap="xs" style={{ flexGrow: 1 }}> {/* Cambiado de gap={4} a gap="xs" */}
                                                        <Title order={5}>
                                                            {i18n.language === 'es' && item.name_es ? item.name_es : item.name_en || item.name_es || t('publicMenu.unnamedItem', 'Ítem sin nombre')}
                                                        </Title>
                                                        <Text c="blue.7" fw={700} fz="lg">
                                                            {item.price.toLocaleString(i18n.language, { style: 'currency', currency: 'EUR' })}
                                                        </Text>
                                                        {(item.description_es && i18n.language === 'es') && <Text size="sm" c="dimmed" lineClamp={3}>{item.description_es}</Text>}
                                                        {(item.description_en && i18n.language === 'en') && <Text size="sm" c="dimmed" lineClamp={3}>{item.description_en}</Text>}

                                                        {item.modifierGroups && item.modifierGroups.length > 0 && (
                                                            <Box mt="sm" pl="xs">
                                                                <Title order={6} c="dimmed" tt="uppercase" fz="xs" mb="xs">{t('publicMenu.optionsTitle', 'Personaliza tu elección:')}</Title>
                                                                {item.modifierGroups.map((group: PublicMenuModifierGroup) => (
                                                                    <Box key={group.id} mb="sm" pl="sm" style={{borderLeft: `2px solid ${theme.colors.gray[3]}`, marginLeft:'4px'}}>
                                                                        <Text size="sm" fw={500}> {/* Cambiado de xs a sm */}
                                                                            {i18n.language === 'es' && group.name_es ? group.name_es : group.name_en || group.name_es}
                                                                            {group.isRequired && <Text span c="red.7" ml={4} fw={700}>*</Text>}
                                                                        </Text>
                                                                        <Text size="xs" c="dimmed" mb={4}> {/* Aumentado mb un poco */}
                                                                            {getModifierGroupSelectionText(group)}
                                                                        </Text>
                                                                        <Stack gap={4} mt={4}> {/* Ajustado gap y mt */}
                                                                            {group.options.map((option: PublicMenuModifierOption) => (
                                                                                <Group key={option.id} gap="xs" ml="md" wrap="nowrap">
                                                                                    <ThemeIcon variant="light" size={16} radius="xl" color={option.isDefault ? "blue" : "gray"}>
                                                                                        <IconPoint size={10} />
                                                                                    </ThemeIcon>
                                                                                    <Text size="sm">
                                                                                        {i18n.language === 'es' && option.name_es ? option.name_es : option.name_en || option.name_es}
                                                                                        {option.priceAdjustment !== 0 && (
                                                                                            <Text span c={option.priceAdjustment > 0 ? "teal.7" : "pink.7"} ml={5} fz="xs">
                                                                                                ({option.priceAdjustment > 0 ? '+' : ''}{option.priceAdjustment.toFixed(2)}€)
                                                                                            </Text>
                                                                                        )}
                                                                                        {option.isDefault && <Badge variant="outline" color="blue" size="xs" ml={5} radius="sm">{t('publicMenu.defaultOption','defecto')}</Badge>}
                                                                                    </Text>
                                                                                </Group>
                                                                            ))}
                                                                        </Stack>
                                                                    </Box>
                                                                ))}
                                                            </Box>
                                                        )}
                                                        
                                                        {(item.allergens.length > 0 || item.tags.length > 0) && (
                                                            <Group gap="xs" mt="sm">
                                                                {item.allergens.map(allergen => <Badge key={allergen} variant="outline" color="orange" size="xs">{t(`menuItem.allergen.${allergen}`, allergen)}</Badge>)}
                                                                {item.tags.map(tag => <Badge key={tag} variant="light" color="grape" size="xs">{t(`menuItem.tag.${tag}`, tag)}</Badge>)}
                                                            </Group>
                                                        )}
                                                    </Stack>
                                                </Group>
                                            </Paper>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Text c="dimmed">{t('publicMenu.noItemsInCategory', 'No hay ítems en esta categoría.')}</Text>
                                )}
                            </Accordion.Panel>
                        </Accordion.Item>
                    ))}
                </Accordion>
            </Stack>
        </Container>
    );
};

export default PublicMenuViewPage;