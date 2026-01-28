import { Test, TestingModule } from '@nestjs/testing';
import { Workout_SessionService } from './workout-session.service';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('Workout_SessionService', () => {
  let service: Workout_SessionService;
  let prisma: PrismaService;

  const mockWorkoutSession = {
    id: 1,
    user_id: 1,
    duration_h: 1.5,
    calories_total: 600,
    avg_bpm: 120,
    max_bpm: 160,
    created_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Workout_SessionService,
        {
          provide: PrismaService,
          useValue: {
            workoutSession: {
              aggregate: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<Workout_SessionService>(Workout_SessionService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserSummary', () => {
    it('should return aggregated stats correctly', async () => {
      const mockAggregateResponse = {
        _sum: { calories_total: 1000, duration_h: 2.5 },
        _avg: { avg_bpm: 110 },
        _count: { id: 2 },
      };

      jest.spyOn(prisma.workoutSession, 'aggregate').mockResolvedValue(mockAggregateResponse as any);

      const result = await service.getUserSummary(1);

      expect(result).toEqual({
        total_calories: 1000,
        total_hours: 2.5,
        average_bpm: 110,
        total_sessions: 2,
      });
    });
  });

  // --- Tests mis à jour avec tes nouveaux noms de méthodes ---

  describe('getWorkoutSessions', () => {
    it('should return an array of sessions', async () => {
      const mockSessions = [mockWorkoutSession];
      jest.spyOn(prisma.workoutSession, 'findMany').mockResolvedValue(mockSessions as any);

      const result = await service.getWorkoutSessions(1);

      expect(result).toEqual(mockSessions);
      expect(prisma.workoutSession.findMany).toHaveBeenCalled();
    });
  });

  describe('getWorkoutSessionById', () => {
    it('should return a session when found', async () => {
      jest.spyOn(prisma.workoutSession, 'findUnique').mockResolvedValue(mockWorkoutSession as any);

      const result = await service.getWorkoutSessionById(1);
      expect(result).toEqual(mockWorkoutSession);
    });

    it('should throw NotFoundException when session does not exist', async () => {
      jest.spyOn(prisma.workoutSession, 'findUnique').mockResolvedValue(null);

      await expect(service.getWorkoutSessionById(999)).rejects.toThrow(NotFoundException);
    });
  });
});