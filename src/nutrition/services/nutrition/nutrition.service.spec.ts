import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NutritionService } from './nutrition.service';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { Nutrition } from '@prisma/client';

describe('NutritionService', () => {
  let service: NutritionService;
  let prisma: {
    nutrition: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
    };
  };

  const mockNutrition: Nutrition = {
    id: 1,
    name: 'Pomme',
    category: 'Fruit',
    calories_kcal: 52.0,
    protein_g: 0.3,
    carbohydrates_g: 14.0,
    fat_g: 0.2,
    fiber_g: 2.4,
    sugar_g: 10.4,
    sodium_mg: 1.0,
    cholesterol_mg: 0.0,
    meal_type_name: 'Snack',
    water_intake_ml: 85.0,
    picture_url: 'https://example.com/apple.jpg',
  };

  beforeEach(async () => {
    prisma = {
      nutrition: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NutritionService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<NutritionService>(NutritionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNutritions', () => {
    it('devrait retourner la liste des nutriments', async () => {
      const nutritions = [mockNutrition, { ...mockNutrition, id: 2, name: 'Banane' }];
      prisma.nutrition.findMany.mockResolvedValue(nutritions);

      const result = await service.getNutritions();

      expect(result).toEqual(nutritions);
      expect(prisma.nutrition.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.nutrition.findMany).toHaveBeenCalledWith();
    });

    it('devrait lancer NotFoundException si aucun nutriment trouvé', async () => {
      prisma.nutrition.findMany.mockResolvedValue([]);

      await expect(service.getNutritions()).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.getNutritions()).rejects.toThrow('NO_NUTRITIONS_FOUND');
      expect(prisma.nutrition.findMany).toHaveBeenCalledTimes(2);
    });

    it('devrait retourner un tableau avec un seul nutriment', async () => {
      const nutritions = [mockNutrition];
      prisma.nutrition.findMany.mockResolvedValue(nutritions);

      const result = await service.getNutritions();

      expect(result).toEqual(nutritions);
      expect(result).toHaveLength(1);
      expect(prisma.nutrition.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('getNutritionById', () => {
    it('devrait retourner un nutriment par son id', async () => {
      prisma.nutrition.findUnique.mockResolvedValue(mockNutrition);

      const result = await service.getNutritionById('1');

      expect(result).toEqual(mockNutrition);
      expect(prisma.nutrition.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.nutrition.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('devrait parser correctement l\'id string en number', async () => {
      prisma.nutrition.findUnique.mockResolvedValue(mockNutrition);

      await service.getNutritionById('42');

      expect(prisma.nutrition.findUnique).toHaveBeenCalledWith({
        where: { id: 42 },
      });
    });

    it('devrait lancer une Error si le nutriment n\'est pas trouvé', async () => {
      prisma.nutrition.findUnique.mockResolvedValue(null);

      await expect(service.getNutritionById('999')).rejects.toThrow(Error);
      await expect(service.getNutritionById('999')).rejects.toThrow('Nutrition with id 999 not found');
      expect(prisma.nutrition.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });

    it('devrait gérer les ids invalides', async () => {
      prisma.nutrition.findUnique.mockResolvedValue(null);

      await expect(service.getNutritionById('invalid')).rejects.toThrow();
      expect(prisma.nutrition.findUnique).toHaveBeenCalledWith({
        where: { id: NaN },
      });
    });
  });
});
