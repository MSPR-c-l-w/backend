import { Test, TestingModule } from '@nestjs/testing';
import { Exercise_LogController } from './exercise-log.controller';
import { Exercise_LogService } from 'src/exercise-log/services/exercise-log/exercise-log.service';
import { SERVICES } from 'src/utils/constants';

describe('ExerciseLogController', () => {
  let controller: Exercise_LogController;
  let service: Exercise_LogService;

  const mockExerciseLog: any = {
    id: 1,
    exercise_id: 1,
    session_id: 1,
    exercise: { id: 1, name: 'Running' },
    session: { id: 1, user_id: 1, calories_total: 500 } 
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Exercise_LogController],
      providers: [
        {
          provide: SERVICES.EXERCISE_LOG,
          useValue: {
            getExerciseLogs: jest.fn(),
            getExerciseLogById: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<Exercise_LogController>(Exercise_LogController);
    service = module.get<Exercise_LogService>(SERVICES.EXERCISE_LOG);
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

      const result = await controller.getExerciseLogById(1);

      expect(result).toEqual(mockExerciseLog);
      expect(service.getExerciseLogById).toHaveBeenCalledWith(1);
    });
  });
});