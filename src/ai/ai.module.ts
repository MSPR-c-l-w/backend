import { Module } from '@nestjs/common';
import { AiWorkoutController } from 'src/ai/controllers/ai-workout/ai-workout.controller';
import { AiWorkoutService } from 'src/ai/services/ai-workout/ai-workout.service';
<<<<<<< HEAD
=======
import { NutritionAiService } from 'src/ai/services/ai-workout/nutrition-ai.service';
>>>>>>> 32c3fdcf5e205cc9ec88f66afcd6d9201661ba40
import { WorkoutMicroserviceModule } from 'src/ai/workout-microservice/workout-microservice.module';
import { SERVICES } from 'src/utils/constants';

@Module({
  imports: [WorkoutMicroserviceModule],
  controllers: [AiWorkoutController],
  providers: [
    AiWorkoutService,
<<<<<<< HEAD
=======
    NutritionAiService,
>>>>>>> 32c3fdcf5e205cc9ec88f66afcd6d9201661ba40
    {
      provide: SERVICES.AI_WORKOUT,
      useClass: AiWorkoutService,
    },
  ],
  exports: [
    AiWorkoutService,
<<<<<<< HEAD
=======
    NutritionAiService,
>>>>>>> 32c3fdcf5e205cc9ec88f66afcd6d9201661ba40
    {
      provide: SERVICES.AI_WORKOUT,
      useClass: AiWorkoutService,
    },
  ],
})
<<<<<<< HEAD
export class AiModule {}
=======
export class AiModule {}
>>>>>>> 32c3fdcf5e205cc9ec88f66afcd6d9201661ba40
