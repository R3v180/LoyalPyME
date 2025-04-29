// filename: frontend/src/hooks/useAdminOverviewStats.ts
// Version: 1.0.1 (Add console.log inside calculateTrend for debugging)

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAdminDashboardStats, AdminOverviewStats } from '../services/adminService';

type TrendDirection = 'up' | 'down' | 'neutral';
interface TrendResult {
    trendValue: string | null;
    trendDirection: TrendDirection | null;
}
interface UseAdminOverviewStatsReturn {
    statsData: AdminOverviewStats | null;
    loadingStats: boolean;
    errorStats: string | null;
    newCustomersTrend: TrendResult;
    pointsIssuedTrend: TrendResult;
    rewardsRedeemedTrend: TrendResult;
    refetchStats: () => void;
}

export const useAdminOverviewStats = (): UseAdminOverviewStatsReturn => {
    const [statsData, setStatsData] = useState<AdminOverviewStats | null>(null);
    const [loadingStats, setLoadingStats] = useState<boolean>(true);
    const [errorStats, setErrorStats] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        setLoadingStats(true);
        setErrorStats(null);
        console.log("[useAdminOverviewStats] Fetching stats...");
        try {
            const data = await getAdminDashboardStats();
            setStatsData(data);
        } catch (err: any) {
            console.error("[useAdminOverviewStats] Error fetching stats:", err);
            setErrorStats(err.message || 'No se pudieron cargar las estadísticas.');
        } finally {
            setLoadingStats(false);
            console.log("[useAdminOverviewStats] Stats fetch finished.");
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const calculateTrend = useMemo(() => {
        // Añadimos un identificador para saber qué métrica se está calculando
        return (metricName: string, current: number | null | undefined, previous: number | null | undefined): TrendResult => {
            const currentVal = current ?? 0;
            const previousVal = previous ?? 0;

            // --- DEBUG LOGGING ---
            console.log(`[calculateTrend - ${metricName}] Inputs: current=${currentVal}, previous=${previousVal}`);
            // --- FIN DEBUG LOGGING ---

            if (previousVal === 0) {
                if (currentVal > 0) {
                    // --- DEBUG LOGGING ---
                    console.log(`[calculateTrend - ${metricName}] Result: '+' (Previous was 0)`);
                    // --- FIN DEBUG LOGGING ---
                    return { trendValue: '+', trendDirection: 'up' };
                }
                // --- DEBUG LOGGING ---
                 console.log(`[calculateTrend - ${metricName}] Result: 'N/A' (Both 0 or current <= 0)`);
                 // --- FIN DEBUG LOGGING ---
                return { trendValue: 'N/A', trendDirection: 'neutral' };
            }

            const percentageChange = ((currentVal - previousVal) / previousVal) * 100;
            // --- DEBUG LOGGING ---
            console.log(`[calculateTrend - ${metricName}] Percentage Change: ${percentageChange}`);
            // --- FIN DEBUG LOGGING ---

            if (isNaN(percentageChange) || !isFinite(percentageChange)) {
                 console.warn(`[calculateTrend - ${metricName}] Invalid percentageChange calculated.`);
                return { trendValue: 'Error', trendDirection: 'neutral' };
            }

            let direction: TrendDirection = 'neutral';
            const threshold = 0.1;
            if (percentageChange > threshold) direction = 'up';
            else if (percentageChange < -threshold) direction = 'down';

            const formattedValue = `${percentageChange >= 0 ? '+' : ''}${percentageChange.toFixed(1)}%`;
            // --- DEBUG LOGGING ---
            console.log(`[calculateTrend - ${metricName}] Result: value='${formattedValue}', direction='${direction}'`);
            // --- FIN DEBUG LOGGING ---
            return { trendValue: formattedValue, trendDirection: direction };
        };
    }, []);

    const newCustomersTrend = useMemo(() => {
        if (!statsData) return { trendValue: null, trendDirection: null };
        // Pasar nombre de métrica para logs
        return calculateTrend('NewCustomers', statsData.newCustomersLast7Days, statsData.newCustomersPrevious7Days);
    }, [statsData, calculateTrend]);

    const pointsIssuedTrend = useMemo(() => {
        if (!statsData) return { trendValue: null, trendDirection: null };
         // Pasar nombre de métrica para logs
        return calculateTrend('PointsIssued', statsData.pointsIssuedLast7Days, statsData.pointsIssuedPrevious7Days);
    }, [statsData, calculateTrend]);

    const rewardsRedeemedTrend = useMemo(() => {
        if (!statsData) return { trendValue: null, trendDirection: null };
         // Pasar nombre de métrica para logs
        return calculateTrend('RewardsRedeemed', statsData.rewardsRedeemedLast7Days, statsData.rewardsRedeemedPrevious7Days);
    }, [statsData, calculateTrend]);

    return {
        statsData,
        loadingStats,
        errorStats,
        newCustomersTrend,
        pointsIssuedTrend,
        rewardsRedeemedTrend,
        refetchStats: fetchStats
    };
};

// End of File: frontend/src/hooks/useAdminOverviewStats.ts