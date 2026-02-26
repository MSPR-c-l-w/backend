import { Module } from '@nestjs/common';
import { SessionExerciseService } from './services/session-exercise/session-exercise.service';
import { SessionExerciseController } from './controllers/session-exercise/session-exercise.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SERVICES } from 'src/utils/constants';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [PrismaModule, HttpModule],
  providers: [
    SessionExerciseService,
    {
      provide: SERVICES.SESSION_EXERCISE,
      useClass: SessionExerciseService,
    },
  ],
  controllers: [SessionExerciseController],
  exports: [
    SessionExerciseService,
    {
      provide: SERVICES.SESSION_EXERCISE,
      useClass: SessionExerciseService,
    },
  ],
})
export class SessionExerciseModule {}
