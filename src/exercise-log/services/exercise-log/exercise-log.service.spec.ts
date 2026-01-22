import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ExerciseLogService } from './exercise-log.service';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { ExerciseLog } from '@prisma/client';

describe('ExerciseLogService', () => {
  let service: ExerciseLogService;
  let prisma: PrismaService;

  const mockExerciseLog: ExerciseLog = {
    id: 1,
    user_id: 1,
    exercise_id: 1,
    session_duration_h: 1.5,
    calories_burned: 200,
    max_bpm: 150,
    avg_bpm: 120,
    resting_bpm: 60,
    created_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExerciseLogService,
        {
          provide: PrismaService,
          useValue: {
            exerciseLog: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ExerciseLogService>(ExerciseLogService);
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

    it('should throw NotFoundException when no logs found', async () => {
      jest.spyOn(prisma.exerciseLog, 'findMany').mockResolvedValue([]);

      await expect(service.getExerciseLogs()).rejects.toThrow(NotFoundException);
    });
  });

  describe('getExerciseLogById', () => {
    it('should return an exercise log by id', async () => {
      jest.spyOn(prisma.exerciseLog, 'findUnique').mockResolvedValue(mockExerciseLog);

      const result = await service.getExerciseLogById('1');

      expect(result).toEqual(mockExerciseLog);
      expect(prisma.exerciseLog.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException when log not found', async () => {
      jest.spyOn(prisma.exerciseLog, 'findUnique').mockResolvedValue(null);

      await expect(service.getExerciseLogById('1')).rejects.toThrow(NotFoundException);
    });
  });
});
