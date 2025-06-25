import { describe, it, expect, vi, beforeEach } from 'vitest';
import { determineTargetTier, calculateUserMetric } from '../tier-logic.helpers';
import { PrismaClient, TierCalculationBasis, QrCodeStatus } from '@prisma/client';

// Mock simple
const prismaMock = {
  qrCode: {
    aggregate: vi.fn(),
    count: vi.fn(),
  },
};


type ActiveTierInfo = {
  id: string;
  name: string;
  level: number;
  minValue: number;
};

describe('Tier Logic Helpers', () => {

  describe('determineTargetTier', () => {
    // ... (tests sin cambios) ...
    const mockActiveTiers: ActiveTierInfo[] = [
        { id: 'tier-oro', name: 'Oro', level: 3, minValue: 1000 },
        { id: 'tier-plata', name: 'Plata', level: 2, minValue: 500 },
        { id: 'tier-bronce', name: 'Bronce', level: 1, minValue: 100 },
      ];
      it('should return null if metric value is below the lowest tier threshold', () => {
        const metricValue = 50;
        const targetTierId = determineTargetTier(metricValue, mockActiveTiers);
        expect(targetTierId).toBeNull();
      });
      it('should return the lowest tier ID if metric value matches its threshold', () => {
        const metricValue = 100;
        const targetTierId = determineTargetTier(metricValue, mockActiveTiers);
        expect(targetTierId).toBe('tier-bronce');
      });
      it('should return the correct tier ID if metric value is between thresholds', () => {
        const metricValue = 650;
        const targetTierId = determineTargetTier(metricValue, mockActiveTiers);
        expect(targetTierId).toBe('tier-plata');
      });
      it('should return the highest tier ID if metric value meets its threshold', () => {
        const metricValue = 1000;
        const targetTierId = determineTargetTier(metricValue, mockActiveTiers);
        expect(targetTierId).toBe('tier-oro');
      });
      it('should return the highest tier ID if metric value exceeds the highest threshold', () => {
        const metricValue = 5000;
        const targetTierId = determineTargetTier(metricValue, mockActiveTiers);
        expect(targetTierId).toBe('tier-oro');
      });
      it('should return null if the list of active tiers is empty', () => {
        const metricValue = 500;
        const emptyTiers: ActiveTierInfo[] = [];
        const targetTierId = determineTargetTier(metricValue, emptyTiers);
        expect(targetTierId).toBeNull();
      });
       it('should handle tiers with minValue 0 correctly', () => {
         const tiersWithZero: ActiveTierInfo[] = [
           { id: 'tier-plata', name: 'Plata', level: 1, minValue: 100 },
           { id: 'tier-basico', name: 'Basico', level: 0, minValue: 0 },
         ];
         const metricValue = 50;
         const targetTierId = determineTargetTier(metricValue, tiersWithZero);
         expect(targetTierId).toBe('tier-basico');
       });
       it('should return the base tier ID if metric value is 0 and a tier starts at 0', () => {
         const tiersWithZero: ActiveTierInfo[] = [
             { id: 'tier-plata', name: 'Plata', level: 1, minValue: 100 },
             { id: 'tier-basico', name: 'Basico', level: 0, minValue: 0 },
           ];
         const metricValue = 0;
         const targetTierId = determineTargetTier(metricValue, tiersWithZero);
         expect(targetTierId).toBe('tier-basico');
       });
  });

  describe('calculateUserMetric', () => {
    const userId = 'test-user-id';
    const testStartDate = new Date('2024-01-01T00:00:00.000Z');

    beforeEach(() => {
      vi.resetAllMocks();
    });

    it('should calculate metric based on SPEND correctly', async () => {
      prismaMock.qrCode.aggregate.mockResolvedValue({ _sum: { amount: 150.75, pointsEarned: null } });
      // --- CAMBIO: Añadir directiva para ignorar error de tipo ---
      // @ts-expect-error: prismaMock is intentionally simplified for this test
      const metric = await calculateUserMetric(prismaMock, userId, TierCalculationBasis.SPEND, undefined);
      // --- FIN CAMBIO ---
      expect(prismaMock.qrCode.aggregate).toHaveBeenCalledWith(expect.objectContaining({
        _sum: { amount: true },
        where: { userId: userId, status: QrCodeStatus.COMPLETED }
      }));
      expect(metric).toBe(150.75);
    });

    it('should calculate metric based on VISITS correctly', async () => {
      prismaMock.qrCode.count.mockResolvedValue(12);
       // --- CAMBIO: Añadir directiva para ignorar error de tipo ---
       // @ts-expect-error: prismaMock is intentionally simplified for this test
      const metric = await calculateUserMetric(prismaMock, userId, TierCalculationBasis.VISITS, undefined);
       // --- FIN CAMBIO ---
      expect(prismaMock.qrCode.count).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId: userId, status: QrCodeStatus.COMPLETED }
      }));
      expect(metric).toBe(12);
    });

    it('should calculate metric based on POINTS_EARNED correctly', async () => {
      prismaMock.qrCode.aggregate.mockResolvedValue({ _sum: { amount: null, pointsEarned: 5430 } });
       // --- CAMBIO: Añadir directiva para ignorar error de tipo ---
       // @ts-expect-error: prismaMock is intentionally simplified for this test
      const metric = await calculateUserMetric(prismaMock, userId, TierCalculationBasis.POINTS_EARNED, undefined);
       // --- FIN CAMBIO ---
      expect(prismaMock.qrCode.aggregate).toHaveBeenCalledWith(expect.objectContaining({
        _sum: { pointsEarned: true },
        where: { userId: userId, status: QrCodeStatus.COMPLETED }
      }));
      expect(metric).toBe(5430);
    });

    it('should calculate metric based on SPEND with a start date', async () => {
      prismaMock.qrCode.aggregate.mockResolvedValue({ _sum: { amount: 99.50, pointsEarned: null } });
       // --- CAMBIO: Añadir directiva para ignorar error de tipo ---
       // @ts-expect-error: prismaMock is intentionally simplified for this test
      const metric = await calculateUserMetric(prismaMock, userId, TierCalculationBasis.SPEND, testStartDate);
       // --- FIN CAMBIO ---
      expect(prismaMock.qrCode.aggregate).toHaveBeenCalledWith(expect.objectContaining({
        _sum: { amount: true },
        where: { userId: userId, status: QrCodeStatus.COMPLETED, completedAt: { gte: testStartDate } }
      }));
      expect(metric).toBe(99.50);
    });

     it('should return 0 if aggregation sum is null', async () => {
       prismaMock.qrCode.aggregate.mockResolvedValue({ _sum: { amount: null, pointsEarned: null } });
        // --- CAMBIO: Añadir directiva para ignorar error de tipo ---
        // @ts-expect-error: prismaMock is intentionally simplified for this test
       const metric = await calculateUserMetric(prismaMock, userId, TierCalculationBasis.SPEND, undefined);
       // --- FIN CAMBIO ---
       expect(prismaMock.qrCode.aggregate).toHaveBeenCalled();
       expect(metric).toBe(0);
     });

     it('should return 0 if count is 0', async () => {
        prismaMock.qrCode.count.mockResolvedValue(0);
         // --- CAMBIO: Añadir directiva para ignorar error de tipo ---
         // @ts-expect-error: prismaMock is intentionally simplified for this test
        const metric = await calculateUserMetric(prismaMock, userId, TierCalculationBasis.VISITS, undefined);
         // --- FIN CAMBIO ---
        expect(prismaMock.qrCode.count).toHaveBeenCalled();
        expect(metric).toBe(0);
      });

     it('should handle Prisma errors gracefully and return 0', async () => {
        prismaMock.qrCode.aggregate.mockRejectedValue(new Error("Database connection failed"));
         // --- CAMBIO: Añadir directiva para ignorar error de tipo ---
         // @ts-expect-error: prismaMock is intentionally simplified for this test
        const metric = await calculateUserMetric(prismaMock, userId, TierCalculationBasis.SPEND, undefined);
         // --- FIN CAMBIO ---
        expect(prismaMock.qrCode.aggregate).toHaveBeenCalled();
        expect(metric).toBe(0);
      });
  });
});

// End of File: backend/src/tiers/__tests__/tier-logic.helpers.test.ts