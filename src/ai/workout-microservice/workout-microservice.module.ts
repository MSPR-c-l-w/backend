import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { WorkoutMicroserviceClient } from 'src/ai/workout-microservice/workout-microservice.client';
import { SERVICES } from 'src/utils/constants';

@Module({
  imports: [HttpModule],
  providers: [
    WorkoutMicroserviceClient,
    {
      provide: SERVICES.WORKOUT_MICROSERVICE_CLIENT,
      useClass: WorkoutMicroserviceClient,
    },
  ],
  exports: [
    WorkoutMicroserviceClient,
    {
      provide: SERVICES.WORKOUT_MICROSERVICE_CLIENT,
      useClass: WorkoutMicroserviceClient,
    },
  ],
})
export class WorkoutMicroserviceModule {}
