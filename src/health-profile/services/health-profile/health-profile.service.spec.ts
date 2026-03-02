import { Test, TestingModule } from '@nestjs/testing';
import { HealthProfileService } from './health-profile.service';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { EtlLogService } from 'src/etl-log/etl-log.service';

describe('HealthProfileService', () => {
  let service: HealthProfileService;
  const prismaMock = {
    healthProfile: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    healthProfileStaging: {
      create: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    $executeRaw: jest.fn(),
  };

  const httpServiceMock = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthProfileService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: HttpService,
          useValue: httpServiceMock,
        },
        {
          provide: EtlLogService,
          useValue: { emit: jest.fn(), getStream: jest.fn(() => ({ subscribe: () => {} })) },
        },
      ],
    }).compile();

    service = module.get<HealthProfileService>(HealthProfileService);
    jest.clearAllMocks();

    // Mock des variables d'environnement
    process.env.KAGGLE_USER = 'test_user';
    process.env.KAGGLE_KEY = 'test_key';
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHealthProfiles', () => {
    it('returns health profiles when found', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const healthProfiles = [{ id: 1 }, { id: 2 }] as any;
      prismaMock.healthProfile.findMany.mockResolvedValue(healthProfiles);

      await expect(service.getHealthProfiles()).resolves.toEqual(
        healthProfiles,
      );
      expect(prismaMock.healthProfile.findMany).toHaveBeenCalledTimes(1);
    });

    it('throws NotFoundException when none found', async () => {
      prismaMock.healthProfile.findMany.mockResolvedValue([]);

      await expect(service.getHealthProfiles()).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('getHealthProfile', () => {
    it('returns health profile when found and parses id', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const healthProfile = { id: 42 } as any;
      prismaMock.healthProfile.findUnique.mockResolvedValue(healthProfile);

      await expect(service.getHealthProfile('42')).resolves.toEqual(
        healthProfile,
      );
      expect(prismaMock.healthProfile.findUnique).toHaveBeenCalledWith({
        where: { id: 42 },
      });
    });

    it('throws when not found', async () => {
      prismaMock.healthProfile.findUnique.mockResolvedValue(null);

      await expect(service.getHealthProfile('42')).rejects.toBeInstanceOf(
        Error,
      );
    });
  });

  describe('runHealthProfilePipeline', () => {
    const mockCsvData = `Patient_ID,Age,Gender,Weight_kg,Height_cm,BMI,Disease_Type,Severity,Physical_Activity_Level,Daily_Caloric_Intake
P0001,56,Male,58.4,160,22.8,None,Mild,Moderate,2000
P0002,45,Female,75.2,165,27.6,Obesity,Moderate,Sedentary,1800`;

    it('should successfully import health profiles from CSV', async () => {
      // Mock HttpService.get() pour retourner le CSV
      httpServiceMock.get.mockReturnValue(of({ data: mockCsvData }));

      // Mock Prisma users (seeded)
      prismaMock.user.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      // Mock Prisma healthProfileStaging.create
      prismaMock.healthProfileStaging.create
        .mockResolvedValueOnce({ id: 'uuid-1' })
        .mockResolvedValueOnce({ id: 'uuid-2' });

      // Exécuter le pipeline
      const result = await service.runHealthProfilePipeline();

      // Vérifications
      expect(result).toBe(2); // 2 lignes dans le CSV mock
      expect(prismaMock.user.findMany).toHaveBeenCalledTimes(1);
      expect(prismaMock.healthProfileStaging.create).toHaveBeenCalledTimes(2);
      expect(prismaMock.healthProfileStaging.create).toHaveBeenNthCalledWith(
        1,
        {
          data: {
            cleaned_data: {
              user_id: 1,
              weight: 58.4,
              bmi: 22.8,
              physical_activity_level: 'Moderate',
              daily_calories_target: 2000,
            },
            anomalies: [],
          },
        },
      );
      expect(httpServiceMock.get).toHaveBeenCalled();
    });

    it('should handle empty CSV gracefully', async () => {
      httpServiceMock.get.mockReturnValue(
        of({ data: 'Patient_ID,Age\n' }), // Header seulement
      );
      prismaMock.user.findMany.mockResolvedValue([{ id: 1 }]);

      const result = await service.runHealthProfilePipeline();

      expect(result).toBe(0); // Aucune ligne de données
      expect(prismaMock.healthProfileStaging.create).not.toHaveBeenCalled();
    });

    it('should throw error when HTTP request fails', async () => {
      httpServiceMock.get.mockImplementation(() => {
        throw new Error('Network error');
      });

      prismaMock.user.findMany.mockResolvedValue([{ id: 1 }]);

      await expect(service.runHealthProfilePipeline()).rejects.toThrow(
        'Network error',
      );
    });

    it('should map CSV columns correctly to HealthProfile staging', async () => {
      const csvWithAllFields = `Patient_ID,Age,Gender,Weight_kg,Height_cm,BMI,Disease_Type,Severity,Physical_Activity_Level,Daily_Caloric_Intake
P0001,56,Male,58.4,160,22.8,Diabetes,Severe,Active,2500`;

      httpServiceMock.get.mockReturnValue(of({ data: csvWithAllFields }));
      prismaMock.user.findMany.mockResolvedValue([{ id: 1 }]);
      prismaMock.healthProfileStaging.create.mockResolvedValue({
        id: 'uuid-1',
      });

      await service.runHealthProfilePipeline();

      expect(prismaMock.healthProfileStaging.create).toHaveBeenCalledWith({
        data: {
          cleaned_data: {
            user_id: 1,
            weight: 58.4,
            bmi: 22.8,
            physical_activity_level: 'Active',
            daily_calories_target: 2500,
          },
          anomalies: [],
        },
      });
    });

    it('should handle missing CSV columns with null values', async () => {
      const csvWithMissingFields = `Patient_ID,Age,Gender,BMI
P0001,56,Male,22.8`;

      httpServiceMock.get.mockReturnValue(of({ data: csvWithMissingFields }));
      prismaMock.user.findMany.mockResolvedValue([{ id: 1 }]);
      prismaMock.healthProfileStaging.create.mockResolvedValue({
        id: 'uuid-1',
      });

      await service.runHealthProfilePipeline();

      expect(prismaMock.healthProfileStaging.create).toHaveBeenCalledWith({
        data: {
          cleaned_data: {
            user_id: 1,
            weight: null,
            bmi: 22.8,
            physical_activity_level: null,
            daily_calories_target: null,
          },
          anomalies: [],
        },
      });
    });
  });
});
