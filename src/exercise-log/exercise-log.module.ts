import { Module } from '@nestjs/common';
import { ExerciseLogService } from './services/exercise-log/exercise-log.service';
import { ExerciseLogController } from './controllers/exercise-log/exercise-log.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SERVICES } from 'src/utils/constants';

@Module({
  imports: [PrismaModule],
  providers: [
    ExerciseLogService,
    {
      provide: SERVICES.EXERCISELOG,
      useClass: ExerciseLogService,
    },
  ],
  controllers: [ExerciseLogController],
  exports: [ExerciseLogService],
})
export class ExerciseLogModule {}
