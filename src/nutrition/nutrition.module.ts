import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NutritionService } from './services/nutrition/nutrition.service';
import { NutritionController } from './controllers/nutrition/nutrition.controller';
import { EtlModule } from 'src/etl/etl.module';
import { SERVICES } from 'src/utils/constants';

@Module({
  imports: [HttpModule, EtlModule],
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
