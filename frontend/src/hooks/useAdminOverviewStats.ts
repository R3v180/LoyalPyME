// filename: frontend/src/hooks/useAdminOverviewStats.ts
// Version: 1.0.0 (Hook to fetch admin overview stats and calculate trends)

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAdminDashboardStats, AdminOverviewStats } from '../services/adminService'; // Importar servicio y tipo

// Definir tipo para la dirección de la tendencia (puede moverse a types globales)
type TrendDirection = 'up' | 'down' | 'neutral';

// Definir la estructura de lo que devuelve una tendencia calculada
interface TrendResult {
    trendValue: string | null;
    trendDirection: TrendDirection | null;
}

// Definir la estructura de lo que devuelve el hook
interface UseAdminOverviewStatsReturn {
    statsData: AdminOverviewStats | null;
    loadingStats: boolean;
    errorStats: string | null;
    newCustomersTrend: TrendResult;
    pointsIssuedTrend: TrendResult;
    rewardsRedeemedTrend: TrendResult;
    refetchStats: () => void; // Función para recargar
}

// El hook personalizado
export const useAdminOverviewStats = (): UseAdminOverviewStatsReturn => {
    // Estados internos del hook
    const [statsData, setStatsData] = useState<AdminOverviewStats | null>(null);
    const [loadingStats, setLoadingStats] = useState<boolean>(true);
    const [errorStats, setErrorStats] = useState<string | null>(null);

    // Función para obtener los datos de la API
    const fetchStats = useCallback(async () => {
        setLoadingStats(true);
        setErrorStats(null);
        console.log("[useAdminOverviewStats] Fetching stats...");
        try {
            const data = await getAdminDashboardStats();
            setStatsData(data);
        } catch (err: any) {
            console.error("[useAdminOverviewStats] Error fetching stats:", err);
            setErrorStats(err.message || 'No se pudieron cargar las estadísticas.'); // Corregido: estadísticas
        } finally {
            setLoadingStats(false);
            console.log("[useAdminOverviewStats] Stats fetch finished.");
        }
    }, []); // Sin dependencias, solo se llama al montar o con refetch

    // Efecto para la carga inicial
    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Función pura para calcular la tendencia (envuelta en useMemo para estabilidad)
    const calculateTrend = useMemo(() => {
        return (current: number | null | undefined, previous: number | null | undefined): TrendResult => {
            const currentVal = current ?? 0;
            const previousVal = previous ?? 0;

            // Caso especial: si el valor anterior era 0
            if (previousVal === 0) {
                if (currentVal > 0) return { trendValue: '+', trendDirection: 'up' }; // Indica aumento desde cero
                return { trendValue: 'N/A', trendDirection: 'neutral' }; // Sin cambios desde cero
            }

            const percentageChange = ((currentVal - previousVal) / previousVal) * 100;

            // Validar resultado numérico
            if (isNaN(percentageChange) || !isFinite(percentageChange)) {
                console.warn("Invalid percentageChange calculated:", { currentVal, previousVal, percentageChange });
                return { trendValue: 'Error', trendDirection: 'neutral' };
            }

            // Determinar dirección
            let direction: TrendDirection = 'neutral';
            const threshold = 0.1; // Umbral pequeño para considerar cambio (ej: 0.1%)
            if (percentageChange > threshold) direction = 'up';
            else if (percentageChange < -threshold) direction = 'down';

            // Formatear valor
            const formattedValue = `${percentageChange >= 0 ? '+' : ''}${percentageChange.toFixed(1)}%`;

            // Devolver resultado formateado
            return { trendValue: formattedValue, trendDirection: direction };
        };
    }, []); // Vacío porque la función en sí no depende de nada externo

    // Calcular las tendencias específicas usando useMemo para que solo se recalculen si statsData cambia
    const newCustomersTrend = useMemo(() => {
        if (!statsData) return { trendValue: null, trendDirection: null };
        return calculateTrend(statsData.newCustomersLast7Days, statsData.newCustomersPrevious7Days);
    }, [statsData, calculateTrend]);

    const pointsIssuedTrend = useMemo(() => {
        if (!statsData) return { trendValue: null, trendDirection: null };
        return calculateTrend(statsData.pointsIssuedLast7Days, statsData.pointsIssuedPrevious7Days);
    }, [statsData, calculateTrend]);

    const rewardsRedeemedTrend = useMemo(() => {
        if (!statsData) return { trendValue: null, trendDirection: null };
        return calculateTrend(statsData.rewardsRedeemedLast7Days, statsData.rewardsRedeemedPrevious7Days);
    }, [statsData, calculateTrend]);

    // Retorno del hook
    return {
        statsData,
        loadingStats,
        errorStats,
        newCustomersTrend,
        pointsIssuedTrend,
        rewardsRedeemedTrend,
        refetchStats: fetchStats // Exponer la función de fetch para recarga manual
    };
};

// End of File: frontend/src/hooks/useAdminOverviewStats.ts