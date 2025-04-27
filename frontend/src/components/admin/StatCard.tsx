// filename: frontend/src/components/admin/StatCard.tsx
// Version: 1.1.1 (Fix imports and theme access)

import React from 'react';
// CORRECCIÓN: Añadido Stack y useMantineTheme a las importaciones
import { Paper, Group, Text, ThemeIcon, Skeleton, MantineColor, useMantineTheme, Stack } from '@mantine/core';
import { IconArrowUpRight, IconArrowDownRight } from '@tabler/icons-react';
import classes from './StatCard.module.css';

// Definimos el tipo para la dirección de la tendencia
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

// Componente Funcional StatCard (Ahora llama useMantineTheme directamente)
const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  loading,
  color = 'gray', // Color gris por defecto
  trendValue,
  trendDirection,
}) => {
  // Hook para acceder al tema (colores, etc.)
  const theme = useMantineTheme();

  // Formateo del valor principal para mostrarlo
  const displayValue = loading || value === null || value === undefined
    ? '-'
    : typeof value === 'number' ? value.toLocaleString('es-ES') : value;

  // Determinar icono y color de la tendencia (si existe)
  let TrendIcon = null;
  let trendColor: MantineColor = 'dimmed'; // Color por defecto
  if (trendDirection === 'up') {
    TrendIcon = IconArrowUpRight;
    trendColor = 'teal';
  } else if (trendDirection === 'down') {
    TrendIcon = IconArrowDownRight;
    trendColor = 'red';
  }

  // Renderizar la línea de tendencia solo si hay valor Y dirección
  const renderTrend = trendValue !== null && trendValue !== undefined && trendDirection;

  return (
    <Paper withBorder p="md" radius="md" className={classes.card}>
      {/* Grupo Superior: Icono y Textos Principales */}
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        {/* Stack Izquierda: Título y Valor */}
        {/* CORRECCIÓN: Usamos Stack importado */}
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
        </Stack> {/* CORRECCIÓN: Fin de Stack */}

         {/* Icono Principal (Derecha) */}
        {icon && !loading && (
          <ThemeIcon color={color} variant="light" size={38} radius="md">
            {icon}
          </ThemeIcon>
        )}
         {loading && (
             <Skeleton height={38} width={38} radius="md" />
         )}
      </Group>

       {/* Grupo Inferior: Tendencia (Condicional) */}
      {!loading && renderTrend && (
           <Group gap={4} mt={5} wrap="nowrap">
               {/* CORRECCIÓN: Usamos un índice fijo [6] para el color del icono de tendencia */}
               {TrendIcon && <TrendIcon size={16} stroke={1.5} color={theme.colors[trendColor][6]} />}
               <Text c={trendColor} fz="xs" fw={500}>
                   {trendValue}
               </Text>
           </Group>
      )}
    </Paper>
  );
};

// Ya no necesitamos el wrapper, exportamos StatCard directamente
export default StatCard;

// End of file: frontend/src/components/admin/StatCard.tsx