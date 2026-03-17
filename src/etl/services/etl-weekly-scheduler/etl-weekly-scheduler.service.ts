import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SERVICES } from 'src/utils/constants';
import type { IExerciceService } from 'src/exercice/interfaces/exercice/exercice.interface';
import type { INutritionService } from 'src/nutrition/interfaces/nutrition/nutrition.interface';

@Injectable()
export class EtlWeeklySchedulerService {
  private readonly logger = new Logger(EtlWeeklySchedulerService.name);

  constructor(
    @Inject(SERVICES.NUTRITION)
    private readonly nutritionService: INutritionService,
    @Inject(SERVICES.EXERCISE)
    private readonly exerciceService: IExerciceService,
  ) {}

  @Cron('0 1 * * 0', {
    timeZone: 'Europe/Paris',
  })
  async runSundayNightPipelines(): Promise<void> {
    this.logger.log(
      'Déclenchement automatique des pipelines ETL nutrition et exercice.',
    );

    const results = await Promise.allSettled([
      this.nutritionService.runImportPipeline(),
      this.exerciceService.runImportPipeline(),
    ]);

    results.forEach((result, index) => {
      const pipeline = index === 0 ? 'nutrition' : 'exercise';
      if (result.status === 'fulfilled') {
        this.logger.log(
          `Pipeline ETL ${pipeline} terminé avec succès (${result.value} éléments).`,
        );
        return;
      }

      const reason =
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason);
      this.logger.error(`Pipeline ETL ${pipeline} en échec: ${reason}`);
    });
  }
}
