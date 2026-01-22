import { Test, TestingModule } from '@nestjs/testing';
import { ExerciseLogController } from './exercise-log.controller';
import { ExerciseLogService } from 'src/exercise-log/services/exercise-log/exercise-log.service';
import { SERVICES } from 'src/utils/constants';
import { ExerciseLog } from '@prisma/client';

describe('ExerciseLogController', () => {
  let controller: ExerciseLogController;
  let service: ExerciseLogService;

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
      controllers: [ExerciseLogController],
      providers: [
        {
          provide: SERVICES.EXERCISELOG,
          useValue: {
            getExerciseLogs: jest.fn(),
            getExerciseLogById: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ExerciseLogController>(ExerciseLogController);
    service = module.get<ExerciseLogService>(SERVICES.EXERCISELOG);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getExerciseLogs', () => {
    it('should return an array of exercise logs', async () => {
      const mockLogs = [mockExerciseLog];
      jest.spyOn(service, 'getExerciseLogs').mockResolvedValue(mockLogs);

      const result = await controller.getExerciseLogs();

      expect(result).toEqual(mockLogs);
      expect(service.getExerciseLogs).toHaveBeenCalled();
    });
  });

  describe('getExerciseLogById', () => {
    it('should return an exercise log by id', async () => {
      jest.spyOn(service, 'getExerciseLogById').mockResolvedValue(mockExerciseLog);

      const result = await controller.getExerciseLogById('1');

      expect(result).toEqual(mockExerciseLog);
      expect(service.getExerciseLogById).toHaveBeenCalledWith('1');
    });
  });
});
