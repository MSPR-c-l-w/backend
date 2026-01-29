import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Exercise_LogService } from './exercise-log.service';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { HttpService } from '@nestjs/axios';

describe('ExerciseLogService', () => {
  let service: Exercise_LogService;
  let prisma: PrismaService;

  // On retire les champs migrés (user_id, calories, bpm)
  const mockExerciseLog: any = {
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
          },
        },
      ],
    }).compile();

    service = module.get<Exercise_LogService>(Exercise_LogService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getExerciseLogs', () => {
    it('should return an array of exercise logs', async () => {
      const mockLogs = [mockExerciseLog];
      jest.spyOn(prisma.exerciseLog, 'findMany').mockResolvedValue(mockLogs);

      const result = await service.getExerciseLogs();

      expect(result).toEqual(mockLogs);
      expect(prisma.exerciseLog.findMany).toHaveBeenCalled();
    });
  });

  describe('getExerciseLogById', () => {
    it('should return an exercise log by id', async () => {
      jest
        .spyOn(prisma.exerciseLog, 'findUnique')
        .mockResolvedValue(mockExerciseLog);

      // On passe un number (1) et non une string ('1')
      const result = await service.getExerciseLogById(1);

      expect(result).toEqual(mockExerciseLog);
      expect(prisma.exerciseLog.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { exercise: true, session: true }, // Ton service fait maintenant cet include
      });
    });

    it('should throw NotFoundException when log not found', async () => {
      jest.spyOn(prisma.exerciseLog, 'findUnique').mockResolvedValue(null);

      await expect(service.getExerciseLogById(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
