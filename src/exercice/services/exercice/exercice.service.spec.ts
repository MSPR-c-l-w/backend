import { Test, TestingModule } from '@nestjs/testing';
import { ExerciceService } from './exercice.service';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { Exercise } from '@prisma/client';

describe('ExerciceService', () => {
  let service: ExerciceService;
  let prismaService: PrismaService;

  const mockExercises: Exercise[] = [
    {
      id: 1,
      name: 'Bench Press',
      image_url: 'http://example.com/bench.jpg',
      video_url: 'http://example.com/bench.mp4',
      gender: 'all',
      workout_type: 'strength',
      overview: 'Upper body exercise',
      equipments: JSON.parse('["barbell", "bench"]'),
      body_parts: JSON.parse('["chest"]'),
      target_muscles: JSON.parse('["pectoral"]'),
      secondary_muscles: JSON.parse('["triceps"]'),
      instructions: JSON.parse('["step1", "step2"]'),
      exercise_type: 'compound',
      variations: JSON.parse('["incline", "dumbbell"]'),
      related_exercice_ids: JSON.parse('[2, 3]'),
    },
    {
      id: 2,
      name: 'Squats',
      image_url: 'http://example.com/squat.jpg',
      video_url: 'http://example.com/squat.mp4',
      gender: 'all',
      workout_type: 'strength',
      overview: 'Lower body exercise',
      equipments: JSON.parse('["barbell"]'),
      body_parts: JSON.parse('["legs"]'),
      target_muscles: JSON.parse('["quadriceps"]'),
      secondary_muscles: JSON.parse('["glutes"]'),
      instructions: JSON.parse('["step1", "step2"]'),
      exercise_type: 'compound',
      variations: JSON.parse('["goblet", "leg press"]'),
      related_exercice_ids: JSON.parse('[1, 3]'),
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
            },
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
      jest.spyOn(prismaService.exercise, 'findMany').mockResolvedValueOnce(mockExercises);

      const result = await service.getExercices();

      expect(result).toEqual(mockExercises);
      expect(prismaService.exercise.findMany).toHaveBeenCalledWith();
    });

    it('should throw an error when no exercises are found', async () => {
      jest.spyOn(prismaService.exercise, 'findMany').mockResolvedValueOnce([]);

      await expect(service.getExercices()).rejects.toThrow('No exercices found');
      expect(prismaService.exercise.findMany).toHaveBeenCalledWith();
    });
  });

  describe('getExerciceById', () => {
    it('should return a single exercise by id', async () => {
      jest.spyOn(prismaService.exercise, 'findUnique').mockResolvedValueOnce(mockExercises[0]);

      const result = await service.getExerciceById(1);

      expect(result).toEqual(mockExercises[0]);
      expect(prismaService.exercise.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw an error when exercise is not found', async () => {
      jest.spyOn(prismaService.exercise, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.getExerciceById(999)).rejects.toThrow('Exercice with id 999 not found');
      expect(prismaService.exercise.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });
  });
});
