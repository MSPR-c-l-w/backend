import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SessionExerciseService } from './session-exercise.service';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { HttpService } from '@nestjs/axios';

describe('ExerciseLogService', () => {
  let service: SessionExerciseService;
  type ExerciseLogRecord = {
    id: number;
    exercise_id: number;
    session_id: number;
    exercise: { id: number; name: string };
    session: { id: number; user_id: number; calories_total: number };
  };
  type PrismaMock = {
    sessionExercise: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      groupBy: jest.Mock;
      deleteMany: jest.Mock;
      create: jest.Mock;
    };
    session: {
      deleteMany: jest.Mock;
      create: jest.Mock;
    };
    user: {
      upsert: jest.Mock;
    };
    exercise: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
    };
  };
  let prisma: PrismaMock;

  // On retire les champs migrés (user_id, calories, bpm)
  const mockExerciseLog: ExerciseLogRecord = {
    id: 1,
    exercise_id: 1,
    session_id: 1,
    exercise: { id: 1, name: 'Running' },
    session: { id: 1, user_id: 1, calories_total: 500 },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionExerciseService,
        {
          provide: HttpService,
          useValue: { get: jest.fn() }, // Nécessaire car injecté dans ton service
        },
        {
          provide: PrismaService,
          useValue: {
            sessionExercise: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              groupBy: jest.fn(),
              deleteMany: jest.fn(),
              create: jest.fn(),
            },
            session: {
              deleteMany: jest.fn(),
              create: jest.fn(),
            },
            user: {
              upsert: jest.fn(),
            },
            exercise: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
          } as PrismaMock,
        },
      ],
    }).compile();

    service = module.get<SessionExerciseService>(SessionExerciseService);
    prisma = module.get<PrismaMock>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSessionExercises', () => {
    it('should return an array of exercise logs', async () => {
      const mockLogs = [mockExerciseLog];
      prisma.sessionExercise.findMany.mockResolvedValue(mockLogs);

      await expect(service.getSessionExercises()).resolves.toEqual(mockLogs);
      expect(prisma.sessionExercise.findMany).toHaveBeenCalled();
    });
  });

  describe('getSessionExerciseById', () => {
    it('should return an exercise log by id when it belongs to the user', async () => {
      prisma.sessionExercise.findFirst.mockResolvedValue(mockExerciseLog);
      await expect(service.getSessionExerciseById(1, 1, 1)).resolves.toEqual(
        mockExerciseLog,
      );
      expect(prisma.sessionExercise.findFirst).toHaveBeenCalledWith({
        where: {
          session_id: 1,
          exercise_id: 1,
          session: { user_id: 1 },
        },
        include: { exercise: true, session: true },
      });
    });

    it('should throw NotFoundException when log not found', async () => {
      prisma.sessionExercise.findFirst.mockResolvedValue(null);

      await expect(service.getSessionExerciseById(1, 1, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
