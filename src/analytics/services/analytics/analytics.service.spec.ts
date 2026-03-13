import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: {
    $transaction: jest.Mock;
    user: { count: jest.Mock; findMany: jest.Mock };
    session: { findMany: jest.Mock; groupBy: jest.Mock };
    plan: { findMany: jest.Mock };
    subscription: { findMany: jest.Mock };
    meal: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn((promises: Promise<unknown>[]) =>
        Promise.all(promises),
      ),
      user: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      session: {
        findMany: jest.fn(),
        groupBy: jest.fn(),
      },
      plan: { findMany: jest.fn() },
      subscription: { findMany: jest.fn() },
      meal: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEngagementSummary', () => {
    it('devrait retourner des zéros si aucun utilisateur ou aucune session', async () => {
      prisma.user.count.mockResolvedValue(0);
      prisma.session.findMany.mockResolvedValue([]);
      prisma.session.groupBy.mockResolvedValue([]);
      prisma.$transaction.mockImplementation((promises: Promise<unknown>[]) =>
        Promise.all(promises),
      );

      const result = await service.getEngagementSummary(7);

      expect(result).toEqual({
        days: 7,
        averageDailyActivityMinutesPerUser: 0,
        averageDailyCaloriesBurnedPerUser: 0,
        averageIntensityPercent: 0,
        totalActiveUsers: 0,
      });
    });

    it('devrait calculer le résumé d’engagement avec sessions et intensité', async () => {
      prisma.user.count.mockResolvedValue(100);
      prisma.session.findMany.mockResolvedValue([
        {
          user_id: 1,
          duration_h: 1,
          calories_total: 400,
          avg_bpm: 120,
          max_bpm: 150,
        },
        {
          user_id: 2,
          duration_h: 0.5,
          calories_total: 200,
          avg_bpm: 100,
          max_bpm: 150,
        },
      ]);
      prisma.session.groupBy.mockResolvedValue([
        { user_id: 1 },
        { user_id: 2 },
      ]);
      prisma.$transaction.mockImplementation((promises: Promise<unknown>[]) =>
        Promise.all(promises),
      );

      const result = await service.getEngagementSummary(7);

      expect(result.days).toBe(7);
      expect(result.totalActiveUsers).toBe(2);
      // (1 + 0.5) * 60 / 7 / 2 = 6.42 -> 6 min
      expect(result.averageDailyActivityMinutesPerUser).toBe(6);
      // (400 + 200) / 7 / 2 = 42.85 -> 43 kcal
      expect(result.averageDailyCaloriesBurnedPerUser).toBe(43);
      // intensité pondérée: (120/150)*100*1 + (100/150)*100*0.5 = 80 + 33.33 -> ~73%
      expect(result.averageIntensityPercent).toBeGreaterThanOrEqual(70);
      expect(result.averageIntensityPercent).toBeLessThanOrEqual(80);
    });
  });

  describe('getEngagementTimeseries', () => {
    it('devrait retourner un tableau vide si aucun utilisateur', async () => {
      prisma.user.count.mockResolvedValue(0);
      prisma.session.findMany.mockResolvedValue([]);
      prisma.$transaction.mockImplementation((promises: Promise<unknown>[]) =>
        Promise.all(promises),
      );

      const result = await service.getEngagementTimeseries(7);

      expect(result).toEqual([]);
    });

    it('devrait retourner un point par jour avec durée, calories et % actifs', async () => {
      prisma.user.count.mockResolvedValue(10);
      prisma.session.findMany.mockResolvedValue([
        {
          user_id: 1,
          duration_h: 1,
          calories_total: 300,
          created_at: new Date(),
        },
      ]);
      prisma.$transaction.mockImplementation((promises: Promise<unknown>[]) =>
        Promise.all(promises),
      );

      const result = await service.getEngagementTimeseries(3);

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('totalDurationHours');
      expect(result[0]).toHaveProperty('totalCalories');
      expect(result[0]).toHaveProperty('activeUsersPercent');
      expect(typeof result[0].activeUsersPercent).toBe('number');
    });
  });

  describe('getProgression', () => {
    it('devrait retourner un tableau vide si aucun utilisateur ou session', async () => {
      prisma.user.count.mockResolvedValue(0);
      prisma.session.findMany.mockResolvedValue([]);
      prisma.$transaction.mockImplementation((promises: Promise<unknown>[]) =>
        Promise.all(promises),
      );

      const result = await service.getProgression(4);

      expect(result).toEqual([]);
    });

    it('devrait retourner progression et satisfaction par semaine', async () => {
      prisma.user.count.mockResolvedValue(10);
      prisma.session.findMany.mockResolvedValue([
        {
          user_id: 1,
          calories_total: 2800,
          created_at: new Date('2026-02-10'),
        },
        {
          user_id: 1,
          calories_total: 500,
          created_at: new Date('2026-02-11'),
        },
        {
          user_id: 2,
          calories_total: 1000,
          created_at: new Date('2026-02-10'),
        },
      ]);
      prisma.$transaction.mockImplementation((promises: Promise<unknown>[]) =>
        Promise.all(promises),
      );

      const result = await service.getProgression(2);

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0]).toHaveProperty('week');
      expect(result[0]).toHaveProperty('progressionPercent');
      expect(result[0]).toHaveProperty('satisfactionPercent');
      expect(typeof result[0].progressionPercent).toBe('number');
      expect(typeof result[0].satisfactionPercent).toBe('number');
    });
  });

  describe('getDemographicsConversion', () => {
    it('devrait retourner tranches d’âge et conversion par plan', async () => {
      // 1995 -> âge 30 en 2025 -> tranche 25-34
      const birthDate = new Date('1995-05-15');
      prisma.user.findMany.mockResolvedValue([
        { id: 1, date_of_birth: birthDate, gender: 'Homme' },
        { id: 2, date_of_birth: birthDate, gender: 'Femme' },
        { id: 3, date_of_birth: birthDate, gender: null },
      ]);
      prisma.plan.findMany.mockResolvedValue([
        { id: 1, name: 'Premium' },
        { id: 2, name: 'Standard' },
      ]);
      prisma.subscription.findMany.mockResolvedValue([
        { user_id: 1, plan_id: 1 },
        { user_id: 2, plan_id: 2 },
      ]);
      prisma.$transaction.mockImplementation((promises: Promise<unknown>[]) =>
        Promise.all(promises),
      );

      const result = await service.getDemographicsConversion();

      expect(result.ageBuckets).toBeDefined();
      expect(Array.isArray(result.ageBuckets)).toBe(true);
      const bucket25_34 = result.ageBuckets.find((b) => b.label === '25-34');
      expect(bucket25_34).toBeDefined();
      expect(bucket25_34?.total).toBe(3);
      expect(bucket25_34?.male).toBe(1);
      expect(bucket25_34?.female).toBe(1);
      expect(bucket25_34?.other).toBe(1);

      expect(result.planConversion).toBeDefined();
      expect(result.planConversion).toContainEqual(
        expect.objectContaining({ name: 'Premium', users: 1 }),
      );
      expect(result.planConversion).toContainEqual(
        expect.objectContaining({ name: 'Standard', users: 1 }),
      );
      expect(result.planConversion).toContainEqual(
        expect.objectContaining({ name: 'Sans abonnement', users: 1 }),
      );
    });
  });

  describe('getNutritionTrends', () => {
    it('devrait retourner un tableau vide si aucun repas', async () => {
      prisma.meal.findMany.mockResolvedValue([]);

      const result = await service.getNutritionTrends();

      expect(result).toEqual([]);
    });

    it('devrait classer les utilisateurs en profils (hyper-protéiné, équilibré, hyper-glucidique)', async () => {
      prisma.meal.findMany.mockResolvedValue([
        {
          user_id: 1,
          nutrition: { calories_kcal: 500, protein_g: 30 },
        },
        {
          user_id: 1,
          nutrition: { calories_kcal: 400, protein_g: 28 },
        },
        {
          user_id: 2,
          nutrition: { calories_kcal: 700, protein_g: 15 },
        },
        {
          user_id: 3,
          nutrition: { calories_kcal: 350, protein_g: 12 },
        },
      ]);

      const result = await service.getNutritionTrends();

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.length).toBeLessThanOrEqual(3);
      for (const row of result) {
        expect(row).toHaveProperty('profile');
        expect(row).toHaveProperty('users');
        expect(row).toHaveProperty('avgCalories');
        expect(row).toHaveProperty('avgProtein');
        expect(typeof row.users).toBe('number');
        expect(typeof row.avgCalories).toBe('number');
        expect(typeof row.avgProtein).toBe('number');
      }
      const hyperProteine = result.find((r) => r.profile === 'Hyper-protéiné');
      if (hyperProteine) {
        expect(hyperProteine.users).toBe(1);
        expect(hyperProteine.avgProtein).toBeGreaterThanOrEqual(25);
      }
    });
  });
});
