import { Test, TestingModule } from '@nestjs/testing';
import { ExerciceService } from './exercice.service';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { Exercise } from '@prisma/client';
import { HttpService } from '@nestjs/axios';
import { EtlService } from 'src/etl/services/etl/etl.service';
import { of } from 'rxjs';
import { EtlAnomalyDetectorService } from 'src/etl/services/etl-anomaly-detector/etl-anomaly-detector.service';
import type { UpdateExerciceDto } from 'src/exercice/dtos/update-exercice.dto';

jest.mock('google-translate-api-x', () => ({
  translate: jest.fn((texts: string[] | string) => {
    if (Array.isArray(texts)) {
      return Promise.resolve(texts.map((t) => ({ text: t })));
    }
    return Promise.resolve({ text: texts });
  }),
}));

describe('ExerciceService', () => {
  let service: ExerciceService;
  let prismaService: PrismaService;
  let httpGetMock: jest.Mock;
  let exerciseStagingCreateMock: jest.Mock;

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
              update: jest.fn(),
              delete: jest.fn(),
            },
            exerciseStaging: {
              findFirst: jest.fn(),
              update: jest.fn(),
              create: (exerciseStagingCreateMock = jest.fn()),
            },
          },
        },
        {
          provide: HttpService,
          useValue: {
            get: (httpGetMock = jest.fn().mockReturnValue(of({ data: [] }))),
          },
        },
        {
          provide: EtlService,
          useValue: {
            emit: jest.fn(),
            getStream: jest.fn(() => ({ subscribe: () => {} })),
            runWithPipelineLock: jest.fn(
              async (_pipeline: string, task: () => Promise<unknown>) =>
                await task(),
            ),
          },
        },
        {
          provide: EtlAnomalyDetectorService,
          useValue: {
            detectForPipeline: jest.fn(() => []),
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

  describe('updateExercice', () => {
    it('should update an exercise when it exists', async () => {
      const findUniqueSpy = jest
        .spyOn(prismaService.exercise, 'findUnique')
        .mockResolvedValueOnce(mockExercises[0]);
      const updateSpy = jest
        .spyOn(prismaService.exercise, 'update')
        .mockResolvedValueOnce({ ...mockExercises[0], name: 'Updated' });

      const dto: UpdateExerciceDto = { name: 'Updated' };
      const result = await service.updateExercice(1, dto);

      expect(result).toEqual({ ...mockExercises[0], name: 'Updated' });
      expect(findUniqueSpy).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 1 },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- matcher Jest
        data: expect.objectContaining({ name: 'Updated' }),
      });
    });

    it('should throw when exercise does not exist', async () => {
      jest
        .spyOn(prismaService.exercise, 'findUnique')
        .mockResolvedValueOnce(null);

      await expect(
        service.updateExercice(999, { name: 'Updated' }),
      ).rejects.toThrow('Exercice 999 introuvable');
    });
  });

  describe('deleteExercice', () => {
    it('should delete an exercise when it exists', async () => {
      const findUniqueSpy = jest
        .spyOn(prismaService.exercise, 'findUnique')
        .mockResolvedValueOnce(mockExercises[0]);
      const deleteSpy = jest
        .spyOn(prismaService.exercise, 'delete')
        .mockResolvedValueOnce(mockExercises[0]);

      const result = await service.deleteExercice(1);

      expect(result).toEqual(mockExercises[0]);
      expect(findUniqueSpy).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(deleteSpy).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw when exercise does not exist', async () => {
      jest
        .spyOn(prismaService.exercise, 'findUnique')
        .mockResolvedValueOnce(null);

      await expect(service.deleteExercice(999)).rejects.toThrow(
        'Exercice 999 introuvable',
      );
    });
  });

  describe('runImportPipeline', () => {
    const minimalPayload: Record<string, unknown>[] = [
      {
        name: 'Bench Press',
        primaryMuscles: ['chest'],
        secondaryMuscles: ['triceps'],
        instructions: ['Step 1', 'Step 2'],
        images: ['bench.jpg'],
        force: 'push',
        level: 'beginner',
        mechanic: 'compound',
        equipment: 'barbell',
        category: 'strength',
      },
    ];

    it('should fetch JSON, write to exerciseStaging and return successCount', async () => {
      httpGetMock.mockReturnValue(of({ data: minimalPayload }));
      exerciseStagingCreateMock.mockResolvedValue({ id: 'staging-uuid' });

      const result = await service.runImportPipeline();

      expect(result).toBe(1);
      expect(exerciseStagingCreateMock).toHaveBeenCalledTimes(1);
      expect(exerciseStagingCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- matcher Jest
            cleaned_data: expect.objectContaining({
              name: 'Bench Press',
              primary_muscles: ['pectoraux'],
              secondary_muscles: ['triceps'],
              level: 'débutant',
              mechanic: 'polyarticulaire',
              equipment: 'barre',
              category: 'force',
              instructions: ['Step 1', 'Step 2'],
              image_urls: [
                'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/bench.jpg',
              ],
              exercise_type: 'poussée',
            }),
            anomalies: [],
            status: 'PENDING',
          },
        }),
      );
    });
  });
});
