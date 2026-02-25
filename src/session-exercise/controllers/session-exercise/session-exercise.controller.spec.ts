/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { SessionExerciseController } from './session-exercise.controller';
import { SessionExerciseService } from 'src/session-exercise/services/session-exercise/session-exercise.service';
import { SERVICES } from 'src/utils/constants';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

describe('ExerciseLogController', () => {
  let controller: SessionExerciseController;
  let service: SessionExerciseService;

  const mockExerciseLog: any = {
    id: 1,
    exercise_id: 1,
    session_id: 1,
    exercise: { id: 1, name: 'Running' },
    session: { id: 1, user_id: 1, calories_total: 500 },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionExerciseController],
      providers: [
        {
          provide: SERVICES.SESSION_EXERCISE,
          useValue: {
            getSessionExercises: jest.fn(),
            getSessionExerciseById: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SessionExerciseController>(
      SessionExerciseController,
    );
    service = module.get<SessionExerciseService>(SERVICES.SESSION_EXERCISE);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSessionExercises', () => {
    it('should return an array of exercise logs', async () => {
      const mockLogs = [mockExerciseLog];
      jest.spyOn(service, 'getSessionExercises').mockResolvedValue(mockLogs);

      const result = await controller.getSessionExercises();

      expect(result).toEqual(mockLogs);
      expect(service.getSessionExercises).toHaveBeenCalled();
    });
  });

  describe('getSessionExerciseById', () => {
    it('should return an exercise log by id when it belongs to the user', async () => {
      jest
        .spyOn(service, 'getSessionExerciseById')
        .mockResolvedValue(mockExerciseLog);

      const req = { user: { sub: 1 } } as any;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result = await controller.getSessionExerciseById(req, 1, 1);

      expect(result).toEqual(mockExerciseLog);
      expect(service.getSessionExerciseById).toHaveBeenCalledWith(1, 1, 1);
    });
  });
});
