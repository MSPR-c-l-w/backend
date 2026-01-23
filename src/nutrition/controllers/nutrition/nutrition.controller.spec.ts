import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NutritionController } from './nutrition.controller';
import { SERVICES } from 'src/utils/constants';
import { Nutrition } from '@prisma/client';

describe('NutritionController', () => {
  let controller: NutritionController;
  const nutritionServiceMock = {
    getNutritions: jest.fn(),
    getNutritionById: jest.fn(),
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
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NutritionController],
      providers: [
        {
          provide: SERVICES.NUTRITION,
          useValue: nutritionServiceMock,
        },
      ],
    }).compile();

    controller = module.get<NutritionController>(NutritionController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getNutritions', () => {
    it('devrait retourner la liste des nutriments', async () => {
      const nutritions = [mockNutrition, { ...mockNutrition, id: 2, name: 'Banane' }];
      nutritionServiceMock.getNutritions.mockResolvedValue(nutritions);

      const result = await controller.getNutritions();

      expect(result).toEqual(nutritions);
      expect(nutritionServiceMock.getNutritions).toHaveBeenCalledTimes(1);
      expect(nutritionServiceMock.getNutritions).toHaveBeenCalledWith();
    });

    it('devrait appeler le service avec les bons paramètres', async () => {
      nutritionServiceMock.getNutritions.mockResolvedValue([mockNutrition]);

      await controller.getNutritions();

      expect(nutritionServiceMock.getNutritions).toHaveBeenCalled();
    });

    it('devrait propager NotFoundException du service', async () => {
      nutritionServiceMock.getNutritions.mockRejectedValue(
        new NotFoundException('NO_NUTRITIONS_FOUND')
      );

      await expect(controller.getNutritions()).rejects.toBeInstanceOf(NotFoundException);
      expect(nutritionServiceMock.getNutritions).toHaveBeenCalledTimes(1);
    });
  });

  describe('getNutritionById', () => {
    it('devrait retourner un nutriment par son id', async () => {
      nutritionServiceMock.getNutritionById.mockResolvedValue(mockNutrition);

      const result = await controller.getNutritionById('1');

      expect(result).toEqual(mockNutrition);
      expect(nutritionServiceMock.getNutritionById).toHaveBeenCalledTimes(1);
      expect(nutritionServiceMock.getNutritionById).toHaveBeenCalledWith('1');
    });

    it('devrait appeler le service avec le bon id', async () => {
      nutritionServiceMock.getNutritionById.mockResolvedValue(mockNutrition);

      await controller.getNutritionById('42');

      expect(nutritionServiceMock.getNutritionById).toHaveBeenCalledWith('42');
    });

    it('devrait propager les erreurs du service', async () => {
      const error = new Error('Nutrition with id 999 not found');
      nutritionServiceMock.getNutritionById.mockRejectedValue(error);

      await expect(controller.getNutritionById('999')).rejects.toThrow(error);
      expect(nutritionServiceMock.getNutritionById).toHaveBeenCalledWith('999');
    });

    it('devrait gérer différents formats d\'id', async () => {
      nutritionServiceMock.getNutritionById.mockResolvedValue(mockNutrition);

      await controller.getNutritionById('123');
      expect(nutritionServiceMock.getNutritionById).toHaveBeenCalledWith('123');
    });
  });
});
