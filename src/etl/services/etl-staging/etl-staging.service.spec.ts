/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { EtlStagingService } from './etl-staging.service';
import { EtlAnomalyDetectorService } from '../etl-anomaly-detector/etl-anomaly-detector.service';

describe('EtlStagingService', () => {
  let service: EtlStagingService;
  let prisma: any;
  let anomalyDetector: { detectForPipeline: jest.Mock };

  const now = new Date('2026-01-01T00:00:00.000Z');

  beforeEach(() => {
    prisma = {
      nutritionStaging: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
      exerciseStaging: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
      healthProfileStaging: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
      nutrition: { upsert: jest.fn() },
      exercise: { upsert: jest.fn() },
      healthProfile: { upsert: jest.fn() },
    };
    anomalyDetector = {
      detectForPipeline: jest.fn(() => []),
    };
    service = new EtlStagingService(
      prisma as unknown as PrismaService,
      anomalyDetector as unknown as EtlAnomalyDetectorService,
    );
  });

  it('should list pending rows without anomalies for nutrition', async () => {
    prisma.nutritionStaging.findMany.mockResolvedValue([
      {
        id: 'n1',
        cleaned_data: { name: 'Pomme', category: 'Fruit' },
        anomalies: [],
        status: 'PENDING',
        created_at: now,
        updated_at: now,
      },
    ]);

    const result = await service.findPendingWithoutAnomalies('nutrition');

    expect(prisma.nutritionStaging.findMany).toHaveBeenCalledWith({
      where: {
        status: 'PENDING',
        anomalies: { equals: [] },
      },
      orderBy: { created_at: 'asc' },
    });
    expect(result.total).toBe(1);
    expect(result.items[0].id).toBe('n1');
  });

  it('should list pending rows with anomalies for exercise and filter by search', async () => {
    prisma.exerciseStaging.findMany.mockResolvedValue([
      {
        id: 'e1',
        cleaned_data: { name: 'Squat' },
        anomalies: [{ code: 'X' }],
        status: 'PENDING',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'e2',
        cleaned_data: { name: 'Bench Press' },
        anomalies: [{ code: 'Y' }],
        status: 'PENDING',
        created_at: now,
        updated_at: now,
      },
    ]);

    const result = await service.findPendingWithAnomalies(
      'exercise',
      'bench',
      1,
      20,
    );

    expect(prisma.exerciseStaging.findMany).toHaveBeenCalledWith({
      where: {
        status: 'PENDING',
        NOT: { anomalies: { equals: [] } },
      },
      orderBy: { created_at: 'asc' },
    });
    expect(result.total).toBe(1);
    expect(result.items[0].id).toBe('e2');
  });

  it('should return 0 when updateStatus receives empty ids', async () => {
    await expect(
      service.updateStatus('nutrition', [], 'APPROVED'),
    ).resolves.toBe(0);
  });

  it('should reject rows for health-profile', async () => {
    prisma.healthProfileStaging.updateMany.mockResolvedValue({ count: 2 });

    const updated = await service.updateStatus(
      'health-profile',
      ['h1', 'h2'],
      'REJECTED',
    );

    expect(updated).toBe(2);
    expect(prisma.healthProfileStaging.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['h1', 'h2'] } },
      data: { status: 'REJECTED' },
    });
  });

  it('should parse JSON, recheck anomalies and update nutrition staging row', async () => {
    anomalyDetector.detectForPipeline.mockReturnValueOnce([{ code: 'A' }]);
    prisma.nutritionStaging.update.mockResolvedValue({
      id: 'n1',
      cleaned_data: { name: 'Pomme' },
      anomalies: [{ code: 'A' }],
      status: 'PENDING',
      created_at: now,
      updated_at: now,
    });

    const result = await service.updateCleanedDataAndRecheck(
      'nutrition',
      'n1',
      '{"name":"Pomme"}',
    );

    expect(anomalyDetector.detectForPipeline).toHaveBeenCalledWith(
      'nutrition',
      { name: 'Pomme' },
    );
    expect(prisma.nutritionStaging.update).toHaveBeenCalled();
    expect(result.id).toBe('n1');
  });

  it('should throw when cleaned_data JSON is invalid', async () => {
    await expect(
      service.updateCleanedDataAndRecheck('exercise', 'e1', '{"bad-json":'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw when cleaned_data is not an object', async () => {
    await expect(
      service.updateCleanedDataAndRecheck('exercise', 'e1', '[]'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should approve nutrition rows and upsert final data when clean', async () => {
    prisma.nutritionStaging.findMany.mockResolvedValue([
      {
        id: 'n-ok',
        cleaned_data: {
          name: 'Pomme',
          category: 'Fruit',
          calories_kcal: 52,
          protein_g: 1,
          carbohydrates_g: 1,
          fat_g: 1,
          fiber_g: 1,
          sugar_g: 1,
          sodium_mg: 1,
          cholesterol_mg: 1,
          meal_type_name: 'Snack',
          water_intake_ml: 100,
          picture_url: null,
        },
        anomalies: [],
        status: 'PENDING',
        created_at: now,
        updated_at: now,
      },
    ]);
    anomalyDetector.detectForPipeline.mockReturnValue([]);
    prisma.nutritionStaging.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.updateStatus(
      'nutrition',
      ['n-ok'],
      'APPROVED',
    );

    expect(prisma.nutrition.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.nutritionStaging.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['n-ok'] } },
      data: { status: 'APPROVED' },
    });
    expect(result).toBe(1);
  });

  it('should keep nutrition row pending when anomalies are found at approval time', async () => {
    prisma.nutritionStaging.findMany.mockResolvedValue([
      {
        id: 'n-ko',
        cleaned_data: { name: 'Pomme', category: 'Fruit' },
        anomalies: [],
        status: 'PENDING',
        created_at: now,
        updated_at: now,
      },
    ]);
    anomalyDetector.detectForPipeline.mockReturnValue([{ code: 'BROKEN' }]);

    const result = await service.updateStatus(
      'nutrition',
      ['n-ko'],
      'APPROVED',
    );

    expect(prisma.nutritionStaging.update).toHaveBeenCalledWith({
      where: { id: 'n-ko' },
      data: {
        anomalies: [{ code: 'BROKEN' }],
        status: 'PENDING',
      },
    });
    expect(prisma.nutrition.upsert).not.toHaveBeenCalled();
    expect(result).toBe(0);
  });

  it('should approve exercise rows when clean', async () => {
    prisma.exerciseStaging.findMany.mockResolvedValue([
      {
        id: 'e-ok',
        cleaned_data: {
          name: 'Squat',
          primary_muscles: [],
          secondary_muscles: [],
          level: null,
          mechanic: null,
          equipment: null,
          category: null,
          instructions: [],
          image_urls: [],
          exercise_type: null,
        },
        anomalies: [],
        status: 'PENDING',
        created_at: now,
        updated_at: now,
      },
    ]);
    anomalyDetector.detectForPipeline.mockReturnValue([]);
    prisma.exerciseStaging.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.updateStatus('exercise', ['e-ok'], 'APPROVED');

    expect(prisma.exercise.upsert).toHaveBeenCalledTimes(1);
    expect(result).toBe(1);
  });

  it('should skip exercise upsert when name is missing', async () => {
    prisma.exerciseStaging.findMany.mockResolvedValue([
      {
        id: 'e-missing-name',
        cleaned_data: { instructions: [] },
        anomalies: [],
        status: 'PENDING',
        created_at: now,
        updated_at: now,
      },
    ]);
    anomalyDetector.detectForPipeline.mockReturnValue([]);

    const result = await service.updateStatus(
      'exercise',
      ['e-missing-name'],
      'APPROVED',
    );

    expect(prisma.exercise.upsert).not.toHaveBeenCalled();
    expect(result).toBe(0);
  });

  it('should approve health-profile rows when clean', async () => {
    prisma.healthProfileStaging.findMany.mockResolvedValue([
      {
        id: 'h-ok',
        cleaned_data: {
          user_id: 12,
          weight: 70,
          bmi: 22,
          physical_activity_level: 'ACTIVE',
          daily_calories_target: 2200,
        },
        anomalies: [],
        status: 'PENDING',
        created_at: now,
        updated_at: now,
      },
    ]);
    anomalyDetector.detectForPipeline.mockReturnValue([]);
    prisma.healthProfileStaging.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.updateStatus(
      'health-profile',
      ['h-ok'],
      'APPROVED',
    );

    expect(prisma.healthProfile.upsert).toHaveBeenCalledTimes(1);
    expect(result).toBe(1);
  });
});
