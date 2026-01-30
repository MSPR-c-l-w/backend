import { Test, TestingModule } from '@nestjs/testing';
import { HealthProfileService } from './health-profile.service';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('HealthProfileService', () => {
  let service: HealthProfileService;
  const prismaMock = {
    healthProfile: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthProfileService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<HealthProfileService>(HealthProfileService);
    jest.clearAllMocks();
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
});
