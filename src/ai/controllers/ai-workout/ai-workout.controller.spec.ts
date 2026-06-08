import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';
import { SERVICES } from 'src/utils/constants';
import { AiWorkoutController } from './ai-workout.controller';

describe('AiWorkoutController', () => {
  let controller: AiWorkoutController;
  let aiWorkoutService: { generateForUser: jest.Mock };

  beforeEach(async () => {
    aiWorkoutService = {
      generateForUser: jest.fn().mockResolvedValue({
        recommendationId: 1,
        microserviceRefId: 'abc',
        statut: 'ACTIVE',
        program: {},
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiWorkoutController],
      providers: [
        {
          provide: SERVICES.AI_WORKOUT,
          useValue: aiWorkoutService,
        },
      ],
    }).compile();

    controller = module.get(AiWorkoutController);
  });

  it('délègue la génération au service', async () => {
    const req = { user: { sub: 42 } } as Request;

    await controller.generate(req);

    expect(aiWorkoutService.generateForUser).toHaveBeenCalledWith(42);
  });
});
