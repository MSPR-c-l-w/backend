/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NutritionService } from './nutrition.service';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { Nutrition } from '@prisma/client';
import { of } from 'rxjs';
import AdmZip from 'adm-zip';

jest.mock('google-translate-api-x', () => ({
  translate: jest.fn((texts: string[] | string) => {
    if (Array.isArray(texts)) {
      return Promise.resolve(texts.map((t) => ({ text: t })));
    }
    return Promise.resolve({ text: texts });
  }),
}));

describe('NutritionService', () => {
  let service: NutritionService;
  let prisma: {
    nutrition: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      upsert: jest.Mock;
    };
  };
  const mockHttpService = {
    get: jest.fn(),
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
        upsert: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NutritionService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
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
      const nutritions = [
        mockNutrition,
        { ...mockNutrition, id: 2, name: 'Banane' },
      ];
      prisma.nutrition.findMany.mockResolvedValue(nutritions);

      const result = await service.getNutritions();

      expect(result).toEqual(nutritions);
      expect(prisma.nutrition.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.nutrition.findMany).toHaveBeenCalledWith();
    });

    it('devrait lancer NotFoundException si aucun nutriment trouvé', async () => {
      prisma.nutrition.findMany.mockResolvedValue([]);

      await expect(service.getNutritions()).rejects.toBeInstanceOf(
        NotFoundException,
      );
      await expect(service.getNutritions()).rejects.toThrow(
        'NO_NUTRITIONS_FOUND',
      );
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

    it("devrait parser correctement l'id string en number", async () => {
      prisma.nutrition.findUnique.mockResolvedValue(mockNutrition);

      await service.getNutritionById('42');

      expect(prisma.nutrition.findUnique).toHaveBeenCalledWith({
        where: { id: 42 },
      });
    });

    it("devrait lancer une Error si le nutriment n'est pas trouvé", async () => {
      prisma.nutrition.findUnique.mockResolvedValue(null);

      await expect(service.getNutritionById('999')).rejects.toThrow(Error);
      await expect(service.getNutritionById('999')).rejects.toThrow(
        'Nutrition with id 999 not found',
      );
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

  describe('runImportPipeline', () => {
    it('devrait lever une erreur si les variables KAGGLE_USER et KAGGLE_KEY sont absentes', async () => {
      const originalUser = process.env.KAGGLE_USER;
      const originalKey = process.env.KAGGLE_KEY;
      delete process.env.KAGGLE_USER;
      delete process.env.KAGGLE_KEY;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          NutritionService,
          {
            provide: PrismaService,
            useValue: prisma,
          },
          {
            provide: HttpService,
            useValue: mockHttpService,
          },
        ],
      }).compile();

      const localService = module.get<NutritionService>(NutritionService);

      await expect(localService.runImportPipeline()).rejects.toThrow(
        "Variables d'environnement KAGGLE_USER et KAGGLE_KEY requises.",
      );

      process.env.KAGGLE_USER = originalUser;
      process.env.KAGGLE_KEY = originalKey;
    });

    it('devrait lever une erreur si le ZIP Kaggle ne contient pas de CSV', async () => {
      const originalUser = process.env.KAGGLE_USER;
      const originalKey = process.env.KAGGLE_KEY;
      process.env.KAGGLE_USER = 'dummy-user';
      process.env.KAGGLE_KEY = 'dummy-key';

      const zip = new AdmZip();
      zip.addFile('no_csv_here.txt', Buffer.from('test', 'utf-8'));
      const buffer = zip.toBuffer();

      mockHttpService.get.mockReturnValue(of({ data: buffer } as any));

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          NutritionService,
          {
            provide: PrismaService,
            useValue: prisma,
          },
          {
            provide: HttpService,
            useValue: mockHttpService,
          },
        ],
      }).compile();

      const localService = module.get<NutritionService>(NutritionService);

      await expect(localService.runImportPipeline()).rejects.toThrow(
        /Aucun fichier \.csv trouvé dans le ZIP Kaggle/,
      );
      expect(prisma.nutrition.upsert).not.toHaveBeenCalled();

      process.env.KAGGLE_USER = originalUser;
      process.env.KAGGLE_KEY = originalKey;
    });

    it('devrait parser correctement un ZIP Kaggle contenant un CSV valide', async () => {
      const originalUser = process.env.KAGGLE_USER;
      const originalKey = process.env.KAGGLE_KEY;
      process.env.KAGGLE_USER = 'dummy-user';
      process.env.KAGGLE_KEY = 'dummy-key';

      const csvContent = 'Food_Item,Category,Calories (kcal)\nPomme,Fruit,52\n';
      const zip = new AdmZip();
      zip.addFile(
        'daily_food_nutrition_dataset.csv',
        Buffer.from(csvContent, 'utf-8'),
      );
      const buffer = zip.toBuffer();

      mockHttpService.get.mockReturnValue(of({ data: buffer } as any));

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          NutritionService,
          {
            provide: PrismaService,
            useValue: prisma,
          },
          {
            provide: HttpService,
            useValue: mockHttpService,
          },
        ],
      }).compile();

      const localService = module.get<NutritionService>(NutritionService);

      const result = await localService.runImportPipeline();

      expect(result).toBe(1);
      expect(prisma.nutrition.upsert).toHaveBeenCalledTimes(1);
      const upsertArgs = prisma.nutrition.upsert.mock.calls[0][0];
      expect(upsertArgs.where.name_category).toEqual({
        name: 'Pomme',
        category: 'Fruit',
      });

      process.env.KAGGLE_USER = originalUser;
      process.env.KAGGLE_KEY = originalKey;
    });
  });
});
