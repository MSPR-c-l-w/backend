import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PlanService } from './plan.service';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { Plan } from '@prisma/client';

describe('PlanService', () => {
  let service: PlanService;
  let prisma: {
    plan: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
    };
  };

  const mockPlan: Plan = {
    id: 1,
    name: 'Freemium',
    price: 0,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    features: JSON.parse('[]'),
  };

  beforeEach(async () => {
    prisma = {
      plan: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<PlanService>(PlanService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPlans', () => {
    it('devrait retourner la liste des plans', async () => {
      const plans = [mockPlan, { ...mockPlan, id: 2, name: 'Premium' }];
      prisma.plan.findMany.mockResolvedValue(plans);

      const result = await service.getPlans();

      expect(result).toEqual(plans);
      expect(prisma.plan.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.plan.findMany).toHaveBeenCalledWith();
    });

    it('devrait lancer NotFoundException si aucun plan trouvé', async () => {
      prisma.plan.findMany.mockResolvedValue([]);

      await expect(service.getPlans()).rejects.toBeInstanceOf(
        NotFoundException,
      );
      await expect(service.getPlans()).rejects.toThrow('NO_PLANS_FOUND');
      expect(prisma.plan.findMany).toHaveBeenCalledTimes(2);
    });

    it('devrait retourner un tableau avec un seul plan', async () => {
      const plans = [mockPlan];
      prisma.plan.findMany.mockResolvedValue(plans);

      const result = await service.getPlans();

      expect(result).toEqual(plans);
      expect(result).toHaveLength(1);
      expect(prisma.plan.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPlanById', () => {
    it('devrait retourner un plan par son id', async () => {
      prisma.plan.findUnique.mockResolvedValue(mockPlan);

      const result = await service.getPlanById('1');

      expect(result).toEqual(mockPlan);
      expect(prisma.plan.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.plan.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("devrait parser correctement l'id string en number", async () => {
      prisma.plan.findUnique.mockResolvedValue(mockPlan);

      await service.getPlanById('42');

      expect(prisma.plan.findUnique).toHaveBeenCalledWith({
        where: { id: 42 },
      });
    });

    it("devrait lancer NotFoundException si le plan n'est pas trouvé", async () => {
      prisma.plan.findUnique.mockResolvedValue(null);

      await expect(service.getPlanById('999')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      await expect(service.getPlanById('999')).rejects.toThrow(
        'Plan with id 999 not found',
      );
      expect(prisma.plan.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });

    it('devrait gérer les ids invalides', async () => {
      prisma.plan.findUnique.mockResolvedValue(null);

      await expect(service.getPlanById('invalid')).rejects.toThrow();
      expect(prisma.plan.findUnique).toHaveBeenCalledWith({
        where: { id: NaN },
      });
    });
  });
});
