import { Test, TestingModule } from '@nestjs/testing';
import { ExerciseLogService } from './exercise-log.service';

describe('ExerciseLogService', () => {
  let service: ExerciseLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExerciseLogService],
    }).compile();

    service = module.get<ExerciseLogService>(ExerciseLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
