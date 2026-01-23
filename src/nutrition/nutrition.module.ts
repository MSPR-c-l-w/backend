import { Module } from '@nestjs/common';
import { NutritionService } from './services/nutrition/nutrition.service';
import { NutritionController } from './controllers/nutrition/nutrition.controller';
import { SERVICES } from 'src/utils/constants';

@Module({
  providers: [
    NutritionService,
    {
      provide: SERVICES.NUTRITION,
      useClass: NutritionService,
    }
  ],
  controllers: [NutritionController],
  exports: [NutritionService,
    {
      provide: SERVICES.NUTRITION,
      useClass: NutritionService,
    }]
})
export class NutritionModule { }
