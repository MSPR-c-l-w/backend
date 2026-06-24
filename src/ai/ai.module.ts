import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AiNutritionController } from 'src/ai/controllers/ai-nutrition/ai-nutrition.controller';
import { AiWorkoutController } from 'src/ai/controllers/ai-workout/ai-workout.controller';
import { AiNutritionService } from 'src/ai/services/ai-nutrition/ai-nutrition.service';
import { AiWorkoutService } from 'src/ai/services/ai-workout/ai-workout.service';
import { WorkoutMicroserviceModule } from 'src/ai/workout-microservice/workout-microservice.module';
import { SERVICES } from 'src/utils/constants';
import { MetricsModule } from 'src/metrics/metrics.module';
import { MediaModule } from 'src/media/media.module';

@Module({
  imports: [WorkoutMicroserviceModule, HttpModule, MetricsModule, MediaModule],
  controllers: [AiWorkoutController, AiNutritionController],
  providers: [
    AiWorkoutService,
    { provide: SERVICES.AI_WORKOUT, useClass: AiWorkoutService },
    AiNutritionService,
    { provide: SERVICES.AI_NUTRITION, useClass: AiNutritionService },
  ],
  exports: [
    AiWorkoutService,
    { provide: SERVICES.AI_WORKOUT, useClass: AiWorkoutService },
    AiNutritionService,
    { provide: SERVICES.AI_NUTRITION, useClass: AiNutritionService },
  ],
})
export class AiModule {}
