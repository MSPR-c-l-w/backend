import { Module } from '@nestjs/common';
import { AiWorkoutController } from 'src/ai/controllers/ai-workout/ai-workout.controller';
import { AiWorkoutService } from 'src/ai/services/ai-workout/ai-workout.service';
import { NutritionAiService } from 'src/ai/services/ai-workout/nutrition-ai.service';
import { WorkoutMicroserviceModule } from 'src/ai/workout-microservice/workout-microservice.module';
import { SERVICES } from 'src/utils/constants';

@Module({
  imports: [WorkoutMicroserviceModule],
  controllers: [AiWorkoutController],
  providers: [
    AiWorkoutService,
    NutritionAiService,
    {
      provide: SERVICES.AI_WORKOUT,
      useClass: AiWorkoutService,
    },
  ],
  exports: [
    AiWorkoutService,
    NutritionAiService,
    {
      provide: SERVICES.AI_WORKOUT,
      useClass: AiWorkoutService,
    },
  ],
})
export class AiModule {}
