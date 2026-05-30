import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NutritionService } from './services/nutrition/nutrition.service';
import { NutritionController } from './controllers/nutrition/nutrition.controller';
import { EtlModule } from 'src/etl/etl.module';
import { SERVICES } from 'src/utils/constants';
import { MetricsModule } from 'src/metrics/metrics.module';

@Module({
  imports: [HttpModule, EtlModule, MetricsModule],
  providers: [
    NutritionService,
    {
      provide: SERVICES.NUTRITION,
      useClass: NutritionService,
    },
  ],
  controllers: [NutritionController],
  exports: [
    NutritionService,
    {
      provide: SERVICES.NUTRITION,
      useClass: NutritionService,
    },
  ],
})
export class NutritionModule {}
