import { Module } from '@nestjs/common';
import { Workout_SessionController } from './controllers/workout-session/workout-session.controller';
import { Workout_SessionService } from './services/workout-session/workout-session.service';
import { SERVICES } from 'src/utils/constants';

@Module({
  controllers: [Workout_SessionController],
  providers: [
    Workout_SessionService,
    {
      provide: SERVICES.WORKOUT_SESSION,
      useClass: Workout_SessionService,
    },
  ],
  exports: [
    Workout_SessionService,
    {
      provide: SERVICES.WORKOUT_SESSION,
      useClass: Workout_SessionService,
    },
  ],
})
export class WorkoutSessionModule {}
