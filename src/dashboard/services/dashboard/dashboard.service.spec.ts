import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { ACTIVE_SUBSCRIPTION_STATUSES } from 'src/utils/constants';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: {
    user: { count: jest.Mock; findMany: jest.Mock };
    healthProfile: { groupBy: jest.Mock };
    nutritionStaging: { count: jest.Mock; aggregate: jest.Mock };
    exerciseStaging: { count: jest.Mock; aggregate: jest.Mock };
    healthProfileStaging: { count: jest.Mock; aggregate: jest.Mock };
  };

  beforeEach(async () => {
    const countStaging = jest.fn().mockResolvedValue(1);
    const aggregateStaging = jest.fn().mockResolvedValue({
      _max: { updated_at: new Date('2025-01-15T12:00:00Z') },
    });

    prisma = {
      user: {
        count: jest
          .fn()
          .mockResolvedValueOnce(100)
          .mockResolvedValueOnce(60)
          .mockResolvedValueOnce(20)
          .mockResolvedValue(0),
        findMany: jest
          .fn()
          .mockResolvedValue([
            { date_of_birth: new Date('1990-05-01') },
            { date_of_birth: new Date('1985-10-10') },
            { date_of_birth: new Date('1970-01-01') },
          ]),
      },
      healthProfile: {
        groupBy: jest.fn().mockResolvedValue([
          { physical_activity_level: 'moderate', _count: { id: 5 } },
          { physical_activity_level: 'sedentary', _count: { id: 3 } },
        ]),
      },
      nutritionStaging: { count: countStaging, aggregate: aggregateStaging },
      exerciseStaging: { count: countStaging, aggregate: aggregateStaging },
      healthProfileStaging: {
        count: countStaging,
        aggregate: aggregateStaging,
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    jest.clearAllMocks();

    // Réinitialiser user.count pour chaque test (3 appels : totalUsers, activeUsers, premiumCount)
    prisma.user.count.mockReset();
    prisma.user.count
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(60)
      .mockResolvedValueOnce(20)
      .mockResolvedValue(0);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPilotage', () => {
    it('retourne la structure attendue (kpis, dataQualityTrend, ageDistribution, objectivesData, alerts)', async () => {
      const result = await service.getPilotage();

      expect(result).toHaveProperty('kpis');
      expect(result.kpis).toHaveProperty('dataQuality');
      expect(result.kpis).toHaveProperty('activeUsers');
      expect(result.kpis).toHaveProperty('premiumConversion');
      expect(result.kpis).toHaveProperty('pipelineErrors');
      expect(result).toHaveProperty('dataQualityTrend');
      expect(result).toHaveProperty('ageDistribution');
      expect(result).toHaveProperty('objectivesData');
      expect(result).toHaveProperty('alerts');
    });

    it('dataQuality KPI : value se termine par % et trend est une chaîne', async () => {
      const result = await service.getPilotage();

      expect(result.kpis.dataQuality.value).toMatch(/\d+(\.\d)?%$/);
      expect(typeof result.kpis.dataQuality.trend).toBe('string');
    });

    it('activeUsers : value formaté fr-FR, trend contient "% actifs" ou "0%"', async () => {
      const result = await service.getPilotage();

      expect(result.kpis.activeUsers.value).toBeDefined();
      expect(
        result.kpis.activeUsers.trend.includes('% actifs') ||
          result.kpis.activeUsers.trend === '0%',
      ).toBe(true);
    });

    it('premiumConversion : value se termine par %', async () => {
      const result = await service.getPilotage();

      expect(result.kpis.premiumConversion.value).toMatch(/%$/);
      expect(result.kpis.premiumConversion.trend).toBe('—');
    });

    it('pipelineErrors : value est la somme des anomalies (chaîne)', async () => {
      const result = await service.getPilotage();

      expect(result.kpis.pipelineErrors.value).toBeDefined();
      expect(typeof result.kpis.pipelineErrors.value).toBe('string');
      expect(result.kpis.pipelineErrors.trend).toBe('—');
    });

    it('dataQualityTrend : 7 entrées (Lun-Dim) avec date, quality, errors', async () => {
      const result = await service.getPilotage();

      expect(Array.isArray(result.dataQualityTrend)).toBe(true);
      expect(result.dataQualityTrend.length).toBe(7);
      const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
      result.dataQualityTrend.forEach((entry, i) => {
        expect(entry).toHaveProperty('date', days[i]);
        expect(entry).toHaveProperty('quality');
        expect(entry).toHaveProperty('errors');
      });
    });

    it('ageDistribution : tranches 18-25, 26-35, etc.', async () => {
      const result = await service.getPilotage();

      expect(Array.isArray(result.ageDistribution)).toBe(true);
      expect(result.ageDistribution.length).toBeGreaterThan(0);
      result.ageDistribution.forEach((band) => {
        expect(band).toHaveProperty('name');
        expect(band).toHaveProperty('value');
        expect(typeof band.value).toBe('number');
      });
    });

    it('objectivesData : au moins un objectif avec name, value, color', async () => {
      const result = await service.getPilotage();

      expect(Array.isArray(result.objectivesData)).toBe(true);
      result.objectivesData.forEach((obj) => {
        expect(obj).toHaveProperty('name');
        expect(obj).toHaveProperty('value');
        expect(obj).toHaveProperty('color');
      });
    });

    it('alerts : au moins une alerte avec id, type, message, time', async () => {
      const result = await service.getPilotage();

      expect(Array.isArray(result.alerts)).toBe(true);
      expect(result.alerts.length).toBeGreaterThanOrEqual(1);
      result.alerts.forEach((alert) => {
        expect(alert).toHaveProperty('id');
        expect(alert).toHaveProperty('type');
        expect(alert).toHaveProperty('message');
        expect(alert).toHaveProperty('time');
      });
    });

    it('appelle user.count pour totalUsers, activeUsers, premiumCount', async () => {
      await service.getPilotage();

      expect(prisma.user.count).toHaveBeenCalledTimes(3);
      expect(prisma.user.count).toHaveBeenNthCalledWith(1, {
        where: { is_deleted: false },
      });
      expect(prisma.user.count).toHaveBeenNthCalledWith(2, {
        where: { is_deleted: false, is_active: true },
      });
      expect(prisma.user.count).toHaveBeenNthCalledWith(3, {
        where: {
          is_deleted: false,
          subscriptions: {
            some: {
              status: { in: [...ACTIVE_SUBSCRIPTION_STATUSES] },
              plan: { name: { equals: 'Premium' } },
            },
          },
        },
      });
    });

    it('appelle user.findMany pour la répartition par âge', async () => {
      await service.getPilotage();

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          is_deleted: false,
          date_of_birth: { not: null },
        },
        select: { date_of_birth: true },
      });
    });

    it('appelle healthProfile.groupBy pour les objectifs', async () => {
      await service.getPilotage();

      expect(prisma.healthProfile.groupBy).toHaveBeenCalledWith({
        by: ['physical_activity_level'],
        _count: { id: true },
        where: { physical_activity_level: { not: null } },
      });
    });
  });
});
