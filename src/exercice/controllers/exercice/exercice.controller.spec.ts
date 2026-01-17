import { Test, TestingModule } from '@nestjs/testing';
import { ExerciceController } from './exercice.controller';

describe('ExerciceController', () => {
  let controller: ExerciceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExerciceController],
    }).compile();

    controller = module.get<ExerciceController>(ExerciceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
