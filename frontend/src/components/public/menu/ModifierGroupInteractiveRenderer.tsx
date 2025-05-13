// frontend/src/components/public/menu/ModifierGroupInteractiveRenderer.tsx
// Version: 1.0.1 (Corrected imports)

import React from 'react';
import { 
    Stack, Text, Radio, Checkbox, 
    Box // <--- AÑADIDO Box
} from '@mantine/core';
// Group, Badge, ThemeIcon, IconPoint eliminados de las importaciones ya que no se usan aquí
import { useTranslation } from 'react-i18next';
import { PublicMenuModifierGroup, PublicMenuModifierOption, ModifierUiType } from '../../../types/menu.types';

interface ModifierGroupInteractiveRendererProps {
    group: PublicMenuModifierGroup;
    selectedOptionsForThisGroup: string | string[]; 
    onSelectionChange: (newSelection: string | string[]) => void;
}

const ModifierGroupInteractiveRenderer: React.FC<ModifierGroupInteractiveRendererProps> = ({
    group,
    selectedOptionsForThisGroup,
    onSelectionChange,
}) => {
    const { t, i18n } = useTranslation();

    const getModifierGroupSelectionText = (grp: PublicMenuModifierGroup): string => {
        const { isRequired, uiType, minSelections, maxSelections } = grp;
        if (isRequired) {
            if (uiType === ModifierUiType.RADIO) { return t('publicMenu.modifier.chooseOneRequired', 'Elige 1 (obligatorio)'); }
            if (minSelections === 1 && maxSelections === 1) { return t('publicMenu.modifier.chooseOneRequired', 'Elige 1 (obligatorio)');}
            if (minSelections === 1 && maxSelections > 1) { return t('publicMenu.modifier.chooseAtLeastOneUpToMax', { max: maxSelections, context: 'required' }); }
            if (minSelections > 0 && maxSelections >= minSelections) { return t('publicMenu.modifier.chooseMinUpToMax', { min: minSelections, max: maxSelections, context: 'required' }); }
        } else { 
            if (uiType === ModifierUiType.RADIO && maxSelections === 1) { return t('publicMenu.modifier.chooseOneOptional', 'Elige 1 (opcional)'); }
            if (maxSelections > 0) { return t('publicMenu.modifier.chooseUpToMaxOptional', { max: maxSelections }); }
        }
        return t('publicMenu.modifier.chooseOptional', 'Opcional');
    };
    
    const renderOptionLabel = (option: PublicMenuModifierOption) => (
        <>
            {i18n.language === 'es' && option.name_es ? option.name_es : option.name_en || option.name_es}
            {option.priceAdjustment !== 0 && (
                <Text span c={option.priceAdjustment > 0 ? "teal.7" : "pink.7"} ml={5} fz="xs">
                    ({option.priceAdjustment > 0 ? '+' : ''}{option.priceAdjustment.toFixed(2)}€)
                </Text>
            )}
        </>
    );

    return (
        <Box key={group.id} mb="md" pl="sm" style={{borderLeft: `2px solid var(--mantine-color-gray-3)`, marginLeft:'4px'}}>
            <Text size="sm" fw={500}>
                {i18n.language === 'es' && group.name_es ? group.name_es : group.name_en || group.name_es}
                {group.isRequired && <Text span c="red.7" ml={4} fw={700}>*</Text>}
            </Text>
            <Text size="xs" c="dimmed" mb={4}>
                {getModifierGroupSelectionText(group)}
            </Text>
            <Stack gap="xs" mt={4}>
                {group.uiType === ModifierUiType.RADIO && (
                    <Radio.Group
                        value={selectedOptionsForThisGroup as string || ''}
                        onChange={(value) => onSelectionChange(value)}
                        name={`radio-group-${group.id}`}
                    >
                        <Stack gap="xs">
                            {group.options.map((option: PublicMenuModifierOption) => (
                                <Radio 
                                    key={option.id} 
                                    value={option.id}
                                    label={renderOptionLabel(option)} 
                                />
                            ))}
                        </Stack>
                    </Radio.Group>
                )}
                {group.uiType === ModifierUiType.CHECKBOX && (
                    <Checkbox.Group
                        value={selectedOptionsForThisGroup as string[] || []}
                        onChange={(values) => onSelectionChange(values)}
                    >
                         <Stack gap="xs">
                            {group.options.map((option: PublicMenuModifierOption) => (
                                <Checkbox
                                    key={option.id}
                                    value={option.id}
                                    label={renderOptionLabel(option)}
                                />
                            ))}
                        </Stack>
                    </Checkbox.Group>
                )}
            </Stack>
        </Box>
    );
};

export default ModifierGroupInteractiveRenderer;