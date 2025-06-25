// filename: frontend/src/components/admin/StatCard.tsx
import React from 'react';
import { Paper, Group, Text, ThemeIcon, Skeleton, MantineColor, useMantineTheme, Stack } from '@mantine/core';
import { IconArrowUpRight, IconArrowDownRight } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
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
  trendValue?: string | null | undefined; // Aseguramos que trendValue siempre sea string o null/undefined
  trendDirection?: TrendDirection | null | undefined;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  loading,
  color = 'gray',
  trendValue, // Recibe el string formateado o null/undefined desde el hook
  trendDirection,
}) => {
  const { i18n } = useTranslation(); // Solo para i18n.language
  const theme = useMantineTheme();

  // Formateo del valor principal (sin cambios)
  const displayValue = loading || value === null || value === undefined
    ? '-'
    : typeof value === 'number' ? value.toLocaleString(i18n.language) : value;

  // Determinar icono y color de la tendencia (sin cambios)
  let TrendIcon = null;
  let trendColor: MantineColor = 'dimmed';
  if (trendDirection === 'up') {
    TrendIcon = IconArrowUpRight;
    trendColor = 'teal';
  } else if (trendDirection === 'down') {
    TrendIcon = IconArrowDownRight;
    trendColor = 'red';
  }

  // **CORRECCIÓN:** No necesitamos formatear `trendValue` aquí, ya viene formateado.
  // Simplemente comprobamos si existe para renderizar la sección de tendencia.
  const displayTrendValue = trendValue; // Usamos directamente el valor recibido
  const renderTrend = displayTrendValue !== null && displayTrendValue !== undefined && trendDirection;

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

      {/* Mostramos la tendencia si renderTrend es true */}
      {!loading && renderTrend && (
           <Group gap={4} mt={5} wrap="nowrap">
               {TrendIcon && <TrendIcon size={16} stroke={1.5} color={theme.colors[trendColor][6]} />}
               <Text c={trendColor} fz="xs" fw={500}>
                   {displayTrendValue} {/* Mostramos el string directamente */}
               </Text>
           </Group>
      )}
    </Paper>
  );
};

export default StatCard;