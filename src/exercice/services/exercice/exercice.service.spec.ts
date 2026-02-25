import { Test, TestingModule } from '@nestjs/testing';
import { ExerciceService } from './exercice.service';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { Exercise } from '@prisma/client';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

describe('ExerciceService', () => {
  let service: ExerciceService;
  let prismaService: PrismaService;

  const mockExercises: Exercise[] = [
    {
      id: 1,
      name: 'Bench Press',
      primary_muscles: ['Pectoraux'],
      secondary_muscles: ['Triceps', 'Épaules'],
      level: 'Intermédiaire',
      mechanic: 'Compound',
      equipment: 'Barre',
      category: 'Force',
      instructions: ['Allongez-vous', 'Poussez la barre'],
      image_urls: ['http://example.com/bench.jpg'],
      exercise_type: 'Strength',
    },
    {
      id: 2,
      name: 'Squat',
      primary_muscles: ['Quadriceps'],
      secondary_muscles: ['Fessiers'],
      level: 'Débutant',
      mechanic: 'Compound',
      equipment: 'Poids du corps',
      category: 'Force',
      instructions: ['Descendez les fesses', 'Remontez'],
      image_urls: ['http://example.com/squat.jpg'],
      exercise_type: 'Strength',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExerciceService,
        {
          provide: PrismaService,
          useValue: {
            exercise: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              upsert: jest.fn(),
              deleteMany: jest.fn(),
            },
          },
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn().mockReturnValue(of({ data: [] })),
          },
        },
      ],
    }).compile();

    service = module.get<ExerciceService>(ExerciceService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getExercices', () => {
    it('should return an array of exercises', async () => {
      jest
        .spyOn(prismaService.exercise, 'findMany')
        .mockResolvedValueOnce(mockExercises);

      const result = await service.getExercices(1, 20);

      expect(result).toEqual(mockExercises);
    });

    it('should throw an error when no exercises are found', async () => {
      jest.spyOn(prismaService.exercise, 'findMany').mockResolvedValueOnce([]);

      await expect(service.getExercices()).rejects.toThrow(
        'Aucun exercice trouvé',
      );
    });
  });

  describe('getExerciceById', () => {
    it('should return a single exercise by id', async () => {
      jest
        .spyOn(prismaService.exercise, 'findUnique')
        .mockResolvedValueOnce(mockExercises[0]);

      const result = await service.getExerciceById(1);

      expect(result).toEqual(mockExercises[0]);
    });

    it('should throw an error when exercise is not found', async () => {
      jest
        .spyOn(prismaService.exercise, 'findUnique')
        .mockResolvedValueOnce(null);

      await expect(service.getExerciceById(999)).rejects.toThrow(
        'Exercice 999 introuvable',
      );
    });
  });
});
