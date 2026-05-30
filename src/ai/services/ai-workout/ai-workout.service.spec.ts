import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { SERVICES } from 'src/utils/constants';
import { AiWorkoutService } from './ai-workout.service';
import { MetricsService } from 'src/metrics/metrics.service';

describe('AiWorkoutService', () => {
  let service: AiWorkoutService;
  let prisma: {
    user: { findUnique: jest.Mock };
    aiWorkoutRecommendation: {
      updateMany: jest.Mock;
      create: jest.Mock;
    };
  };
  let workoutClient: { generateProgram: jest.Mock };

  const microserviceProgram = {
    programId: '665a1b2c3d4e5f6789012345',
    userId: 1,
    statut: 'ACTIVE',
    programme: [],
    generatedAt: '2026-05-16T12:00:00.000Z',
  };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      aiWorkoutRecommendation: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn().mockResolvedValue({
          id: 10,
          user_id: 1,
          microservice_ref_id: microserviceProgram.programId,
          statut: 'ACTIVE',
        }),
      },
    };

    workoutClient = {
      generateProgram: jest.fn().mockResolvedValue(microserviceProgram),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiWorkoutService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: SERVICES.WORKOUT_MICROSERVICE_CLIENT,
          useValue: workoutClient,
        },
        {
          provide: MetricsService,
          useValue: {
            observerDureeETL: jest.fn(),
            enregistrerRequeteHttp: jest.fn(),
            enregistrerAppelIA: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AiWorkoutService);
  });

  it('génère un programme et persiste la recommandation', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      aiPreferences: {
        objectif_ia: 'renforcement',
        contraintes_materielles: ['tapis'],
        regime: 'vegetarien',
        allergies: ['lactose'],
      },
      healthProfile: { physical_activity_level: 'modere' },
    });

    const result = await service.generateForUser(1);

    expect(workoutClient.generateProgram).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        objectif: 'renforcement',
        niveau: 'intermediaire',
        materiel: ['tapis'],
        limitations: ['lactose'],
      }),
    );
    expect(prisma.aiWorkoutRecommendation.updateMany).toHaveBeenCalled();
    expect(prisma.aiWorkoutRecommendation.create).toHaveBeenCalledWith({
      data: {
        user_id: 1,
        microservice_ref_id: microserviceProgram.programId,
        statut: 'ACTIVE',
      },
    });
    expect(result.recommendationId).toBe(10);
    expect(result.program).toEqual(microserviceProgram);
  });

  it('rejette si les préférences IA sont absentes', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      aiPreferences: null,
      healthProfile: null,
    });

    await expect(service.generateForUser(1)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejette si l utilisateur est introuvable', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.generateForUser(1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
