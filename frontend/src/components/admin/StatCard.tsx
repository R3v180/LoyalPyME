// filename: frontend/src/components/admin/StatCard.tsx
import React from 'react';
import { Paper, Group, Text, ThemeIcon, Skeleton, MantineColor, useMantineTheme, Stack } from '@mantine/core';
import { IconArrowUpRight, IconArrowDownRight } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next'; // Importar hook
import classes from './StatCard.module.css';

// Tipo para la dirección de la tendencia
type TrendDirection = 'up' | 'down' | 'neutral';

// Props que acepta nuestro componente StatCard
interface StatCardProps {
  title: string; // El título ya viene traducido como prop
  value: number | string | null | undefined;
  icon?: React.ReactNode;
  loading?: boolean;
  color?: MantineColor;
  trendValue?: number | string | null | undefined;
  trendDirection?: TrendDirection | null | undefined;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  loading,
  color = 'gray',
  trendValue,
  trendDirection,
}) => {
  const { t, i18n } = useTranslation(); // Hook de traducción
  const theme = useMantineTheme();

  // Formateo del valor principal usando el idioma actual de i18n
  const displayValue = loading || value === null || value === undefined
    ? '-'
    // Usar i18n.language para el formateo local
    : typeof value === 'number' ? value.toLocaleString(i18n.language) : value;

  // Determinar icono y color de la tendencia
  let TrendIcon = null;
  let trendColor: MantineColor = 'dimmed';
  if (trendDirection === 'up') {
    TrendIcon = IconArrowUpRight;
    trendColor = 'teal';
  } else if (trendDirection === 'down') {
    TrendIcon = IconArrowDownRight;
    trendColor = 'red';
  }

  // Formateo del valor de la tendencia (usar t() para el error)
  let displayTrendValue = trendValue;
  if (typeof trendValue === 'number') {
      if (!isNaN(trendValue) && isFinite(trendValue)) {
          displayTrendValue = `${trendValue >= 0 ? '+' : ''}${trendValue.toFixed(1)}%`;
      } else {
          console.warn("Invalid trendValue number received:", trendValue);
          displayTrendValue = t('common.error'); // Usar clave i18n para error
      }
  } else if (trendValue === null || trendValue === undefined) {
      displayTrendValue = null; // No mostrar nada si es null/undefined
  }
  // Si es un string (como '+'), se muestra tal cual

  // Renderizar la línea de tendencia solo si hay valor Y dirección definidos
  const renderTrend = displayTrendValue !== null && trendDirection;

  return (
    <Paper withBorder p="md" radius="md" className={classes.card}>
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Stack gap={0}>
          <Text c="dimmed" tt="uppercase" fw={700} fz="xs" className={classes.label}>
            {title}
          </Text>
          {loading ? (
            <Skeleton height={28} mt={5} width={70} />
          ) : (
             <Text fw={700} fz="xl" className={classes.value} c={color}>
               {displayValue}
             </Text>
          )}
        </Stack>

        {icon && !loading && (
          <ThemeIcon color={color} variant="light" size={38} radius="md">
            {icon}
          </ThemeIcon>
        )}
         {loading && (
            <Skeleton height={38} width={38} radius="md" />
         )}
      </Group>

      {!loading && renderTrend && (
           <Group gap={4} mt={5} wrap="nowrap">
               {TrendIcon && <TrendIcon size={16} stroke={1.5} color={theme.colors[trendColor][6]} />}
               <Text c={trendColor} fz="xs" fw={500}>
                   {displayTrendValue}
               </Text>
           </Group>
      )}
    </Paper>
  );
};

export default StatCard;