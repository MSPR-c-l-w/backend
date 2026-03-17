import { EtlWeeklySchedulerService } from './etl-weekly-scheduler.service';
import type { IExerciceService } from 'src/exercice/interfaces/exercice/exercice.interface';
import type { INutritionService } from 'src/nutrition/interfaces/nutrition/nutrition.interface';

describe('EtlWeeklySchedulerService', () => {
  let service: EtlWeeklySchedulerService;
  let nutritionService: { runImportPipeline: jest.Mock };
  let exerciceService: { runImportPipeline: jest.Mock };

  beforeEach(() => {
    nutritionService = {
      runImportPipeline: jest.fn(),
    };
    exerciceService = {
      runImportPipeline: jest.fn(),
    };
    service = new EtlWeeklySchedulerService(
      nutritionService as unknown as INutritionService,
      exerciceService as unknown as IExerciceService,
    );
  });

  it('should run nutrition and exercise pipelines only', async () => {
    nutritionService.runImportPipeline.mockResolvedValue(12);
    exerciceService.runImportPipeline.mockResolvedValue(34);

    await service.runSundayNightPipelines();

    expect(nutritionService.runImportPipeline).toHaveBeenCalledTimes(1);
    expect(exerciceService.runImportPipeline).toHaveBeenCalledTimes(1);
  });

  it('should keep running even if one pipeline fails', async () => {
    nutritionService.runImportPipeline.mockRejectedValue(
      new Error('nutrition failed'),
    );
    exerciceService.runImportPipeline.mockResolvedValue(34);

    await service.runSundayNightPipelines();

    expect(nutritionService.runImportPipeline).toHaveBeenCalledTimes(1);
    expect(exerciceService.runImportPipeline).toHaveBeenCalledTimes(1);
  });
});
