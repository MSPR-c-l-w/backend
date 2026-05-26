import { Module } from '@nestjs/common';
import { AiWorkoutController } from 'src/ai/controllers/ai-workout/ai-workout.controller';
import { AiWorkoutService } from 'src/ai/services/ai-workout/ai-workout.service';
import { WorkoutMicroserviceModule } from 'src/ai/workout-microservice/workout-microservice.module';
import { SERVICES } from 'src/utils/constants';

@Module({
  imports: [WorkoutMicroserviceModule],
  controllers: [AiWorkoutController],
  providers: [
    AiWorkoutService,
    {
      provide: SERVICES.AI_WORKOUT,
      useClass: AiWorkoutService,
    },
  ],
  exports: [
    AiWorkoutService,
    {
      provide: SERVICES.AI_WORKOUT,
      useClass: AiWorkoutService,
    },
  ],
})
export class AiModule {}
