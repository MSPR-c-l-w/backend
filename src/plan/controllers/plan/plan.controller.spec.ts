import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PlanController } from './plan.controller';
import { SERVICES } from 'src/utils/constants';
import { Plan } from '@prisma/client';

describe('PlanController', () => {
  let controller: PlanController;
  const planServiceMock = {
    getPlans: jest.fn(),
    getPlanById: jest.fn(),
  };

  const mockPlan: Plan = {
    id: 1,
    name: 'Freemium',
    price: 0,
    features: JSON.parse('[]'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlanController],
      providers: [
        {
          provide: SERVICES.PLAN,
          useValue: planServiceMock,
        },
      ],
    }).compile();

    controller = module.get<PlanController>(PlanController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPlans', () => {
    it('devrait retourner la liste des plans', async () => {
      const plans = [mockPlan, { ...mockPlan, id: 2, name: 'Premium' }];
      planServiceMock.getPlans.mockResolvedValue(plans);

      const result = await controller.getPlans();

      expect(result).toEqual(plans);
      expect(planServiceMock.getPlans).toHaveBeenCalledTimes(1);
      expect(planServiceMock.getPlans).toHaveBeenCalledWith();
    });

    it('devrait appeler le service avec les bons paramètres', async () => {
      planServiceMock.getPlans.mockResolvedValue([mockPlan]);

      await controller.getPlans();

      expect(planServiceMock.getPlans).toHaveBeenCalled();
    });

    it('devrait propager NotFoundException du service', async () => {
      planServiceMock.getPlans.mockRejectedValue(
        new NotFoundException('NO_PLANS_FOUND'),
      );

      await expect(controller.getPlans()).rejects.toBeInstanceOf(NotFoundException);
      expect(planServiceMock.getPlans).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPlanById', () => {
    it('devrait retourner un plan par son id', async () => {
      planServiceMock.getPlanById.mockResolvedValue(mockPlan);

      const result = await controller.getPlanById('1');

      expect(result).toEqual(mockPlan);
      expect(planServiceMock.getPlanById).toHaveBeenCalledTimes(1);
      expect(planServiceMock.getPlanById).toHaveBeenCalledWith('1');
    });

    it('devrait appeler le service avec le bon id', async () => {
      planServiceMock.getPlanById.mockResolvedValue(mockPlan);

      await controller.getPlanById('42');

      expect(planServiceMock.getPlanById).toHaveBeenCalledWith('42');
    });

    it('devrait propager les erreurs du service', async () => {
      const error = new NotFoundException('Plan with id 999 not found');
      planServiceMock.getPlanById.mockRejectedValue(error);

      await expect(controller.getPlanById('999')).rejects.toThrow(error);
      expect(planServiceMock.getPlanById).toHaveBeenCalledWith('999');
    });

    it('devrait gérer différents formats d\'id', async () => {
      planServiceMock.getPlanById.mockResolvedValue(mockPlan);

      await controller.getPlanById('123');
      expect(planServiceMock.getPlanById).toHaveBeenCalledWith('123');
    });
  });
});
