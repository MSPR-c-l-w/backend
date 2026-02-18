import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Exercise_LogService } from './exercise-log.service';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { HttpService } from '@nestjs/axios';

describe('ExerciseLogService', () => {
  let service: Exercise_LogService;
  type ExerciseLogRecord = {
    id: number;
    exercise_id: number;
    session_id: number;
    exercise: { id: number; name: string };
    session: { id: number; user_id: number; calories_total: number };
  };
  type PrismaMock = {
    exerciseLog: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      groupBy: jest.Mock;
      deleteMany: jest.Mock;
      create: jest.Mock;
    };
    workoutSession: {
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
        Exercise_LogService,
        {
          provide: HttpService,
          useValue: { get: jest.fn() }, // Nécessaire car injecté dans ton service
        },
        {
          provide: PrismaService,
          useValue: {
            exerciseLog: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              groupBy: jest.fn(),
              deleteMany: jest.fn(),
              create: jest.fn(),
            },
            workoutSession: {
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

    service = module.get<Exercise_LogService>(Exercise_LogService);
    prisma = module.get<PrismaMock>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getExerciseLogs', () => {
    it('should return an array of exercise logs', async () => {
      const mockLogs = [mockExerciseLog];
      prisma.exerciseLog.findMany.mockResolvedValue(mockLogs);

      await expect(service.getExerciseLogs()).resolves.toEqual(mockLogs);
      expect(prisma.exerciseLog.findMany).toHaveBeenCalled();
    });
  });

  describe('getExerciseLogById', () => {
    it('should return an exercise log by id', async () => {
      prisma.exerciseLog.findUnique.mockResolvedValue(mockExerciseLog);
      await expect(service.getExerciseLogById(1)).resolves.toEqual(
        mockExerciseLog,
      );
      expect(prisma.exerciseLog.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { exercise: true, session: true },
      });
    });

    it('should throw NotFoundException when log not found', async () => {
      prisma.exerciseLog.findUnique.mockResolvedValue(null);

      await expect(service.getExerciseLogById(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
