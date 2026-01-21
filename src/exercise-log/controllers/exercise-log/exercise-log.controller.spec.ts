import { Test, TestingModule } from '@nestjs/testing';
import { ExerciseLogController } from './exercise-log.controller';

describe('ExerciseLogController', () => {
  let controller: ExerciseLogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExerciseLogController],
    }).compile();

    controller = module.get<ExerciseLogController>(ExerciseLogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
