/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { ExerciceController } from './exercice.controller';
import { SERVICES } from 'src/utils/constants';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { UpdateExerciceDto } from 'src/exercice/dtos/update-exercice.dto';

describe('ExerciceController', () => {
  let controller: ExerciceController;
  let service: any;

  const mockExerciceService = {
    runImportPipeline: jest.fn().mockResolvedValue(873),
    getExercices: jest.fn().mockResolvedValue([]),
    getExerciceById: jest.fn().mockResolvedValue({ id: 1, name: 'Push Up' }),
    updateExercice: jest.fn().mockResolvedValue({ id: 1, name: 'Updated' }),
    deleteExercice: jest.fn().mockResolvedValue({ id: 1, name: 'Deleted' }),
    findByFilters: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExerciceController],
      providers: [
        {
          provide: SERVICES.EXERCISE,
          useValue: mockExerciceService,
        },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ExerciceController>(ExerciceController);
    service = module.get(SERVICES.EXERCISE);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('triggerImport', () => {
    it('should call the import pipeline and return count', async () => {
      const result = await controller.triggerImport();
      expect(service.runImportPipeline).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Le pipeline ETL a été exécuté avec succès.',
        count: 873,
      });
    });
  });

  describe('search', () => {
    it('should call findByFilters with query parameters', async () => {
      const filters = { muscle: 'biceps', level: 'débutant' };
      await controller.search(filters.muscle, filters.level);

      expect(service.findByFilters).toHaveBeenCalledWith({
        muscle: 'biceps',
        level: 'débutant',
        equipment: undefined,
        category: undefined,
      });
    });
  });

  describe('updateExercice', () => {
    it('should call updateExercice with id and body', async () => {
      const dto: UpdateExerciceDto = { name: 'Updated' };
      await controller.updateExercice(1, dto);
      expect(service.updateExercice).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('deleteExercice', () => {
    it('should call deleteExercice with id', async () => {
      await controller.deleteExercice(1);
      expect(service.deleteExercice).toHaveBeenCalledWith(1);
    });
  });
});
