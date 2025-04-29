// filename: frontend/src/components/admin/StatCard.tsx
// Version: 1.1.2 (Clean up comments)

import React from 'react';
import { Paper, Group, Text, ThemeIcon, Skeleton, MantineColor, useMantineTheme, Stack } from '@mantine/core';
import { IconArrowUpRight, IconArrowDownRight } from '@tabler/icons-react';
import classes from './StatCard.module.css';

// Tipo para la dirección de la tendencia
type TrendDirection = 'up' | 'down' | 'neutral';

// Props que acepta nuestro componente StatCard
interface StatCardProps {
  title: string;
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
  color = 'gray', // Color gris por defecto si no se especifica
  trendValue,
  trendDirection,
}) => {
  const theme = useMantineTheme();

  // Formateo del valor principal para mostrarlo
  const displayValue = loading || value === null || value === undefined
    ? '-'
    : typeof value === 'number' ? value.toLocaleString('es-ES') : value;

  // Determinar icono y color de la tendencia
  let TrendIcon = null;
  let trendColor: MantineColor = 'dimmed'; // Color por defecto
  if (trendDirection === 'up') {
    TrendIcon = IconArrowUpRight;
    trendColor = 'teal';
  } else if (trendDirection === 'down') {
    TrendIcon = IconArrowDownRight;
    trendColor = 'red';
  }

  // Renderizar la línea de tendencia solo si hay valor Y dirección definidos
  const renderTrend = trendValue !== null && trendValue !== undefined && trendDirection;

  return (
    <Paper withBorder p="md" radius="md" className={classes.card}>
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        {/* Título y Valor */}
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

        {/* Icono Principal */}
        {icon && !loading && (
          <ThemeIcon color={color} variant="light" size={38} radius="md">
            {icon}
          </ThemeIcon>
        )}
         {loading && (
            <Skeleton height={38} width={38} radius="md" />
         )}
      </Group>

      {/* Tendencia */}
      {!loading && renderTrend && (
           <Group gap={4} mt={5} wrap="nowrap">
               {TrendIcon && <TrendIcon size={16} stroke={1.5} color={theme.colors[trendColor][6]} />}
               <Text c={trendColor} fz="xs" fw={500}>
                   {trendValue}
               </Text>
           </Group>
      )}
    </Paper>
  );
};

export default StatCard;

// End of file: frontend/src/components/admin/StatCard.tsx