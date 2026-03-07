import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PlanService } from './plan.service';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { Plan } from '@prisma/client';
import type { CreatePlanDto, UpdatePlanDto } from 'src/plan/dtos/plan.dto';

describe('PlanService', () => {
  let service: PlanService;
  let prisma: {
    plan: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
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
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
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

    it('devrait lancer BadRequestException si id invalide', async () => {
      await expect(service.getPlanById('invalid')).rejects.toThrow(
        'PLAN_ID_MUST_BE_A_NUMBER',
      );
      expect(prisma.plan.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('createPlan', () => {
    it('devrait créer un plan', async () => {
      prisma.plan.create.mockResolvedValue(mockPlan);

      const dto: CreatePlanDto = { name: 'Freemium', price: 0, features: [] };
      await expect(service.createPlan(dto)).resolves.toEqual(mockPlan);

      expect(prisma.plan.create).toHaveBeenCalledWith({
        data: { name: 'Freemium', price: 0, features: [] },
      });
    });
  });

  describe('updatePlan', () => {
    it('devrait mettre à jour un plan', async () => {
      prisma.plan.findUnique.mockResolvedValue(mockPlan);
      prisma.plan.update.mockResolvedValue(mockPlan);

      const dto: UpdatePlanDto = { price: 10 };
      await expect(service.updatePlan('1', dto)).resolves.toEqual(mockPlan);

      expect(prisma.plan.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { price: 10 },
      });
    });

    it('devrait lancer BadRequestException si id invalide', async () => {
      await expect(
        service.updatePlan('invalid', { price: 10 }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        service.updatePlan('invalid', { price: 10 }),
      ).rejects.toThrow('PLAN_ID_MUST_BE_A_NUMBER');
      expect(prisma.plan.findUnique).not.toHaveBeenCalled();
      expect(prisma.plan.update).not.toHaveBeenCalled();
    });

    it("devrait lancer NotFoundException si le plan n'existe pas", async () => {
      prisma.plan.findUnique.mockResolvedValue(null);

      await expect(
        service.updatePlan('999', { price: 10 }),
      ).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.updatePlan('999', { price: 10 })).rejects.toThrow(
        'Plan with id 999 not found',
      );
      expect(prisma.plan.update).not.toHaveBeenCalled();
    });
  });

  describe('deletePlan', () => {
    it('devrait supprimer un plan', async () => {
      prisma.plan.findUnique.mockResolvedValue(mockPlan);
      prisma.plan.delete.mockResolvedValue(mockPlan);

      await expect(service.deletePlan('1')).resolves.toEqual(mockPlan);
      expect(prisma.plan.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('devrait lancer BadRequestException si id invalide', async () => {
      await expect(service.deletePlan('invalid')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(service.deletePlan('invalid')).rejects.toThrow(
        'PLAN_ID_MUST_BE_A_NUMBER',
      );
      expect(prisma.plan.findUnique).not.toHaveBeenCalled();
      expect(prisma.plan.delete).not.toHaveBeenCalled();
    });

    it("devrait lancer NotFoundException si le plan n'existe pas", async () => {
      prisma.plan.findUnique.mockResolvedValue(null);

      await expect(service.deletePlan('999')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      await expect(service.deletePlan('999')).rejects.toThrow(
        'Plan with id 999 not found',
      );
      expect(prisma.plan.delete).not.toHaveBeenCalled();
    });
  });
});
